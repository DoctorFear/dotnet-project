"""FastAPI Expressive TTS Server: Gemini Native TTS -> Expressive Piper ONNX -> Edge Neural."""
import asyncio
import base64
import inspect
import io
import json
import logging
import os
import random
import re
import threading
import time
import urllib.error
import urllib.request
import wave
from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import edge_tts
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

try:
    from piper import PiperVoice
except ImportError:
    try:
        from piper.voice import PiperVoice
    except ImportError:
        PiperVoice = None

try:
    from piper import SynthesisConfig
except ImportError:
    SynthesisConfig = None

try:
    import lameenc
except ImportError:
    lameenc = None

log = logging.getLogger("uvicorn.error")

MODELS_DIR = Path(os.getenv("PIPER_MODELS_DIR", "models/piper"))
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_TTS_MODELS = [
    m.strip()
    for m in os.getenv("GEMINI_TTS_MODELS", "gemini-2.5-flash-preview-tts,gemini-3.8-flash-tts").split(",")
    if m.strip()
]
GEMINI_TIMEOUT = float(os.getenv("TTS_GEMINI_TIMEOUT", "30"))
GEMINI_WORKERS = max(1, int(os.getenv("TTS_GEMINI_CONCURRENCY", "2")))

EDGE_WORKERS = max(1, int(os.getenv("TTS_EDGE_CONCURRENCY", "2")))
EDGE_RETRIES = max(1, int(os.getenv("TTS_EDGE_RETRIES", "2")))
EDGE_MIN_INTERVAL = max(0.0, float(os.getenv("TTS_EDGE_MIN_INTERVAL_MS", "180")) / 1000.0)
EDGE_TIMEOUT = float(os.getenv("TTS_EDGE_TIMEOUT", "20"))
LOCAL_WORKERS = max(1, int(os.getenv("TTS_LOCAL_CONCURRENCY", "2")))
CACHE_LIMIT = max(0, int(os.getenv("TTS_CACHE_MB", "64"))) * 1024 * 1024
DEFAULT_ENGINE = os.getenv("TTS_DEFAULT_ENGINE", "auto").lower()
LOCAL_FIRST = os.getenv("TTS_LOCAL_FIRST", "0") == "1"
USE_CUDA = os.getenv("PIPER_USE_CUDA", "0") == "1"

FALLBACK_SILENT_MP3 = bytes.fromhex(
    "fffb906400000000000000000000000000000000000000000000000000000000"
    "0000000000000000000000000000000000000000000000000000000000000000"
    "0000000000000000000000000000000000000000000000000000000000000000"
)

# Gemini studio prebuilt voices (supports both Vietnamese and English natively)
GEMINI_VOICE_MAP = {
    ("vi", "female"): "Aoede",
    ("vi", "male"): "Charon",
    ("en", "female"): "Aoede",
    ("en", "male"): "Charon",
}

PIPER_VOICE_MAP = {
    ("vi", "female"): os.getenv("PIPER_VI_FEMALE_MODEL", "vi_VN-vais1000-medium.onnx"),
    ("vi", "male"): os.getenv("PIPER_VI_MALE_MODEL", "vi_VN-vais1000-medium.onnx"),
    ("en", "female"): os.getenv("PIPER_EN_FEMALE_MODEL", "en_US-lessac-high.onnx"),
    ("en", "male"): os.getenv("PIPER_EN_MALE_MODEL", "en_US-ryan-high.onnx"),
}

EDGE_VOICE_CANDIDATES = {
    ("vi", "female"): ["vi-VN-HoaiMyNeural"],
    ("vi", "male"): ["vi-VN-NamMinhNeural"],
    ("en", "female"): ["en-US-AvaMultilingualNeural", "en-US-AriaNeural"],
    ("en", "male"): ["en-US-AndrewMultilingualNeural", "en-US-BrianMultilingualNeural"],
}

_models: dict[Path, tuple["PiperVoice", threading.Lock]] = {}
_model_lock = threading.Lock()
_cache: OrderedDict[tuple, tuple[bytes, str, str, str]] = OrderedDict()
_cache_bytes = 0
_inflight: dict[tuple, asyncio.Task] = {}
_gemini_gate: Optional[asyncio.Semaphore] = None
_edge_gate: Optional[asyncio.Semaphore] = None
_edge_pace_lock: Optional[asyncio.Lock] = None
_last_edge_start = 0.0
_local_pool: Optional[ThreadPoolExecutor] = None
_gemini_cooldown_until = 0.0


