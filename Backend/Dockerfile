# ============================================================
# Multi-stage build – target image ~300–500MB
# Use python:3.11-slim (NOT full python:3.11) to save 500–800MB
# ============================================================

# ---- Builder: install deps and app ----
FROM python:3.11-slim AS builder

WORKDIR /app

# Runtime system deps (needed for PyMuPDF, pdf2image, tesseract, etc.)
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

# Copy app (so we have one layer with deps + code for cache)
COPY . .

# ---- Runtime: slim image, no pip cache / build tools ----
FROM python:3.11-slim AS runtime

WORKDIR /app

# Only runtime system deps (same as builder, minimal)
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

# Copy installed packages from builder (no pip in this stage)
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin/gunicorn /usr/local/bin/gunicorn

# Copy application code
COPY --from=builder /app /app

RUN mkdir -p /app/uploads /app/vector_store /app/sessions && \
    chmod 777 /app/uploads /app/vector_store /app/sessions

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# 1 worker by default (set WEB_CONCURRENCY=2 or 4 on higher-memory hosts)
CMD ["sh", "-c", "gunicorn -w ${WEB_CONCURRENCY:-1} -b 0.0.0.0:${PORT:-5000} --timeout 120 --access-logfile - --error-logfile - App:app"]
