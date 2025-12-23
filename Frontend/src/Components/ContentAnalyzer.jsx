import React, { useState } from "react";
import { motion } from "framer-motion";

function FileUploader({ onFileUpload }) {
  const [dragActive, setDragActive] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleYoutubeSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!youtubeUrl.trim()) {
      setError("Please enter a YouTube URL.");
      return;
    }

    const youtubeRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([0-9A-Za-z_-]{11})/;
    if (!youtubeRegex.test(youtubeUrl)) {
      setError("Invalid YouTube URL. Please use a valid YouTube video link.");
      return;
    }

    setIsLoading(true);
    onFileUpload(youtubeUrl);
    setYoutubeUrl("");
    setIsLoading(false);
  };

  return (
    <motion.div
      className="space-y-6 max-w-xl mx-auto p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className={`p-10 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all duration-300 ${
          dragActive
            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
            : 'border-[--border-color] text-[--text-secondary] hover:border-blue-500 hover:bg-blue-500/5'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
      >
        <input
          type="file"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleChange}
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center space-y-3">
          <motion.div
            className="text-4xl"
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            📁
          </motion.div>
          <div>
            <p className="font-medium">Drag & drop or click to upload</p>
            <p className="text-sm text-[--text-secondary] mt-1">Supports PDF, PNG, JPG, JPEG</p>
          </div>
        </label>
      </motion.div>

      <form onSubmit={handleYoutubeSubmit} className="flex flex-col items-center space-y-3">
        <input
          type="text"
          value={youtubeUrl}
          onChange={(e) => {
            setYoutubeUrl(e.target.value);
            setError("");
          }}
          placeholder="Paste YouTube URL here"
          className={`w-full border border-[--border-color] rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[--card-bg] text-[--text-primary] placeholder-[--text-secondary] transition-all duration-200 ${error ? 'border-red-500' : ''}`}
          disabled={isLoading}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <motion.button
          type="submit"
          className={`px-6 py-3 rounded-full font-medium text-white glass-button transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1 disabled:opacity-50`}
          disabled={isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isLoading ? "Processing..." : "Analyze YouTube Video"}
        </motion.button>
      </form>
    </motion.div>
  );
}

export default FileUploader;