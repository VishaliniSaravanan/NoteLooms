from flask import Flask, request, jsonify, send_file
import time
from functools import wraps
import logging
import os
import json
import re
import base64
import random
import requests
from contextlib import contextmanager
from pathlib import Path
from typing import Optional
from werkzeug.utils import secure_filename
import pymupdf as fitz
from google import genai
import pytesseract
from pdf2image import convert_from_path
import cv2
import numpy as np
from flask_cors import CORS
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type
from requests.exceptions import ConnectionError
from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from docx import Document
import zipfile
from docx.enum.text import WD_ALIGN_PARAGRAPH
from PIL import Image
import datetime
import googleapiclient.discovery

# Initialize logging FIRST before any imports that might use it
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# RAG (optional)
RAGProcessor = None
rag_import_error = None
try:
    from rag_processor import RAGProcessor
    logger.info("✓ RAG processor imported successfully")
except Exception as e:
    rag_import_error = str(e)
    logger.warning(f"RAG processor import failed: {e}")
    RAGProcessor = None

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load environment variables
from dotenv import load_dotenv
import os

# Load .env file from the Backend directory
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

# Get API keys from environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_CHAT_API_KEY = os.getenv("GEMINI_CHAT_API_KEY") or GEMINI_API_KEY
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

# Configure the default client for non-chat features
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY not found in environment variables")
youtube = googleapiclient.discovery.build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

# Initialize RAG if available
rag_processor = None
rag_init_error = None
if RAGProcessor is not None:
    try:
        # Get the directory where App.py is located
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        persist_dir = os.path.join(backend_dir, 'vector_store')
        
        # Ensure the directory exists and is writable
        try:
            os.makedirs(persist_dir, exist_ok=True)
            # Test write permissions
            test_file = os.path.join(persist_dir, '.write_test')
            with open(test_file, 'w') as f:
                f.write('test')
            os.remove(test_file)
            logger.info(f"Vector store directory is writable: {persist_dir}")
        except Exception as dir_error:
            logger.error(f"Cannot create or write to vector store directory {persist_dir}: {dir_error}")
            raise
        
        rag_processor = RAGProcessor(persist_directory=persist_dir)
        logger.info(f"✓ RAG processor initialized successfully with vector store at: {persist_dir}")
    except Exception as e:
        rag_init_error = str(e)
        logger.error(f"RAG processor initialization failed: {e}", exc_info=True)
        rag_processor = None
else:
    if rag_import_error:
        logger.warning(f"RAG processor not available - import failed: {rag_import_error}")
    else:
        logger.warning("RAG processor not available - RAGProcessor class is None")

# Health check
@app.get('/health')
def health():
    return jsonify({"status": "ok"})

def extract_video_id(url):
    """Extract video ID from various YouTube URL formats"""
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'(?:embed\/)([0-9A-Za-z_-]{11})',
        r'^([0-9A-Za-z_-]{11})$'
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def get_youtube_transcript_advanced(video_url_or_id):
    """
    Fetch transcript with multiple fallback options
    Returns: List of transcript segments with timing or None
    """
    try:
        video_id = extract_video_id(video_url_or_id)
        if not video_id:
            logger.error(f"Could not extract video ID from: {video_url_or_id}")
            return None
        
        logger.info(f"Attempting to fetch transcript for video ID: {video_id}")
        
        # Try direct method first (most reliable)
        try:
            transcript_data = YouTubeTranscriptApi.get_transcript(video_id, languages=['en'])
            formatted_transcript = []
            for entry in transcript_data:
                formatted_transcript.append({
                    'text': entry['text'].strip(),
                    'start': float(entry['start']),
                    'duration': float(entry['duration'])
                })
            logger.info(f"✓ Successfully fetched transcript using direct method with {len(formatted_transcript)} segments")
            return formatted_transcript
        except Exception as e:
            logger.warning(f"Direct method failed: {e}")
        
        # Advanced fallback methods
        try:
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            transcript = None
            
            # Priority 1: Manual English transcript
            try:
                transcript = transcript_list.find_manually_created_transcript(['en'])
                logger.info("✓ Found manually created English transcript")
            except:
                pass
            
            # Priority 2: Auto-generated English transcript
            if not transcript:
                try:
                    transcript = transcript_list.find_generated_transcript(['en'])
                    logger.info("✓ Found auto-generated English transcript")
                except:
                    pass
            
            if transcript:
                # Fetch the actual transcript data
                transcript_data = transcript.fetch()
                
                # Format the transcript with timing
                formatted_transcript = []
                for entry in transcript_data:
                    formatted_transcript.append({
                        'text': entry['text'].strip(),
                        'start': float(entry['start']),
                        'duration': float(entry['duration'])
                    })
                
                logger.info(f"✓ Successfully fetched transcript with {len(formatted_transcript)} segments")
                return formatted_transcript
            
        except TranscriptsDisabled:
            logger.warning(f"Transcripts are disabled for video: {video_id}")
            return None
        except NoTranscriptFound:
            logger.warning(f"No transcripts found for video: {video_id}")
            return None
        except Exception as e:
            logger.error(f"Error getting transcript list: {e}")
        
        logger.error(f"✗ All transcript fetch methods failed for video: {video_id}")
        return None
        
    except Exception as e:
        logger.error(f"Error fetching transcript: {str(e)}")
        return None

# New endpoint for fetching transcripts on-demand
@app.route('/api/youtube/transcript', methods=['POST'])
def get_transcript_endpoint():
    data = request.json
    video_url = data.get('url')
    
    if not video_url:
        return jsonify({'success': False, 'error': 'No URL provided'}), 400
    
    transcript = get_youtube_transcript_advanced(video_url)
    video_id = extract_video_id(video_url)
    
    if transcript:
        return jsonify({
            'success': True,
            'transcript': transcript,
            'video_id': video_id
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Could not fetch transcript. The video may not have captions available.',
            'transcript': []
        })

