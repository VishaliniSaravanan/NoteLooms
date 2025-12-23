import { useState } from "react";

const useAppState = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState({ summary: false, notes: false, image_description: false });
  const [activeSection, setActiveSection] = useState("summary");
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);
  const [layoutMode, setLayoutMode] = useState("classic");
  const [activeOutput, setActiveOutput] = useState(null);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [numFlashcards, setNumFlashcards] = useState(10);
  const [numQuestions, setNumQuestions] = useState(10);
  const [isGenerating, setIsGenerating] = useState({ notes: false, flashcards: false, mcqs: false, summary: false, image_description: false });
  const [previews, setPreviews] = useState({});
  const [mobileTab, setMobileTab] = useState('chat');
  const [previewFiles, setPreviewFiles] = useState([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPreviewMinimized, setIsPreviewMinimized] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  return {
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
  };
};

export default useAppState;