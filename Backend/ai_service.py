"""
ai_service.py
─────────────
Encapsulates all Google Gemini AI client initialization and content-generation
logic so that App.py only needs to call high-level functions.

Exported symbols used by App.py:
  gemini_client, GEMINI_MODEL
  generate_gemini_response(prompt) -> str
  generate_chat_response(prompt)   -> str
  generate_image_description(image_path) -> str
  generate_flashcards_with_retry(text)   -> str | dict
  process_flashcards(response_text)      -> list
  generate_short_notes_with_retry(text)  -> str | dict
  generate_mcqs_with_retry(text, n)      -> list
"""

import os
import json
import logging

from google import genai
from google.genai import types as genai_types
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type
from requests.exceptions import ConnectionError

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# Client & model configuration
# ──────────────────────────────────────────────

GEMINI_API_KEY      = os.getenv("GEMINI_API_KEY")
GEMINI_CHAT_API_KEY = os.getenv("GEMINI_CHAT_API_KEY") or GEMINI_API_KEY
GEMINI_MODEL        = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

gemini_client      = None
gemini_chat_client = None

if GEMINI_API_KEY:
    try:
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        logger.info("✓ Gemini client initialized successfully")
    except Exception as e:
        logger.warning(f"Gemini client initialization failed: {e}")
else:
    logger.warning("GEMINI_API_KEY not found in environment variables")

if GEMINI_CHAT_API_KEY:
    try:
        gemini_chat_client = genai.Client(api_key=GEMINI_CHAT_API_KEY)
        logger.info("✓ Gemini chat client initialized successfully")
    except Exception as e:
        logger.warning(f"Gemini chat client initialization failed: {e}")


# ──────────────────────────────────────────────
# Core generation helpers
# ──────────────────────────────────────────────

def generate_gemini_response(prompt: str) -> str:
    """Generate a text response using the main Gemini client."""
    try:
        if not gemini_client:
            return "⚠ ERROR: Gemini client not initialized. Please check GEMINI_API_KEY."
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )
        return response.text.strip().replace("*", "")
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        if "429" in str(e):
            return "⚠ ERROR: API quota exceeded. Please try again later."
        elif "404" in str(e):
            return "⚠ ERROR: Model not available. Please check the model configuration."
        return f"⚠ ERROR: {e}"


def generate_chat_response(prompt: str) -> str:
    """
    Generate a chat response using the dedicated chat client.
    Falls back to the main Gemini client key when GEMINI_CHAT_API_KEY is not set.
    """
    try:
        if not gemini_chat_client:
            return "⚠ ERROR: Gemini chat client not initialized. Please check GEMINI_CHAT_API_KEY."
        response = gemini_chat_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )
        return response.text.strip().replace("*", "")
    except Exception as e:
        logger.error(f"Gemini Chat API error: {e}")
        if "429" in str(e):
            return "⚠ ERROR: Chat API quota exceeded. Please try again later."
        elif "404" in str(e):
            return "⚠ ERROR: Chat model not available. Please check the chat model configuration."
        return f"⚠ ERROR: {e}"


def generate_image_description(image_path: str) -> str:
    """Describe an image using Gemini's vision capabilities."""
    try:
        if not gemini_client:
            return "⚠ ERROR: Gemini client not initialized. Please check GEMINI_API_KEY."

        ext = (os.path.splitext(image_path)[1] or "").lower()
        mime_type = "image/png" if ext == ".png" else "image/jpeg"

        with open(image_path, "rb") as img_file:
            img_data = img_file.read()

        image_part = genai_types.Part.from_bytes(data=img_data, mime_type=mime_type)
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=["Provide a detailed description of this image for educational purposes.", image_part],
        )

        text = getattr(response, "text", None) if response else None
        if not text or not text.strip():
            return "⚠ ERROR: No description returned (response may have been blocked or empty)."
        return text.strip().replace("*", "")
    except Exception as e:
        logger.error(f"Image description error: {e}")
        return f"⚠ ERROR: Unable to describe image - {e}"


# ──────────────────────────────────────────────
# Flashcard generation
# ──────────────────────────────────────────────

@retry(stop=stop_after_attempt(2), retry=retry_if_exception_type(ConnectionError))
def generate_flashcards_with_retry(extracted_text: str):
    """Generate up to 20 flashcards from the given text."""
    try:
        clipped_text = extracted_text[:8000]
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


def process_flashcards(response_text) -> list:
    """Parse the raw AI flashcard text into a structured list of dicts."""
    try:
        if isinstance(response_text, dict):
            if response_text.get("status") == "error":
                return []
            response_text = str(response_text)

        flashcards_list = [f.strip() for f in response_text.split("\n\n") if f.strip()]
        structured_flashcards = []

        for i, flashcard in enumerate(flashcards_list, 1):
            if i > 20:
                break
            parts = [p.strip() for p in flashcard.split("\n") if p.strip()]
            if len(parts) >= 2:
                front = back = None
                for part in parts:
                    if part.startswith("Question:") or part.startswith("Q:"):
                        front = part.split(":", 1)[1].strip()
                    elif part.startswith("Answer:") or part.startswith("A:"):
                        back = part.split(":", 1)[1].strip()
                if front and back and len(front) > 3 and len(back) > 3:
                    structured_flashcards.append({"id": i, "front": front, "back": back})

        return structured_flashcards
    except Exception as e:
        logger.error(f"Flashcard processing error: {e}")
        return []


# ──────────────────────────────────────────────
# Short notes generation
# ──────────────────────────────────────────────

@retry(stop=stop_after_attempt(2), retry=retry_if_exception_type(ConnectionError))
def generate_short_notes_with_retry(extracted_text: str):
    """Generate concise bullet-point study notes."""
    try:
        clipped_text = extracted_text[:6000]
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


# ──────────────────────────────────────────────
# MCQ generation
# ──────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_fixed(2))
def generate_mcqs_with_retry(extracted_text: str, num_questions: int = 10) -> list:
    """Generate multiple-choice questions as a validated list of dicts."""
    response = ""
    try:
        prompt = (
            f"Create {num_questions} multiple-choice questions from the following content. "
            "Return ONLY a valid JSON array with this exact format:\n"
            '[{"question": "Question text", "options": ["Option A", "Option B", "Option C", "Option D"], "answer": "Correct option text"}]\n'
            "Ensure each question is clear, options are distinct, and the answer matches exactly one option.\n\n"
            "Content:\n" + extracted_text[:8000]
        )

        response = generate_gemini_response(prompt)

        if "ERROR" in response:
            raise Exception("API error occurred")

        # Strip markdown fences
        raw = response.strip()
        for prefix in ("```json", "```JSON", "```"):
            if raw.startswith(prefix):
                raw = raw[len(prefix):]
                break
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

        # Isolate the JSON array if surrounded by extra text
        if not (raw.startswith("[") and raw.endswith("]")):
            start, end = raw.find("["), raw.rfind("]")
            if start != -1 and end != -1 and end > start:
                raw = raw[start: end + 1]

        data = json.loads(raw)

        cleaned = []
        for item in data[:num_questions]:
            if not isinstance(item, dict):
                continue
            q   = (item.get("question") or "").strip()
            opts = item.get("options") or []
            ans  = (item.get("answer") or "").strip()
            if q and isinstance(opts, list) and len(opts) >= 4 and ans:
                options_list = [str(opt).strip() for opt in opts[:4]]
                if ans in options_list:
                    cleaned.append({
                        "question": q.replace("**", "").replace("*", ""),
                        "options":  options_list,
                        "answer":   ans.replace("**", "").replace("*", ""),
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