@contextmanager
def open_pdf(pdf_path: str):
    """Context manager for safely opening PDF files."""
    doc = None
    try:
        doc = fitz.open(pdf_path)
        yield doc
    finally:
        if doc:
            doc.close()

def get_removal_delay(filepath: str) -> float:
    """Calculate delay based on file size. Larger files get longer delays."""
    try:
        size_mb = os.path.getsize(filepath) / (1024 * 1024)  # Size in MB
        if size_mb > 100:  # Very large files
            return 1.0
        elif size_mb > 10:  # Large files
            return 0.5
        return 0.2  # Small files
    except (OSError, TypeError):
        return 0.3  # Default if size can't be determined

def safe_remove(filepath: str, max_retries: int = 5, initial_delay: float = None) -> bool:
    """Safely remove a file with retry logic and size-based delays."""
    if not os.path.exists(filepath):
        return True

    delay = initial_delay if initial_delay is not None else get_removal_delay(filepath)
    
    for attempt in range(max_retries):
        try:
            # Force garbage collection to ensure file handles are released
            import gc
            gc.collect()
            
            # Try to remove the file
            os.remove(filepath)
            
            # Verify the file was actually removed
            if not os.path.exists(filepath):
                return True
                
            # If we get here, the file still exists
            if attempt < max_retries - 1:  # Don't sleep on last attempt
                # Increase delay with each retry
                time.sleep(delay * (attempt + 1))
                
        except (PermissionError, OSError) as e:
            if attempt == max_retries - 1:  # Last attempt
                logger.warning(f"Failed to remove file {filepath} after {max_retries} attempts: {e}")
                return False
            
            # Exponential backoff with jitter
            sleep_time = min(delay * (2 ** attempt) + (random.random() * 0.1), 5.0)
            time.sleep(sleep_time)
    
    return False

def extract_text_from_pdf(pdf_path: str, max_pages: int = 100) -> Optional[str]:
    """Extract text from PDF using PyMuPDF with memory optimization."""
    try:
        text_chunks = []
        with open_pdf(pdf_path) as doc:
            total_pages = len(doc)
            pages_to_process = min(total_pages, max_pages)
            
            for page_num in range(pages_to_process):
                try:
                    page = doc[page_num]
                    page_text = page.get_text("text")
                    if page_text and page_text.strip():
                        text_chunks.append(f"--- Page {page_num + 1} ---\n{page_text.strip()}")
                    
                    # Memory management: Clear references periodically
                    if page_num % 50 == 0:
                        import gc
                        gc.collect()
                        
                except Exception as page_error:
                    logger.warning(f"Error processing page {page_num}: {page_error}")
                    continue
        
        if text_chunks:
            return "\n\n".join(text_chunks)
        return None
        
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        return None

def extract_text_from_scanned_pdf(pdf_path: str, max_pages: int = 20, dpi: int = 200) -> Optional[str]:
    """Extract text from scanned PDF using OCR with memory optimization."""
    temp_images = []
    try:
        logger.info(f"Starting OCR processing for {pdf_path} (max {max_pages} pages)")
        
        # Convert limited number of pages to images
        images = convert_from_path(pdf_path, first_page=1, last_page=max_pages, dpi=dpi)
        extracted_text = []
        
        for i, image in enumerate(images):
            if i >= max_pages:
                break
                
            try:
                # Convert PIL image to OpenCV format
                img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                
                # Apply preprocessing for better OCR
                denoised = cv2.medianBlur(gray, 3)
                _, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
                
                # OCR with optimized config
                custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?;:()[]{}@#$%^&*+-= '
                text = pytesseract.image_to_string(binary, config=custom_config)
                
                if text.strip():
                    extracted_text.append(f"--- Page {i + 1} ---\n{text.strip()}")
                
                # Memory management
                if i % 5 == 0:
                    import gc
                    gc.collect()
                    
            except Exception as img_e:
                logger.error(f"Error processing page {i}: {img_e}")
                continue
        
        if extracted_text:
            result = "\n\n".join(extracted_text)
            logger.info(f"OCR extracted {len(extracted_text)} pages of text")
            return result
        return None
        
    except Exception as e:
        logger.error(f"Error processing scanned PDF: {e}")
        return None
    finally:
        # Clean up any temporary image files
        for img_path in temp_images:
            safe_remove(img_path)

def extract_text_from_youtube(url):
    """Extract text and transcript from YouTube video"""
    try:
        video_id = extract_video_id(url)
        if not video_id:
            return None, None
        
        # Try to get transcript with advanced method
        transcript_data = get_youtube_transcript_advanced(url)
        
        # Extract plain text for summary/processing
        extracted_text = None
        if transcript_data:
            extracted_text = " ".join([entry["text"] for entry in transcript_data])
        
        # If no transcript, try to get metadata
        if not extracted_text:
            try:
                request = youtube.videos().list(part="snippet", id=video_id)
                response = request.execute()
                if response.get("items"):
                    snippet = response["items"][0]["snippet"]
                    extracted_text = f"Title: {snippet['title']}\nDescription: {snippet['description']}"
            except Exception as e:
                logger.error(f"Error getting YouTube metadata: {e}")
        
        return extracted_text, transcript_data
        
    except Exception as e:
        logger.error(f"YouTube processing error: {str(e)}")
        return None, None

def generate_gemini_response(prompt):
    """Generate response with proper error handling and model selection."""
    try:
        # Using gemini-2.5-flash as it's available in the environment
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        return response.text.strip().replace("*", "")
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        if "429" in str(e):
            return "⚠ ERROR: API quota exceeded. Please try again later."
        elif "404" in str(e):
            return "⚠ ERROR: Model not available. Please check the model configuration."
        return f"⚠ ERROR: {e}"


