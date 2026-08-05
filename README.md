# NoteLooms - AI-Powered Study Material Generator

> Transform PDFs, images, and YouTube videos into interactive study materials with AI

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Google Gemini API Key ([Get Key](https://ai.google.dev/))
- Tesseract OCR (Optional, for scanned PDFs)

### Local Development Setup

**1. Backend Setup**
```bash
cd Backend
pip install -r requirements.txt
```

Create `Backend/.env`:
```env
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-3.6-flash
ENABLE_RAG=0
```

Start the Flask Backend:
```bash
python App.py
# Runs on http://localhost:5000
```

**2. Frontend Setup (in a new terminal)**
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
│   ├── App.py                 # Main application server
│   ├── rag_processor.py       # RAG processor (ChromaDB + Gemini Embeddings)
│   ├── requirements.txt       # Dependencies
│   ├── .env                   # Environment secrets
│   ├── sessions/              # Local JSON session storage
│   ├── uploads/               # Temporary file uploads
│   └── vector_store/          # Embedded ChromaDB vector store
│
├── Frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── Components/        # React components (MCQs, Chatbot, DocumentViewer, etc.)
│   │   ├── Layout/            # Classic & Studio layout shells
│   │   ├── Reusable/          # Shared UI elements & navigation
│   │   ├── hooks/             # Custom state & file handling hooks
│   │   └── utils/             # Icons & API config
│   ├── package.json
│   └── vite.config.js
│
├── docker-compose.yml
├── LOCAL_RUN.md
└── README.md
```

---

## ✨ Key Features

| Feature | Status | Details |
|---------|--------|---------|
| **Multi-Format Processing** | ✅ | PDFs, images (PNG/JPG), and YouTube video URLs |
| **Pre-Generated Content** | ✅ | Summaries, short notes, 3D flashcards, and pre-generated MCQs |
| **Source Document Viewer** | ✅ | Native PDF embed viewer & searchable extracted text view |
| **Audio Reader** | ✅ | Web Speech API text-to-speech with speed controls (1x to 2x) |
| **AI Evidence Citations** | ✅ | RAG chat responses with page numbers & exact excerpt quotes |
| **Interactive Quiz Mode** | ✅ | Test mode with scoring, answers, and exit controls |
| **Context-Aware Chatbot** | ✅ | Chat with KaTeX math rendering and document grounding |
| **Session Management** | ✅ | Save and load historical study sessions |
| **Responsive Layouts** | ✅ | Mobile-optimized and Desktop Classic & Studio modes |

---

## 🛠️ Technology Stack

### **Frontend**
React 19 | Vite 6 | Tailwind CSS | Framer Motion | Axios | React KaTeX

### **Backend**
Flask | Google GenAI SDK (`gemini-3.6-flash`) | ChromaDB (Embedded Vector Store) | PyMuPDF | pytesseract

---

## 🔑 Core API Endpoints

### **File & URL Processing**
- `POST /upload` - Upload PDF/image files or YouTube links; returns summary, notes, flashcards, and pre-generated MCQs.

### **On-Demand Generation**
- `POST /generate/flashcards` - Generate flashcards from text
- `POST /generate/mcqs` - Generate multiple-choice questions
- `POST /generate/notes` - Generate concise short notes
- `POST /download` - Export content as TXT, PDF, or DOCX

### **Chat & RAG**
- `POST /chat` - Context-aware AI chat with evidence citations
- `GET /health` - Server & RAG status check
- `GET /api/sessions` - List saved sessions
- `POST /api/sessions` - Save study session

---

## 🐳 Docker Deployment

Run both backend and frontend using Docker Compose:

```bash
docker compose build
docker compose up
```

- **Backend**: `http://localhost:5000`
- **Frontend**: `http://localhost:80`

To stop:
```bash
docker compose down
```

---

## 🔒 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | **Yes** | - | Google Gemini API key |
| `GEMINI_CHAT_API_KEY` | No | `GEMINI_API_KEY` | Dedicated key for chat requests |
| `GEMINI_MODEL` | No | `gemini-3.6-flash` | Gemini model version |
| `YOUTUBE_API_KEY` | No | - | Optional metadata fallback key |
| `ENABLE_RAG` | No | `1` | Enable/disable vector store RAG |
| `MAX_UPLOAD_MB` | No | `16` | Max upload size limit |
