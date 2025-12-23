import os
import time
import random
from typing import List, Dict, Any, Optional, Generator, Union
from pathlib import Path
from contextlib import contextmanager
import logging
import concurrent.futures
from tqdm import tqdm
import multiprocessing
from functools import partial

# LangChain imports - updated for newer versions
try:
    # Try new langchain-community imports first (for langchain >= 0.1.0)
    try:
        from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
        from langchain_community.vectorstores import Chroma
    except ImportError:
        # Fallback to old imports (for older langchain versions)
        from langchain.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
        from langchain.vectorstores import Chroma
    
    # Try new langchain-huggingface package first (recommended), then fallback to deprecated version
    try:
        from langchain_huggingface import HuggingFaceEmbeddings
    except ImportError:
        try:
            from langchain_community.embeddings import HuggingFaceEmbeddings
        except ImportError:
            from langchain.embeddings import HuggingFaceEmbeddings
    
    # These are in core langchain or separate packages
    try:
        from langchain_text_splitters import RecursiveCharacterTextSplitter
    except ImportError:
        from langchain.text_splitter import RecursiveCharacterTextSplitter
    
    try:
        from langchain_core.documents import Document
    except ImportError:
        from langchain.schema import Document
except ImportError as e:
    raise ImportError(
        "Required LangChain packages not found. Install with: "
        "pip install langchain langchain-community sentence-transformers chromadb pymupdf python-docx"
    ) from e

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_removal_delay(filepath: Union[str, Path]) -> float:
    """Calculate delay based on file size. Larger files get longer delays."""
    try:
        filepath = Path(filepath) if isinstance(filepath, str) else filepath
        size_mb = filepath.stat().st_size / (1024 * 1024)  # Size in MB
        if size_mb > 100:  # Very large files
            return 1.0
        elif size_mb > 10:  # Large files
            return 0.5
        return 0.2  # Small files
    except (OSError, TypeError):
        return 0.3  # Default if size can't be determined

def safe_remove(filepath: Union[str, Path], max_retries: int = 5, initial_delay: float = None) -> bool:
    """Safely remove a file with retry logic and size-based delays."""
    filepath = Path(filepath) if isinstance(filepath, str) else filepath
    if not filepath.exists():
        return True

    delay = initial_delay if initial_delay is not None else get_removal_delay(filepath)
    
    for attempt in range(max_retries):
        try:
            # Force garbage collection to ensure file handles are released
            import gc
            gc.collect()
            
            # Try to remove the file
            filepath.unlink()
            
            # Verify the file was actually removed
            if not filepath.exists():
                return True
                
            # If we get here, the file still exists
            if attempt < max_retries - 1:  # Don't sleep on last attempt
                # Increase delay with each retry
                time.sleep(delay * (attempt + 1))
                
        except (PermissionError, OSError) as e:
            if attempt == max_retries - 1:  # Last attempt
                logging.warning(f"Failed to remove file {filepath} after {max_retries} attempts: {e}")
                return False
            
            # Exponential backoff with jitter
            sleep_time = min(delay * (2 ** attempt) + (random.random() * 0.1), 5.0)
            time.sleep(sleep_time)
    
    return False

@contextmanager
def safe_open_pdf(file_path: Union[str, Path]):
    """Context manager for safely opening PDF files with proper error handling."""
    import pymupdf as fitz
    doc = None
    file_path = Path(file_path) if isinstance(file_path, str) else file_path
    
    if not file_path.exists():
        raise FileNotFoundError(f"PDF file not found: {file_path}")
        
    try:
        # Open the document with garbage collection hint
        doc = fitz.open(str(file_path))
        yield doc
        
    except Exception as e:
        error_msg = f"Error opening PDF {file_path.name}: {str(e)}"
        logging.error(error_msg, exc_info=True)
        raise RuntimeError(error_msg) from e
        
    finally:
        # Ensure document is properly closed
        if doc is not None:
            try:
                doc.close()
            except Exception as close_error:
                logging.warning(f"Error closing PDF {file_path.name}: {close_error}")
                # Force garbage collection to ensure resources are released
                import gc
                gc.collect()