def generate_chat_response(prompt):
    """
    Use a dedicated chat API key if provided, to avoid burning the main quota.
    Falls back to GEMINI_API_KEY when GEMINI_CHAT_API_KEY is not set.
    """
    try:
        # Reconfigure client with chat key for this call
        genai.configure(api_key=GEMINI_CHAT_API_KEY)
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        return response.text.strip().replace("*", "")
    except Exception as e:
        logger.error(f"Gemini Chat API error: {e}")
        if "429" in str(e):
            return "⚠ ERROR: Chat API quota exceeded. Please try again later."
        elif "404" in str(e):
            return "⚠ ERROR: Chat model not available. Please check the chat model configuration."
        return f"⚠ ERROR: {e}"

def generate_image_description(image_path):
    try:
        # Use the same stable model as the rest of the app to avoid 404 / unsupported errors
        model = genai.GenerativeModel("gemini-2.5-flash")
        with open(image_path, "rb") as img_file:
            img_data = img_file.read()
        response = model.generate_content([
            "Provide a detailed description of this image for educational purposes.",
            {"mime_type": "image/jpeg", "data": img_data}
        ])
        return response.text.strip().replace("*", "")
    except Exception as e:
        logger.error(f"Image description error: {e}")
        return f"⚠ ERROR: Unable to describe image - {e}"

@retry(stop=stop_after_attempt(2), retry=retry_if_exception_type(ConnectionError))
def generate_flashcards_with_retry(extracted_text):
    try:
        # Limit text length to avoid quota issues
        clipped_text = extracted_text[:8000]  # Reduced from 12000
        
        prompt = f"""Generate up to 20 flashcards from the following text. Each flashcard must follow this exact format:
Question: [clear question text]
Answer: [concise answer text]

Ensure there is a blank line between flashcards. Do not use asterisks, numbers, or other markdown. 
Ensure each question and answer is concise, non-empty, and relevant to the text.

Text to analyze:
{clipped_text}"""

        response = generate_gemini_response(prompt)
        if "⚠ ERROR" in response:
            return {"status": "error", "message": response.replace("⚠ ERROR: ", "")}
        return response
    except Exception as e:
        if "429" in str(e):
            return {"status": "error", "message": "Quota exceeded. Please try later."}
        raise

def process_flashcards(response_text):
    """Process flashcards response with robust error handling."""
    try:
        if isinstance(response_text, dict):
            if response_text.get("status") == "error":
                return []
            response_text = str(response_text)
        
        flashcards_list = [f.strip() for f in response_text.split("\n\n") if f.strip()]
        structured_flashcards = []
        
        for i, flashcard in enumerate(flashcards_list, 1):
            if i > 20:  # Limit to 20 flashcards
                break
                
            parts = [p.strip() for p in flashcard.split("\n") if p.strip()]
            if len(parts) >= 2:
                front = None
                back = None
                
                # Flexible parsing for different formats
                for part in parts:
                    if part.startswith("Question:") or part.startswith("Q:"):
                        front = part.split(":", 1)[1].strip()
                    elif part.startswith("Answer:") or part.startswith("A:"):
                        back = part.split(":", 1)[1].strip()
                
                if front and back and len(front) > 3 and len(back) > 3:
                    structured_flashcards.append({
                        "id": i,
                        "front": front,
                        "back": back,
                    })
        
        return structured_flashcards
    except Exception as e:
        logger.error(f"Flashcard processing error: {e}")
        return []

@retry(stop=stop_after_attempt(2), retry=retry_if_exception_type(ConnectionError))
def generate_short_notes_with_retry(extracted_text):
    try:
        clipped_text = extracted_text[:6000]  # Reduced length
        prompt = f"""Generate concise short notes from the following text. 
Use bullet points for key ideas and keep each point brief (1-2 sentences). 
Ensure clarity and relevance for study purposes. 
Do not use markdown symbols like asterisks.

Text:
{clipped_text}"""

        response = generate_gemini_response(prompt)
        if "⚠ ERROR" in response:
            return {"status": "error", "message": response.replace("⚠ ERROR: ", "")}
        return response
    except Exception as e:
        if "429" in str(e):
            return {"status": "error", "message": "Quota exceeded. Please try later."}
        raise

@retry(stop=stop_after_attempt(3), wait=wait_fixed(2))
def generate_mcqs_with_retry(extracted_text, num_questions: int = 10):
    """Generate MCQs with retry logic and error handling"""
    try:
        prompt = (
            f"Create {num_questions} multiple-choice questions from the following content. "
            "Return ONLY a valid JSON array with this exact format:\n"
            "[{\"question\": \"Question text\", \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"], \"answer\": \"Correct option text\"}]\n"
            "Ensure each question is clear, options are distinct, and the answer matches exactly one option.\n\n"
            "Content:\n" + extracted_text[:8000]  # Reduced length to avoid token limits
        )
        
        response = generate_gemini_response(prompt)
        
        if "ERROR" in response:
            raise Exception("API error occurred")
            
        # Clean the response and parse JSON more robustly
        raw = response.strip()
        
        # Strip common markdown code fences
        if raw.startswith("```json"):
            raw = raw[7:]
        elif raw.startswith("```JSON"):
            raw = raw[7:]
        elif raw.startswith("```"):
            raw = raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

        # If there is still extra text around the JSON, try to isolate the array
        if not (raw.startswith("[") and raw.endswith("]")):
            start = raw.find("[")
            end = raw.rfind("]")
            if start != -1 and end != -1 and end > start:
                raw = raw[start : end + 1]
        
        data = json.loads(raw)
        
        # Validate and clean the MCQs
        cleaned = []
        for item in data[:num_questions]:
            if not isinstance(item, dict):
                continue
                
            q = (item.get('question') or '').strip()
            opts = item.get('options') or []
            ans = (item.get('answer') or '').strip()
            
            # Ensure we have exactly 4 options
            if q and isinstance(opts, list) and len(opts) >= 4 and ans:
                # Take first 4 options and ensure they're strings
                options_list = [str(opt).strip() for opt in opts[:4]]
                
                # Check if answer is in options
                if ans in options_list:
                    cleaned.append({
                        'question': q.replace("**", "").replace("*", ""),
                        'options': options_list,
                        'answer': ans.replace("**", "").replace("*", "")
                    })
        
        return cleaned if cleaned else [{"error": "No valid MCQs could be generated from the AI response."}]
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error in MCQ generation: {e}")
        logger.error(f"Raw response: {response}")
        return [{"error": "Failed to parse MCQs from AI response."}]
    except Exception as e:
        logger.error(f"MCQ generation error: {e}")
        if "429" in str(e):
            return [{"error": "MCQ generation is temporarily unavailable because the Gemini API quota was exceeded. Please wait a bit and try again."}]
        return [{"error": f"MCQ generation failed: {str(e)}"}]