def _is_valid_onnx(path: Optional[Path]) -> bool:
    return bool(path and path.is_file() and Path(f"{path}.json").is_file())


def resolve_model_path(lang: str, gender: str) -> Optional[Path]:
    candidates = [
        PIPER_VOICE_MAP.get((lang, gender)),
        PIPER_VOICE_MAP.get((lang, "female")),
        PIPER_VOICE_MAP.get((lang, "male")),
    ]
    for name in candidates:
        if name:
            p = MODELS_DIR / name
            if _is_valid_onnx(p):
                return p

    if MODELS_DIR.exists():
        for p in sorted(MODELS_DIR.glob(f"{lang}_*.onnx")):
            if _is_valid_onnx(p):
                return p
    return None


def piper_available(lang: str, gender: str) -> bool:
    return bool(PiperVoice and lameenc and resolve_model_path(lang, gender) is not None)


def get_model(lang: str, gender: str) -> tuple["PiperVoice", threading.Lock]:
    path = resolve_model_path(lang, gender)
    if not PiperVoice or path is None:
        raise RuntimeError(f"No valid Piper ONNX model found for {lang}-{gender} in {MODELS_DIR}")
    resolved = path.resolve()
    with _model_lock:
        if resolved not in _models:
            log.info("[TTS] Loading expressive local model: %s", resolved.name)
            _models[resolved] = (PiperVoice.load(str(resolved), use_cuda=USE_CUDA), threading.Lock())
        return _models[resolved]