class RAGProcessor:
    """
    High-performance RAG processor optimized for large documents (2000+ pages).
    Uses parallel processing, batch embeddings, and optimized chunking.
    """
    
    def __init__(self, persist_directory: Optional[str] = None):
        """Initialize with optimized settings for speed."""
        # Use the fastest small model
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",  # Fastest small model
            model_kwargs={'device': 'cpu'},
            encode_kwargs={
                'normalize_embeddings': True,
                'batch_size': 128,  # Reduced batch size for stability
                'show_progress_bar': False  # Reduce overhead
            }
        )
        self.persist_directory = persist_directory or "vector_store"
        os.makedirs(self.persist_directory, exist_ok=True)
        
        # Optimized text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,  # Smaller chunks for better performance
            chunk_overlap=100,  # Reduced overlap for speed
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        
        # Use CPU count for parallel processing
        self.num_workers = max(1, multiprocessing.cpu_count() - 1)
        logger.info(f"Initialized RAG processor with {self.num_workers} worker threads")
    
    def get_loader(self, file_path: str):
        """Get the appropriate document loader based on file extension."""
        ext = file_path.lower()
        if ext.endswith('.pdf'):
            return PyPDFLoader(file_path)
        elif ext.endswith(('.doc', '.docx')):
            return Docx2txtLoader(file_path)
        elif ext.endswith(('.txt', '.md')):
            return TextLoader(file_path, encoding='utf-8')
        else:
            # Fallback
            return PyPDFLoader(file_path)
    
    def load_document_parallel(self, file_path: Union[str, Path], max_pages: int = 500) -> List[Document]:
        """Load document using parallel processing for PDFs with page limits."""
        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        def load_pdf_page(doc_path: Path, page_num: int) -> Optional[Document]:
            """Helper function to load a single PDF page with proper resource management."""
            try:
                with safe_open_pdf(doc_path) as doc:
                    if page_num >= len(doc):
                        return None
                    page = doc[page_num]
                    text = page.get_text()
                    if text and text.strip():
                        return Document(
                            page_content=text.strip(),
                            metadata={
                                'source': str(doc_path.name),
                                'page': page_num + 1
                            }
                        )
                    return None
            except Exception as e:
                logger.error(f"Error loading page {page_num} from {doc_path.name}: {e}")
                return None

        try:
            # For PDFs, use parallel loading with page limits
            if file_path.suffix.lower() == '.pdf':
                with safe_open_pdf(file_path) as doc:
                    total_pages = min(len(doc), max_pages)  # Apply page limit
                    logger.info(f"Loading PDF with {total_pages} pages (limited from {len(doc)}): {file_path.name}")

                # Process pages in parallel with resource limits
                documents = []
                with concurrent.futures.ThreadPoolExecutor(
                    max_workers=min(self.num_workers, 8)  # Further reduced max workers
                ) as executor:
                    # Submit tasks for limited number of pages
                    futures = [
                        executor.submit(load_pdf_page, file_path, page_num)
                        for page_num in range(total_pages)
                    ]
                    
                    # Process results as they complete
                    for future in tqdm(
                        concurrent.futures.as_completed(futures),
                        total=total_pages,
                        desc="Loading pages",
                        unit="page"
                    ):
                        result = future.result()
                        if result:
                            documents.append(result)
                
                logger.info(f"Successfully loaded {len(documents)} pages from PDF")
                return documents
                
            else:
                # For other file types, use standard loader with size limits
                try:
                    loader = self.get_loader(str(file_path))
                    documents = loader.load()
                    # Limit document size
                    for doc in documents:
                        if len(doc.page_content) > 10000:
                            doc.page_content = doc.page_content[:10000]
                    return documents
                except Exception as load_error:
                    logger.error(f"Error loading document {file_path}: {load_error}")
                    raise
                
        except Exception as e:
            logger.error(f"Unexpected error processing {file_path}: {e}")
            raise
        
        finally:
            # Clean up any temporary files if needed
            if 'temp_' in str(file_path):
                safe_remove(file_path)
    
    def chunk_documents_parallel(self, documents: List[Document]) -> List[Document]:
        """Split documents into chunks using parallel processing."""
        if not documents:
            return []
            
        logger.info(f"Chunking {len(documents)} documents...")
        
        # Split into batches for parallel processing
        batch_size = max(5, len(documents) // self.num_workers)
        batches = [documents[i:i + batch_size] for i in range(0, len(documents), batch_size)]
        
        def process_batch(batch):
            return self.text_splitter.split_documents(batch)
        
        # Process in parallel
        chunks = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(self.num_workers, 4)) as executor:
            futures = [executor.submit(process_batch, batch) for batch in batches if batch]
            for future in tqdm(concurrent.futures.as_completed(futures), 
                             total=len(futures), 
                             desc="Chunking documents"):
                try:
                    batch_chunks = future.result()
                    chunks.extend(batch_chunks)
                except Exception as e:
                    logger.error(f"Error chunking batch: {e}")
        
        logger.info(f"Created {len(chunks)} chunks")
        return chunks
    
    def process_document(self, file_path: str, book_id: str, 
                        metadata: Optional[Dict] = None, max_pages: int = 500) -> int:
        """
        Process a document with high-performance optimizations and page limits.
        """
        try:
            # Step 1: Load document (parallel for PDFs)
            documents = self.load_document_parallel(file_path, max_pages=max_pages)
            
            if not documents:
                logger.warning(f"No documents loaded from {file_path}")
                return 0
            
            # Step 2: Chunk documents (parallel)
            chunks = self.chunk_documents_parallel(documents)
            
            if not chunks:
                logger.warning(f"No chunks created from {file_path}")
                return 0
            
            # Step 3: Add metadata
            for chunk in chunks:
                chunk.metadata.update(metadata or {})
                chunk.metadata['book_id'] = book_id
            
            # Step 4: Create embeddings and store (batched for speed)
            logger.info("Generating embeddings and storing in vector database...")
            
            # Process in smaller batches for memory efficiency
            batch_size = 100
            vectordb = None
            
            for i in tqdm(range(0, len(chunks), batch_size), desc="Creating embeddings"):
                batch = chunks[i:i + batch_size]
                
                if vectordb is None:
                    # Create initial vectordb
                    vectordb = Chroma.from_documents(
                        documents=batch,
                        embedding=self.embeddings,
                        persist_directory=self.persist_directory,
                        collection_name=book_id
                    )
                else:
                    # Add to existing vectordb
                    vectordb.add_documents(batch)
                
                # Persist after each batch to avoid memory issues
                # Note: persist() may not exist in newer ChromaDB versions (persistence is automatic)
                try:
                    if hasattr(vectordb, 'persist'):
                        vectordb.persist()
                except Exception as persist_error:
                    # Persistence is automatic when persist_directory is set, so this is optional
                    logger.debug(f"Persist call skipped (may not be needed): {persist_error}")
                
                # Memory management
                if i % 200 == 0:
                    import gc
                    gc.collect()
            
            logger.info(f"✓ Successfully processed {len(chunks)} chunks")
            return len(chunks)
            
        except Exception as e:
            logger.error(f"Error processing document: {str(e)}")
            raise
    
    def query_book(self, book_id: str, question: str, k: int = 3) -> Dict[str, Any]:
        """
        Retrieve top-k similar chunks for a question.
        Optimized for fast retrieval.
        """
        try:
            vectordb = Chroma(
                persist_directory=self.persist_directory,
                embedding_function=self.embeddings,
                collection_name=book_id
            )
            
            # Use similarity search with score
            docs_scores = vectordb.similarity_search_with_score(question, k=k)
            
            results: List[Dict[str, Any]] = []
            for doc, score in docs_scores:
                results.append({
                    "content": (doc.page_content or "")[:500],  # Limited preview
                    "score": float(score),
                    "page": doc.metadata.get('page', 'N/A'),
                    "source": doc.metadata.get('source', 'Unknown')
                })
            
            return {"results": results}
            
        except Exception as e:
            logger.error(f"Error querying book {book_id}: {str(e)}")
            return {"results": [], "error": str(e)}
    
    def delete_book(self, book_id: str) -> bool:
        """Delete a book collection from the vector store."""
        try:
            vectordb = Chroma(
                persist_directory=self.persist_directory,
                embedding_function=self.embeddings,
                collection_name=book_id
            )
            
            # Try to delete collection
            try:
                client = getattr(vectordb, "_client", None)
                if client is not None:
                    client.delete_collection(name=book_id)
                    logger.info(f"✓ Deleted collection: {book_id}")
                    return True
            except Exception as e:
                logger.warning(f"Could not delete collection: {e}")
            
            return False
            
        except Exception as e:
            logger.error(f"Error deleting book {book_id}: {str(e)}")
            return False
    
    def get_stats(self, book_id: str) -> Dict[str, Any]:
        """Get statistics about a book collection."""
        try:
            vectordb = Chroma(
                persist_directory=self.persist_directory,
                embedding_function=self.embeddings,
                collection_name=book_id
            )
            
            # Get collection info
            collection = vectordb._collection
            count = collection.count()
            
            return {
                "book_id": book_id,
                "chunk_count": count,
                "status": "ready"
            }
            
        except Exception as e:
            logger.error(f"Error getting stats for {book_id}: {str(e)}")
            return {
                "book_id": book_id,
                "error": str(e),
                "status": "error"
            }