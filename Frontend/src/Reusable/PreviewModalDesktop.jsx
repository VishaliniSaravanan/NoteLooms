import { motion, AnimatePresence } from "framer-motion";
import { IconClose, IconLoading } from "../utils/icons";

const PreviewModalDesktop = ({
  isOpen,
  previewFiles,
  setPreviewFiles,
  handleRemovePreviewFile,
  handleAddMoreFiles,
  handleFileUpload,
  isLoading,
  onClose,
  isChatbotVisible = false,
  mobileTab = 'chat',
}) => {
  // When uploading, show a slim status bar just above the mobile navigation buttons
  // Positioned above chat and menu icons on mobile, at bottom on desktop
  // Hide when chat box or hamburger menu is opened (instead of moving it)
  if (isLoading && previewFiles.length > 0) {
    // Check if chat or menu is open - hide the message if either is open
    const isMenuOpen = mobileTab === 'menu';
    const isChatOpen = isChatbotVisible;
    
    // Hide the message when menu or chat is open on mobile
    if ((isMenuOpen || isChatOpen) && typeof window !== 'undefined' && window.innerWidth < 1024) {
      return null;
    }
    
    return (
      <div
        className="fixed left-1/2 -translate-x-1/2 z-40 px-2"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)' }}
      >
        <div className="glass rounded-lg px-2.5 py-1.5 flex items-center gap-2 max-w-[200px] text-[--text-primary] border border-[--border-color]">
          <span className="animate-spin flex-shrink-0">
            <IconLoading className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs truncate">Uploading…</span>
        </div>
      </div>
    );
  }

  if (!isOpen || previewFiles.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          if (onClose) {
            onClose();
          } else {
            setPreviewFiles([]);
          }
        }}
      >
        <motion.div
          className="w-full max-w-4xl h-[80vh] bg-[--bg-primary] rounded-2xl overflow-hidden flex flex-col"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-[--border-color] flex justify-between items-center">
            <h3 className="text-lg font-semibold text-[--text-primary]">
              File Preview ({previewFiles.length} files)
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onClose) {
                  onClose();
                } else {
                  setPreviewFiles([]);
                }
              }}
              className="p-2 rounded-lg hover:bg-[--hover-bg] transition-colors"
              aria-label="Close preview"
            >
              <IconClose className="w-5 h-5 text-[--text-secondary]" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {previewFiles.map((file, index) => (
                <div key={index} className="bg-[--bg-secondary] rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-[--text-primary] truncate">
                      {file.name || 'Preview'}
                    </span>
                    <button
                      onClick={() => handleRemovePreviewFile(index)}
                      className="text-red-500 hover:text-red-400 transition-colors p-1"
                    >
                      <IconClose className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="w-full h-48 bg-[--bg-primary] rounded-lg overflow-hidden flex items-center justify-center">
                    {file.type?.startsWith('image/') ? (
                      <img
                        src={file.preview || URL.createObjectURL(file)}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : file.type === 'application/pdf' ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-[--text-tertiary]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                        </svg>
                      </div>
                    ) : (
                      <p className="text-center text-[--text-secondary]">Preview Unavailable</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 border-t border-[--border-color] flex flex-col gap-3">
            {isLoading && (
              <div className="text-sm text-blue-500 text-center flex items-center justify-center gap-2 py-1">
                <span className="animate-spin"><IconLoading className="w-4 h-4" /></span>
                <span>Processing your files. This may take a moment...</span>
              </div>
            )}
            <div className="flex gap-3">
              <motion.button
                onClick={handleAddMoreFiles}
                className="flex-1 px-4 py-2 rounded-lg font-semibold bg-[#0b1e70] text-white transition-colors duration-200 hover:bg-white hover:text-black active:bg-white active:text-black focus:bg-white focus:text-black"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Add More Files
              </motion.button>
              <motion.button
                onClick={async () => {
                  await handleFileUpload();
                  if (onClose) {
                    onClose();
                  } else {
                    setPreviewFiles([]);
                  }
                }}
                className="flex-1 px-4 py-2 rounded-lg glass-button text-white font-medium hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin"><IconLoading className="w-4 h-4" /></span>
                    <span>Uploading...</span>
                  </>
                ) : 'Upload All'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PreviewModalDesktop;