# NoteLooms Backend

> Python Flask API server for AI-powered study material generation with RAG

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Tesseract OCR (for scanned PDFs)
- Google Gemini API Key

### Setup

1. **Create Virtual Environment**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate     # Windows
```

2. **Install Dependencies**
```bash
pip install -r requirements.txt
```

3. **Set Environment Variables**
```bash
# Copy template to Backend/
cp ../.env.example .env

# Or create new .env file in Backend/
# REQUIRED: Add your Gemini API key
GOOGLE_API_KEY=your-gemini-api-key

# See ../.env.example for all options
```

4. **Run Server**
```bash
python App.py
# Server runs on http://localhost:5000
```

---

## 🐳 Run with Docker

Build and run the backend in a container (port 5000):

```bash
# From project root
cd Backend

# Build the image
docker build -t notelooms-backend .

# Run in background (-d), map host 5000 → container 5000 (-p 5000:5000)
docker run -d -p 5000:5000 --env-file .env --name notelooms-backend notelooms-backend
```

**Check it’s running**
```bash
docker ps
# You should see notelooms-backend listed.
```

**Test locally**
```bash
curl http://localhost:5000/health
# Should return: {"status":"ok"}
```

**Stop/remove**
```bash
docker stop notelooms-backend
docker rm notelooms-backend
```

---

## 🌐 Expose with ngrok (for external / mobile testing)

To get a public URL (e.g. for a phone or another machine), use [ngrok](https://ngrok.com):

1. **Install ngrok**  
   Download from [ngrok.com](https://ngrok.com/download) or:  
   `choco install ngrok` (Windows) / `brew install ngrok` (Mac).

2. **Start your backend**  
   Either run `python App.py` or the Docker container so the app is listening on port 5000.

3. **Expose port 5000**
   ```bash
   ngrok http 5000
   ```
   ngrok will print a public URL like `https://xxxx-xx-xx-xx-xx.ngrok-free.app`.

4. **Use the ngrok URL as backend**
   - In the **frontend**, set `VITE_BACKEND_URL` to that URL (e.g. in `.env.local` or when building).
   - Test: `curl https://YOUR-NGROK-URL/health` — should return `{"status":"ok"}`.

5. **Docker + ngrok**  
   Run the container with `-p 5000:5000` as above, then run `ngrok http 5000` on the same machine. Use the ngrok URL in the frontend.

---

## 📁 Project Structure

```
Backend/
├── App.py                      # Main Flask server (1379 lines)
├── rag_processor.py            # RAG system with ChromaDB
├── requirements.txt            # Python dependencies
├── README.md                   # This file
├── .env                        # Environment variables (git-ignored)
├── services/
│   ├── notification_service.py # Notifications
│   └── quiz_service.py         # Quiz management
├── uploads/                    # Temporary file storage (auto-cleaned)
├── vector_store/               # ChromaDB vector embeddings
└── sessions/                   # Session data storage
```

---

## 🛠️ Dependencies

### **Core Framework**
- **Flask 2.3.3** - Web framework
- **Flask-CORS 4.0.0** - Cross-origin support

### **AI & LLM**
- **google-generativeai 0.3.0** - Gemini 2.5 Flash model
- **langchain 0.1.9** - LLM framework
- **langchain-community 0.0.20** - Extensions
- **sentence-transformers 2.2.2** - Embeddings
- **chromadb 0.4.21** - Vector database

### **Document Processing**
- **PyMuPDF 1.23.8** - PDF text extraction
- **pdf2image 1.16.3** - PDF to image conversion
- **pytesseract 0.3.10** - OCR wrapper
- **python-docx 0.8.11** - Word documents
- **reportlab 4.0.7** - PDF generation

### **Image Processing**
- **Pillow 10.1.0** - Image manipulation
- **opencv-python-headless 4.8.1.78** - Computer vision

### **Utilities**
- **tenacity 8.2.3** - Retry logic
- **python-multipart 0.0.6** - Form data
- **python-dotenv 1.0.0** - Environment variables
- **numpy 1.24.3** - Numerical computing
- **tqdm 4.66.1** - Progress bars
- **youtube-transcript-api 0.6.1** - Video transcripts

---

## 🔌 API Endpoints

### **File Processing**
```
POST /upload
- Input: multipart/form-data (files + youtube_url)
- Output: JSON with generated content
- Time: 5-30 seconds
```

### **Content Generation**
```
POST /generate/flashcards  - Generate flashcards
POST /generate/mcqs        - Generate MCQs (multiple choice)
POST /generate/notes       - Generate short notes
POST /generate/summary     - Generate text summary
```

### **Chat & RAG**
```
POST /chat                 - Chat with AI (context-aware)
GET  /api/rag/books       - List ingested documents
POST /api/rag/query       - Semantic search over documents
GET  /health              - Server health check
```

---

## ⚙️ Configuration