def warm_models() -> None:
    if not PiperVoice or not MODELS_DIR.exists():
        return
    seen: set[Path] = set()
    for lang, gender in PIPER_VOICE_MAP:
        path = resolve_model_path(lang, gender)
        if path and path.resolve() not in seen:
            seen.add(path.resolve())
            try:
                get_model(lang, gender)
            except Exception as exc:
                log.warning("[TTS] Failed to preload %s: %s", path.name, exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _gemini_gate, _edge_gate, _edge_pace_lock, _local_pool, _cache_bytes
    _gemini_gate = asyncio.Semaphore(GEMINI_WORKERS)
    _edge_gate = asyncio.Semaphore(EDGE_WORKERS)
    _edge_pace_lock = asyncio.Lock()
    _local_pool = ThreadPoolExecutor(max_workers=LOCAL_WORKERS, thread_name_prefix="tts-local")
    _cache.clear()
    _cache_bytes = 0
    if os.getenv("TTS_PRELOAD_MODELS", "1") == "1":
        await asyncio.get_running_loop().run_in_executor(_local_pool, warm_models)
    log.info(
        "[TTS] Ready | GeminiKey=%s | LocalModels=%s",
        "configured" if GEMINI_API_KEY else "via-request/fallback",
        [p.name for p in sorted(MODELS_DIR.glob("*.onnx"))] if MODELS_DIR.exists() else [],
    )
    try:
        yield
    finally:
        tasks = list(_inflight.values())
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        _local_pool.shutdown(wait=True, cancel_futures=True)


app = FastAPI(title="Expressive Gemini + Local Piper TTS Server", lifespan=lifespan)


class TtsRequest(BaseModel):
    text: str = Field(max_length=20000)
    language: str = "vi"
    gender: str = "female"
    voice: Optional[str] = None
    rate: str = "+0%"
    pitch: str = "+0Hz"
    engine: Optional[str] = None
    geminiApiKey: Optional[str] = None


def wav_bytes_to_audio(wav_bytes: bytes) -> tuple[bytes, str]:
    if lameenc is None:
        return wav_bytes, "audio/wav"
    with wave.open(io.BytesIO(wav_bytes), "rb") as wav_in:
        if wav_in.getsampwidth() != 2:
            return wav_bytes, "audio/wav"
        pcm = wav_in.readframes(wav_in.getnframes())
        if not pcm:
            return FALLBACK_SILENT_MP3, "audio/mpeg"
        encoder = lameenc.Encoder()
        encoder.set_bit_rate(128)
        encoder.set_in_sample_rate(wav_in.getframerate())
        encoder.set_channels(wav_in.getnchannels())
        encoder.set_quality(2)
        return bytes(encoder.encode(pcm) + encoder.flush()), "audio/mpeg"


def pcm_to_wav(pcm_bytes: bytes, sample_rate: int = 24000) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wav_out:
        wav_out.setnchannels(1)
        wav_out.setsampwidth(2)
        wav_out.setframerate(sample_rate)
        wav_out.writeframes(pcm_bytes)
    return buf.getvalue()


def prepare_expressive_text(text: str) -> str:
    cleaned = re.sub(r"\s+", " ", text).strip()
    cleaned = cleaned.replace("...", "… ")
    cleaned = re.sub(r"\s*—\s*", ", ", cleaned)
    return cleaned


def _gemini_sync_call(text: str, lang: str, gender: str, api_key: str) -> tuple[bytes, str]:
    global _gemini_cooldown_until
    if time.monotonic() < _gemini_cooldown_until:
        raise RuntimeError("Gemini TTS in quota cooldown")

    voice_name = GEMINI_VOICE_MAP[(lang, gender)]
    style_instruction = (
        "You are an expressive literary audiobook narrator. Read the user's text verbatim "
        "with warm emotion, natural pacing, subtle pauses at punctuation, and clear articulation. "
        "Do not add extra words or commentary."
    )

    payload = {
        "systemInstruction": {"parts": [{"text": style_instruction}]},
        "contents": [{"parts": [{"text": prepare_expressive_text(text)}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {
                        "voiceName": voice_name
                    }
                }
            },
        },
    }
    body_bytes = json.dumps(payload).encode("utf-8")
    last_err: Optional[Exception] = None

    for model in GEMINI_TTS_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        req = urllib.request.Request(
            url,
            data=body_bytes,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=GEMINI_TIMEOUT) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))

            parts = resp_data["candidates"][0]["content"]["parts"]
            inline = next((p["inlineData"] for p in parts if "inlineData" in p), None)
            if not inline or not inline.get("data"):
                raise RuntimeError("Gemini response missing inlineData audio")

            raw_audio = base64.b64decode(inline["data"])
            mime = inline.get("mimeType", "audio/L16;codec=pcm;rate=24000")
            rate_match = re.search(r"rate=(\d+)", mime)
            sample_rate = int(rate_match.group(1)) if rate_match else 24000

            wav_bytes = raw_audio if raw_audio[:4] == b"RIFF" else pcm_to_wav(raw_audio, sample_rate)
            mp3_bytes, out_mime = wav_bytes_to_audio(wav_bytes)
            return mp3_bytes, f"{model}:{voice_name}"
        except urllib.error.HTTPError as http_err:
            err_body = http_err.read().decode("utf-8", errors="ignore")
            last_err = RuntimeError(f"HTTP {http_err.code}: {err_body[:200]}")
            if http_err.code in (401, 403, 429):
                # Quota exhausted or invalid key -> cool down for 60s so local model handles batch smoothly
                _gemini_cooldown_until = time.monotonic() + 60.0
                break
        except Exception as exc:
            last_err = exc

    raise RuntimeError(f"Gemini TTS unavailable ({last_err})")


def _synthesize_piper_wav(voice: "PiperVoice", text: str, wav: wave.Wave_write, length_scale: float) -> None:
    if hasattr(voice, "synthesize_wav"):
        sig = inspect.signature(voice.synthesize_wav)
        if "syn_config" in sig.parameters and SynthesisConfig is not None:
            sc_params = inspect.signature(SynthesisConfig).parameters
            kwargs = {"length_scale": length_scale}
            # Expressive prosody variance (richer intonation & cadence than flat default)
            if "noise_scale" in sc_params:
                kwargs["noise_scale"] = 0.78
            if "noise_w_scale" in sc_params:
                kwargs["noise_w_scale"] = 0.88
            elif "noise_w" in sc_params:
                kwargs["noise_w"] = 0.88
            voice.synthesize_wav(text, wav, syn_config=SynthesisConfig(**kwargs))
        elif "length_scale" in sig.parameters:
            voice.synthesize_wav(text, wav, length_scale=length_scale)
        else:
            voice.synthesize_wav(text, wav)
    else:
        voice.synthesize(text, wav, length_scale=length_scale)


