import { useState, useRef, useEffect, useMemo, Suspense, lazy } from "react";
import toast, { Toaster } from 'react-hot-toast';
import axios from "axios";
import { endpoint } from "./utils/api";
import useAppState from "./hooks/useAppState";
import useFileHandling from "./hooks/useFileHandling";
import bgImage from "./utils/Background.jpg";

// Lazy-load the large layout shells so the initial classic view stays fast
const StudioLayout = lazy(() => import("./Layout/StudioLayout"));
const ClassicLayout = lazy(() => import("./Layout/ClassicLayout"));
const SessionHistory = lazy(() => import("./Reusable/SessionHistory"));

function App() {
  const {
    uploadedFiles,
    setUploadedFiles,
    selectedFileIndex,
    setSelectedFileIndex,
    isLoading,
    setIsLoading,
    error,
    setError,
    isSpeaking,
    setIsSpeaking,
    activeSection,
    setActiveSection,
    isChatbotVisible,
    setIsChatbotVisible,
    layoutMode,
    setLayoutMode,
    activeOutput,
    setActiveOutput,
    currentFlashcardIndex,
    setCurrentFlashcardIndex,
    numFlashcards,
    setNumFlashcards,
    numQuestions,
    setNumQuestions,
    isGenerating,
    setIsGenerating,
    previews,
    setPreviews,
    mobileTab,
    setMobileTab,
    previewFiles,
    setPreviewFiles,
    isPreviewModalOpen,
    setIsPreviewModalOpen,
    isPreviewMinimized,
    setIsPreviewMinimized,
    showConfirmModal,
    setShowConfirmModal,
    confirmAction,
    setConfirmAction,
    confirmMessage,
    setConfirmMessage,
  } = useAppState();

  const isMobile = window.innerWidth < 1024;
  const speechSynthesisRef = useRef(window.speechSynthesis);
  const previewFilesRef = useRef([]);
  const addMoreFilesInputRef = useRef(null);

  const {
    handleFileSelect,
    handleFileUpload,
    handleRemovePreviewFile,
    handleAddMoreFiles,
    openUploadedSource,
    handleUploadedFileClick,
    processResponse,
  } = useFileHandling({
    previewFiles,
    setPreviewFiles,
    uploadedFiles,
    setUploadedFiles,
    selectedFileIndex,
    setSelectedFileIndex,
    setIsLoading,
    setError,
    setCurrentFlashcardIndex,
    setNumFlashcards,
    addMoreFilesInputRef,
    layoutMode,
    setIsPreviewModalOpen,
    setIsPreviewMinimized,
  });

  useEffect(() => {
    previewFilesRef.current = previewFiles;
  }, [previewFiles]);

  useEffect(() => {
    localStorage.removeItem('studyAssistantChat');
  }, []);

  useEffect(() => {
    return () => {
      previewFilesRef.current.forEach((file) => {
        if (file?.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setLayoutMode('classic');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      const hasContent = uploadedFiles.length > 0;
      const hasChatHistory = localStorage.getItem('studyAssistantChat') !== null;
      if (hasContent || hasChatHistory) {
        const message = 'Are you sure you want to refresh? Your uploaded content and chat history will disappear.';
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [uploadedFiles]);

  const currentContent = uploadedFiles[selectedFileIndex] || {
    summary: "",
    short_notes: "",
    mcqs: [],
    flashcards: [],
    raw_text: "",
    image_description: "",
    base64_image: "",
    is_image: false,
    filename: "",
    type: "",
  };

  const speakText = (text, type) => {
    if (!text) return;
    if (speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking((prev) => ({ ...prev, [type]: false }));
    speechSynthesisRef.current.speak(utterance);
    setIsSpeaking((prev) => ({ ...prev, [type]: true }));
    toast.success(`Reading aloud ${type}...`);
  };

  const stopSpeaking = () => {
    if (speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking({ summary: false, notes: false, image_description: false });
    }
  };

  const updateCurrentContent = (updatedContent) => {
    setUploadedFiles((prev) => prev.map((f, i) => (i === selectedFileIndex ? updatedContent : f)));
  };

  const handleExport = async (type, format, contentData) => {
    try {
      let res;
      if (type === 'ppt' || format === 'ppt') {
        res = await axios.post(endpoint('/generate/ppt'), { 
          text: currentContent.raw_text, 
          summary: contentData?.summary || currentContent.summary,
          notes: contentData?.short_notes || currentContent.short_notes
        }, { responseType: 'blob' });
      } else {
        res = await axios.post(endpoint('/download'), { 
          type, 
          format, 
          content: contentData 
        }, { responseType: 'blob' });
      }
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = type === 'ppt' || format === 'ppt' ? 'notelooms_ppt.zip' : `${type}.${format}`;
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed—try again.');
      setError('Export failed—try again.');
    }
  };

  const handleDownload = async (contentType, format) => {
    const contentData = {
      summary: currentContent.summary,
      short_notes: currentContent.short_notes,
      mcqs: currentContent.mcqs,
      flashcards: currentContent.flashcards,
      image_description: currentContent.image_description,
    }[contentType];

    try {
      const response = await axios.post(
        endpoint("/download"),
        { type: contentType, format, content: contentData },
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${contentType}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError("Failed to download the file. Please try again.");
    }
  };

  const showConfirmation = (action, message) => {
    setConfirmAction(action);
    setConfirmMessage(message);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    setShowConfirmModal(false);
    if (confirmAction === 'reset') {
      setUploadedFiles([]);
      setSelectedFileIndex(0);
      setCurrentFlashcardIndex(0);
      setNumFlashcards(10);
      setError(null);
      setActiveSection("summary");
      setIsChatbotVisible(false);
      localStorage.removeItem('studyAssistantChat');
      setPreviewFiles([]);
      setIsPreviewModalOpen(false);
      setIsPreviewMinimized(false);
      setActiveOutput(null);
      setIsLoading(false);
      setIsGenerating({
        summary: false,
        notes: false,
        flashcards: false,
        mcqs: false,
        image_description: false,
      });
      toast.dismiss();
    }
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  const handleReset = () => {
    const confirmMessage = 'Are you sure you want to reset? Your uploaded content and chat history will disappear.';
    // Clear chat history from localStorage
    localStorage.removeItem('studyAssistantChat');
    // Also clear from sessionStorage if used
    sessionStorage.removeItem('studyAssistantChat');
    // Clear any active chat sessions
    if (window.chatApi) {
      window.chatApi.clearChatHistory();
    }
    showConfirmation('reset', confirmMessage);
  };

  // Session Management
  const [isSessionHistoryOpen, setIsSessionHistoryOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const handleSaveSession = async () => {
    try {
      if (uploadedFiles.length === 0) {
        toast.error("No content to save. Please upload files first.");
        return;
      }

      const sessionName = prompt("Enter a name for this session:", `Session ${new Date().toLocaleString()}`);
      if (!sessionName) return;

      // Get chat history from localStorage
      const chatHistory = JSON.parse(localStorage.getItem('studyAssistantChat') || '[]');

      const sessionData = {
        name: sessionName,
        uploadedFiles: uploadedFiles,
        chatHistory: chatHistory
      };

      const response = await axios.post(endpoint('/api/sessions'), sessionData);

      if (response.data.session_id) {
        setCurrentSessionId(response.data.session_id);
        toast.success("Session saved successfully!");
        // Trigger refresh event for SessionHistory component
        window.dispatchEvent(new Event('sessionSaved'));
      } else {
        throw new Error("No session_id in response");
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error saving session:", error);
        console.error("Error details:", error.response?.data);
      }
      toast.error(`Failed to save session: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleLoadSession = (sessionData) => {
    try {
      // Load uploaded files
      if (sessionData.uploadedFiles && sessionData.uploadedFiles.length > 0) {
        setUploadedFiles(sessionData.uploadedFiles);
        setSelectedFileIndex(0);
      }

      // Load chat history
      if (sessionData.chatHistory && sessionData.chatHistory.length > 0) {
        localStorage.setItem('studyAssistantChat', JSON.stringify(sessionData.chatHistory));
      }

      setCurrentSessionId(sessionData.id);
      toast.success("Session loaded successfully!");
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error loading session:", error);
      toast.error("Failed to load session");
    }
  };

  const sharedProps = useMemo(
    () => ({
      uploadedFiles,
      selectedFileIndex,
      setSelectedFileIndex,
      isLoading,
      error,
      isSpeaking,
      activeSection,
      setActiveSection,
      isChatbotVisible,
      setIsChatbotVisible,
      layoutMode,
      setLayoutMode,
      activeOutput,
      setActiveOutput,
      currentFlashcardIndex,
      numFlashcards,
      setNumFlashcards,
      numQuestions,
      setNumQuestions,
      isGenerating,
      setIsGenerating,
      mobileTab,
      setMobileTab,
      previewFiles,
      isPreviewModalOpen,
      setIsPreviewModalOpen,
      showConfirmModal,
      confirmMessage,
      currentContent,
      handleFileSelect,
      handleFileUpload,
      handleRemovePreviewFile,
      handleAddMoreFiles,
      handleUploadedFileClick,
      handleExport,
      handleDownload,
      handleReset,
      handleConfirm,
      handleCancel,
      showConfirmation,
      speakText,
      stopSpeaking,
      updateCurrentContent,
      addMoreFilesInputRef,
      isMobile,
      isSessionHistoryOpen,
      setIsSessionHistoryOpen,
      handleSaveSession,
      handleLoadSession,
      currentSessionId,
    }),
    [
      uploadedFiles,
      selectedFileIndex,
      isLoading,
      error,
      isSpeaking,
      activeSection,
      isChatbotVisible,
      layoutMode,
      activeOutput,
      currentFlashcardIndex,
      numFlashcards,
      numQuestions,
      isGenerating,
      mobileTab,
      previewFiles,
      isPreviewModalOpen,
      showConfirmModal,
      confirmMessage,
      currentContent,
      currentSessionId,
      isSessionHistoryOpen,
      handleFileSelect,
      handleFileUpload,
      handleRemovePreviewFile,
      handleAddMoreFiles,
      handleUploadedFileClick,
      handleExport,
      handleDownload,
      handleReset,
      handleConfirm,
      handleCancel,
      showConfirmation,
      speakText,
      stopSpeaking,
      updateCurrentContent,
      handleSaveSession,
      handleLoadSession,
    ]
  );

  const backdropStyle = useMemo(
    () => ({
      backgroundImage: `linear-gradient(180deg, rgba(15,20,25,0.62) 0%, rgba(26,31,41,0.58) 50%, rgba(15,20,25,0.66) 100%), url(${bgImage})`,
    }),
    []
  );

  return (
    <div className="app-backdrop" style={backdropStyle}>
      {layoutMode === "studio" ? (
        <Suspense
          fallback={
            <div className="min-h-screen bg-[--bg-primary] text-white flex items-center justify-center">
              Loading studio workspace…
            </div>
          }
        >
          <StudioLayout {...sharedProps} />
        </Suspense>
      ) : (
        <Suspense
          fallback={
            <div className="min-h-screen bg-[--bg-primary] text-white flex items-center justify-center">
              Loading Notelooms…
            </div>
          }
        >
          <ClassicLayout {...sharedProps} />
        </Suspense>
      )}
      
      {/* Session History Modal */}
      <Suspense fallback={null}>
        <SessionHistory
          isOpen={isSessionHistoryOpen}
          onClose={() => setIsSessionHistoryOpen(false)}
          onLoadSession={handleLoadSession}
          currentSessionId={currentSessionId}
        />
      </Suspense>
    </div>
  );
}

export default App;