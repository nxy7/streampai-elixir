"""
Minimal MLX-Whisper WebSocket server for macOS Apple Silicon.

Speaks the same protocol as WhisperLive so the Elixir client works unchanged.

Protocol:
  1. Client sends JSON config: {uid, model, language, task, use_vad}
  2. Server responds: {"message": "SERVER_READY"}
  3. Client streams binary PCM frames (float32, 16kHz, mono)
  4. Server responds with: {"segments": [{start, end, text, completed}]}
  5. Client sends text "END_OF_AUDIO" to signal done
"""

import argparse
import asyncio
import json
import logging
import struct
import time

import mlx_whisper
import numpy as np
import websockets

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("whisper-mlx")

SAMPLE_RATE = 16000
# Process audio every N seconds of accumulated audio
PROCESS_INTERVAL = 3.0
# Keep last N seconds as context for better continuity
CONTEXT_OVERLAP = 1.0


class TranscriptionSession:
    def __init__(self, uid: str, model: str, language: str | None):
        self.uid = uid
        self.model = model
        self.language = language
        self.audio_buffer = np.array([], dtype=np.float32)
        self.segments: list[dict] = []
        self.segment_offset = 0.0
        self.last_process_time = time.monotonic()
        self.processing = False

    def append_audio(self, pcm_bytes: bytes):
        samples = np.frombuffer(pcm_bytes, dtype=np.float32)
        self.audio_buffer = np.concatenate([self.audio_buffer, samples])

    def should_process(self) -> bool:
        elapsed = time.monotonic() - self.last_process_time
        has_audio = len(self.audio_buffer) > SAMPLE_RATE * 0.5
        return elapsed >= PROCESS_INTERVAL and has_audio and not self.processing

    def process(self) -> list[dict]:
        if len(self.audio_buffer) == 0:
            return self.segments

        self.processing = True
        self.last_process_time = time.monotonic()

        audio = self.audio_buffer.copy()

        # Transcribe the buffered audio
        decode_options = {}
        if self.language:
            decode_options["language"] = self.language

        try:
            result = mlx_whisper.transcribe(
                audio,
                path_or_hf_repo=self.model,
                word_timestamps=False,
                condition_on_previous_text=True,
                **decode_options,
            )
        except Exception as e:
            log.error(f"[{self.uid}] Transcription error: {e}")
            self.processing = False
            return self.segments

        new_segments = []
        for seg in result.get("segments", []):
            new_segments.append(
                {
                    "start": round(seg["start"] + self.segment_offset, 2),
                    "end": round(seg["end"] + self.segment_offset, 2),
                    "text": seg["text"].strip(),
                    "completed": True,
                }
            )

        if new_segments:
            self.segments.extend(new_segments)

        # Keep overlap for context, discard the rest
        overlap_samples = int(CONTEXT_OVERLAP * SAMPLE_RATE)
        consumed = len(audio)
        keep = min(overlap_samples, consumed)
        self.segment_offset += (consumed - keep) / SAMPLE_RATE
        self.audio_buffer = self.audio_buffer[consumed - keep :]

        self.processing = False
        return self.segments

    def process_remaining(self) -> list[dict]:
        """Process any remaining audio in the buffer."""
        if len(self.audio_buffer) < SAMPLE_RATE * 0.3:
            return self.segments
        self.last_process_time = 0  # Force processing
        return self.process()


async def handle_client(websocket):
    client_addr = websocket.remote_address
    log.info(f"Client connected: {client_addr}")

    session: TranscriptionSession | None = None

    try:
        # Wait for config message
        config_msg = await asyncio.wait_for(websocket.recv(), timeout=10.0)
        config = json.loads(config_msg)
        log.info(f"Config: {config}")

        uid = config.get("uid", "unknown")
        model = config.get("model", "mlx-community/whisper-turbo")
        language = config.get("language")

        # Map short model names to HuggingFace repos
        model_map = {
            "tiny": "mlx-community/whisper-tiny",
            "base": "mlx-community/whisper-base",
            "small": "mlx-community/whisper-small",
            "medium": "mlx-community/whisper-medium",
            "large": "mlx-community/whisper-large-v3-mlx",
            "large-v3": "mlx-community/whisper-large-v3-mlx",
            "turbo": "mlx-community/whisper-turbo",
            "large-v3-turbo": "mlx-community/whisper-large-v3-turbo",
        }
        model = model_map.get(model, model)

        session = TranscriptionSession(uid, model, language)

        # Warm up the model (first transcribe is slow due to model loading)
        log.info(f"[{uid}] Loading model: {model}")
        warmup_audio = np.zeros(SAMPLE_RATE, dtype=np.float32)
        mlx_whisper.transcribe(warmup_audio, path_or_hf_repo=model)
        log.info(f"[{uid}] Model loaded")

        await websocket.send(json.dumps({"message": "SERVER_READY"}))

        # Process audio loop
        async for message in websocket:
            if isinstance(message, str):
                if message.strip() == "END_OF_AUDIO":
                    log.info(f"[{uid}] End of audio")
                    segments = session.process_remaining()
                    if segments:
                        await websocket.send(json.dumps({"segments": segments}))
                    break
                continue

            # Binary frame = PCM audio
            session.append_audio(message)

            if session.should_process():
                segments = await asyncio.to_thread(session.process)
                if segments:
                    await websocket.send(json.dumps({"segments": segments}))

    except websockets.exceptions.ConnectionClosed:
        log.info(f"Client disconnected: {client_addr}")
    except asyncio.TimeoutError:
        log.warning(f"Client {client_addr} timed out waiting for config")
    except Exception as e:
        log.error(f"Error handling client {client_addr}: {e}", exc_info=True)
        try:
            await websocket.send(
                json.dumps({"status": "ERROR", "message": str(e)})
            )
        except Exception:
            pass


async def main(host: str, port: int):
    log.info(f"Starting MLX Whisper server on ws://{host}:{port}")
    async with websockets.serve(handle_client, host, port):
        await asyncio.Future()  # Run forever


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MLX Whisper WebSocket Server")
    parser.add_argument("--host", default="0.0.0.0", help="Bind address")
    parser.add_argument("--port", "-p", type=int, default=9090, help="WebSocket port")
    args = parser.parse_args()

    asyncio.run(main(args.host, args.port))