def piper_synthesize(text: str, lang: str, gender: str, rate: str) -> tuple[bytes, str]:
    voice, lock = get_model(lang, gender)
    pct = int(rate[:-1])
    # Slightly measured storytelling pace for natural audiobook cadence
    base_speed = 0.96 if pct == 0 else (1.0 + pct / 100.0)
    speed = max(0.5, min(2.0, base_speed))
    length_scale = round(1.0 / speed, 3)

    narration = prepare_expressive_text(text)
    buffer = io.BytesIO()
    with lock:
        with wave.open(buffer, "wb") as wav:
            _synthesize_piper_wav(voice, narration, wav, length_scale)

    raw_wav = buffer.getvalue()
    if len(raw_wav) <= 44:
        return FALLBACK_SILENT_MP3, "audio/mpeg"
    return wav_bytes_to_audio(raw_wav)


async def _pace_edge_request() -> None:
    global _last_edge_start
    if EDGE_MIN_INTERVAL <= 0 or _edge_pace_lock is None:
        return
    async with _edge_pace_lock:
        now = time.monotonic()
        wait = EDGE_MIN_INTERVAL - (now - _last_edge_start)
        if wait > 0:
            await asyncio.sleep(wait)
        _last_edge_start = time.monotonic()


async def edge_synthesize(text: str, voice_candidates: list[str], rate: str, pitch: str) -> tuple[bytes, str]:
    assert _edge_gate is not None
    narration = prepare_expressive_text(text)
    async with _edge_gate:
        last_err: Optional[Exception] = None
        for voice in voice_candidates:
            for attempt in range(1, EDGE_RETRIES + 1):
                await _pace_edge_request()
                try:
                    async def collect() -> bytes:
                        audio = bytearray()
                        comm = edge_tts.Communicate(narration, voice, rate=rate, pitch=pitch)
                        async for chunk in comm.stream():
                            if chunk["type"] == "audio":
                                audio.extend(chunk["data"])
                        if not audio:
                            raise RuntimeError("Edge TTS returned empty audio stream")
                        return bytes(audio)

                    data = await asyncio.wait_for(collect(), timeout=EDGE_TIMEOUT)
                    return data, voice
                except asyncio.CancelledError:
                    raise
                except Exception as exc:
                    last_err = exc
                    if attempt < EDGE_RETRIES:
                        await asyncio.sleep((0.5 * attempt) + random.uniform(0.05, 0.2))
        raise RuntimeError(f"{type(last_err).__name__}: {last_err}")


async def generate(key: tuple, api_key: str) -> tuple[bytes, str, str, str]:
    text, lang, gender, voice_candidates_tuple, rate, pitch, engine = key
    voice_candidates = list(voice_candidates_tuple)
    has_piper = piper_available(lang, gender)
    has_gemini = bool(api_key)

    if engine == "gemini":
        engines = ["gemini"]
    elif engine == "local":
        engines = ["piper"]
    elif engine == "edge":
        engines = ["edge"]
    else:
        # Priority: Gemini Native TTS -> Expressive Local Piper -> Edge Neural
        engines = (["piper", "gemini", "edge"] if (LOCAL_FIRST and has_piper)
                   else ["gemini", "piper", "edge"])

    errors: list[str] = []
    loop = asyncio.get_running_loop()

    for choice in engines:
        if choice == "gemini":
            if not has_gemini:
                errors.append("gemini(no-api-key)")
                continue
            try:
                assert _gemini_gate is not None
                async with _gemini_gate:
                    audio, used_voice = await loop.run_in_executor(
                        _local_pool, _gemini_sync_call, text, lang, gender, api_key
                    )
                return audio, "audio/mpeg", "gemini-tts", used_voice
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                errors.append(f"gemini: {exc}")
                log.warning("[TTS] Gemini failed for [%s-%s], falling back to local: %s", lang, gender, exc)

        elif choice == "piper":
            if not has_piper:
                errors.append(f"piper(no-{lang}-model)")
                continue
            try:
                audio, mime = await loop.run_in_executor(_local_pool, piper_synthesize, text, lang, gender, rate)
                model_path = resolve_model_path(lang, gender)
                return audio, mime, "piper-expressive", model_path.stem if model_path else f"piper-{lang}-{gender}"
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                errors.append(f"piper: {exc}")
                log.warning("[TTS] Local Piper failed for [%s-%s]: %s", lang, gender, exc)

        elif choice == "edge":
            try:
                audio, used_voice = await edge_synthesize(text, voice_candidates, rate, pitch)
                return audio, "audio/mpeg", "edge-neural", used_voice
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                errors.append(f"edge: {exc}")

    detail = "All TTS engines failed: " + " | ".join(errors)
    log.error("[TTS] %s", detail)
    raise HTTPException(status_code=503, detail=detail)