@app.route('/upload', methods=['POST'])
def upload_file_or_url():
    """Handle file uploads and URL processing with optimized memory management."""
    logger.info("Received upload request")
    files_data = []
    temp_files = []  # Track all temporary files for cleanup
    quick_mode = request.form.get('quick_mode') in ['1', 'true', 'True']

    try:
        if 'files' not in request.files and 'youtube_url' not in request.form:
            return jsonify({"error": "No files or YouTube URL provided."}), 400

        # Process file uploads
        if 'files' in request.files:
            files = request.files.getlist('files')
            if not files or all(file.filename == '' for file in files):
                return jsonify({"error": "No valid files uploaded."}), 400

            for file in files:
                if not file.filename:
                    continue
                    
                if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.pdf')):
                    return jsonify({"error": f"Unsupported file type for {file.filename}."}), 400

                filepath = os.path.join(UPLOAD_FOLDER, secure_filename(file.filename))
                temp_files.append(filepath)  # Track for cleanup
                
                try:
                    file.save(filepath)
                    file_data = {"filename": file.filename}
                    
                    if file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                        file_data["type"] = "image"
                        file_data["image_description"] = generate_image_description(filepath)
                        
                        with open(filepath, "rb") as img_file:
                            mime_type = "image/jpeg" if file.filename.lower().endswith(('.jpg', '.jpeg')) else "image/png"
                            file_data["base64_image"] = f"data:{mime_type};base64,{base64.b64encode(img_file.read()).decode('utf-8')}"
                        
                        files_data.append(file_data)
                        
                    elif file.filename.lower().endswith('.pdf'):
                        file_data["type"] = "pdf"
                        
                        # Extract text using PyMuPDF with page limits
                        max_pages = 50 if quick_mode else 100
                        extracted_text = extract_text_from_pdf(filepath, max_pages=max_pages)
                        
                        # Fall back to OCR if no text found (with even stricter limits)
                        if not extracted_text:
                            logger.info("No text found with PyMuPDF, trying OCR...")
                            ocr_pages = 10 if quick_mode else 20
                            extracted_text = extract_text_from_scanned_pdf(filepath, max_pages=ocr_pages)
                        
                        file_data["extracted_text"] = extracted_text if extracted_text else "No text could be extracted from this PDF."
                        
                        # Process PDF into RAG vector store if RAG is available
                        if rag_processor and extracted_text and "No text could be extracted" not in extracted_text:
                            try:
                                # Generate a unique book_id from filename
                                book_id = secure_filename(file.filename).replace('.pdf', '').replace(' ', '_')[:50]
                                # Process document into vector store (async in background would be better, but sync for now)
                                logger.info(f"Processing {file.filename} into RAG vector store...")
                                chunk_count = rag_processor.process_document(
                                    file_path=filepath,
                                    book_id=book_id,
                                    metadata={"filename": file.filename, "type": "pdf"},
                                    max_pages=max_pages
                                )
                                file_data["book_id"] = book_id
                                file_data["rag_processed"] = True
                                file_data["rag_chunks"] = chunk_count
                                logger.info(f"✓ Processed {chunk_count} chunks into RAG for {file.filename}")
                            except Exception as rag_error:
                                logger.warning(f"RAG processing failed for {file.filename}: {rag_error}")
                                file_data["rag_processed"] = False
                                file_data["rag_error"] = str(rag_error)
                        else:
                            file_data["rag_processed"] = False
                        
                        files_data.append(file_data)
                        
                except Exception as e:
                    logger.error(f"Error processing file {file.filename}: {e}")
                    continue

        # Process YouTube URL if provided
        if 'youtube_url' in request.form:
            youtube_url = request.form['youtube_url']
            if not youtube_url:
                return jsonify({"error": "Empty YouTube URL provided."}), 400
            
            try:
                extracted_text, transcript_data = extract_text_from_youtube(youtube_url)
                
                if not extracted_text:
                    return jsonify({"error": "Failed to extract content from YouTube video."}), 400
                
                video_id = extract_video_id(youtube_url)
                
                files_data.append({
                    "type": "youtube",
                    "filename": youtube_url,
                    "extracted_text": extracted_text,
                    "transcript": transcript_data,
                    "youtube_id": video_id,
                })
            except Exception as e:
                logger.error(f"Error processing YouTube URL {youtube_url}: {e}")
                return jsonify({"error": f"Failed to process YouTube URL: {str(e)}"}), 500

        if not files_data:
            return jsonify({"error": "Failed to process any files or URLs."}), 400

        # Process content generation for each file
        response_data = []
        for file_data in files_data:
            processed_data = {
                "type": file_data["type"],
                "filename": file_data["filename"],
                "summary": "",
                "flashcards": [],
                "short_notes": "",
                "mcqs": [],
                "raw_text": "",
                "is_image": file_data["type"] == "image"
            }
            
            # Add RAG-related fields if available
            if file_data.get("book_id"):
                processed_data["book_id"] = file_data["book_id"]
                processed_data["rag_processed"] = file_data.get("rag_processed", False)
                if file_data.get("rag_chunks"):
                    processed_data["rag_chunks"] = file_data["rag_chunks"]
            
            # Add transcript data for YouTube videos
            if file_data["type"] == "youtube":
                processed_data["transcript"] = file_data.get("transcript")
                processed_data["youtube_id"] = file_data.get("youtube_id")
            
            if file_data["type"] == "image":
                processed_data["image_description"] = file_data["image_description"]
                processed_data["base64_image"] = file_data["base64_image"]
            elif file_data["type"] in ["pdf", "youtube"]:
                extracted_text = file_data["extracted_text"]
                if extracted_text and "No text could be extracted" not in extracted_text:
                    # Use clipped text for all processing to avoid quota issues
                    clipped = extracted_text[:4000] if quick_mode else extracted_text[:8000]
                    processed_data["raw_text"] = extracted_text
                    
                    # Generate summary
                    processed_data["summary"] = generate_gemini_response(f"Summarize this text concisely:\n\n{clipped}")
                    # Default: no MCQs yet; may be filled below (for non-quick mode)
                    processed_data["mcqs"] = []
                    
                    # Only generate short notes, flashcards, and MCQs in non-quick mode
                    if not quick_mode:
                        # Short notes
                        short_notes_response = generate_short_notes_with_retry(extracted_text)
                        if isinstance(short_notes_response, dict) and short_notes_response.get("status") == "error":
                            processed_data["short_notes"] = f"Note generation failed: {short_notes_response.get('message')}"
                        else:
                            processed_data["short_notes"] = short_notes_response
                        
                        # Flashcards
                        flashcards_response = generate_flashcards_with_retry(extracted_text)
                        if isinstance(flashcards_response, dict) and flashcards_response.get("status") == "error":
                            processed_data["flashcards"] = []
                            logger.warning(f"Flashcard generation failed: {flashcards_response.get('message')}")
                        else:
                            processed_data["flashcards"] = process_flashcards(flashcards_response)

                        # MCQs – pre-generate a set during upload (like the old behavior)
                        try:
                            # Ask the model for more MCQs so the frontend can offer 10/20/30-question tests
                            # We request 40 and will later use at most the first 30 valid ones.
                            initial_mcqs = generate_mcqs_with_retry(extracted_text, 40)
                            if isinstance(initial_mcqs, list):
                                # Keep only valid, non-error MCQ dicts with text options
                                simple_mcqs = []
                                for item in initial_mcqs:
                                    if not isinstance(item, dict):
                                        continue
                                    if "error" in item:
                                        continue
                                    q = (item.get("question") or "").strip()
                                    opts = item.get("options") or []
                                    ans = (item.get("answer") or "").strip()
                                    if q and isinstance(opts, list) and len(opts) >= 2 and ans:
                                        simple_mcqs.append({
                                            "question": q,
                                            "options": [str(o).strip() for o in opts],
                                            "answer": ans,
                                        })
                                if simple_mcqs:
                                    processed_data["mcqs"] = simple_mcqs
                        except Exception as e:
                            logger.warning(f"Initial MCQ generation during upload failed: {e}")
            
            response_data.append(processed_data)
            
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Unexpected error in upload_file_or_url: {e}")
        return jsonify({"error": "An unexpected error occurred while processing your request."}), 500
        
    finally:
        # Clean up all temporary files with enhanced safety
        for filepath in temp_files:
            safe_remove(filepath)
        # Force garbage collection
        import gc
        gc.collect()

