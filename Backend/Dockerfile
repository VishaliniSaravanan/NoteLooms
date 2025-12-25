FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (OCR, PDF processing, healthcheck)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libsm6 \
    libxext6 \
    libxrender-dev \
    mupdf \
    mupdf-tools \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy application code
COPY . .

# Create required writable directories
RUN mkdir -p /app/uploads /app/vector_store /app/sessions && \
    chmod 777 /app/uploads /app/vector_store /app/sessions

# Expose backend port
EXPOSE 5000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Run Flask app with Gunicorn using Render $PORT
CMD ["sh", "-c", "gunicorn -w 4 -b 0.0.0.0:$PORT --timeout 120 App:app"]
