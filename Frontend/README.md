# NoteLooms Frontend

> React + Vite SPA for interactive study material learning

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Start Development Server**
```bash
npm run dev
# Runs on http://localhost:5173
```

3. **Build for Production**
```bash
npm run build
# Output in dist/ folder
```

---

## 📁 Project Structure

```
Frontend/
├── src/
│   ├── Components/              # React components (20+)
│   │   ├── Chatbot.jsx          # AI chat interface
│   │   ├── FileUploader.jsx     # File upload
│   │   ├── FlashcardCarousel.jsx # 3D flip cards
│   │   ├── MCQs.jsx             # Quiz test mode
│   │   ├── PomodoroTimer.jsx    # Focus timer
│   │   └── YouTubeTranscript.jsx # Video transcripts
│   │
│   ├── Layout/                  # Layout components
│   │   ├── ClassicLayout.jsx    # Single-column layout
│   │   └── StudioLayout.jsx     # Three-panel layout
│   │
│   ├── Reusable/                # Shared components
│   │   ├── PreviewModal.jsx
│   │   ├── DownloadButtons.jsx
│   │   ├── SourcePreview.jsx
│   │   └── ConfirmationModal.jsx
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAppState.js       # Global state
│   │   └── useFileHandling.js   # File logic
│   │
│   ├── utils/                   # Utilities
│   │   ├── api.js               # API calls
│   │   └── icons.jsx            # Icon components
│   │
│   ├── App.jsx                  # Main component
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles
│
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md                    # This file
```

---

## 🛠️ Technology Stack

### **Core**
- **React 19** - UI library
- **Vite 6** - Build tool
- **React Router** - Client-side routing

### **Styling & Animations**
- **Tailwind CSS** - Utility CSS
- **Framer Motion** - Animations
- **Headless UI** - Unstyled components

### **Features**
- **Axios** - HTTP client
- **React KaTeX** - LaTeX rendering
- **React Hot Toast** - Notifications
- **React Icons** - Icon library

---

## ✨ Key Features

| Feature | Status | Details |
|---------|--------|---------|
| **File Upload** | ✅ | Drag-drop PDF, images |
| **Flashcards** | ✅ | 3D flip cards (1-50) |
| **MCQ Quiz** | ✅ | Test mode with scoring |
| **AI Chat** | ✅ | Context-aware, LaTeX support |
| **Pomodoro** | ✅ | Focus/break timer |
| **YouTube** | ✅ | Video transcript extraction |
| **Multi-layout** | ✅ | Classic + Studio modes |
| **Responsive** | ✅ | Mobile optimized |

---

## 🔌 Component Details

### **Chatbot.jsx**
- Context-aware AI responses
- LaTeX formula support
- Emoji picker
- localStorage persistence
- Safety filter

### **FlashcardCarousel.jsx**
- 3D flip animation (Framer Motion)
- Adjustable card count (1-50)
- Navigation arrows
- Smooth transitions

### **MCQs.jsx**
- Auto-generation on upload
- Full-screen test mode
- Progress tracking
- Score calculation
- Optional timer

### **PomodoroTimer.jsx**
- Configurable focus/break time
- Expandable settings
- Current time display
- Auto-phase switching

### **YouTubeTranscript.jsx**
- URL parsing
- Multiple language support
- Segment-based display
- Click-to-timestamp feature

---

## 🎨 Design System

### **Colors** (CSS Variables)
```css
--bg-primary: #0f1419
--text-primary: #f8fafc
--accent-primary: #3b82f6  (Blue)
--glass-bg: rgba(30, 37, 50, 0.7)
```

### **Effects**
- Glass morphism (backdrop blur)
- Glow effects (blue shadows)
- 3D transforms
- Smooth animations (0.2-0.3s)

---

## 🚀 Deployment

### **Development**
```bash
npm run dev
```

### **Production Build**
```bash
npm run build
npm run preview  # Test production build locally
```

### **Deploy to Vercel**
```bash
npm install -g vercel
vercel
```

### **Deploy to Netlify**
```bash
npm install -g netlify-cli
netlify deploy
```

### **Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "dev"]
```

---

## 🔑 API Configuration

Backend API base URL (in `utils/api.js`):
```javascript
const API_BASE = process.env.VITE_API_BASE || 'http://localhost:5000'
```

Set in `.env.local`:
```
VITE_API_BASE=http://localhost:5000  # Development
VITE_API_BASE=https://api.example.com # Production
```

---

## 📊 State Management

### **useAppState Hook**
Global state using React hooks:
- Uploaded files
- Selected file
- Loading states
- Layout mode
- Modal visibility
- Chat visibility

### **useFileHandling Hook**
File upload logic:
- File selection
- Preview generation
- Upload requests
- Response processing

### **Component-Level State**
Each component manages local state:
- MCQs test state
- Flashcard index
- Timer countdown
- Chat messages

---

## ⚠️ Limitations

### **Data**
- ❌ No authentication
- ❌ Chat lost on refresh (localStorage)
- ⚠️ Session-based only

### **Performance**
- ⚠️ No code splitting
- ⚠️ React.memo not optimized
- ❌ No offline support

### **Features**
- ❌ No cross-device sync
- ❌ No offline mode
- ⚠️ Depends on backend API

---

## 🐛 Troubleshooting

### **Backend Connection Failed**
```bash
# Check backend is running
curl http://localhost:5000/health

# Check VITE_API_BASE in .env.local
VITE_API_BASE=http://localhost:5000
```

### **Styles Missing**
```bash
npm install
npm run dev
```

### **Hot Reload Not Working**
- Check Vite config
- Restart dev server
- Clear browser cache

---

## 📈 Performance Tips

1. **Lazy Load Components** - Use React.lazy() for heavy components
2. **Memoize Callbacks** - useCallback for stable function refs
3. **Optimize Re-renders** - useMemo for expensive computations
4. **Image Optimization** - Use native lazy loading
5. **Bundle Analysis** - Check bundle size regularly

---

## 🤝 Contributing

When adding features:
1. Create component in `src/Components/`
2. Add hook in `src/hooks/` if needed
3. Import in parent component
4. Test with backend running
5. Update this README

---

## 📚 Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)

---

**Last Updated**: December 2025  
**Status**: Production Ready

---

## 🎯 Project Overview

**NoteLooms** is a full-stack AI-powered educational platform that transforms various content formats (PDFs, images, YouTube videos) into comprehensive, interactive study materials using:

- **Frontend**: React + Vite with Tailwind CSS
- **Backend**: Flask with Google Gemini 2.5 Flash AI
- **RAG System**: ChromaDB for vector search over documents
- **Core Features**: Summaries, flashcards, MCQs, notes, AI chatbot

---

## 📦 Setup & Installation

### **Prerequisites**
- Node.js 18+ and npm
- Python 3.8+
- Tesseract OCR (for scanned PDFs)

### **Frontend Setup**
```bash
cd Frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # Production build
```

### **Backend Setup**
```bash
cd Backend
pip install -r requirements.txt
export GOOGLE_API_KEY="your-key"  # Linux/Mac
python App.py      # http://localhost:5000
```

### **Environment Setup (.env in Backend/)**
```
GOOGLE_API_KEY=your-gemini-api-key-here
```

---

## 🏗️ Project Structure

```
Notelooms/
├── Frontend/                    # React + Vite frontend
│   ├── src/
│   │   ├── Components/         # React components (20+)
│   │   ├── hooks/             # Custom hooks (state, file handling)
│   │   ├── utils/             # API & helpers
│   │   ├── Layout/            # Classic & Studio modes
│   │   └── Reusable/          # Shared components
│   └── package.json
│
└── Backend/                     # Python Flask backend
    ├── App.py                  # Main server (1379 lines)
    ├── rag_processor.py        # RAG system
    ├── requirements.txt
    ├── services/              # Notification & quiz services
    ├── uploads/               # Temp file storage
    └── vector_store/          # ChromaDB embeddings