@app.route('/generate/notes', methods=['POST'])
def generate_notes():
    data = request.get_json(force=True)
    text = data.get('text') or ''
    if not text:
        return jsonify({"error": "text is required"}), 400
    try:
        clipped_text = text[:6000]
        response = generate_short_notes_with_retry(clipped_text)
        if isinstance(response, dict) and response.get("status") == "error":
            return jsonify({"error": response.get("message")}), 500
        return jsonify({"short_notes": response})
    except Exception as e:
        logger.error(f"notes gen error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/generate/flashcards', methods=['POST'])
def generate_flashcards_endpoint():
    data = request.get_json(force=True)
    text = data.get('text') or ''
    if not text:
        return jsonify({"error": "text is required"}), 400
    try:
        clipped_text = text[:8000]
        resp = generate_flashcards_with_retry(clipped_text)
        flashcards = process_flashcards(resp)
        return jsonify({"flashcards": flashcards})
    except Exception as e:
        logger.error(f"flashcards gen error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/generate/mcqs', methods=['POST'])
def generate_mcqs_endpoint():
    data = request.get_json() or {}
    text = data.get('text', '').strip()
    n = min(max(1, int(data.get('num_questions', 10))), 20)

    if not text:
        return jsonify({"error": "Text is required"}), 400

    try:
        # Generate MCQs using the retry function
        raw_mcqs = generate_mcqs_with_retry(text, n)
        
        # If the generator returned only an error entry, surface it clearly
        if isinstance(raw_mcqs, list) and len(raw_mcqs) == 1 and isinstance(raw_mcqs[0], dict) and "error" in raw_mcqs[0]:
            return jsonify({"mcqs": [], "error": raw_mcqs[0]["error"]})

        # Format the response properly for the frontend
        formatted = []
        for i, mcq in enumerate(raw_mcqs):
            if "error" in mcq:
                continue
                
            # Ensure we have valid question and options
            question = mcq.get('question', '').strip()
            options = mcq.get('options', [])
            answer = mcq.get('answer', '').strip()
            
            if question and len(options) >= 4 and answer:
                # Find the correct answer index
                correct_idx = options.index(answer) if answer in options else 0
                
                formatted.append({
                    "id": i + 1,
                    "question": question,
                    "options": [
                        {"letter": "A", "text": str(options[0]), "is_correct": correct_idx == 0},
                        {"letter": "B", "text": str(options[1]), "is_correct": correct_idx == 1},
                        {"letter": "C", "text": str(options[2]), "is_correct": correct_idx == 2},
                        {"letter": "D", "text": str(options[3]), "is_correct": correct_idx == 3},
                    ],
                    "answer": answer,  # Keep the original answer text
                    "correct_answer": ["A", "B", "C", "D"][correct_idx],  # Letter version
                    "explanation": f"The correct answer is {answer}.",
                    "user_answer": "",
                    "is_answered": False,
                    "is_revealed": False
                })
        
        return jsonify({
            "mcqs": formatted,
            "total_generated": len(formatted)
        })
        
    except Exception as e:
        logger.error(f"MCQ generation error: {e}")
        return jsonify({"error": "Failed to generate MCQs. Please try again."}), 500

@app.route('/mcq/submit', methods=['POST'])
def submit_mcq_answers():
    data = request.get_json()
    mcqs = data.get('mcqs', [])
    if not mcqs:
        return jsonify({"error": "No answers provided"}), 400

    correct = sum(1 for q in mcqs if q.get('user_answer') == q.get('correct_answer'))
    total = len(mcqs)
    score = (correct / total) * 100 if total else 0

    feedback = "Excellent!" if score >= 90 else "Great!" if score >= 70 else "Good effort!" if score >= 50 else "Keep practicing!"

    return jsonify({
        "success": True,
        "score": round(score, 1),
        "correct": correct,
        "total": total,
        "feedback": feedback
    })

@app.route('/mcq/progress', methods=['GET'])
def get_mcq_progress():
    """Get user's MCQ progress history (placeholder for future implementation)"""
    return jsonify({
        "total_quizzes_taken": 0,
        "average_score": 0,
        "best_score": 0,
        "quizzes_completed": 0,
        "improvement_trend": "beginner"
    })

@app.route('/download', methods=['POST'])
def download_content():
    data = request.get_json()
    content_type = data.get('type')
    format_type = data.get('format')
    content = data.get('content')
    
    # Handle transcript download
    if content_type == 'transcript':
        transcript_data = content.get('transcript', [])
        if format_type == 'txt':
            buffer = BytesIO()
            buffer.write(b"YouTube Video Transcript\n\n")
            for segment in transcript_data:
                time_str = f"[{int(segment['start']//60)}:{int(segment['start']%60):02d}]"
                buffer.write(f"{time_str} {segment['text']}\n".encode('utf-8'))
            buffer.seek(0)
            return send_file(buffer, as_attachment=True, download_name='transcript.txt', mimetype='text/plain')
    
    if not content_type or not format_type or not content:
        return jsonify({"error": "Missing required fields"}), 400
        
    filename = f"{content_type}.{format_type}"
    buffer = BytesIO()
    
    if format_type == 'pdf':
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        custom_style = ParagraphStyle(
            'CustomStyle',
            parent=styles['Normal'],
            fontSize=12,
            leading=14,
            spaceAfter=12,
            alignment=1
        )
        story = []
        if content_type in ['summary', 'short_notes', 'image_description']:
            story.append(Paragraph(content_type.replace('_', ' ').title(), styles['Title']))
            for paragraph in content.split('\n\n'):
                story.append(Paragraph(paragraph, custom_style))
                story.append(Spacer(1, 12))
        elif content_type == 'flashcards':
            story.append(Paragraph("Flashcards", styles['Title']))
            for i, card in enumerate(content, 1):
                story.append(Paragraph(f"Card {i}", styles['Heading2']))
                story.append(Paragraph(f"Question: {card['front']}", custom_style))
                story.append(Paragraph(f"Answer: {card['back']}", custom_style))
                story.append(Spacer(1, 12))
        elif content_type == 'mcqs':
            story.append(Paragraph("Multiple Choice Questions", styles['Title']))
            for i, mcq in enumerate(content, 1):
                story.append(Paragraph(f"Question {i}: {mcq['question']}", styles['Heading2']))
                for option in mcq['options']:
                    story.append(Paragraph(f"{option['letter']}) {option['text']}", custom_style))
                story.append(Paragraph(f"Correct Answer: {mcq['correct_answer']}", custom_style))
                story.append(Paragraph(f"Explanation: {mcq.get('explanation', 'No explanation available')}", custom_style))
                story.append(Spacer(1, 12))
        doc.build(story)
        buffer.seek(0)
        return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/pdf')
        
    elif format_type == 'txt':
        buffer = BytesIO()
        if content_type in ['summary', 'short_notes', 'image_description']:
            buffer.write(content.encode('utf-8'))
        elif content_type == 'flashcards':
            buffer.write(b"Flashcards\n\n")
            for i, card in enumerate(content, 1):
                buffer.write(f"Card {i}\n".encode('utf-8'))
                buffer.write(f"  Question: {card['front']}\n".encode('utf-8'))
                buffer.write(f"  Answer: {card['back']}\n".encode('utf-8'))
                buffer.write(b"\n")
        elif content_type == 'mcqs':
            buffer.write(b"Multiple Choice Questions\n\n")
            for i, mcq in enumerate(content, 1):
                buffer.write(f"Question {i}: {mcq['question']}\n".encode('utf-8'))
                for option in mcq['options']:
                    buffer.write(f"  {option['letter']}) {option['text']}\n".encode('utf-8'))
                buffer.write(f"Correct Answer: {mcq['correct_answer']}\n".encode('utf-8'))
                buffer.write(f"Explanation: {mcq.get('explanation', 'No explanation available')}\n".encode('utf-8'))
                buffer.write(b"\n")
        buffer.seek(0)
        return send_file(buffer, as_attachment=True, download_name=filename, mimetype='text/plain')
        
    elif format_type == 'docx':
        doc = Document()
        doc.add_heading(content_type.replace('_', ' ').title(), level=1).alignment = WD_ALIGN_PARAGRAPH.CENTER
        if content_type in ['summary', 'short_notes', 'image_description']:
            for paragraph in content.split('\n\n'):
                p = doc.add_paragraph(paragraph)
                p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        elif content_type == 'flashcards':
            for i, card in enumerate(content, 1):
                doc.add_paragraph(f"Card {i}", style='Heading 2')
                doc.add_paragraph(f"Question: {card['front']}")
                doc.add_paragraph(f"Answer: {card['back']}", style='Normal').runs[0].italic = True
        elif content_type == 'mcqs':
            for i, mcq in enumerate(content, 1):
                doc.add_paragraph(f"Question {i}: {mcq['question']}", style='Heading 2')
                for option in mcq['options']:
                    doc.add_paragraph(f"{option['letter']}) {option['text']}")
                doc.add_paragraph(f"Correct Answer: {mcq['correct_answer']}", style='Normal').runs[0].bold = True
                doc.add_paragraph(f"Explanation: {mcq.get('explanation', 'No explanation available')}", style='Normal')
        doc.save(buffer)
        buffer.seek(0)
        return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        
    return jsonify({"error": "Unsupported format"}), 400

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_message = data.get('message')
        conversation_history = data.get('history', [])
        content = data.get('content', {})
        if not user_message:
            return jsonify({"error": "No message provided."}), 400
        
        def _truncate(txt: str, max_len: int) -> str:
            if not isinstance(txt, str):
                return ""
            return txt[:max_len]

        # Try to use RAG if available and book_id is provided
        rag_context = ""
        book_id = content.get('book_id')
        if rag_processor and book_id:
            try:
                # Query RAG for relevant context
                rag_results = rag_processor.query_book(book_id, user_message, k=3)
                if rag_results.get('results'):
                    rag_context = "\n\nRelevant content from your document:\n"
                    for i, result in enumerate(rag_results['results'], 1):
                        rag_context += f"[{i}] {_truncate(result.get('content', ''), 300)}\n"
                        if result.get('page'):
                            rag_context += f"   (Page {result.get('page')})\n"
                    rag_context += "\n"
                    logger.info(f"Retrieved {len(rag_results['results'])} relevant chunks from RAG")
            except Exception as rag_error:
                logger.warning(f"RAG query failed: {rag_error}")
                # Continue without RAG context

        content_context = ""
        if content.get("summary"):
            content_context += f"Summary of the uploaded content:\n{_truncate(content['summary'], 2000)}\n\n"
        if content.get("short_notes"):
            content_context += f"Short notes from the uploaded content:\n{_truncate(content['short_notes'], 2000)}\n\n"
        if content.get("image_description"):
            content_context += f"Image description:\n{_truncate(content['image_description'], 1000)}\n\n"
        
        recent_history = conversation_history[-5:] if isinstance(conversation_history, list) else []  # Reduced history
        history_text = "\n".join([f"{m.get('sender','user')}: {_truncate(m.get('text',''), 200)}" for m in recent_history])
        
        # Build prompt with RAG context if available
        prompt = (
            "You are a friendly and helpful study assistant chatbot. You can answer questions about the user's uploaded study content "
            "and also engage in general conversation on any topic. Use the provided content and conversation history to give context-aware, "
            "natural, and concise responses. If the user asks about something unrelated to the content, respond appropriately with general knowledge "
            "or conversational replies. Keep responses under 150 words and maintain a friendly tone.\n\n"
        )
        
        if rag_context:
            prompt += f"{rag_context}\n"
        
        prompt += (
            f"Uploaded content context:\n{content_context}\n\n"
            f"Conversation history:\n{history_text}\n\n"
            f"User message: {_truncate(user_message, 300)}\n\n"
            "Respond as the chatbot:"
        )
        
        response_text = generate_chat_response(prompt)
        if "⚠ ERROR" in response_text:
            fallback = (
                "I'm having trouble reaching the AI right now. "
                "Here's a friendly response while I recover: I read your message and the uploaded context. "
                "Try again in a moment, or ask a simpler question."
            )
            return jsonify({"response": fallback})
        return jsonify({"response": response_text})
    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        return jsonify({"error": f"Chat error: {str(e)}"}), 500

# Add this debug route before the if __name__ == '__main__': line
@app.route('/debug/rag-status')
def debug_rag_status():
    rag_status = {
        "rag_processor_imported": RAGProcessor is not None,
        "rag_processor_initialized": rag_processor is not None,
        "import_error": rag_import_error if 'rag_import_error' in globals() else None,
        "init_error": rag_init_error if 'rag_init_error' in globals() else None,
        "python_path": os.environ.get('PYTHONPATH', 'Not set'),
        "current_working_directory": os.getcwd(),
        "files_in_directory": os.listdir('.')
    }
    
    # Test LangChain imports
    langchain_imports_ok = False
    langchain_error = None
    try:
        # Try new imports
        try:
            from langchain_community.document_loaders import PyPDFLoader
            from langchain_community.embeddings import HuggingFaceEmbeddings
            from langchain_community.vectorstores import Chroma
            langchain_imports_ok = True
            rag_status["langchain_version"] = "new (langchain-community)"
        except ImportError:
            # Try old imports
            from langchain.document_loaders import PyPDFLoader
            from langchain.embeddings import HuggingFaceEmbeddings
            from langchain.vectorstores import Chroma
            langchain_imports_ok = True
            rag_status["langchain_version"] = "old (langchain)"
    except ImportError as e:
        langchain_error = str(e)
        rag_status["langchain_version"] = "error"
    
    rag_status["langchain_imports"] = langchain_imports_ok
    if langchain_error:
        rag_status["langchain_import_error"] = langchain_error
    
    # Test ChromaDB import
    try:
        import chromadb
        rag_status["chromadb_imported"] = True
        rag_status["chromadb_version"] = getattr(chromadb, '__version__', 'unknown')
    except ImportError as e:
        rag_status["chromadb_imported"] = False
        rag_status["chromadb_error"] = str(e)
    
    # Check vector store directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    persist_dir = os.path.join(backend_dir, 'vector_store')
    rag_status["vector_store_path"] = persist_dir
    rag_status["vector_store_exists"] = os.path.exists(persist_dir)
    if rag_status["vector_store_exists"]:
        try:
            contents = os.listdir(persist_dir)
            rag_status["vector_store_contents"] = contents
            rag_status["vector_store_writable"] = os.access(persist_dir, os.W_OK)
        except Exception as e:
            rag_status["vector_store_error"] = str(e)
    
    # Check vector store directory if RAG is initialized
    if rag_processor:
        try:
            rag_status["rag_processor_persist_dir"] = rag_processor.persist_directory
            # Try to list collections
            try:
                import chromadb
                client = chromadb.PersistentClient(path=rag_processor.persist_directory)
                collections = client.list_collections()
                rag_status["collections"] = [col.name for col in collections]
                rag_status["collection_count"] = len(collections)
            except Exception as e:
                rag_status["collection_list_error"] = str(e)
        except Exception as e:
            rag_status["rag_processor_error"] = str(e)
    
    return jsonify(rag_status)

@app.route('/api/rag/books', methods=['GET'])
def list_rag_books():
    """List all books/documents that have been processed into RAG."""
    if not rag_processor:
        return jsonify({"error": "RAG processor not available"}), 503
    
    try:
        import chromadb
        client = chromadb.PersistentClient(path=rag_processor.persist_directory)
        collections = client.list_collections()
        
        books = []
        for collection in collections:
            try:
                stats = rag_processor.get_stats(collection.name)
                books.append(stats)
            except Exception as e:
                logger.warning(f"Error getting stats for {collection.name}: {e}")
                books.append({
                    "book_id": collection.name,
                    "status": "error",
                    "error": str(e)
                })
        
        return jsonify({
            "books": books,
            "total": len(books)
        })
    except Exception as e:
        logger.error(f"Error listing RAG books: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/rag/query', methods=['POST'])
def rag_query():
    """Query RAG directly for testing."""
    if not rag_processor:
        return jsonify({"error": "RAG processor not available"}), 503
    
    data = request.get_json()
    book_id = data.get('book_id')
    question = data.get('question')
    k = data.get('k', 3)
    
    if not book_id or not question:
        return jsonify({"error": "book_id and question are required"}), 400
    
    try:
        results = rag_processor.query_book(book_id, question, k=k)
        return jsonify(results)
    except Exception as e:
        logger.error(f"RAG query error: {e}")
        return jsonify({"error": str(e)}), 500

# Session Management Endpoints
SESSIONS_DIR = os.path.join(os.path.dirname(__file__), 'sessions')
os.makedirs(SESSIONS_DIR, exist_ok=True)

@app.route('/api/sessions', methods=['GET'])
def list_sessions():
    """List all saved sessions."""
    try:
        sessions = []
        if os.path.exists(SESSIONS_DIR):
            for filename in os.listdir(SESSIONS_DIR):
                if filename.endswith('.json'):
                    session_path = os.path.join(SESSIONS_DIR, filename)
                    try:
                        with open(session_path, 'r', encoding='utf-8') as f:
                            session_data = json.load(f)
                            # Get file stats
                            stat = os.stat(session_path)
                            sessions.append({
                                'id': filename.replace('.json', ''),
                                'name': session_data.get('name', 'Untitled Session'),
                                'created_at': session_data.get('created_at', ''),
                                'updated_at': datetime.datetime.fromtimestamp(stat.st_mtime).isoformat(),
                                'file_count': len(session_data.get('uploadedFiles', [])),
                                'has_chat': len(session_data.get('chatHistory', [])) > 0
                            })
                    except Exception as e:
                        logger.warning(f"Error reading session {filename}: {e}")
                        continue
        
        # Sort by updated_at descending (most recent first)
        sessions.sort(key=lambda x: x.get('updated_at', ''), reverse=True)
        return jsonify({'sessions': sessions})
    except Exception as e:
        logger.error(f"Error listing sessions: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/sessions', methods=['POST'])
def save_session():
    """Save a session (uploaded files + chat history)."""
    try:
        data = request.get_json()
        session_name = data.get('name', f"Session {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}")
        uploaded_files = data.get('uploadedFiles', [])
        chat_history = data.get('chatHistory', [])
        
        # Generate session ID
        session_id = f"session_{int(time.time())}"
        
        session_data = {
            'id': session_id,
            'name': session_name,
            'created_at': datetime.datetime.now().isoformat(),
            'uploadedFiles': uploaded_files,
            'chatHistory': chat_history
        }
        
        session_path = os.path.join(SESSIONS_DIR, f"{session_id}.json")
        with open(session_path, 'w', encoding='utf-8') as f:
            json.dump(session_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Session saved: {session_id}")
        return jsonify({
            'success': True,
            'session_id': session_id,
            'message': 'Session saved successfully'
        })
    except Exception as e:
        logger.error(f"Error saving session: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/sessions/<session_id>', methods=['GET'])
def get_session(session_id):
    """Get a specific session by ID."""
    try:
        session_path = os.path.join(SESSIONS_DIR, f"{session_id}.json")
        if not os.path.exists(session_path):
            return jsonify({"error": "Session not found"}), 404
        
        with open(session_path, 'r', encoding='utf-8') as f:
            session_data = json.load(f)
        
        return jsonify(session_data)
    except Exception as e:
        logger.error(f"Error loading session: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/sessions/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    """Delete a session."""
    try:
        session_path = os.path.join(SESSIONS_DIR, f"{session_id}.json")
        if not os.path.exists(session_path):
            return jsonify({"error": "Session not found"}), 404
        
        os.remove(session_path)
        logger.info(f"Session deleted: {session_id}")
        return jsonify({'success': True, 'message': 'Session deleted successfully'})
    except Exception as e:
        logger.error(f"Error deleting session: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host="127.0.0.1", port=5000, debug=True)