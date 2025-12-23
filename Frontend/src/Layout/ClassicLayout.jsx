import { motion, AnimatePresence } from "framer-motion";
import { Suspense, lazy } from "react";
import { Toaster } from 'react-hot-toast';
import { IconChat, IconClose, IconArchive } from "../utils/icons";
import DownloadButtons from "../Reusable/DownloadButtons";
import ConfirmationModal from "../Reusable/ConfirmationModal";
import MobileMenu from "../Reusable/MobileMenu";
import DesktopNavigation from "../Reusable/DesktopNavigation";
import ContentSections from "../Reusable/ContentSections";
import axios from "axios";
import { endpoint } from "../utils/api";

// Lazy-load heavier components to keep the initial classic view light
const Chatbot = lazy(() => import("../Components/Chatbot"));
const PreviewModalDesktop = lazy(() =>
  import("../Reusable/PreviewModalDesktop")
);
const FloatingChatButton = ({ isChatbotVisible, setIsChatbotVisible }) => (
  <AnimatePresence>
    <motion.button
      onClick={() => setIsChatbotVisible(!isChatbotVisible)}
      className="fixed w-14 h-14 rounded-full glass-button flex items-center justify-center shadow-lg z-50 right-4"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)', right: '1rem' }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title="Chat with AI"
    >
      <IconChat className="w-6 h-6" />
    </motion.button>
  </AnimatePresence>
);

const ClassicLayout = (props) => {
  const {
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
    setPreviewFiles,
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
    handleDownload,
    handleReset,
    handleConfirm,
    handleCancel,
    speakText,
    stopSpeaking,
    updateCurrentContent,
    addMoreFilesInputRef,
    isSessionHistoryOpen,
    setIsSessionHistoryOpen,
    handleSaveSession,
  } = props;

  return (
    <div className="relative min-h-screen bg-[--bg-primary]">
      <input
        type="file"
        ref={addMoreFilesInputRef}
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg"
        multiple
        aria-hidden="true"
        onChange={(event) => {
          const files = event.target.files ? Array.from(event.target.files) : [];
          if (files.length) {
            handleFileSelect(files);
          }
          event.target.value = "";
        }}
      />

      {/* Chatbot */}
      <AnimatePresence>
        {isChatbotVisible && (
          <Suspense fallback={null}>
            <motion.div
              className="fixed bottom-24 left-4 right-4 lg:right-6 lg:left-auto w-auto lg:w-96 max-w-[calc(100vw-2rem)] lg:max-w-[calc(100vw-3rem)] z-40"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <Chatbot 
                content={currentContent} 
                onClose={() => setIsChatbotVisible(false)}
              />
            </motion.div>
          </Suspense>
        )}
      </AnimatePresence>

      <FloatingChatButton 
        isChatbotVisible={isChatbotVisible}
        setIsChatbotVisible={setIsChatbotVisible}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <header className={`glass shadow-xl py-4`}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h1 className="text-4xl sm:text-5xl font-bold text-[--accent-primary] leading-tight">
                  NOTELOOMS
                </h1>
                <p className="text-sm sm:text-base text-[--text-secondary] mt-1">
                  Transform your content into AI-powered study tools
                </p>
              </div>
              <div className="flex gap-3 items-center">
                <button
                  onClick={() => setIsSessionHistoryOpen(true)}
                  className="px-5 py-2 text-sm rounded-lg font-medium glass-button text-white transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap flex items-center gap-2"
                  title="View Session History"
                >
                  <IconArchive className="w-4 h-4" />
                  <span className="hidden sm:inline">History</span>
                </button>
                {uploadedFiles.length > 0 && (
                  <button
                    onClick={handleSaveSession}
                    className="px-5 py-2 text-sm rounded-lg font-medium glass-button text-white transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap flex items-center gap-2"
                    title="Save Current Session"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="hidden sm:inline">Save</span>
                  </button>
                )}
                <button
                  onClick={() => setLayoutMode("studio")}
                  className="hidden lg:block px-5 py-2 text-sm rounded-lg font-medium glass-button text-white transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                >
                  Studio Mode
                </button>
                <button
                  onClick={handleReset}
                  className="px-5 py-2 text-sm rounded-lg font-medium bg-[--error-color] text-white hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-6 py-8 pb-24 lg:pb-8">
          {/* Mobile Hamburger Menu */}
          <div className="fixed left-4 z-50 lg:hidden" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}>
            <motion.button
              onClick={() =>
                setMobileTab(mobileTab === "menu" ? "chat" : "menu")
              }
              className="w-14 h-14 rounded-full glass-button flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {mobileTab === "menu" ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </motion.button>
          </div>

          <MobileMenu 
            mobileTab={mobileTab}
            setMobileTab={setMobileTab}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />

          <DesktopNavigation 
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />

          {/* Content Sections */}
          <ContentSections
            isLoading={isLoading}
            error={error}
            uploadedFiles={uploadedFiles}
            currentContent={currentContent}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            isSpeaking={isSpeaking}
            speakText={speakText}
            stopSpeaking={stopSpeaking}
            handleDownload={handleDownload}
            handleFileSelect={handleFileSelect}
            selectedFileIndex={selectedFileIndex}
            setSelectedFileIndex={setSelectedFileIndex}
            handleUploadedFileClick={handleUploadedFileClick}
            handleReset={handleReset}
            numFlashcards={numFlashcards}
            setNumFlashcards={setNumFlashcards}
            numQuestions={numQuestions}
            setNumQuestions={setNumQuestions}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            updateCurrentContent={updateCurrentContent}
            setUploadedFiles={props.setUploadedFiles}
          />

          {/* File Preview Modal for Desktop */}
          <Suspense fallback={null}>
            <PreviewModalDesktop
              isOpen={isPreviewModalOpen}
              previewFiles={previewFiles}
              setPreviewFiles={setPreviewFiles}
              handleRemovePreviewFile={handleRemovePreviewFile}
              handleAddMoreFiles={handleAddMoreFiles}
              handleFileUpload={handleFileUpload}
              isLoading={isLoading}
              onClose={() => setIsPreviewModalOpen(false)}
            />
          </Suspense>

          <ConfirmationModal
            showConfirmModal={showConfirmModal}
            confirmMessage={confirmMessage}
            handleConfirm={handleConfirm}
            handleCancel={handleCancel}
          />
        </main>
      </motion.div>
    </div>
  );
};

export default ClassicLayout;