```

---

## ✨ Key Features

| Feature | Status | Details |
|---------|--------|---------|
| **File Upload** | ✅ | PDF, images, YouTube links |
| **AI Summaries** | ✅ | Auto-generated via Gemini |
| **Flashcards** | ✅ | 3D flip cards (1-50 cards) |
| **MCQ Quiz** | ✅ | Auto-generated + test mode |
| **AI Chatbot** | ✅ | Context-aware, LaTeX support |
| **YouTube Transcripts** | ✅ | Extract & analyze videos |
| **RAG System** | ✅ | Semantic search (optional) |
| **Pomodoro Timer** | ✅ | Focus/break cycles |
| **Multi-layout** | ✅ | Classic + Studio modes |
| **Responsive** | ✅ | Mobile + desktop |

---

## 🛠️ Technology Stack

### **Frontend**
- React 19 | Vite 6 | Tailwind CSS | Framer Motion
- Axios | React Router | React KaTeX | React Hot Toast

### **Backend**
- Flask | Google Gemini 2.5 Flash | ChromaDB | LangChain
- PyMuPDF | pytesseract | Pillow | opencv-python
- Sentence Transformers | YouTube Transcript API

---

## ⚠️ Limitations & Key Constraints

### **Data & Storage**
- ❌ No user authentication or database
- ❌ Chat history lost on page refresh
- ❌ No persistent user data (privacy-first design)
- ⚠️ Single-user, session-based only

### **AI & Processing**
- ❌ Requires internet connection (no offline mode)
- ⚠️ Google Gemini API rate limits (free tier: ~20 req/min)
- ⚠️ Latency: 5-30 seconds per AI generation
- ⚠️ Large PDFs (100+ pages) may timeout

### **RAG System**
- ⚠️ In-memory storage (resets on server restart)
- ❌ No semantic caching
- ⚠️ Lightweight embedding model (`all-MiniLM-L12-v2`)

### **Deployment**
- ⚠️ Single-instance only (not horizontally scalable)
- ⚠️ No container orchestration
- ❌ No auto-scaling or load balancing
- ❌ No monitoring/alerting system

### **Frontend**
- ❌ No offline support
- ❌ No cross-device sync (localStorage only)
- ⚠️ React.memo not optimized
- ⚠️ No code splitting

---

## 📡 API Endpoints

### **Upload & Processing**
- `POST /upload` - Process files (PDF, images, YouTube)
- `POST /ocr_image` - Extract text from images

### **Content Generation**
- `POST /generate/flashcards` - Generate flashcards
- `POST /generate/mcqs` - Generate MCQs
- `POST /generate/summary` - Auto-summary
- `POST /generate/notes` - Short notes

### **Chat & RAG**
- `POST /chat` - Chat with Gemini AI
- `POST /rag_query` - Semantic search
- `GET /health` - Server health check

---

## 🚀 Deployment

### **Docker**
```bash
docker build -t notelooms-backend -f Backend/Dockerfile .
docker run -e GOOGLE_API_KEY=your-key -p 5000:5000 notelooms-backend
```

### **Frontend Build**
```bash
npm run build
# Deploy dist/ to Vercel, Netlify, or nginx
```

---

## 📝 Important Notes

- Set `GOOGLE_API_KEY` before running backend
- ChromaDB stores in `Backend/vector_store/`
- Files auto-clean from `Backend/uploads/` after processing
- Tesseract required for OCR (scanned PDFs)
- See [RAG_EXPLANATION.md](Backend/RAG_EXPLANATION.md) for RAG details

---

## 🔒 Security

**Current State**:
- ✅ File upload validation
- ✅ Secure filename handling
- ⚠️ No CSRF protection
- ⚠️ No rate limiting
- ⚠️ No authentication

**For Production**:
1. Add JWT/OAuth authentication
2. Implement CSRF + rate limiting
3. Use HTTPS only
4. Add request logging & monitoring
5. Validate all inputs

---

**Status**: Production Ready (single-instance)  
**Updated**: December 2025



#### **Styling & UI**
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Framer Motion 12.7.4** - Animation library for smooth transitions
- **Headless UI 2.2.2** - Unstyled, accessible UI components
- **Custom CSS Variables** - Theme system (`index.css`)

#### **Data Visualization**
- **ReactFlow 11.11.4** - Interactive node-based graphs (for mind maps - optional)
- **D3.js 7.9.0** - Data visualization library
- **React D3 Tree 3.6.6** - Tree visualization components

#### **HTTP & API**
- **Axios 1.8.4** - HTTP client for API calls
- **Custom API Utility** - `src/utils/api.js` for endpoint management

#### **Math & Formula Rendering**
- **React KaTeX 3.1.0** - LaTeX mathematical formula rendering
- **KaTeX 0.16.25** - Core LaTeX rendering engine

#### **Notifications**
- **React Hot Toast 2.6.0** - Toast notification system

#### **Performance**
- **React Window 1.8.8** - Virtualization for large lists (installed but not actively used)

#### **Icons**
- **React Icons** - Custom icon components (`src/utils/icons.jsx`)
- **Font Awesome** - Used via `react-icons/fa` for flashcard navigation

### **Frontend Project Structure**

```
looms 1/
├── src/
│   ├── Components/              # React components
│   │   ├── Chatbot.jsx          # AI chat interface with LaTeX support
│   │   ├── ContentAnalyzer.jsx  # Content analysis display
│   │   ├── FileUploader.jsx     # File upload with drag-drop
│   │   ├── FilePreview.jsx      # Pre-upload file preview
│   │   ├── FlashcardCarousel.jsx # Interactive flashcard carousel
│   │   ├── Homepage.jsx         # Landing page (optional)
│   │   ├── MCQs.jsx             # MCQ quiz component with test mode
│   │   ├── PomodoroTimer.jsx    # Focus timer component
│   │   ├── StudioPanel.jsx      # Studio mode tools panel
│   │   └── YouTubeTranscript.jsx # YouTube transcript viewer
│   ├── Layout/                  # Layout components
│   │   ├── ClassicLayout.jsx    # Traditional single-page layout
│   │   └── StudioLayout.jsx     # Three-panel studio layout
│   ├── Reusable/                # Reusable components
│   │   ├── ContentSections.jsx  # Content display sections
│   │   ├── DesktopNavigation.jsx # Desktop nav tabs
│   │   ├── MobileNavigation.jsx # Mobile bottom nav
│   │   ├── MobileMenu.jsx       # Mobile hamburger menu
│   │   ├── PreviewModalDesktop.jsx # File preview modal
│   │   ├── PreviewModal.jsx     # Studio mode preview modal
│   │   ├── SourcePreview.jsx   # Source file preview cards
│   │   ├── DownloadButtons.jsx  # Export/download buttons
│   │   └── ConfirmationModal.jsx # Confirmation dialogs
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAppState.js       # Global state management hook
│   │   └── useFileHandling.js   # File upload/processing logic
│   ├── utils/                   # Utility functions
│   │   ├── api.js              # API endpoint configuration
│   │   └── icons.jsx           # Icon component exports
│   ├── App.jsx                  # Main application component
│   ├── main.jsx                 # Application entry point
│   └── index.css                # Global styles and CSS variables
├── package.json                 # Dependencies and scripts
├── vite.config.js               # Vite configuration
└── tailwind.config.js           # Tailwind CSS configuration
```

### **State Management Architecture**

**No Redux/Zustand/Context API** - Uses React Hooks pattern:

1. **useAppState Hook** (`src/hooks/useAppState.js`)
   - Centralized state management using `useState` hooks
   - Manages: uploaded files, selected file index, loading states, errors, active sections, chatbot visibility, layout mode, preview files, modals, etc.
   - **Pattern**: Custom hook that returns all state and setters

2. **useFileHandling Hook** (`src/hooks/useFileHandling.js`)
   - Handles file selection, upload, preview, removal
   - Processes API responses
   - Manages preview file state

3. **Component-Level State**
   - Each component manages its own local state (e.g., `MCQs.jsx` manages test state, `FlashcardCarousel.jsx` manages current card index)

### **Code Splitting & Performance**

- **Lazy Loading**: Heavy components loaded on-demand
  - `StudioLayout` and `ClassicLayout` lazy-loaded in `App.jsx`
  - `Chatbot`, `PreviewModalDesktop` lazy-loaded in `ClassicLayout.jsx`
  - `FlashcardCarousel`, `MCQs` lazy-loaded in `ContentSections.jsx`
- **Suspense Boundaries**: Loading fallbacks for lazy-loaded components
- **React.memo**: Not extensively used (could be optimization opportunity)

---

## ⚙️ Backend Architecture

### **Technology Stack (Complete)**

#### **Core Framework**
- **Flask 2.0.1+** - Python web framework
- **Flask-CORS 3.0.10+** - Cross-Origin Resource Sharing support
- **Python 3.x** - Programming language

#### **AI & ML Services**
- **Google Generative AI 0.3.0+** - Gemini 2.5 Flash model integration
- **Google API Python Client 2.86.0+** - YouTube API integration

#### **Document Processing**
- **PyMuPDF (fitz) 1.21.0+** - PDF text extraction (native text)
- **pdf2image 1.16.0+** - PDF to image conversion for OCR
- **python-docx 0.8.11+** - Word document generation
- **ReportLab 3.6.1+** - PDF generation for exports

#### **Image Processing & OCR**
- **Pillow (PIL) 9.0.0+** - Image manipulation
- **OpenCV (headless) 4.5.5+** - Image preprocessing (grayscale, thresholding)
- **pytesseract 0.3.10+** - OCR engine wrapper (Tesseract OCR)

#### **RAG System (Optional)**
- **LangChain 0.1.0+** - LLM application framework
- **ChromaDB 0.4.0+** - Vector database for embeddings
- **Sentence Transformers 2.2.2+** - Embedding models (`all-MiniLM-L12-v2`)
- **tqdm 4.66.0+** - Progress bars for batch processing

#### **Utilities**
- **NumPy 1.21.0+** - Numerical computing (for image processing)
- **Tenacity 8.0.1+** - Retry logic with exponential backoff
- **YouTube Transcript API 0.6.1+** - YouTube video transcript extraction
- **python-dotenv 0.19.0+** - Environment variable management
- **python-multipart 0.0.5+** - Multipart form data handling

### **Backend Project Structure**

```
Backend/
├── App.py                       # Main Flask application (1057 lines)
├── rag_processor.py             # RAG system implementation
├── requirements.txt             # Python dependencies
├── .env                         # Environment variables (API keys)
├── services/                    # Service modules
│   ├── notification_service.py # Notification handling (placeholder)
│   └── quiz_service.py         # Quiz management (placeholder)
├── uploads/                     # Temporary file storage
│   └── [uploaded files]         # Auto-cleaned after processing
└── vector_store/                # ChromaDB persistence directory
    └── [ChromaDB files]         # Vector embeddings storage
