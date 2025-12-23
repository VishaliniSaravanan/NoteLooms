# NoteLooms - AI-Powered Study Material Generator

> Transform PDFs, images, and YouTube videos into interactive study materials with AI

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- Google Gemini API Key
- Tesseract OCR (for scanned PDFs)

### Local Development Setup

**1. Clone & Navigate**
```bash
cd Notelooms
```

**2. Backend Setup**
```bash
cd Backend
pip install -r requirements.txt
export GOOGLE_API_KEY="your-gemini-api-key"  # Linux/Mac
# OR
set GOOGLE_API_KEY=your-gemini-api-key       # Windows
python App.py
# Runs on http://localhost:5000
```

**3. Frontend Setup (new terminal)**
```bash
cd Frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## 📁 Project Structure

```
Notelooms/
├── Backend/                    # Python Flask API
│   ├── App.py                 # Main server (1379 lines)
│   ├── rag_processor.py       # RAG system
│   ├── requirements.txt       # Dependencies
│   ├── README.md              # Backend docs
│   ├── services/              # Service modules
│   ├── uploads/               # Temp files
│   └── vector_store/          # ChromaDB
│
├── Frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── Components/        # React components
│   │   ├── hooks/             # Custom hooks
│   │   └── utils/             # Helpers
│   ├── package.json
│   ├── README.md              # Frontend docs
│   └── vite.config.js
│
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md
│   └── API.md
│
├── .gitignore
└── README.md                  # This file
```

---

## ✨ Key Features

| Feature | Status | Details |
|---------|--------|---------|
| **File Upload** | ✅ | PDF, images, YouTube links |
| **AI Generation** | ✅ | Summaries, flashcards, MCQs, notes |
| **Flashcards** | ✅ | 3D flip cards with custom count |
| **Quiz Mode** | ✅ | Test-taking with scoring |
| **AI Chatbot** | ✅ | Context-aware chat with LaTeX |
| **RAG System** | ✅ | Semantic search over documents |
| **YouTube Transcripts** | ✅ | Extract & analyze videos |
| **Pomodoro Timer** | ✅ | Focus/break time management |
| **Multi-layout** | ✅ | Classic + Studio modes |
| **Responsive** | ✅ | Mobile & desktop optimized |

---

## 🛠️ Technology Stack

### **Frontend**
React 19 | Vite 6 | Tailwind CSS | Framer Motion | Axios | React KaTeX

### **Backend**
Flask | Google Gemini 2.5 Flash | ChromaDB | LangChain | PyMuPDF | pytesseract

---

## 📚 Documentation

- [Backend Setup & API Docs](Backend/README.md)
- [Frontend Setup & Components](Frontend/README.md)
- [System Architecture](docs/ARCHITECTURE.md)
- [API Endpoints](docs/API.md)

---

## ⚠️ Important Notes

### Environment Variables
Create `.env` in Backend folder:
```
GOOGLE_API_KEY=your-gemini-api-key (REQUIRED)
GEMINI_CHAT_API_KEY=optional-key
YOUTUBE_API_KEY=optional-key
```

### File Storage
- **Uploads**: Temp files cleaned after processing
- **Vector Store**: ChromaDB embeddings in `Backend/vector_store/`
- **Chat History**: Browser localStorage (session-based)

### API Rate Limits
- Google Gemini free tier: ~20 requests/minute
- Rate limit errors return HTTP 429

---

## 🔑 Core Endpoints

**Upload & Process**
- `POST /upload` - Process files (PDF, images, YouTube)

**Content Generation**
- `POST /generate/flashcards` - Generate flashcards
- `POST /generate/mcqs` - Generate MCQs
- `POST /generate/notes` - Generate short notes
- `POST /generate/summary` - Auto-summary

**Chat & RAG**
- `POST /chat` - Chat with AI
- `GET /api/rag/books` - List documents
- `POST /api/rag/query` - Semantic search

See [docs/API.md](docs/API.md) for full reference.

---

## 🐛 Troubleshooting

### Backend Issues
- **No API response**: Check `GOOGLE_API_KEY` in `.env`
- **OCR not working**: Install Tesseract
- **Port 5000 in use**: Change port in `App.py`

### Frontend Issues
- **API connection fails**: Check backend is running on `localhost:5000`
- **Styles missing**: Run `npm install` and `npm run dev`

---

## 📊 Project Status

- **Frontend**: ✅ Production Ready
- **Backend**: ✅ Production Ready
- **RAG System**: ✅ Enabled by default
- **Docker**: ⏳ Planned

---

## 🤝 Contributing

1. Check [Backend/README.md](Backend/README.md) for setup
2. Make your changes
3. Test locally before pushing
4. Update relevant documentation

---

## 📝 License

[Add your license here]

---

**Last Updated**: December 2025  
**Status**: Production Ready

---

## 🛠️ Dependencies

### **Core Framework**
- **Flask 2.3.x** - Web framework
- **Flask-CORS 4.0.x** - Cross-origin support

### **AI & LLM**
- **google-generativeai 0.3.x** - Gemini 2.5 Flash
- **langchain 0.1.x** - LLM framework
- **langchain-community 0.0.x** - LangChain extensions
- **sentence-transformers 2.2.x** - Embeddings
- **chromadb 0.4.x** - Vector database

### **Document Processing**
- **PyMuPDF 1.23.x** - PDF text extraction
- **pdf2image 1.16.x** - PDF to image conversion
- **pytesseract 0.3.x** - OCR wrapper
- **python-docx 0.8.x** - Word documents
- **reportlab 4.0.x** - PDF generation

### **Image Processing**
- **Pillow 10.x** - Image manipulation
- **opencv-python-headless 4.8.x** - Computer vision

### **Utilities**
- **tenacity 8.2.x** - Retry logic
- **python-multipart 0.0.x** - Form data
- **python-dotenv 1.0.x** - Environment variables
- **numpy 1.24.x** - Numerical computing
- **tqdm 4.66.x** - Progress bars
- **youtube-transcript-api 0.6.x** - Video transcripts

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
POST /generate/mcqs        - Generate MCQs
POST /generate/notes       - Generate short notes
POST /generate/summary     - Generate summary
```

