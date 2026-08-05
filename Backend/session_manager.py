"""
session_manager.py
──────────────────
Handles saving, listing, loading, and deleting user study sessions.
Sessions are stored as JSON files in the Backend/sessions/ directory.

Exported symbols used by App.py:
  SESSIONS_DIR
  list_sessions()                     -> list[dict]
  save_session(name, files, history)  -> dict
  get_session(session_id)             -> dict | None
  delete_session(session_id)          -> bool
"""

import os
import json
import time
import datetime
import logging

logger = logging.getLogger(__name__)

# Directory where session JSON files are persisted
SESSIONS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sessions")
os.makedirs(SESSIONS_DIR, exist_ok=True)


def list_sessions() -> list:
    """
    Return a summary list of all saved sessions, sorted newest-first.
    Each entry contains: id, name, created_at, updated_at, file_count, has_chat.
    """
    sessions = []
    try:
        for filename in os.listdir(SESSIONS_DIR):
            if not filename.endswith(".json"):
                continue
            session_path = os.path.join(SESSIONS_DIR, filename)
            try:
                with open(session_path, "r", encoding="utf-8") as f:
                    session_data = json.load(f)
                stat = os.stat(session_path)
                sessions.append({
                    "id":         filename.replace(".json", ""),
                    "name":       session_data.get("name", "Untitled Session"),
                    "created_at": session_data.get("created_at", ""),
                    "updated_at": datetime.datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "file_count": len(session_data.get("uploadedFiles", [])),
                    "has_chat":   len(session_data.get("chatHistory", [])) > 0,
                })
            except Exception as e:
                logger.warning(f"Error reading session {filename}: {e}")
    except Exception as e:
        logger.error(f"Error listing sessions: {e}")

    sessions.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
    return sessions


def save_session(name: str, uploaded_files: list, chat_history: list) -> dict:
    """
    Persist a session to disk and return a dict with the new session_id.
    Raises on I/O error.
    """
    session_id   = f"session_{int(time.time())}"
    session_data = {
        "id":            session_id,
        "name":          name,
        "created_at":    datetime.datetime.now().isoformat(),
        "uploadedFiles": uploaded_files,
        "chatHistory":   chat_history,
    }
    session_path = os.path.join(SESSIONS_DIR, f"{session_id}.json")
    with open(session_path, "w", encoding="utf-8") as f:
        json.dump(session_data, f, indent=2, ensure_ascii=False)
    logger.info(f"Session saved: {session_id}")
    return {"session_id": session_id}


def get_session(session_id: str) -> dict:
    """
    Load and return a session by ID.
    Returns None if the session file does not exist.
    """
    session_path = os.path.join(SESSIONS_DIR, f"{session_id}.json")
    if not os.path.exists(session_path):
        return None
    with open(session_path, "r", encoding="utf-8") as f:
        return json.load(f)


def delete_session(session_id: str) -> bool:
    """
    Delete a session file.
    Returns True on success, False if the file did not exist.
    """
    session_path = os.path.join(SESSIONS_DIR, f"{session_id}.json")
    if not os.path.exists(session_path):
        return False
    os.remove(session_path)
    logger.info(f"Session deleted: {session_id}")
    return True
