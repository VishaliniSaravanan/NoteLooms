import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { IconYouTube } from "../utils/icons";

function FileUploader({ onFileUpload, multiple = false }) {
  const [dragActive, setDragActive] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      onFileUpload(files);
    }
  };

  const handleFileChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onFileUpload(files);
      // Reset input value to allow selecting the same file again
      e.target.value = "";
    }
  };

  const handleYoutubeSubmit = (e) => {
    e.preventDefault();
    if (youtubeUrl) {
      onFileUpload(youtubeUrl);
      setYoutubeUrl("");
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div
        className={`glass border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
          dragActive
            ? 'border-[--accent-primary]'
            : 'border-[--glass-border]'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,image/*"
          multiple={multiple}
        />
        {/* Separate input for camera to prevent attribute conflicts */}
        <input
          type="file"
          ref={cameraInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
          capture="environment"
        />
        <svg
          className="mx-auto h-12 w-12 text-[--text-secondary]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v5a4 4 0 01-4 4H7z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M16 12H8m4-4v8"
          />
        </svg>
        <p className="mt-4 text-lg text-[--text-secondary]">
          Drag or click to upload
        </p>
        <p className="text-sm text-[--text-tertiary]">
          Supports PDF, PNG, JPG, JPEG
        </p>
        <button
          onClick={onButtonClick}
          className={`mt-4 px-6 py-2 rounded-lg font-medium glass-button text-white transition-all duration-200 shadow-sm hover:shadow-md`}
        >
          Upload Files
        </button>
        <button
          type="button"
          onClick={handleCameraClick}
          className="mt-3 px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 shadow-sm hover:shadow-md w-full sm:w-auto block sm:hidden"
        >
          Take a Photo
        </button>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-[--text-secondary] mb-2">
          Or analyze a YouTube video
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-3 pr-12 rounded-lg glass border border-[--border-color] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[--accent-primary] focus:border-[--accent-primary] text-[--text-primary] placeholder:text-[--text-tertiary] text-sm"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && youtubeUrl.trim()) {
                  handleYoutubeSubmit(e);
                }
              }}
            />
            {youtubeUrl && (
              <button
                onClick={() => setYoutubeUrl("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[--text-tertiary] hover:text-[--text-primary] transition-colors"
                type="button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <motion.button
            onClick={handleYoutubeSubmit}
            disabled={!youtubeUrl.trim()}
            className={`px-5 py-3 rounded-lg font-medium text-white glass-button transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
            whileHover={youtubeUrl.trim() ? { scale: 1.05 } : {}}
            whileTap={youtubeUrl.trim() ? { scale: 0.95 } : {}}
          >
            <IconYouTube className="w-5 h-5" />
            <span className="text-sm font-semibold">Analyze</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default FileUploader;