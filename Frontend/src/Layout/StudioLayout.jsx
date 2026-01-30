import { Suspense, lazy } from "react";
import { Toaster } from 'react-hot-toast';
import { IconFolder, IconChat, IconExport, IconReset, IconArchive } from "../utils/icons";
import FileUploader from "../Components/FileUploader";
import SourcePreview from "../Reusable/SourcePreview";
import ConfirmationModal from "../Reusable/ConfirmationModal";
import MobileNavigation from "../Reusable/MobileNavigation";

const Chatbot = lazy(() => import("../Components/Chatbot"));
const StudioPanel = lazy(() => import("../Components/StudioPanel"));
const PreviewModal = lazy(() => import("../Reusable/PreviewModal"));

const StudioLayout = (props) => {
  const {
    uploadedFiles,
    selectedFileIndex,
    mobileTab,
    setMobileTab,
    layoutMode,
    setLayoutMode,
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
    handleReset,
    handleConfirm,
    handleCancel,
    showConfirmation,
    activeOutput,
    isGenerating,
    setIsGenerating,
    setActiveOutput,
    speakText,
    updateCurrentContent,
    numQuestions,
    setNumQuestions,
    numFlashcards,
    setNumFlashcards,
    addMoreFilesInputRef,
    isLoading,
    isMobile,
    isSessionHistoryOpen,
    setIsSessionHistoryOpen,
    handleSaveSession,
  } = props;

  return (
    <div className="min-h-screen bg-transparent flex flex-col lg:flex-row relative pb-16 lg:pb-0">
      <Toaster position="bottom-left" />
      
      {/* Hidden file input for Add More Files button */}
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
      
      <MobileNavigation mobileTab={mobileTab} setMobileTab={setMobileTab} />

      {/* Sources Panel */}
      <aside
        className={`w-full lg:w-[400px] min-w-[350px] p-4 space-y-4 border-r border-[--border-color] overflow-y-auto lg:h-screen bg-[--bg-primary]/50 ${mobileTab !== 'sources' ? 'hidden lg:block' : 'block'}`}
      >
        <div className="mb-6 sticky top-0 bg-[--bg-primary]/95 pb-4 z-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-[--text-primary]">Sources</h2>
            <button
              type="button"
              onClick={() => setLayoutMode(prev => prev === 'classic' ? 'modern' : 'classic')}
              className="px-3 py-1.5 rounded-lg glass-button text-xs flex items-center gap-1.5 active:scale-95 transition-transform duration-150"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{layoutMode === 'classic' ? 'Modern' : 'Classic'}</span>
            </button>
          </div>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <IconFolder className="w-5 h-5 text-[--accent-primary]" />
              <h2 className="text-lg font-semibold text-[--text-primary]">Sources</h2>
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <FileUploader
            onFileUpload={handleFileSelect}
            multiple={true}
          />
          {uploadedFiles.length > 0 && (
            <button
              type="button"
              onClick={handleAddMoreFiles}
              className="w-full px-4 py-2 rounded-lg font-semibold bg-[#0b1e70] text-white transition-colors duration-200 hover:bg-white hover:text-black active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add More Files
            </button>
          )}
          {uploadedFiles.length > 0 && (
            <div className="mt-2">
              <div className="text-xs font-medium text-[--text-secondary] mb-1.5 px-1">
                Uploaded files ({uploadedFiles.length})
              </div>
              <div className="space-y-2 pr-1">
                {uploadedFiles.map((file, index) => (
                  <SourcePreview 
                    key={index} 
                    file={file} 
                    index={index}
                    selectedFileIndex={selectedFileIndex}
                    handleUploadedFileClick={handleUploadedFileClick}
                    isMobile={isMobile}
                    layoutMode={layoutMode}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        {uploadedFiles.length === 0 && (
          <div className="text-center mt-8 py-8">
            <IconFolder className="w-12 h-12 text-[--text-tertiary] mx-auto mb-3 opacity-50" />
            <p className="text-[--text-tertiary] text-sm">Upload content to start</p>
          </div>
        )}
      </aside>

      {/* Chat Panel */}
      <main className={`flex-1 flex flex-col border-r border-[--border-color] bg-[--bg-primary]/30 ${mobileTab !== 'chat' ? 'hidden lg:flex' : 'flex'}`}>
        <header className="glass p-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar">
            <IconChat className="w-5 h-5 text-[--accent-primary]" />
            <h1 className="text-xl font-bold text-[--accent-primary]">Chat</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSessionHistoryOpen(true)}
              className="px-2.5 py-1 rounded-lg glass-button text-xs text-white flex items-center gap-1 hover:shadow transition-colors duration-200 active:scale-95"
              title="View Session History"
            >
              <IconArchive className="w-3 h-3" />
              <span className="hidden sm:inline">History</span>
            </button>
            {uploadedFiles.length > 0 && (
              <button
                type="button"
                onClick={handleSaveSession}
                className="px-2.5 py-1 rounded-lg glass-button text-xs text-white flex items-center gap-1 hover:shadow transition-colors duration-200 active:scale-95"
                title="Save Current Session"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="hidden sm:inline">Save</span>
              </button>
            )}
            <div className="relative">
              <select 
                onChange={(e) => {
                  if (e.target.value) {
                    handleExport(activeOutput?.type || 'summary', e.target.value, activeOutput?.data || currentContent);
                    e.target.value = '';
                  }
                }}
                className="px-2.5 py-1 pr-8 rounded-lg glass text-xs text-white border border-[--border-color] hover:border-[--accent-primary] transition-all duration-200 cursor-pointer appearance-none"
              >
                <option value="">Export</option>
                <option value="docx">DOCX</option>
                <option value="pdf">PDF</option>
                <option value="ppt">PPT</option>
              </select>
              <IconExport className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/80 pointer-events-none" />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (handleReset) handleReset();
                else if (import.meta.env.DEV) console.error("handleReset is not defined");
              }}
              className="px-2.5 py-1 rounded-lg glass-button text-xs text-white flex items-center gap-1 hover:shadow transition-colors duration-200 active:scale-95"
            >
              <IconReset className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </header>
        <div className="flex-1 p-4 overflow-hidden flex flex-col relative">
          <div className="flex-1 overflow-hidden mb-4 relative z-10">
            <Suspense fallback={<div className="flex items-center justify-center py-8 text-[--text-secondary] text-sm">Loading chat…</div>}>
              <Chatbot
                content={currentContent}
                onClose={() => {}}
              />
            </Suspense>
          </div>

          {previewFiles.length > 0 && !isPreviewModalOpen && (
            <div className="fixed bottom-20 left-2 right-2 z-30 sm:left-4 sm:right-4">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(true)}
                className="w-full px-3 py-2 rounded-xl glass-button text-white font-medium text-xs shadow-lg hover:shadow-xl transition-colors duration-200 flex items-center justify-center gap-1 active:scale-[0.98]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Files ({previewFiles.length})
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Studio Panel */}
      <aside
        className={`hidden lg:flex w-full lg:w-[400px] min-w-[350px] max-w-[400px] p-4 lg:h-screen border-t lg:border-t-0 lg:border-l border-[--border-color] bg-[--bg-primary]/50 flex-col`}
      >
        <Suspense fallback={<div className="flex items-center justify-center py-8 text-[--text-secondary] text-sm">Loading panel…</div>}>
          <StudioPanel
            currentContent={currentContent}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            setActiveOutput={setActiveOutput}
            activeOutput={activeOutput}
            handleExport={handleExport}
            speakText={speakText}
            updateCurrentContent={updateCurrentContent}
            mode={layoutMode}
            setMode={setLayoutMode}
            numQuestions={numQuestions}
            setNumQuestions={setNumQuestions}
            numFlashcards={numFlashcards}
            setNumFlashcards={setNumFlashcards}
          />
        </Suspense>
      </aside>

      {/* Preview Modal */}
      <Suspense fallback={null}>
        <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        previewFiles={previewFiles}
        handleRemovePreviewFile={handleRemovePreviewFile}
        handleAddMoreFiles={handleAddMoreFiles}
        handleFileUpload={handleFileUpload}
        isLoading={isLoading}
      />
      </Suspense>

      <ConfirmationModal
        showConfirmModal={showConfirmModal}
        confirmMessage={confirmMessage}
        handleConfirm={handleConfirm}
        handleCancel={handleCancel}
      />
    </div>
  );
};

export default StudioLayout;