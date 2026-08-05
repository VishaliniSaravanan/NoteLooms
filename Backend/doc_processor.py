"""
doc_processor.py
────────────────
Document processing utilities:
  - PDF text extraction (native + OCR fallback)
  - YouTube transcript fetching
  - File cleanup helpers

Exported symbols used by App.py / upload handler:
  extract_text_from_pdf(pdf_path, max_pages)         -> str | None
  extract_text_from_scanned_pdf(pdf_path, max_pages) -> str | None
  extract_text_from_youtube(url)                      -> (str|None, list|None)
  extract_video_id(url)                               -> str | None
  get_youtube_transcript_advanced(url)                -> list | None
  safe_remove(filepath)                               -> bool
"""

import os
import re
import time
import random
import logging
import tempfile
import gc
from contextlib import contextmanager
from typing import Optional

import pymupdf as fitz
from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled

logger = logging.getLogger(__name__)

# The YouTube Data API client is optional (only needed for metadata fallback).
# It is built in App.py and injected via set_youtube_client().
_youtube_client = None


def set_youtube_client(client) -> None:
    """Inject the YouTube Data API client built in App.py."""
    global _youtube_client
    _youtube_client = client


# ──────────────────────────────────────────────
# File cleanup helpers
# ──────────────────────────────────────────────

def get_removal_delay(filepath: str) -> float:
    """Return a cleanup delay proportional to file size."""
    try:
        size_mb = os.path.getsize(filepath) / (1024 * 1024)
        if size_mb > 100:
            return 1.0
        elif size_mb > 10:
            return 0.5
        return 0.2
    except (OSError, TypeError):
        return 0.3


def safe_remove(filepath: str, max_retries: int = 5, initial_delay: float = None) -> bool:
    """Remove a file safely with retry logic and exponential back-off."""
    if not os.path.exists(filepath):
        return True

    delay = initial_delay if initial_delay is not None else get_removal_delay(filepath)

    for attempt in range(max_retries):
        try:
            gc.collect()
            os.remove(filepath)
            if not os.path.exists(filepath):
                return True
            if attempt < max_retries - 1:
                time.sleep(delay * (attempt + 1))
        except (PermissionError, OSError) as e:
            if attempt == max_retries - 1:
                logger.warning(f"Failed to remove file {filepath} after {max_retries} attempts: {e}")
                return False
            sleep_time = min(delay * (2 ** attempt) + (random.random() * 0.1), 5.0)
            time.sleep(sleep_time)

    return False


# ──────────────────────────────────────────────
# PDF utilities
# ──────────────────────────────────────────────

@contextmanager
def _open_pdf(pdf_path: str):
    """Context manager that safely opens and closes a PyMuPDF document."""
    doc = None
    try:
        doc = fitz.open(pdf_path)
        yield doc
    finally:
        if doc:
            doc.close()


def extract_text_from_pdf(pdf_path: str, max_pages: int = 100) -> Optional[str]:
    """Extract text from a native (non-scanned) PDF using PyMuPDF."""
    try:
        text_chunks = []
        with _open_pdf(pdf_path) as doc:
            pages_to_process = min(len(doc), max_pages)
            for page_num in range(pages_to_process):
                try:
                    page_text = doc[page_num].get_text("text")
                    if page_text and page_text.strip():
                        text_chunks.append(f"--- Page {page_num + 1} ---\n{page_text.strip()}")
                    if page_num % 50 == 0:
                        gc.collect()
                except Exception as page_error:
                    logger.warning(f"Error processing page {page_num}: {page_error}")
                    continue

        return "\n\n".join(text_chunks) if text_chunks else None

    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        return None


def extract_text_from_scanned_pdf(pdf_path: str, max_pages: int = 20, dpi: int = 200) -> Optional[str]:
    """Extract text from a scanned PDF via OCR (Tesseract + OpenCV)."""
    # Lazy-import the heavy OCR stack to keep startup fast
    from pdf2image import convert_from_path
    import cv2
    import numpy as np
    import pytesseract

    with tempfile.TemporaryDirectory() as tmpdir:
        try:
            logger.info(f"Starting OCR processing for {pdf_path} (max {max_pages} pages)")
            images = convert_from_path(
                pdf_path, first_page=1, last_page=max_pages, dpi=dpi, output_folder=tmpdir
            )
            extracted_text = []

            for i, image in enumerate(images):
                if i >= max_pages:
                    break
                try:
                    img     = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
                    gray    = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                    denoised = cv2.medianBlur(gray, 3)
                    _, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
                    custom_config = (
                        r"--oem 3 --psm 6 -c tessedit_char_whitelist="
                        r"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?;:()[]{}@#$%^&*+-= "
                    )
                    text = pytesseract.image_to_string(binary, config=custom_config)
                    if text.strip():
                        extracted_text.append(f"--- Page {i + 1} ---\n{text.strip()}")
                    del img, gray, denoised, binary
                    if i % 5 == 0:
                        gc.collect()
                except Exception as img_e:
                    logger.error(f"Error processing page {i}: {img_e}")
                    continue

            if extracted_text:
                logger.info(f"OCR extracted {len(extracted_text)} pages of text")
                return "\n\n".join(extracted_text)
            return None

        except Exception as e:
            logger.error(f"Error extracting text from scanned PDF: {e}")
            return None


