FROM python:3.10-slim

WORKDIR /app

# System dependencies (poppler-utils required for pdf2image)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libsm6 \
    libxext6 \
    libxrender-dev \
    mupdf \
    mupdf-tools \
    poppler-utils \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip tooling
RUN pip install --upgrade pip setuptools wheel

# Install Python dependencies (cached layer)
COPY requirements.txt .
RUN pip install -r requirements.txt gunicorn

# Copy application code
COPY . .

# Create required directories
RUN mkdir -p /app/uploads /app/vector_store /app/sessions && \
    chmod 777 /app/uploads /app/vector_store /app/sessions

# Expose port (optional but good practice)
EXPOSE 5000

# Run with multiple workers
CMD ["sh", "-c", "gunicorn -w 3 -b 0.0.0.0:${PORT:-5000} --timeout 120 App:app"]
