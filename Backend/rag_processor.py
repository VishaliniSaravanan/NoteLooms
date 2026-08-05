"""
rag_processor.py
────────────────
RAG (Retrieval-Augmented Generation) processor using:
  - Google Gemini API for embeddings  (zero local model RAM)
  - ChromaDB for vector storage       (lightweight, file-based)
  - LangChain for chunking utilities

Switching from HuggingFace sentence-transformers to Gemini embeddings
reduces peak RAM by ~800 MB, making RAG viable on free-tier hosts.

Exported symbols used by App.py:
  RAGProcessor               – main class
    .process_document(...)   -> int   (chunk count stored)
    .query_book(...)         -> dict  (retrieval results)
    .delete_book(...)        -> bool
    .get_stats(...)          -> dict
"""

import os
import gc
import logging
from typing import List, Dict, Any, Optional, Union
from pathlib import Path
from contextlib import contextmanager

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# Dependency imports with clear error messages
# ──────────────────────────────────────────────
try:
    from langchain_chroma import Chroma
except ImportError:
    try:
        from langchain_community.vectorstores import Chroma  # older installs
    except ImportError as e:
        raise ImportError(
            "langchain-chroma not found. Install with:\n"
            "pip install langchain-chroma chromadb"
        ) from e

try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError as e:
    raise ImportError(
        "langchain-text-splitters not found. Install with:\n"
        "pip install langchain-text-splitters"
    ) from e

try:
    from langchain_core.documents import Document
except ImportError as e:
    raise ImportError(
        "langchain-core not found. Install with:\n"
        "pip install langchain-core"
    ) from e

try:
    from langchain_google_genai import GoogleGenerativeAIEmbeddings
except ImportError as e:
    raise ImportError(
        "langchain-google-genai not found. Install with:\n"
        "pip install langchain-google-genai"
    ) from e


# ──────────────────────────────────────────────
# PDF helper
# ──────────────────────────────────────────────

@contextmanager
def _safe_open_pdf(file_path: Union[str, Path]):
    """Context manager that safely opens and closes a PyMuPDF document."""
    import pymupdf as fitz
    doc = None
    fp = Path(file_path)
    if not fp.exists():
        raise FileNotFoundError(f"PDF file not found: {fp}")
    try:
        doc = fitz.open(str(fp))
        yield doc
    except Exception as e:
        raise RuntimeError(f"Error opening PDF {fp.name}: {e}") from e
    finally:
        if doc is not None:
            try:
                doc.close()
            except Exception:
                gc.collect()


# ──────────────────────────────────────────────
# RAGProcessor
# ──────────────────────────────────────────────