# ──────────────────────────────────────────────
# YouTube utilities
# ──────────────────────────────────────────────

def extract_video_id(url: str) -> Optional[str]:
    """Extract the 11-character YouTube video ID from various URL formats."""
    patterns = [
        r"(?:v=|\/)([0-9A-Za-z_-]{11}).*",
        r"(?:embed\/)([0-9A-Za-z_-]{11})",
        r"^([0-9A-Za-z_-]{11})$",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def get_youtube_transcript_advanced(video_url_or_id: str) -> Optional[list]:
    """
    Fetch a YouTube transcript with multiple fallback strategies.
    Returns a list of segment dicts {text, start, duration} or None.
    """
    try:
        video_id = extract_video_id(video_url_or_id)
        if not video_id:
            logger.error(f"Could not extract video ID from: {video_url_or_id}")
            return None

        logger.info(f"Attempting to fetch transcript for video ID: {video_id}")

        # Strategy 1: Direct English fetch
        try:
            transcript_data = YouTubeTranscriptApi.get_transcript(video_id, languages=["en"])
            formatted = [
                {"text": e["text"].strip(), "start": float(e["start"]), "duration": float(e["duration"])}
                for e in transcript_data
            ]
            logger.info(f"✓ Fetched transcript (direct, {len(formatted)} segments)")
            return formatted
        except Exception as e:
            logger.warning(f"Direct transcript fetch failed: {e}")

        # Strategy 2: List-then-fetch with priority (manual > auto-generated)
        try:
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            transcript = None
            try:
                transcript = transcript_list.find_manually_created_transcript(["en"])
                logger.info("✓ Found manually created English transcript")
            except Exception:
                pass
            if not transcript:
                try:
                    transcript = transcript_list.find_generated_transcript(["en"])
                    logger.info("✓ Found auto-generated English transcript")
                except Exception:
                    pass

            if transcript:
                data = transcript.fetch()
                formatted = [
                    {"text": e["text"].strip(), "start": float(e["start"]), "duration": float(e["duration"])}
                    for e in data
                ]
                logger.info(f"✓ Fetched transcript (fallback, {len(formatted)} segments)")
                return formatted

        except TranscriptsDisabled:
            logger.warning(f"Transcripts are disabled for video: {video_id}")
            return None
        except NoTranscriptFound:
            logger.warning(f"No transcripts found for video: {video_id}")
            return None
        except Exception as e:
            logger.error(f"Error fetching transcript list: {e}")

        logger.error(f"✗ All transcript fetch methods failed for video: {video_id}")
        return None

    except Exception as e:
        logger.error(f"Error fetching transcript: {e}")
        return None


def extract_text_from_youtube(url: str):
    """
    Extract plain text and structured transcript from a YouTube video.
    Returns (extracted_text: str|None, transcript_data: list|None).
    """
    try:
        logger.info(f"Starting YouTube extraction for URL: {url}")
        video_id = extract_video_id(url)
        if not video_id:
            logger.error(f"Could not extract video ID from URL: {url}")
            return None, None

        transcript_data = get_youtube_transcript_advanced(url)
        extracted_text  = None

        if transcript_data:
            extracted_text = " ".join(entry["text"] for entry in transcript_data)
            logger.info(f"✓ Extracted {len(transcript_data)} transcript segments")
        else:
            logger.warning(f"No transcript data retrieved for video: {video_id}")

        # Fallback: fetch YouTube metadata if transcript unavailable
        if not extracted_text and _youtube_client:
            try:
                req  = _youtube_client.videos().list(part="snippet", id=video_id)
                resp = req.execute()
                if resp.get("items"):
                    snippet = resp["items"][0]["snippet"]
                    extracted_text = f"Title: {snippet['title']}\nDescription: {snippet['description']}"
                    logger.info(f"✓ Retrieved YouTube metadata for video: {video_id}")
                else:
                    logger.warning(f"No metadata found for video: {video_id}")
            except Exception as e:
                logger.error(f"Error getting YouTube metadata: {e}", exc_info=True)

        if not extracted_text:
            logger.error(f"Failed to extract any content from YouTube video: {video_id}")
            return None, None

        return extracted_text, transcript_data

    except Exception as e:
        logger.error(f"YouTube processing error: {e}", exc_info=True)
        return None, None
