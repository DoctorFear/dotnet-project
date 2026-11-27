import io
import re
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
import edge_tts
import uvicorn

app = FastAPI(title="TTS Edge Proxy Multi-language")

# 1-frame MPEG-1 Layer 3 silent MP3 fallback when text has no pronounceable characters
SILENT_MP3 = bytes.fromhex(
    "fffb906400000000000000000000000000000000000000000000000000000000"
    "0000000000000000000000000000000000000000000000000000000000000000"
    "0000000000000000000000000000000000000000000000000000000000000000"
)

VOICE_MAP = {
    "vi": {"female": "vi-VN-HoaiMyNeural", "male": "vi-VN-NamMinhNeural"},
    "en": {"female": "en-US-JennyNeural", "male": "en-US-GuyNeural"},
    "fr": {"female": "fr-FR-DeniseNeural", "male": "fr-FR-HenriNeural"},
    "ja": {"female": "ja-JP-NanamiNeural", "male": "ja-JP-KeitaNeural"},
    "zh": {"female": "zh-CN-XiaoxiaoNeural", "male": "zh-CN-YunxiNeural"},
    "ko": {"female": "ko-KR-SunHiNeural", "male": "ko-KR-InJoonNeural"},
    "de": {"female": "de-DE-KatjaNeural", "male": "de-DE-ConradNeural"},
    "es": {"female": "es-ES-ElviraNeural", "male": "es-ES-AlvaroNeural"}
}

class TtsRequest(BaseModel):
    text: str
    language: str = "vi"
    gender: str = "female"
    voice: str | None = None
    rate: str = "+0%"
    pitch: str = "+0Hz"

async def _synthesize(text: str, voice_name: str, rate: str = "+0%", pitch: str = "+0Hz") -> bytes:
    communicate = edge_tts.Communicate(text, voice_name, rate=rate, pitch=pitch)
    audio_stream = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_stream.write(chunk["data"])
    return audio_stream.getvalue()

@app.post("/synthesize")
async def synthesize_speech(req: TtsRequest):
    content = req.text.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Text rỗng")

    # Nếu đoạn chỉ chứa dấu câu / ký tự đặc biệt (vd: "...", "---", "***"), trả về audio im lặng thay vì lỗi 500
    if not any(ch.isalnum() for ch in content):
        return Response(content=SILENT_MP3, media_type="audio/mpeg")

    # Map ngôn ngữ và giới tính hoặc dùng giọng chỉ định
    if req.voice:
        voice_name = req.voice
    else:
        lang_key = (req.language or "vi").lower().strip()[:2]
        lang_voices = VOICE_MAP.get(lang_key, VOICE_MAP["vi"])
        voice_name = lang_voices.get(req.gender.lower(), lang_voices["female"])

    rate_str = req.rate if req.rate else "+0%"
    pitch_str = req.pitch if req.pitch else "+0Hz"

    try:
        audio_bytes = await _synthesize(content, voice_name, rate_str, pitch_str)
    except edge_tts.exceptions.NoAudioReceived:
        # Thử lọc bỏ ký tự đặc biệt giữ lại chữ/số/khoảng trắng; nếu vẫn không có âm thanh thì trả về silent MP3
        cleaned = re.sub(r"[^\w\s.,!?;:\-]", " ", content).strip()
        if not any(ch.isalnum() for ch in cleaned):
            return Response(content=SILENT_MP3, media_type="audio/mpeg")
        try:
            audio_bytes = await _synthesize(cleaned, voice_name, rate_str, pitch_str)
        except edge_tts.exceptions.NoAudioReceived:
            return Response(content=SILENT_MP3, media_type="audio/mpeg")

    if not audio_bytes:
        return Response(content=SILENT_MP3, media_type="audio/mpeg")

    return Response(content=audio_bytes, media_type="audio/mpeg")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5050)