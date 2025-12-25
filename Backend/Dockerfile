FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libsm6 \
    libxext6 \
    libxrender-dev \
    mupdf \
    mupdf-tools \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY . .

RUN mkdir -p /app/uploads /app/vector_store /app/sessions && \
    chmod 777 /app/uploads /app/vector_store /app/sessions


CMD ["sh", "-c", "gunicorn -w 1 -b 0.0.0.0:$PORT --timeout 120 App:app"]
