import io
import asyncio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import edge_tts
import uvicorn

app = FastAPI(title="TTS Edge Proxy Multi-language")

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

@app.post("/synthesize")
async def synthesize_speech(req: TtsRequest):
    content = req.text.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Text rỗng")

    # Map ngôn ngữ và giới tính
    lang_key = (req.language or "vi").lower().strip()[:2]
    lang_voices = VOICE_MAP.get(lang_key, VOICE_MAP["vi"])
    voice_name = lang_voices.get(req.gender.lower(), lang_voices["female"])

    communicate = edge_tts.Communicate(content, voice_name)
    audio_stream = io.BytesIO()

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_stream.write(chunk["data"])

    audio_bytes = audio_stream.getvalue()
    if not audio_bytes:
        raise HTTPException(status_code=500, detail="Không thể tạo âm thanh")

    from fastapi.responses import Response
    return Response(content=audio_bytes, media_type="audio/mpeg")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5050)