```

### **Backend Architecture Patterns**

1. **RESTful API Design**
   - Standard HTTP methods (GET, POST)
   - JSON request/response format
   - Error handling with status codes

2. **Error Handling**
   - Try-catch blocks with logging
   - Retry logic using Tenacity decorators
   - User-friendly error messages

3. **File Processing Pipeline**
   - Upload → Extract → Process → Generate → Return
   - Automatic cleanup of temporary files
   - Memory-efficient processing

4. **API Key Management**
   - Environment variables via `.env` file
   - Separate keys for chat and generation (optional)
   - Fallback to single key if chat key not provided

---

## 🎯 Feature Implementation Details

### **1. Flashcards System**

#### **Frontend Implementation** (`src/Components/FlashcardCarousel.jsx`)

**Technology Used:**
- **Framer Motion** - 3D flip animation (`rotateY` transform)
- **React Icons** - Navigation arrows (`FaChevronLeft`, `FaChevronRight`, `FaRedo`)
- **Custom CSS** - 3D perspective and backface visibility

**How It Works:**
1. **Data Structure**: Array of objects `[{front: "question", back: "answer"}, ...]`
2. **State Management**:
   - `currentIndex` - Tracks which card is displayed
   - `flipped` - Boolean for front/back state
   - `numFlashcards` - Number of cards to display (1-50, controlled by slider)
3. **3D Flip Animation**:
   - Uses CSS `perspective: 1000px` for 3D effect
   - `transform-style: preserve-3d` on container
   - `backface-visibility: hidden` on front/back faces
   - Framer Motion animates `rotateY` from 0° to 180° on flip
4. **Navigation**:
   - Previous/Next buttons cycle through cards
   - Keyboard support (Enter/Space to flip)
   - Circular navigation (wraps around)
5. **Slider Control**:
   - HTML5 range input (`<input type="range">`)
   - Custom styled with blue glow effect (CSS in `FlashcardCarousel.css`)
   - Number input for precise control
   - Updates `numFlashcards` state, resets to first card

**Styling Details:**
- **Glow Effect**: Blue box-shadow `0 4px 20px rgba(59, 130, 246, 0.2)`
- **Hover Effect**: Lifts card with `translateY(-5px)` and stronger glow
- **Gradient Background**: `linear-gradient(145deg, var(--card-bg), var(--bg-secondary))`
- **Blue Border**: `rgba(59, 130, 246, 0.3)` with hover increase to `0.5`
- **Radial Glow**: Pseudo-element `::before` with radial gradient on hover

#### **Backend Implementation** (`Backend/App.py`)

**Generation Process:**
1. **Prompt Engineering** (lines 437-445):
   ```
   "Generate up to 20 flashcards from the following text. 
   Each flashcard must follow this exact format:
   Question: [clear question text]
   Answer: [concise answer text]"
   ```
2. **Text Clipping**: Limits input to 8000 characters to avoid quota issues
3. **Response Parsing** (`process_flashcards` function, lines 456-493):
   - Splits by double newlines (`\n\n`)
   - Parses "Question:" and "Answer:" prefixes
   - Validates minimum length (3 characters)
   - Returns structured array `[{front, back, id}]`
4. **Error Handling**: Returns empty array on parsing failure
5. **Retry Logic**: Uses `@retry` decorator with 2 attempts

**API Endpoint**: `POST /generate/flashcards`
- **Input**: `{text: string}`
- **Output**: `{flashcards: [{front, back, id}]}`

---

### **2. MCQ System**

#### **Frontend Implementation** (`src/Components/MCQs.jsx`)

**Technology Used:**
- **React Hooks** - useState, useMemo, useEffect
- **Framer Motion** - Modal animations
- **Custom Test Mode** - Full-screen test interface

**How It Works:**

1. **Data Normalization** (`normalizedMcqs` useMemo, lines 18-43):
   - Converts various MCQ formats to consistent structure
   - Handles both `correct_answer` (letter) and `answer` (text) formats
   - Maps options to array of strings
   - Converts answer text to letter (A, B, C, D) if needed

2. **Auto-Generation** (useEffect, lines 89-96):
   - Automatically generates MCQs when content is uploaded
   - Only if `raw_text` exists and no MCQs present
   - Calls `handleGenerateMCQs` function

3. **Test Mode** (lines 289-424):
   - **Full-Screen Overlay**: Fixed position, z-index 9999
   - **Progress Bar**: Visual progress indicator
   - **Question Display**: Shows current question with options
   - **Answer Selection**: Click to select, visual feedback
   - **Navigation**: Next/Submit button
   - **Timer** (optional): Countdown timer with auto-submit
   - **Score Calculation**: Calculates score on completion
   - **Exit Mechanism**: Click outside or press any key (except navigation keys)

4. **Timer Implementation** (lines 175-191):
   - `useEffect` with `setInterval` (1 second)
   - Auto-submits when timer reaches 0
   - Formats time as MM:SS
   - Configurable (0, 10, 20, 30 minutes)

5. **State Management**:
   - `isTestActive` - Test mode toggle
   - `currentIndex` - Current question index
   - `testAnswers` - Array of selected answers
   - `testFinished` - Completion state
   - `testScore` - Final score

**Styling Details:**
- **Test Overlay**: Dark background `bg-[#050816]` with safe-area insets
- **Question Card**: Glass morphism with `bg-white/5`, `backdrop-blur`
- **Selected Option**: Blue highlight `bg-blue-600/80`
- **Progress Bar**: Gradient `from-blue-500 to-purple-500`

#### **Backend Implementation** (`Backend/App.py`)

**Generation Process** (`generate_mcqs_with_retry`, lines 516-589):

1. **Prompt Engineering** (lines 520-526):
   ```
   "Create {num_questions} multiple-choice questions from the following content.
   Return ONLY a valid JSON array with this exact format:
   [{"question": "...", "options": ["A", "B", "C", "D"], "answer": "Correct option"}]
   ```

2. **JSON Parsing** (lines 533-554):
   - Strips markdown code fences (```json)
   - Extracts JSON array from response
   - Handles malformed JSON with fallback extraction

3. **Validation** (lines 556-577):
   - Ensures exactly 4 options per question
   - Validates answer exists in options
   - Cleans markdown formatting (`**`, `*`)
   - Limits to requested number of questions

4. **Error Handling**:
   - JSON parsing errors return error message
   - API quota errors (429) return user-friendly message
   - Retry logic: 3 attempts with 2-second wait

**API Endpoint**: `POST /generate/mcqs`
- **Input**: `{text: string, num_questions: number}`
- **Output**: `{mcqs: [{question, options, answer}]}`

---

### **3. Pomodoro Timer**

#### **Implementation** (`src/Components/PomodoroTimer.jsx`)

**Technology Used:**
- **React Hooks** - useState, useEffect, useRef
- **Framer Motion** - Settings panel animation
- **Background Image** - Custom background image import

**How It Works:**

1. **State Management**:
   - `focusMinutes` - Focus duration (default 25, max 240)
   - `breakMinutes` - Break duration (default 5, max 60)
   - `phase` - Current phase ('focus' or 'break')
   - `timeLeft` - Remaining seconds
   - `isRunning` - Timer running state
   - `isExpanded` - Settings panel visibility

2. **Timer Logic** (useEffect, lines 44-64):
   - `setInterval` runs every 1000ms (1 second)
   - Decrements `timeLeft` each second
   - Auto-switches phase when timer reaches 0
   - Cleans up interval on unmount or pause

3. **Phase Switching**:
   - When focus timer ends → switches to break phase
   - When break timer ends → switches to focus phase
   - Resets `timeLeft` to new phase duration

4. **Settings Panel**:
   - Expandable/collapsible with Framer Motion
   - Input validation: `clampMinutes` function (1-240 for focus, 1-60 for break)
   - Saves settings and closes panel

5. **Clock Display**:
   - Shows current system time (updates every second)
   - Format: "FOCUS • 08:23 PM"

6. **Styling**:
   - Background image with gradient overlay
   - Glass morphism effect
   - Blue theme matching app design

**Key Functions:**
- `formatCountdown(seconds)` - Formats seconds as MM:SS
- `clampMinutes(value, fallback, max)` - Validates and clamps input
- `getCurrentClock()` - Gets current time string
- `handleStartPause()` - Toggles timer
- `handleReset()` - Resets to initial state

---

### **4. YouTube Transcript System**

#### **Frontend Implementation** (`src/Components/YouTubeTranscript.jsx`)

**Technology Used:**
- **React Hooks** - useState, useEffect
- **Framer Motion** - Segment animations
- **DOMParser** - XML parsing for transcript data
- **Fetch API** - Direct YouTube API calls

**How It Works:**

1. **Video ID Extraction** (`extractVideoId`, lines 31-44):
   - Handles multiple URL formats:
     - `youtube.com/watch?v=VIDEO_ID`
     - `youtu.be/VIDEO_ID`
     - `youtube.com/embed/VIDEO_ID`
     - Direct video ID

2. **Transcript Fetching** (`fetchTranscript`, lines 46-104):
   - **Method 1**: Direct YouTube timedtext API
     - URL: `https://www.youtube.com/api/timedtext?v={videoId}&lang={lang}`
     - Tries multiple language codes: `['en', 'en-US', 'en-GB', 'a.en']`
     - Parses XML response with DOMParser
     - Extracts text, start time, duration from `<text>` elements
   - **Method 2**: YouTube Transcript API library (backend fallback)
   - **Error Handling**: Shows user-friendly error if no captions found

3. **Display Modes**:
   - **Segmented View**: Individual segments with timestamps
   - **Continuous View**: Full text as single paragraph

4. **Segment Interaction**:
   - Click segment → Opens YouTube video at that timestamp
   - Visual feedback: Selected segment highlighted
   - Color coding: Alternating blue shades

5. **Styling**:
   - Dark gradient background
   - Glass morphism cards
   - Custom scrollbar styling
   - Responsive design

#### **Backend Implementation** (`Backend/App.py`)

**Transcript Extraction** (`get_youtube_transcript_advanced`, lines 100-200):

1. **Primary Method**: YouTube Transcript API library
   - Uses `youtube-transcript-api` package
   - Tries direct method first: `YouTubeTranscriptApi.get_transcript(video_id, languages=['en'])`

2. **Fallback Methods**:
   - Manual transcript search
   - Auto-generated transcript search
   - Language fallbacks

3. **Format Conversion**:
   - Converts API response to consistent format
   - Returns: `[{text, start, duration}]`

4. **Error Handling**:
   - Handles `NoTranscriptFound`, `TranscriptsDisabled` exceptions
   - Returns None on failure

**Integration**: Called during file upload if YouTube URL detected

---

### **5. Preview Modal System**

#### **Implementation** (`src/Reusable/PreviewModalDesktop.jsx`)

**Technology Used:**
- **Framer Motion** - Modal animations (AnimatePresence)
- **React State** - Preview files management
- **URL.createObjectURL** - File preview generation

**How It Works:**

1. **Modal States**:
   - **Closed**: `previewFiles.length === 0` → No modal
   - **Open**: Shows file previews in grid layout
   - **Uploading**: Shows slim bottom status bar instead of blocking modal

2. **File Preview Generation**:
   - **Images**: Uses `URL.createObjectURL(file)` for preview
   - **PDFs**: Shows PDF icon (no actual preview)
   - **YouTube**: Handled separately

3. **Upload Flow**:
   - User selects files → Added to `previewFiles` state
   - Modal opens automatically
   - User can add more files or remove files
   - Click "Upload All" → Calls `handleFileUpload()`
   - During upload: Modal closes, bottom status bar appears
   - After upload: Status bar disappears, files cleared

4. **Optimization** (lines 14-25):
   - **Non-Blocking Upload**: Modal doesn't stay open during upload
   - **Bottom Status Bar**: Small, non-intrusive indicator
   - **User Can Explore**: Page remains accessible during upload

5. **Styling**:
   - Full-screen overlay with backdrop blur
   - Centered modal with max-width
   - Grid layout for multiple files
   - Smooth animations

**Key Props**:
- `previewFiles` - Array of file objects
- `setPreviewFiles` - State setter
- `handleFileUpload` - Upload function
- `isLoading` - Upload state

---

### **6. Chatbot System**

#### **Frontend Implementation** (`src/Components/Chatbot.jsx`)

**Technology Used:**
- **React Hooks** - useState, useEffect, useRef
- **Axios** - API calls
- **React KaTeX** - LaTeX rendering
- **Framer Motion** - Animations
- **localStorage** - Chat history persistence

**How It Works:**

1. **Chat History Persistence** (lines 27-47):
   - **Storage Key**: `'studyAssistantChat'`
   - **Format**: JSON array of messages
   - **Loading**: Reads from localStorage on mount
   - **Saving**: Saves to localStorage on every message update (useEffect)
   - **Initial Greeting**: Different for mobile/desktop (homework mention only on mobile)

2. **Message Rendering** (lines 179-193):
   - **User Messages**: Right-aligned, blue background
   - **Bot Messages**: Left-aligned, gray background
   - **LaTeX Support**: Uses `renderWithLatex` function to parse `$...$` and `$$...$$`
   - **Emoji Support**: Full emoji rendering with proper font settings

3. **Safety Filter** (lines 94-118):
   - **Frontend Filter**: Blocks obviously inappropriate queries
   - **Patterns**: `/18\+/i`, `/nsfw/i`, `/porn/i`, `/sex(ual)?/i`, `/nude/i`, `/erotic/i`
   - **Response**: Returns safe reply without sending to backend

4. **API Communication** (lines 120-140):
   - **Endpoint**: `POST /chat`
   - **Payload**: `{message, history, content}`
   - **Content Context**: Includes current file's summary, notes, etc.
   - **Error Handling**: Shows user-friendly error messages

5. **Emoji Picker** (lines 211-253):
   - **Categories**: Frequently Used, Smileys, Gestures, Objects, Symbols, Activities
   - **UI**: Dropdown with grid layout
   - **Insertion**: Adds emoji to input field

6. **Auto-Scroll** (useEffect, lines 68-70):
   - Scrolls to bottom when new messages arrive
   - Uses `messagesEndRef` for scroll target

**Styling**:
- Glass morphism container
- Responsive design
- Smooth animations
- LaTeX formulas styled with blue glow

#### **Backend Implementation** (`Backend/App.py`)

**Chat Endpoint** (`/chat`, lines 350-415):

1. **Prompt Construction** (lines 360-380):
   - Builds context from uploaded content
   - Includes summary, notes, flashcards, MCQs if available
   - Adds conversation history
   - Constructs system prompt for Gemini

2. **API Call** (`chat_with_gemini`, lines 395-414):
   - Uses separate API key if available (`GEMINI_CHAT_API_KEY`)
   - Falls back to main key
   - Model: `gemini-2.5-flash`
   - Error handling for quota/404 errors

3. **Response Processing**:
   - Strips markdown formatting (`*`)
   - Returns clean text response

**API Endpoint**: `POST /chat`
- **Input**: `{message: string, history: array, content: object}`
- **Output**: `{response: string}`

---

### **7. Classic vs Studio Mode**

#### **Why Two Modes?**

**Classic Mode** (`src/Layout/ClassicLayout.jsx`):
- **Purpose**: Traditional, familiar interface
- **Layout**: Single-column with tabbed navigation
- **Use Case**: Users who prefer simple, focused interface
- **Features**:
  - Header with title and mode switcher
  - Tab navigation (Summary, Notes, Flashcards, MCQs, etc.)
  - Floating chatbot button (bottom right)
  - Content sections displayed one at a time
  - Mobile hamburger menu

**Studio Mode** (`src/Layout/StudioLayout.jsx`):
- **Purpose**: Power user interface with advanced tools
- **Layout**: Three-panel layout (Sources | Chat | Studio Tools)
- **Use Case**: Users who want everything visible simultaneously
- **Features**:
  - **Left Panel**: Source files with preview thumbnails
  - **Center Panel**: Persistent chat interface (always visible)
  - **Right Panel**: Studio tools (generation buttons, Pomodoro timer)
  - **Mobile**: Bottom navigation tabs (Sources, Chat, Studio)
  - **Export Dropdown**: Quick export in header
  - **File Preview Modal**: Minimize/maximize functionality

**Implementation**:
- **State**: `layoutMode` state in `useAppState` hook
- **Switching**: Button in header toggles between modes
- **Lazy Loading**: Both layouts lazy-loaded for performance
- **State Preservation**: State persists when switching modes

---

### **8. File Upload & Processing**

#### **Frontend Flow** (`src/hooks/useFileHandling.js`)

1. **File Selection** (`handleFileSelect`):
   - Accepts files array or YouTube URL string
   - Creates preview objects with `URL.createObjectURL` for images/PDFs
   - Adds to `previewFiles` state
   - Opens preview modal automatically

2. **File Upload** (`handleFileUpload`):
   - Creates `FormData` object
   - Appends files or YouTube URL
   - Sends `POST /upload` request
   - Processes response with `processResponse`

3. **Response Processing** (`processResponse`):
   - Maps backend response to frontend format
   - Cleans markdown formatting
   - Sets uploaded files state
   - Updates selected file index

#### **Backend Flow** (`Backend/App.py`, `/upload` endpoint)

1. **File Reception** (lines 591-600):
   - Receives `multipart/form-data`
   - Extracts files and YouTube URLs
   - Determines `quick_mode` flag

2. **Text Extraction**:
   - **PDF**: Tries PyMuPDF first, falls back to OCR if no text
   - **Images**: OCR with Tesseract
   - **YouTube**: Transcript extraction
   - **Image Files**: Image description generation

3. **Content Generation**:
   - **Always**: Summary generation
   - **If not quick_mode**: Notes, flashcards, MCQs generation
   - **Parallel Processing**: Multiple generations can run concurrently

4. **Response Format**:
   - Returns JSON with all generated content
   - Includes base64 image for image files
   - Includes transcript for YouTube videos

---

## 🎨 Styling & Design System

### **Color System** (`src/index.css`)

**CSS Variables** (lines 5-24):
```css
--bg-primary: #0f1419        /* Main background */
--bg-secondary: #1a1f29      /* Secondary background */
--text-primary: #f8fafc      /* Primary text (white) */
--text-secondary: #cbd5e1    /* Secondary text (light gray) */
--text-tertiary: #94a3b8     /* Tertiary text (gray) */
--card-bg: #1e2532           /* Card background */
--border-color: #334155      /* Border color */
--hover-bg: #2d3748          /* Hover background */
--accent-primary: #f8fafc    /* Accent color (white) */
--accent-purple: #8b5cf6     /* Purple accent */
--accent-pink: #ec4899       /* Pink accent */
```

**Glass Morphism Variables**:
```css
--glass-bg: rgba(30, 37, 50, 0.7)
--glass-border: rgba(255, 255, 255, 0.1)
--glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37)
--glass-backdrop: blur(8px)
```

### **Glow Effects**

1. **Glass Buttons** (`.glass-button`, lines 99-114):
   - **Base**: `rgba(59, 130, 246, 0.2)` background
   - **Border**: `rgba(59, 130, 246, 0.3)` with `backdrop-filter: blur(8px)`
   - **Shadow**: `0 0 10px rgba(59, 130, 246, 0.28)`
   - **Hover**: Stronger shadow `0 6px 14px rgba(59, 130, 246, 0.16)`
   - **Transform**: `translateY(-2px)` on hover

2. **Flashcards** (`.flashcard`, `FlashcardCarousel.css`):
   - **Border Glow**: `rgba(59, 130, 246, 0.3)` border
   - **Box Shadow**: `0 4px 20px rgba(59, 130, 246, 0.2)`
   - **Hover Glow**: `0 8px 30px rgba(59, 130, 246, 0.4), 0 0 20px rgba(59, 130, 246, 0.3)`
   - **Radial Glow**: Pseudo-element with `radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)`

3. **Range Slider** (`FlashcardCarousel.css`, lines 152-192):
   - **Track**: `linear-gradient(90deg, rgba(59, 130, 246, 0.25), rgba(37, 99, 235, 0.8))`
   - **Track Shadow**: `0 0 12px rgba(59, 130, 246, 0.5)`
   - **Thumb**: `#3b82f6` with `box-shadow: 0 0 16px rgba(59, 130, 246, 0.9)`
   - **Border**: `2px solid #1d4ed8`

4. **LaTeX Formulas** (`index.css`, lines 166-171):
   - **Color**: Blue with `text-shadow: 0 0 5px blue`
   - **Background**: Transparent
   - **Display**: Inline or block based on `$` or `$$`

### **Background Gradients**

1. **Body Background** (`index.css`, line 28):
   ```css
   background: linear-gradient(135deg, #0f1419 0%, #1a1f29 50%, #16213e 100%);
   ```

2. **Pomodoro Timer** (`PomodoroTimer.jsx`, line 124):
   ```css
   bg-gradient-to-r from-[#081542]/90 via-[#0b1e70]/85 to-[#0e2d9c]/85
   ```

3. **MCQ Test Overlay** (`MCQs.jsx`, line 233):
   ```css
   bg-gradient-to-br from-[#050816] via-[#0b1e70] to-[#020617]
   ```

### **Animation System**

**Framer Motion Usage**:
- **Page Transitions**: Fade in/out (`opacity`, `scale`)
- **Modal Animations**: Scale + opacity (`initial={{ scale: 0.9 }}`)
- **Button Hover**: Scale transforms (`whileHover={{ scale: 1.05 }}`)
- **Card Flips**: 3D rotation (`rotateY: 180`)
- **List Items**: Stagger animations (`transition={{ delay: index * 0.005 }}`)

**CSS Transitions**:
- **Duration**: 0.2s - 0.3s for most elements
- **Easing**: `ease` or `easeInOut`
- **Properties**: `transform`, `opacity`, `background-color`

---

## 🔌 API Endpoints & Data Flow

### **Complete API Reference**

#### **Core Endpoints**

1. **`GET /health`**
   - **Purpose**: Health check
   - **Response**: `{"status": "ok"}`
   - **Use Case**: Server availability check

2. **`POST /upload`**
   - **Purpose**: File/URL upload and processing
   - **Content-Type**: `multipart/form-data`
   - **Input**:
     ```json
     {
       "files": File[],
       "youtube_url": string (optional),
       "quick_mode": "true"|"false"
     }
     ```
   - **Output**:
     ```json
     [{
       "filename": string,
       "type": "pdf"|"image"|"youtube",
       "summary": string,
       "short_notes": string (if not quick_mode),
       "flashcards": [{front, back, id}],
       "mcqs": [{question, options, answer}],
       "image_description": string (if image),
       "base64_image": string (if image),
       "transcript": [{text, start, duration}] (if YouTube),
       "raw_text": string
     }]
     ```
   - **Processing Time**: 5-30 seconds depending on content size

#### **On-Demand Generation Endpoints**

3. **`POST /generate/notes`**
   - **Input**: `{text: string}`
   - **Output**: `{short_notes: string}`
   - **Model**: Gemini 2.5 Flash
   - **Text Limit**: 6000 characters

4. **`POST /generate/flashcards`**
   - **Input**: `{text: string}`
   - **Output**: `{flashcards: [{front, back, id}]}`
   - **Model**: Gemini 2.5 Flash
   - **Text Limit**: 8000 characters
   - **Max Cards**: 20

5. **`POST /generate/mcqs`**
   - **Input**: `{text: string, num_questions: number}`
   - **Output**: `{mcqs: [{question, options, answer}]}`
   - **Model**: Gemini 2.5 Flash
   - **Text Limit**: 8000 characters
   - **Retry Logic**: 3 attempts with 2-second wait

6. **`POST /generate/ppt`**
   - **Input**: `{text: string, summary: string, notes: string}`
   - **Output**: ZIP file with PDF slides
   - **Format**: ReportLab-generated PDFs

#### **Chat Endpoint**

7. **`POST /chat`**
   - **Input**: 
     ```json
     {
       "message": string,
       "history": [{sender, text}],
       "content": {
         "summary": string,
         "short_notes": string,
         "flashcards": array,
         "mcqs": array
       }
     }
     ```
   - **Output**: `{response: string}`
   - **Model**: Gemini 2.5 Flash
   - **API Key**: Uses `GEMINI_CHAT_API_KEY` if available

#### **Download/Export Endpoint**

8. **`POST /download`**
   - **Input**: 
     ```json
     {
       "type": "summary"|"short_notes"|"flashcards"|"mcqs"|"image_description",
       "format": "pdf"|"txt"|"docx"|"csv",
       "content": object
     }
     ```
   - **Output**: File download (blob)
   - **Formats**:
     - **PDF**: ReportLab generation
     - **DOCX**: python-docx library
     - **TXT**: Plain text
     - **CSV**: For structured data (flashcards, MCQs)

#### **RAG Endpoints** (Optional)

9. **`POST /rag/ingest`**
   - **Purpose**: Ingest document into vector store
   - **Input**: `{file_path: string, book_id: string}`
   - **Output**: `{status: "success"|"error"}`

10. **`GET /rag/books`**
    - **Purpose**: List all ingested books
    - **Output**: `{books: [{id, name}]}`

11. **`DELETE /rag/books/<book_id>`**
    - **Purpose**: Delete book from vector store
    - **Output**: `{status: "success"|"error"}`

12. **`POST /rag/query`**
    - **Purpose**: Query documents using RAG
    - **Input**: `{question: string, book_id: string, k: number}`
    - **Output**: `{answer: string, sources: array}`

### **Data Flow Diagrams**

#### **Upload Flow**
```
User selects files
    ↓
Frontend: handleFileSelect()
    ↓
Preview files added to state
    ↓
Preview modal opens
    ↓
User clicks "Upload All"
    ↓
Frontend: handleFileUpload()
    ↓
POST /upload (FormData)
    ↓
Backend: Extract text (PDF/OCR/YouTube)
    ↓
Backend: Generate summary (always)
    ↓
Backend: Generate notes/flashcards/MCQs (if not quick_mode)
    ↓
Backend: Return JSON response
    ↓
Frontend: processResponse()
    ↓
Update uploadedFiles state
    ↓
Display content in tabs
```

#### **Chat Flow**
```
User types message
    ↓
Frontend: handleSendMessage()
    ↓
Safety filter check (frontend)
    ↓
POST /chat {message, history, content}
    ↓
Backend: Build prompt with context
    ↓
Backend: Call Gemini API
    ↓
Backend: Return response
    ↓
Frontend: Add to messages state
    ↓
Frontend: Save to localStorage
    ↓
Frontend: Auto-scroll to bottom
```

#### **MCQ Generation Flow**
```
User uploads content
    ↓
Backend generates MCQs automatically
    ↓
Frontend: MCQs component mounts
    ↓
useEffect detects no MCQs
    ↓
Calls handleGenerateMCQs()
    ↓
POST /generate/mcqs
    ↓
Backend: Generate with retry logic
    ↓
Backend: Parse JSON response
    ↓
Backend: Validate and clean MCQs
    ↓
Frontend: Update currentContent.mcqs
    ↓
Display MCQ test interface
```

---

## 🤖 AI Integration

### **Google Gemini 2.5 Flash**

**Model Details**:
- **Model Name**: `gemini-2.5-flash`
- **Provider**: Google Generative AI
- **API Version**: v1 (not v1beta)
- **Use Cases**: All text generation (summary, notes, flashcards, MCQs, chat, image description)

**API Configuration** (`Backend/App.py`):
```python
import google.generativeai as genai
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")
response = model.generate_content(prompt)
```

**Separate API Keys**:
- **GEMINI_API_KEY**: Main key for content generation
- **GEMINI_CHAT_API_KEY**: Optional separate key for chat (falls back to main key)

**Rate Limiting**:
- **Free Tier**: ~20 requests per minute
- **Error Handling**: 429 errors handled with user-friendly messages
- **Retry Logic**: Tenacity decorators with exponential backoff

**Prompt Engineering**:

1. **Summary Generation**:
   ```
   "Provide a comprehensive summary of the following text..."
   ```

2. **Flashcard Generation**:
   ```
   "Generate up to 20 flashcards. Format:
   Question: [text]
   Answer: [text]"
   ```

3. **MCQ Generation**:
   ```
   "Create {num} multiple-choice questions.
   Return ONLY valid JSON array:
   [{"question": "...", "options": [...], "answer": "..."}]"
   ```

4. **Chat**:
   ```
   "You are a study assistant. Context:
   Summary: {summary}
   Notes: {notes}
   User question: {message}
   Provide helpful, educational response."
   ```

**Error Handling**:
- **429 Quota Exceeded**: Returns user-friendly message
- **404 Model Not Found**: Checks API version and model name
- **400 Invalid Key**: Checks environment variables
- **Retry Logic**: Automatic retries with backoff

---

## ⚡ Performance Optimizations

### **Frontend Optimizations**

1. **Code Splitting**:
   - Lazy loading of heavy components
   - Route-based splitting (if routing added)
   - Dynamic imports for large libraries

2. **State Management**:
   - Minimal re-renders with proper dependency arrays
   - useMemo for expensive computations
   - useCallback for stable function references (where needed)

3. **Rendering Optimizations**:
   - Conditional rendering to avoid unnecessary DOM
   - Virtual scrolling ready (react-window installed)
   - Image lazy loading (native browser)

4. **Bundle Size**:
   - Tree shaking enabled (Vite default)
   - Production builds minified
   - Unused dependencies removed

### **Backend Optimizations**

1. **Text Clipping**:
   - Limits input text to avoid token limits
   - Summary: Full text
   - Notes: 6000 chars
   - Flashcards: 8000 chars
   - MCQs: 8000 chars

2. **Retry Logic**:
   - Prevents unnecessary API calls
   - Exponential backoff reduces server load
   - Connection error handling

3. **File Cleanup**:
   - Automatic temporary file removal
   - Memory-efficient processing
   - Safe file removal with retries

4. **Parallel Processing**:
   - Multiple generations can run concurrently
   - Non-blocking I/O operations

### **Network Optimizations**

1. **Request Batching**:
   - Single upload endpoint handles all processing
   - Reduces round trips

2. **Response Compression**:
   - Flask can compress responses (if configured)
   - JSON responses are compact

3. **Caching**:
   - No server-side caching (stateless design)
   - Browser caching for static assets
   - localStorage for chat history

---

## 🛠️ Development Setup

### **Prerequisites**

1. **Node.js** 18+ and npm
2. **Python** 3.8+
3. **Tesseract OCR** (for scanned PDFs)
   - Windows: Install from https://github.com/UB-Mannheim/tesseract/wiki
   - Path: `C:\Program Files\Tesseract-OCR\tesseract.exe` (or configure in code)

### **Frontend Setup**

```bash
cd "looms 1"
npm install
npm run dev      # Development server (http://localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
```

**Environment Variables** (`.env` or `vite.config.js`):
- `VITE_API_BASE` - Backend API URL (default: `http://127.0.0.1:5000`)

### **Backend Setup**

```bash
cd Backend
pip install -r requirements.txt
python App.py    # Run Flask server (http://127.0.0.1:5000)
```

**Environment Variables** (`.env` file in `Backend/`):
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_CHAT_API_KEY=your_chat_api_key_here  # Optional
YOUTUBE_API_KEY=your_youtube_api_key_here   # Optional
```

**API Key Setup**:
1. Get Gemini API key from https://ai.google.dev/
2. Create `.env` file in `Backend/` directory
3. Add `GEMINI_API_KEY=your_key_here`
4. Restart Flask server

### **Project Dependencies Summary**

**Frontend** (package.json):
- React ecosystem: 19.0.0
- Build tool: Vite 6.2.0
- Styling: Tailwind CSS 3.4.17
- Animations: Framer Motion 12.7.4
- HTTP: Axios 1.8.4
- Math: React KaTeX 3.1.0
- Notifications: React Hot Toast 2.6.0

**Backend** (requirements.txt):
- Web framework: Flask 2.0.1+
- AI: google-generativeai 0.3.0+
- PDF: PyMuPDF 1.21.0+, pdf2image 1.16.0+
- OCR: pytesseract 0.3.10+
- Image: Pillow 9.0.0+, opencv-python-headless 4.5.5+
- RAG: langchain 0.1.0+, chromadb 0.4.0+, sentence-transformers 2.2.2+
- Utilities: tenacity 8.0.1+, youtube-transcript-api 0.6.1+

---

## 📊 Key Metrics & Statistics

- **Total Lines of Code**: ~5000+ (Frontend + Backend)
- **Components**: 20+ React components
- **API Endpoints**: 12 endpoints
- **Dependencies**: 30+ npm packages, 15+ Python packages
- **Build Size**: ~500KB (gzipped) for production
- **Load Time**: <2s initial load (with optimizations)

---

## 🎓 Interview Preparation Highlights

### **Architecture Decisions**

1. **Why No Database?**
   - Stateless design for simplicity
   - Privacy-first approach
   - Reduced infrastructure costs
   - Session-based data in localStorage

2. **Why Two Layout Modes?**
   - Different user preferences
   - Classic: Simple, focused
   - Studio: Power users, everything visible

3. **Why Lazy Loading?**
   - Performance optimization
   - Faster initial load
   - Better LCP (Largest Contentful Paint) scores

4. **Why Glass Morphism?**
   - Modern, aesthetic design
   - Visual depth
   - Professional appearance
   - Blue glow matches educational theme

5. **Why Gemini 2.5 Flash?**
   - Fast response times
   - Cost-effective
   - Good quality for educational content
   - Free tier available

### **Technical Challenges Solved**

1. **3D Card Flip**: CSS perspective + Framer Motion
2. **PDF OCR Fallback**: PyMuPDF → Tesseract pipeline
3. **YouTube Transcript**: Multiple API methods with fallbacks
4. **JSON Parsing**: Robust parsing with markdown stripping
5. **File Preview**: Object URLs with cleanup
6. **State Management**: Custom hooks without Redux
7. **Performance**: Lazy loading + code splitting
8. **Error Handling**: Comprehensive error messages + retry logic

---

## 🔒 Security Considerations

### **Current Implementation**

## 🚧 Limitations

1. **Session-Based Storage**
   - All chat history is stored in browser's localStorage and is cleared on page refresh
   - No persistent user accounts or data retention between sessions

2. **RAG System**
   - The Retrieval-Augmented Generation (RAG) system uses ChromaDB in-memory by default
   - Vector embeddings are not persisted between server restarts unless configured otherwise
   - Limited context window for document processing

3. **File Processing**
   - Large files may cause performance issues
   - Limited to specific file formats (PDF, PNG, JPG, JPEG)
   - No batch processing capability

4. **AI Model**
   - Dependent on Google's Gemini 2.5 Flash model availability and rate limits
   - Responses may be limited by model's context window
   - No fine-tuning of the base model

5. **Scalability**
   - Not designed for high-concurrency production use
   - No load balancing or horizontal scaling built-in
   - No database for persistent storage of user data

6. **Security**
   - No user authentication system
   - Limited input validation on the client side
   - No end-to-end encryption for sensitive data

## 🔄 RAG and ChromaDB Storage Details

### RAG Implementation
- **Status**: Optional feature (not enabled by default)
- **Location**: Implemented in the backend using LangChain and ChromaDB
- **Activation**: Requires specific configuration to enable RAG functionality

### ChromaDB Storage
- **Default Mode**: In-memory (non-persistent)
- **Persistence**: To enable persistent storage, ChromaDB needs to be configured with a persistent directory
- **Storage Location**: When configured for persistence, vectors are stored in the `vector_store/` directory in the backend
- **Embeddings**: Uses `all-MiniLM-L12-v2` model for generating document embeddings

### Why You Might Not See Vectors
1. **RAG Not Enabled**: The RAG system might be disabled in the current configuration
2. **In-Memory Mode**: If ChromaDB is running in in-memory mode, vectors won't persist after server restart
3. **No Documents Processed**: The vector store will be empty until documents are processed through the RAG pipeline

### Enabling Persistent Storage
To enable persistent vector storage, you would need to modify the ChromaDB initialization to include a persistent directory:

```python
# Example configuration for persistent storage
vector_store = Chroma(
    embedding_function=embedding_function,
    persist_directory="./vector_store"  # This enables persistence
)
```

1. **API Keys**: Stored in `.env` file (not committed)
2. **CORS**: Enabled for all origins (development)
3. **File Uploads**: Validated file types
4. **Input Sanitization**: Basic markdown stripping
5. **No Authentication**: Public access (by design)

### **Production Recommendations**

1. **Environment Variables**: Move all secrets to `.env`
2. **CORS Restriction**: Limit to specific origins
3. **Rate Limiting**: Implement Flask-Limiter
4. **File Size Limits**: Enforce maximum file sizes
5. **Input Validation**: Enhanced sanitization
6. **HTTPS**: Use SSL/TLS in production
7. **API Key Rotation**: Regular key updates

---

## 🚀 Deployment Considerations

### **Frontend Deployment**
- **Platform**: Vercel, Netlify, or any static host
- **Build Command**: `npm run build`
- **Output Directory**: `dist/`
- **Environment**: Set `VITE_API_BASE` to production API URL

### **Backend Deployment**
- **Platform**: Heroku, Railway, Render, or VPS
- **Requirements**: Python 3.8+, Tesseract OCR
- **Environment Variables**: Set in hosting platform
- **Process**: Run `python App.py` or use gunicorn/uwsgi

### **Database** (if adding)
- **Options**: PostgreSQL, MongoDB, Supabase
- **Migration**: Add user authentication first
- **Storage**: User data, file metadata, chat history

---

## 📝 Conclusion

**NoteLooms** is a comprehensive, production-ready educational platform demonstrating:
- Full-stack development (React + Flask)
- AI integration (Google Gemini)
- Modern UI/UX (Glass morphism, animations)
- Performance optimization (lazy loading, code splitting)
- Robust error handling
- Clean architecture patterns

This documentation serves as the **complete technical reference** for understanding every aspect of the project, from database choices to styling details, making it perfect for interview preparation and project handoff.

---

**Last Updated**: December 2025  
**Project Status**: Production Ready  
**Maintainer**: Development Team
