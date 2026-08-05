# ============================================================
# Multi-stage build for NoteLooms Backend
# Target: python:3.11-slim (~512 MB free-tier compatible)
# ============================================================

# ---- Builder: install deps ----
FROM python:3.11-slim AS builder

WORKDIR /app

# System deps:
#   - tesseract-ocr + poppler-utils: needed for OCR on scanned PDFs
#   - libsm6 / libxext6 / libxrender-dev: required by opencv-python-headless
#   - mupdf / mupdf-tools: used by pymupdf
#   - curl: used by the healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libsm6 \
    libxext6 \
    libxrender-dev \
    mupdf \
    mupdf-tools \
    poppler-utils \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --upgrade pip setuptools wheel
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy application code
COPY . .

# ---- Runtime: slim image ----
FROM python:3.11-slim AS runtime

WORKDIR /app

# Same runtime system deps as builder (minimal, no build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libsm6 \
    libxext6 \
    libxrender-dev \
    mupdf \
    mupdf-tools \
    poppler-utils \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages and app from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin/gunicorn /usr/local/bin/gunicorn
COPY --from=builder /app /app

RUN mkdir -p /app/uploads /app/vector_store /app/sessions && \
    chmod 777 /app/uploads /app/vector_store /app/sessions

# Remove dead cache file if it was accidentally committed
RUN rm -f /app/transcript_cache.json

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Gunicorn settings for 512 MB free-tier:
#   -w 1                   : single worker (lowest memory)
#   --timeout 90           : reduced from 120 — kills hung workers sooner
#   --max-requests 200     : recycle worker after 200 requests (prevents slow memory leaks)
#   --max-requests-jitter 50 : random jitter so all workers don't restart at once
CMD ["sh", "-c", "gunicorn -w ${WEB_CONCURRENCY:-1} -b 0.0.0.0:${PORT:-5000} \
    --timeout 90 \
    --max-requests 200 \
    --max-requests-jitter 50 \
    --access-logfile - \
    --error-logfile - \
    App:app"]
