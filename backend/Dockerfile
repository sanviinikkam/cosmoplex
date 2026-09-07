FROM python:3.12-slim-bookworm

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# System libraries WeasyPrint needs to render PDF certificates, plus Noto +
# Indic fonts so learner names in Hindi/Marathi/Telugu/Tamil/Kannada render.
#
# ffmpeg is for feedback voice notes: WhatsApp sends Ogg/Opus, which Safari does
# not reliably play, and the admins use Macs as well as Windows. Recordings are
# stored as they arrived and converted to MP3 on the way out, so nothing is
# re-encoded twice and the original is always the one kept.
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpango-1.0-0 \
        libpangocairo-1.0-0 \
        libcairo2 \
        libgdk-pixbuf-2.0-0 \
        libffi8 \
        shared-mime-info \
        fonts-noto-core \
        fonts-indic \
        ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

# Single uvicorn worker: WebSocket sessions hold per-connection state in memory.
# Render injects $PORT; fall back to 8000 for local `docker run`.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
