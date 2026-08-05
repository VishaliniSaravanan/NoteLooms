import { useState, useEffect, useMemo } from "react";

export default function DocumentViewer({ currentContent }) {
  const [viewMode, setViewMode] = useState("pdf"); // 'pdf' or 'text'
  const [searchQuery, setSearchQuery] = useState("");
  const [speechRate, setSpeechRate] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const rawText = currentContent?.raw_text || currentContent?.extracted_text || "";
  const filename = currentContent?.filename || "Uploaded Document";
  const fileObj = currentContent?.sourceMeta?.file;
  const previewUrl = currentContent?.sourceMeta?.previewUrl;

  const pdfUrl = useMemo(() => {
    if (previewUrl) return previewUrl;
    if (fileObj instanceof File && (fileObj.type === "application/pdf" || fileObj.name.toLowerCase().endsWith(".pdf"))) {
      return URL.createObjectURL(fileObj);
    }
    return null;
  }, [fileObj, previewUrl]);

  useEffect(() => {
    return () => {
      if (pdfUrl && pdfUrl.startsWith("blob:") && !previewUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      window.speechSynthesis.cancel();
    };
  }, [pdfUrl, previewUrl]);

  const handlePlayAudio = () => {
    if (!rawText) return;
    window.speechSynthesis.cancel();

    const textToRead = rawText.slice(0, 5000);
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = speechRate;

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePauseResume = () => {
    if (window.speechSynthesis.speaking) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    }
  };

  const handleStopAudio = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const renderContentWithHighlights = () => {
    if (!rawText) return <p className="text-[--text-secondary]">No text content available to display.</p>;

    const paragraphs = rawText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

    return paragraphs.map((para, pIdx) => {
      if (!searchQuery.trim()) {
        return (
          <p key={pIdx} className="mb-4 leading-relaxed text-[--text-primary]">
            {para}
          </p>
        );
      }

      const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = para.split(regex);

      return (
        <p key={pIdx} className="mb-4 leading-relaxed text-[--text-primary]">
          {parts.map((part, i) =>
            part.toLowerCase() === searchQuery.toLowerCase() ? (
              <mark key={i} className="bg-amber-300 text-black px-1 rounded font-semibold">
                {part}
              </mark>
            ) : (
              part
            )
          )}
        </p>
      );
    });
  };

  return (
    <div className="card space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[--border-color] pb-4">
        <div>
          <h2 className="text-2xl font-semibold text-[--accent-primary]">
            Source Document Viewer
          </h2>
          <p className="text-sm text-[--text-secondary] mt-1 truncate max-w-md">
            {filename}
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-[--bg-secondary] p-1.5 rounded-xl border border-[--border-color]">
          <button
            onClick={() => setViewMode("pdf")}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === "pdf"
                ? "bg-[--accent-primary] text-black shadow"
                : "text-[--text-secondary] hover:text-[--text-primary]"
            }`}
          >
            PDF View
          </button>
          <button
            onClick={() => setViewMode("text")}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === "text"
                ? "bg-[--accent-primary] text-black shadow"
                : "text-[--text-secondary] hover:text-[--text-primary]"
            }`}
          >
            Text & Audio
          </button>
        </div>
      </div>

      {/* Mode 1: PDF Embed View */}
      {viewMode === "pdf" && (
        <div className="w-full">
          {pdfUrl ? (
            <div className="w-full rounded-2xl overflow-hidden shadow-2xl border border-[--border-color] bg-gray-900">
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-[450px] sm:h-[650px] border-0"
                title={`PDF Viewer - ${filename}`}
              />
            </div>
          ) : currentContent?.base64_image ? (
            <div className="flex justify-center p-4 bg-gray-900 rounded-2xl border border-[--border-color]">
              <img
                src={currentContent.base64_image}
                alt="Document Image"
                className="max-h-[400px] sm:max-h-[600px] object-contain rounded-lg"
              />
            </div>
          ) : (
            <div className="p-8 sm:p-12 text-center bg-[--bg-secondary] rounded-2xl border border-[--border-color] space-y-3">
              <p className="text-sm sm:text-base text-[--text-secondary]">
                Direct PDF preview is available for uploaded PDF files.
              </p>
              <button
                onClick={() => setViewMode("text")}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[--accent-primary] text-black hover:opacity-90 transition-all shadow"
              >
                Switch to Extracted Text View
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Searchable Text & Audio Reader View */}
      {viewMode === "text" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[--bg-secondary] p-3 rounded-xl border border-[--border-color]">
            {/* Audio Controls */}
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-start gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-[--text-secondary] px-1">
                Audio Reader:
              </span>
              {!isPlaying ? (
                <button
                  onClick={handlePlayAudio}
                  disabled={!rawText}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow disabled:opacity-50"
                >
                  Play Audio
                </button>
              ) : (
                <>
                  <button
                    onClick={handlePauseResume}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white transition-all shadow"
                  >
                    {isPaused ? "Resume" : "Pause"}
                  </button>
                  <button
                    onClick={handleStopAudio}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-500 text-white transition-all shadow"
                  >
                    Stop
                  </button>
                </>
              )}

              <select
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="bg-[--bg-primary] text-xs text-[--text-primary] border border-[--border-color] rounded-lg px-2 py-1.5 focus:outline-none"
                title="Reading Speed"
              >
                <option value={1}>1.0x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2.0x</option>
              </select>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Highlight keywords..."
                className="w-full px-3 py-1.5 rounded-lg bg-[--bg-primary] text-[--text-primary] border border-[--border-color] focus:outline-none text-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1.5 text-xs text-[--text-secondary] hover:text-[--text-primary]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto p-4 rounded-xl bg-[--bg-secondary] border border-[--border-color] font-mono text-sm leading-relaxed whitespace-pre-wrap selection:bg-amber-400 selection:text-black">
            {renderContentWithHighlights()}
          </div>
        </div>
      )}
    </div>
  );
}