class RAGProcessor:
    """
    Lightweight RAG processor that uses the Gemini Embeddings API.

    Advantages over HuggingFace sentence-transformers:
      • No local model download (~800 MB saved on free-tier hosts)
      • Embeddings are computed via the Gemini API (same key as the app)
      • ChromaDB stores vectors on disk, so memory footprint stays small
    """

    def __init__(self, persist_directory: Optional[str] = None):
        gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not gemini_api_key:
            raise RuntimeError(
                "GEMINI_API_KEY (or GOOGLE_API_KEY) is required for Gemini embeddings."
            )

        # Gemini text-embedding model – free-tier quota is generous
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004",
            google_api_key=gemini_api_key,
            task_type="retrieval_document",
        )

        self.persist_directory = persist_directory or "vector_store"
        os.makedirs(self.persist_directory, exist_ok=True)

        # Chunking: keep chunks small to stay within Gemini's token limit per embed call
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=80,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""],
        )
        logger.info("✓ RAGProcessor initialised with Gemini embeddings (text-embedding-004)")

    # ── Document loading ──────────────────────────────────────────────

    def _load_pdf_pages(self, file_path: Path, max_pages: int = 200) -> List[Document]:
        """Extract text page-by-page from a PDF (no parallel threads to keep RAM low)."""
        documents: List[Document] = []
        with _safe_open_pdf(file_path) as doc:
            total = min(len(doc), max_pages)
            logger.info(f"Loading {total} pages from {file_path.name}")
            for page_num in range(total):
                try:
                    text = doc[page_num].get_text()
                    if text and text.strip():
                        documents.append(Document(
                            page_content=text.strip(),
                            metadata={"source": file_path.name, "page": page_num + 1},
                        ))
                    # Light GC every 50 pages
                    if page_num % 50 == 0:
                        gc.collect()
                except Exception as e:
                    logger.warning(f"Error reading page {page_num}: {e}")
        logger.info(f"Loaded {len(documents)} non-empty pages")
        return documents

    # ── Main processing ───────────────────────────────────────────────

    def process_document(
        self,
        file_path: str,
        book_id: str,
        metadata: Optional[Dict] = None,
        max_pages: int = 200,
    ) -> int:
        """
        Chunk a document and store embeddings in ChromaDB.
        Returns the number of chunks stored.
        """
        fp = Path(file_path)
        if not fp.exists():
            raise FileNotFoundError(f"File not found: {fp}")

        # Load
        if fp.suffix.lower() == ".pdf":
            documents = self._load_pdf_pages(fp, max_pages=max_pages)
        else:
            # Plain text / markdown fallback
            text = fp.read_text(encoding="utf-8", errors="ignore")
            documents = [Document(page_content=text[:50_000], metadata={"source": fp.name})]

        if not documents:
            logger.warning(f"No content extracted from {fp.name}")
            return 0

        # Chunk
        chunks = self.text_splitter.split_documents(documents)
        if not chunks:
            logger.warning(f"No chunks produced from {fp.name}")
            return 0

        # Attach metadata
        extra_meta = metadata or {}
        for chunk in chunks:
            chunk.metadata.update(extra_meta)
            chunk.metadata["book_id"] = book_id

        logger.info(f"Embedding and storing {len(chunks)} chunks for '{book_id}'…")

        # Store in batches to avoid hitting Gemini rate limits
        batch_size = 50
        vectordb = None
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]
            if vectordb is None:
                vectordb = Chroma.from_documents(
                    documents=batch,
                    embedding=self.embeddings,
                    persist_directory=self.persist_directory,
                    collection_name=book_id,
                )
            else:
                vectordb.add_documents(batch)
            gc.collect()

        logger.info(f"✓ Stored {len(chunks)} chunks for book '{book_id}'")
        return len(chunks)

    # ── Querying ──────────────────────────────────────────────────────

    def query_book(self, book_id: str, question: str, k: int = 3) -> Dict[str, Any]:
        """Retrieve the top-k most relevant chunks for a question."""
        try:
            vectordb = Chroma(
                persist_directory=self.persist_directory,
                embedding_function=self.embeddings,
                collection_name=book_id,
            )
            docs_scores = vectordb.similarity_search_with_score(question, k=k)
            results = [
                {
                    "content": (doc.page_content or "")[:500],
                    "score": float(score),
                    "page": doc.metadata.get("page", "N/A"),
                    "source": doc.metadata.get("source", "Unknown"),
                }
                for doc, score in docs_scores
            ]
            return {"results": results}
        except Exception as e:
            logger.error(f"Error querying book '{book_id}': {e}")
            return {"results": [], "error": str(e)}

    # ── Management ────────────────────────────────────────────────────

    def delete_book(self, book_id: str) -> bool:
        """Delete a book's collection from the vector store."""
        try:
            vectordb = Chroma(
                persist_directory=self.persist_directory,
                embedding_function=self.embeddings,
                collection_name=book_id,
            )
            client = getattr(vectordb, "_client", None)
            if client is not None:
                client.delete_collection(name=book_id)
                logger.info(f"✓ Deleted collection: {book_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting book '{book_id}': {e}")
            return False

    def get_stats(self, book_id: str) -> Dict[str, Any]:
        """Return chunk count and status for a stored book."""
        try:
            vectordb = Chroma(
                persist_directory=self.persist_directory,
                embedding_function=self.embeddings,
                collection_name=book_id,
            )
            count = vectordb._collection.count()
            return {"book_id": book_id, "chunk_count": count, "status": "ready"}
        except Exception as e:
            logger.error(f"Error getting stats for '{book_id}': {e}")
            return {"book_id": book_id, "error": str(e), "status": "error"}