async def cached_generate(key: tuple, api_key: str) -> tuple[bytes, str, str, str]:
    global _cache_bytes
    try:
        result = await generate(key, api_key)
        if len(result[0]) <= CACHE_LIMIT and CACHE_LIMIT > 0:
            _cache[key] = result
            _cache_bytes += len(result[0])
            while _cache_bytes > CACHE_LIMIT or len(_cache) > 512:
                _, removed = _cache.popitem(last=False)
                _cache_bytes -= len(removed[0])
        return result
    finally:
        _inflight.pop(key, None)


def observe_task(task: asyncio.Task) -> None:
    if not task.cancelled():
        task.exception()


def _normalize_signed_unit(val: Optional[str], default: str, unit: str) -> str:
    raw = (val or default).strip()
    return f"+0{unit}" if raw == f"0{unit}" else raw


@app.get("/voices")
async def voices():
    return [
        {
            "id": f"{lang}-{gender}",
            "language": lang,
            "gender": gender,
            "geminiVoice": GEMINI_VOICE_MAP[(lang, gender)],
            "localModel": resolve_model_path(lang, gender).name if resolve_model_path(lang, gender) else None,
            "offlineAvailable": piper_available(lang, gender),
        }
        for lang in ("vi", "en")
        for gender in ("female", "male")
    ]


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "geminiConfigured": bool(GEMINI_API_KEY),
        "geminiModels": GEMINI_TTS_MODELS,
        "piperAvailable": any(piper_available(*k) for k in PIPER_VOICE_MAP),
        "localModels": sorted(p.name for p in MODELS_DIR.glob("*.onnx")) if MODELS_DIR.exists() else [],
        "loadedModels": len(_models),
        "cacheEntries": len(_cache),
        "voices": await voices(),
    }


@app.post("/synthesize")
async def synthesize(req: TtsRequest):
    start = time.perf_counter()
    text = (req.text or "").strip()
    lang = (req.language or "vi").strip().lower().replace("_", "-").split("-")[0]
    gender = (req.gender or "female").strip().lower()
    engine = (req.engine or DEFAULT_ENGINE).strip().lower()
    rate = _normalize_signed_unit(req.rate, "+0%", "%")
    pitch = _normalize_signed_unit(req.pitch, "+0Hz", "Hz")
    api_key = (req.geminiApiKey or "").strip() or GEMINI_API_KEY

    if not text:
        raise HTTPException(status_code=400, detail="Text must not be empty")
    if (lang, gender) not in GEMINI_VOICE_MAP:
        raise HTTPException(status_code=400, detail=f"Unsupported language '{lang}' or gender '{gender}'")
    if engine not in ("auto", "gemini", "local", "edge"):
        raise HTTPException(status_code=400, detail=f"Invalid engine '{engine}'")
    if not re.fullmatch(r"[+-]\d{1,3}%", rate) or not re.fullmatch(r"[+-]\d{1,3}Hz", pitch):
        raise HTTPException(status_code=400, detail=f"Invalid rate '{rate}' or pitch '{pitch}'")

    if not any(ch.isalnum() for ch in text):
        return Response(
            content=FALLBACK_SILENT_MP3,
            media_type="audio/mpeg",
            headers={"X-TTS-Engine": "silence", "X-TTS-Cache": "BYPASS", "X-TTS-Time-Ms": "0"},
        )

    custom_voice = (req.voice or "").strip()
    voice_candidates = tuple([custom_voice] if custom_voice else EDGE_VOICE_CANDIDATES[(lang, gender)])
    key = (text, lang, gender, voice_candidates, rate, pitch, engine)
    hit = key in _cache

    if hit:
        _cache.move_to_end(key)
        audio, media_type, used_engine, used_voice = _cache[key]
    else:
        task = _inflight.get(key)
        if task is None:
            if len(_inflight) >= 128:
                raise HTTPException(status_code=503, detail="TTS queue full; retry later")
            task = asyncio.create_task(cached_generate(key, api_key))
            task.add_done_callback(observe_task)
            _inflight[key] = task
        audio, media_type, used_engine, used_voice = await asyncio.shield(task)

    return Response(
        content=audio,
        media_type=media_type,
        headers={
            "X-TTS-Engine": used_engine,
            "X-TTS-Cache": "HIT" if hit else "MISS",
            "X-TTS-Voice": used_voice,
            "X-TTS-Time-Ms": str(round((time.perf_counter() - start) * 1000)),
        },
    )


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5050)