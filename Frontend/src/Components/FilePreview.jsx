import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

function FilePreview({ files, onRemove, onConfirm, onAddMore, isLoading = false, error = null, mode = "classic" }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Control visibility to prevent popping
  useEffect(() => {
    if (files && files.length > 0) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [files]);

  if (!files || files.length === 0) return null;

  const selectedFile = files[selectedFileIndex];

  const resolveFileUrl = (file) => {
    if (file.preview) return { url: file.preview, revoke: false };
    if (file.url) return { url: file.url, revoke: false };
    if (file.file instanceof File) {
      const blobUrl = URL.createObjectURL(file.file);
      return { url: blobUrl, revoke: true };
    }
    return { url: null, revoke: false };
  };

  const handleOpenFile = (file) => {
    const { url, revoke } = resolveFileUrl(file);
    if (!url) return;
    const tab = window.open(url, '_blank', 'noopener,noreferrer');
    if (revoke) {
      if (tab) {
        tab.onload = () => URL.revokeObjectURL(url);
      } else {
        URL.revokeObjectURL(url);
      }
    }
  };

  const getFileName = (file) => file.name || 'Unknown File';

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (file) => {
    const ext = file.name ? file.name.split('.').pop().toLowerCase() : '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return (
        <svg className="w-5 h-5 text-[--accent-primary]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (['pdf'].includes(ext)) {
      return (
        <svg className="w-5 h-5 text-[--accent-primary]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-[--text-secondary]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const renderFileViewer = (file) => {
    if (!file) return null;
    const fileType =
      file.type ||
      file.file?.type ||
      (file.name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : '');
    const isImage = fileType?.startsWith('image/');
    const isPdf =
      fileType === 'application/pdf' ||
      file.name?.toLowerCase().endsWith('.pdf');
    const previewSrc = file.preview;

    if (isImage && previewSrc) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-[--bg-secondary]">
          <img 
            src={previewSrc} 
            alt={file.name} 
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      );
    } else if (isPdf && previewSrc) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-[--bg-secondary]">
          <iframe src={previewSrc} className="w-full h-full" title={file.name} />
        </div>
      );
    } else {
      return (
        <div className="w-full h-full flex items-center justify-center text-[--text-primary] bg-[--bg-secondary]">
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-[--hover-bg] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-[--text-tertiary]">?</span>
            </div>
            <p className="text-lg font-medium mb-2">Preview not available</p>
            <p className="text-sm text-[--text-secondary] mb-4">for {getFileName(file)}</p>
            <button
              onClick={() => handleOpenFile(file)}
              className="px-6 py-2 glass-button text-white rounded-lg hover:shadow-md text-sm font-medium transition-all duration-200"
            >
              Open in new tab
            </button>
          </div>
        </div>
      );
    }
  };

  const ExternalLinkIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );

  const CloseIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative z-50 p-4" // Changed from fixed to relative, removed bottom positioning
          >
            <div className="glass rounded-xl shadow-2xl p-4 space-y-3 border border-[--border-color] backdrop-blur-lg">
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[--text-primary]">Uploaded Files ({files.length})</h3>
                <button
                  onClick={() => setIsVisible(false)}
                  className="p-1 rounded-full hover:bg-[--hover-bg] transition-colors"
                >
                  <CloseIcon className="w-5 h-5 text-[--text-secondary]" />
                </button>
              </div>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="relative group">
                    <motion.button
                      onClick={() => setSelectedFileIndex(index)}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-[--bg-secondary] hover:bg-[--hover-bg] transition-colors border border-[--border-color] group"
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getFileIcon(file)}
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium text-[--text-primary] truncate">
                            {getFileName(file)}
                          </p>
                          {file.size && (
                            <p className="text-xs text-[--text-secondary] mt-0.5">
                              {formatFileSize(file.size)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFile(file);
                          }}
                          className="p-1.5 rounded-full hover:bg-[--accent-primary]/10 text-[--accent-primary] opacity-0 group-hover:opacity-100 transition-all duration-200"
                          title="Preview file"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <ExternalLinkIcon className="w-4 h-4 text-[--text-secondary] flex-shrink-0" />
                      </div>
                    </motion.button>
                    {/* X button for mobile file removal */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(index);
                      }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-md"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 h-48">
                {selectedFile && renderFileViewer(selectedFile)}
              </div>

              <div className="pt-2 flex gap-3">
                {onAddMore && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-3 px-4 rounded-lg text-sm font-medium text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-300 hover:border-blue-600 transition-all duration-200 flex items-center justify-center gap-2 group"
                  >
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add More
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      onAddMore(Array.from(e.target.files));
                    }
                  }}
                  className="hidden"
                  multiple
                />
                <button
                  onClick={() => onConfirm && onConfirm()}
                  disabled={isLoading}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium glass-button text-white hover:shadow-md transition-all duration-200 ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Uploading...' : 'Upload All'}
                </button>
              </div>

              {/* Mobile Menu Hint */}
              {onConfirm && !isLoading && (
                <div className="mt-2 text-center">
                  <p className="text-xs text-[--text-secondary]">
                    More features available in the <span className="font-medium text-[--accent-primary]">menu</span> 
                    <svg 
                      className="inline-block w-4 h-4 ml-1 -mt-1 text-[--accent-primary] animate-bounce" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // DESKTOP - Rest of the code remains the same...
  return (
    <motion.div
      className="glass rounded-xl border border-[--border-color] overflow-hidden flex flex-col shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ maxHeight: '500px', height: 'auto' }}
    >
      {/* Header */}
      <div className="py-2 px-3 flex items-center justify-between border-b border-[--border-color] bg-[--bg-secondary]">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-[--hover-bg] transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.svg
              className="w-5 h-5 text-[--accent-primary]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </motion.svg>
          </motion.button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[--text-primary]">
              File Preview
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[--accent-primary]/20 text-[--accent-primary] text-xs font-medium">
              {files.length} {files.length === 1 ? "file" : "files"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onAddMore && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-4 py-2 rounded-lg text-blue-600 hover:text-white bg-white hover:bg-blue-600 text-sm font-medium border border-blue-300 hover:border-blue-600 transition-all duration-200 flex items-center gap-2 group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Files
            </motion.button>
          )}
          {onConfirm && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                if (onConfirm && !isLoading) {
                  onConfirm();
                }
              }}
              disabled={isLoading || files.length === 0}
              className={`px-4 py-2 rounded-lg glass-button text-white text-sm font-medium hover:shadow-md transition-all duration-200 flex items-center gap-2 ${
                isLoading || files.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              whileHover={!isLoading && files.length > 0 ? { scale: 1.05 } : {}}
              whileTap={!isLoading && files.length > 0 ? { scale: 0.95 } : {}}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                'Upload All'
              )}
            </motion.button>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 250, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-r border-[--border-color] overflow-y-auto bg-[--bg-primary] flex flex-col"
            >
              <div className="p-3 space-y-2 flex-1">
                {files.map((file, index) => {
                  const isSelected = selectedFileIndex === index;
                  const textColor = mode === 'classic' ? 'text-[--text-primary]' : 'text-white';
                  const textColorMuted = mode === 'classic' ? 'text-[--text-secondary]' : 'text-white/70';
                  
                  return (
                  <motion.button
                    key={index}
                    onClick={() => setSelectedFileIndex(index)}
                    className={`w-full p-3 rounded-lg flex items-center gap-3 text-left transition-all ${textColor} ${
                      isSelected
                        ? 'bg-[--accent-primary] text-white'
                        : 'hover:bg-[--hover-bg]'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex-shrink-0">
                      {getFileIcon(file)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : textColor}`}>
                          {getFileName(file)}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFile(file);
                          }}
                          className={`p-1 rounded-full hover:bg-opacity-20 ${
                            isSelected ? 'text-white/70 hover:bg-white/20' : 'text-[--text-secondary] hover:bg-[--accent-primary]/10 hover:text-[--accent-primary]'
                          } transition-colors`}
                          title="Preview file"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                      {file.size && (
                        <p className={`text-xs mt-1 ${isSelected ? 'text-white/70' : textColorMuted}`}>
                          {formatFileSize(file.size)}
                        </p>
                      )}
                    </div>
                    {onRemove && (
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(index);
                          if (selectedFileIndex === index) {
                            if (files.length === 1) {
                              setSelectedFileIndex(-1);
                            } else if (index > 0) {
                              setSelectedFileIndex(index - 1);
                            } else {
                              setSelectedFileIndex(0);
                            }
                          }
                        }}
                        className="flex-shrink-0 p-1.5 rounded-full bg-[--accent-primary]/20 hover:bg-[--accent-primary]/40 text-[--accent-primary] hover:text-[--accent-primary-dark] transition-all duration-200 border border-[--accent-primary]/30 hover:border-[--accent-primary]/50 shadow-sm hover:shadow-md"
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        title="Remove file"
                      >
                        <CloseIcon className="w-4 h-4" />
                      </motion.button>
                    )}
                  </motion.button>
                  );
                })}
              </div>

              {/* Desktop Menu Hint */}
              {files.length > 0 && (
                <div className="p-3 mt-2 text-center border-t border-[--border-color]">
                  <p className="text-xs text-[--text-secondary]">
                    More features in the <span className="font-medium text-[--accent-primary]">menu</span>
                    <svg 
                      className="inline-block w-4 h-4 ml-1 -mt-1 text-[--accent-primary]" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-auto bg-[--bg-primary]">
          {selectedFile ? (
            <div className="w-full h-full p-0">
              {renderFileViewer(selectedFile)}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[--text-secondary] bg-[--bg-secondary]">
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-[--hover-bg] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[--text-tertiary]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2z" />
                  </svg>
                </div>
                <p className="text-lg font-medium">Select a file to preview</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onAddMore(Array.from(e.target.files));
          }
        }}
        className="hidden"
        multiple
      />
    </motion.div>
  );
}

export default FilePreview;