### **Chat & RAG**
```
POST /chat                 - Chat with AI
GET  /api/rag/books       - List ingested documents
POST /api/rag/query       - Semantic search over documents
GET  /health              - Health check
```

---

## 🚀 Deployment

### **Docker**
```bash
docker build -t notelooms-backend .
docker run -e GOOGLE_API_KEY=your-key -p 5000:5000 notelooms-backend
```

### **Production Server**
Use Gunicorn for production:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 App:app
```

### **Environment Variables**
```
GOOGLE_API_KEY=your-gemini-api-key (REQUIRED - for all AI generation)
GEMINI_CHAT_API_KEY=your-chat-key (optional - uses GOOGLE_API_KEY if not set)
YOUTUBE_API_KEY=your-youtube-key (optional - for transcript extraction)
```

---

## 🔑 Key Features

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

## ⚠️ Important Notes

### **Tesseract OCR**
Required for processing scanned documents:
- **Windows**: Download from [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki)
- **Linux**: `sudo apt-get install tesseract-ocr`
- **Mac**: `brew install tesseract`

### **File Storage**
- Uploaded files: `Backend/uploads/` (auto-cleaned after processing)
- Vector embeddings: `Backend/vector_store/` (RAG system)
- Session data: `Backend/sessions/` (session history)

### **API Rate Limits**
- Google Gemini free tier: ~20 requests/minute
- Rate limit errors: Returns HTTP 429 with user-friendly message

### **Text Size Limits**
- Summary: No limit (full text)
- Notes: 6000 characters
- Flashcards: 8000 characters
- MCQs: 8000 characters

---

## 🔧 Configuration

### **Flask Debug Mode**
For development, enable debug mode:
```bash
export FLASK_DEBUG=1  # Linux/Mac
set FLASK_DEBUG=1     # Windows
python App.py
```

### **CORS Settings**
Currently enabled for all origins. For production:
```python
CORS(app, resources={r"/api/*": {"origins": ["your-domain.com"]}})
```

### **File Upload Limits**
Max file size: 16 MB (configurable in `App.py`)

---

## 🐛 Troubleshooting

### **OCR Not Working**
```bash
# Check Tesseract installation
tesseract --version

# Set path if needed (Windows)
import pytesseract
pytesseract.pytesseract.pytesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

### **Gemini API Errors**
1. Check API key in `.env`
2. Verify key has Generative AI enabled
3. Check rate limits
4. Try with different key if available

### **ChromaDB Issues**
```bash
# Reset vector store if corrupted
rm -rf Backend/vector_store/

# RAG will reinitialize on next use
```

### **PDF Processing Slow**
- Increase text limit to avoid OCR
- Use PyMuPDF for native PDFs only
- Reduce image DPI in preprocessing

---

## 📊 Performance Tips

1. **Use PyMuPDF PDFs** - Faster than OCR
2. **Batch Generation** - Generate multiple items at once
3. **Cache Results** - Store summaries in database
4. **Parallel Processing** - Run multiple AI calls concurrently
5. **Text Limits** - Clip text to reduce API calls

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
- [ ] Implement rate limiting
- [ ] Add request logging
- [ ] Validate all inputs
- [ ] Set proper CORS
- [ ] Use environment variables for all secrets
- [ ] Add monitoring/alerting

---

## 📝 Development Workflow

### **Adding New Endpoints**
1. Define route in `App.py`
2. Add input validation
3. Implement error handling
4. Add logging
5. Test with Frontend

### **Debugging**
```python
# Enable detailed logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Check request data
print(request.form, request.files)

# Test AI response
response = model.generate_content(prompt)
print(response.text)
```

---

## 📚 Additional Resources

- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [ChromaDB Guide](https://docs.trychroma.com/)
- [LangChain Docs](https://python.langchain.com/)

---


---