### **Environment Variables** (.env in Backend/)
```
# REQUIRED
GOOGLE_API_KEY=your-gemini-api-key

# OPTIONAL (falls back to GOOGLE_API_KEY)
GEMINI_CHAT_API_KEY=separate-chat-key
YOUTUBE_API_KEY=youtube-api-key
```

**Setup:**
```bash
cd Backend
cp ../.env.example .env
# Edit .env and add your API keys
```

### **Flask Debug Mode** (Development)
```bash
export FLASK_DEBUG=1  # Linux/Mac
set FLASK_DEBUG=1     # Windows
python App.py
```

### **Port Configuration**
Default: `localhost:5000`  
To change: Edit `app.run(host='0.0.0.0', port=5000)` in `App.py`

---

## 📊 File Processing Details

### **PDF Processing**
1. Try PyMuPDF for native text extraction
2. If no text found, fallback to OCR (Tesseract)
3. Return extracted text

### **Image Processing**
1. OCR with Tesseract
2. Generate image description with Gemini
3. Return text + base64 image

### **YouTube Processing**
1. Extract video ID from URL
2. Fetch transcript using YouTube API
3. Parse and return segments

---

## 🎯 Key Features

| Feature | Status |
|---------|--------|
| PDF processing | ✅ |
| Image OCR | ✅ |
| YouTube transcripts | ✅ |
| AI content generation | ✅ |
| RAG system | ✅ Enabled |
| Semantic search | ✅ |
| Flashcard generation | ✅ |
| MCQ generation | ✅ |
| Chat interface | ✅ |

---

## 🔒 Security

### **Current State**
- ✅ File upload validation
- ✅ Secure filename handling
- ✅ Environment variables for secrets
- ⚠️ No CSRF protection
- ⚠️ No rate limiting
- ⚠️ No authentication

### **Production Checklist**
- [ ] Add user authentication (JWT)
- [ ] Enable HTTPS/TLS
- [ ] Implement rate limiting (Flask-Limiter)
- [ ] Add request logging
- [ ] Validate all inputs
- [ ] Set proper CORS
- [ ] Use environment variables for ALL secrets
- [ ] Add monitoring/alerting

---

## 📝 Important Notes

### **Tesseract OCR Installation**
Required for scanned/image PDFs:

**Windows:**
- Download installer: https://github.com/UB-Mannheim/tesseract/wiki
- Run installer (default path: `C:\Program Files\Tesseract-OCR\`)
- Verify: `tesseract --version`

**Linux:**
```bash
sudo apt-get install tesseract-ocr
```

**Mac:**
```bash
brew install tesseract
```

### **File Storage**
- **Uploads**: `Backend/uploads/` (auto-cleaned after processing)
- **Vector Store**: `Backend/vector_store/` (RAG embeddings persist)
- **Sessions**: `Backend/sessions/` (session history)

### **API Rate Limits**
- Google Gemini free tier: ~20 requests/minute
- Errors return HTTP 429 with user-friendly message
- Retry logic with exponential backoff included

### **Text Size Limits**
- Summary: No limit (full text)
- Notes: 6000 characters
- Flashcards: 8000 characters
- MCQs: 8000 characters

---

## 🚀 Deployment

### **Production Server**
Use Gunicorn for production:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 App:app
```

### **Docker** (Coming Soon)
```bash
docker build -t notelooms-backend .
docker run -e GOOGLE_API_KEY=your-key -p 5000:5000 notelooms-backend
```

---

## 🐛 Troubleshooting

### **OCR Not Working**
```bash
# Check Tesseract installation
tesseract --version

# On Windows, set path if needed
# Edit App.py and add:
import pytesseract
pytesseract.pytesseract.pytesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

### **Gemini API Errors**
1. Check API key in `.env`
2. Verify key has Generative AI enabled
3. Check rate limits
4. Ensure key is valid

### **ChromaDB Issues**
```bash
# Reset vector store if corrupted
rm -rf Backend/vector_store/

# RAG will reinitialize on next use
```

### **Port Already in Use**
```python
# Edit App.py - change port
app.run(host='0.0.0.0', port=5001)  # Use 5001 instead
```

---

## 📈 Performance Tips

1. **Use PyMuPDF PDFs** - Faster than OCR
2. **Batch Generation** - Generate multiple items at once
3. **Text Limits** - Clip input text to reduce API calls
4. **Parallel Processing** - Run multiple AI calls concurrently
5. **Cache Results** - Store frequently generated content

---

## 📚 Additional Resources

- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [ChromaDB Guide](https://docs.trychroma.com/)
- [LangChain Docs](https://python.langchain.com/)
- [PyMuPDF Docs](https://pymupdf.readthedocs.io/)

---

## 🤝 Contributing

When adding features:
1. Update `requirements.txt` with version pins
2. Update this README
3. Add error handling and logging
4. Test with sample data
5. Document API changes in `docs/API.md`

---

**Last Updated**: December 2025  
**Python Version**: 3.8+  
**Status**: Production Ready
