import { motion, AnimatePresence } from "framer-motion";
import { IconClose, IconLoading } from "../utils/icons";

const PreviewModal = ({ isOpen, onClose, previewFiles, handleRemovePreviewFile, handleAddMoreFiles, handleFileUpload, isLoading }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md h-[90vh] bg-[--bg-primary] rounded-2xl overflow-y-auto p-4 relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/20 text-white hover:bg-black/30 transition-colors z-10"
              aria-label="Close preview"
            >
              <IconClose className="w-5 h-5" />
            </button>
            <div className="space-y-4">
              {previewFiles.map((file, index) => (
                <div key={index} className="bg-[--bg-secondary] rounded-lg p-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-[--text-primary] truncate max-w-[80%]">
                      {file.name || 'Preview'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePreviewFile(index);
                      }}
                      className="text-red-500 hover:text-red-400 transition-colors p-0.5"
                    >
                      <IconClose className="w-3 h-3" />  
                    </button>
                  </div>
                  <div className="w-full h-64 bg-[--bg-primary] rounded-lg overflow-hidden flex items-center justify-center">   
                    {file.type?.startsWith('image/') ? (
                      <img
                        src={file.preview || URL.createObjectURL(file)}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : file.type === 'application/pdf' ? (
                      <div className="w-full h-full flex items-center justify-center bg-white">
                        <svg className="w-16 h-16 text-[--text-tertiary]" fill="currentColor" viewBox="0 0 24 24">  
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
            <div className="mt-4 flex gap-2 p-2 bg-[--bg-secondary] rounded-lg">
              <button
                type="button"
                onClick={handleAddMoreFiles}
                className="flex-1 px-3 py-1.5 rounded text-xs font-semibold bg-[#0b1e70] text-white transition-colors duration-200 hover:bg-white hover:text-black active:scale-[0.98]"
              >
                Add More
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleFileUpload();
                  onClose();
                }}
                className="flex-1 px-3 py-1.5 rounded text-xs bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin"><IconLoading className="w-3 h-3" /></span>
                    <span>Uploading...</span>
                  </>
                ) : 'Upload All'}
              </button>
            </div>
            {isLoading ? (
              <div className="text-xs text-blue-500 text-center mt-2 flex items-center justify-center gap-2">
                <span className="animate-spin"><IconLoading className="w-3 h-3" /></span>
                <span>Processing files...</span>
              </div>
            ) : (
              <p className="text-xs text-[--text-secondary] text-center mt-2">Swipe to scroll • Tap outside to close</p>
            )}  
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PreviewModal;