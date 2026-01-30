import { motion } from "framer-motion";
import { lazy, Suspense } from "react";
import FileUploader from "../Components/FileUploader";
import DownloadButtons from "./DownloadButtons";
import axios from "axios";
import { endpoint } from "../utils/api";

// Lazy-load heavier, less frequently used sections to improve initial LCP
const FlashcardCarousel = lazy(() =>
  import("../Components/FlashcardCarousel")
);
const MCQs = lazy(() => import("../Components/MCQs"));

const ContentSections = ({
  isLoading,
  error,
  uploadedFiles,
  currentContent,
  activeSection,
  setActiveSection,
  isSpeaking,
  speakText,
  stopSpeaking,
  handleDownload,
  handleFileSelect,
  selectedFileIndex,
  setSelectedFileIndex,
  handleUploadedFileClick,
  handleReset,
  numFlashcards,
  setNumFlashcards,
  numQuestions,
  setNumQuestions,
  isGenerating,
  setIsGenerating,
  updateCurrentContent,
  setUploadedFiles,
}) => {
  return (
    <motion.div
      className="space-y-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Upload Card – always available so users can add more content */}
      <div className="card">
        <h2 className="text-2xl font-semibold mb-6 text-[--accent-primary] text-center">
          Upload Content
        </h2>
        <FileUploader onFileUpload={handleFileSelect} multiple={true} />
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-4 text-[--text-primary]">
            Uploaded Files
          </h3>
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <button
                  onClick={() => handleUploadedFileClick(index)}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${
                    selectedFileIndex === index
                      ? "bg-[--accent-primary] text-black"
                      : "bg-[--hover-bg] text-black hover:bg-[--accent-primary] hover:text-black"
                  }`}
                >
                  <span className="truncate max-w-[120px]">{file.filename}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
                    if (selectedFileIndex === index) {
                      setSelectedFileIndex(0);
                    }
                  }}
                  className="lg:hidden absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error ? (
        <div className="card text-center py-16">
          <div className="bg-red-900 text-white p-6 rounded-lg shadow-lg">
            <p className="text-lg">{error}</p>
          </div>
        </div>
      ) : !uploadedFiles.length ? (
        <div className="card text-center py-16">
          <p className="text-lg text-[--text-secondary]">
            Please upload a file or a YouTube URL to get started.
          </p>
        </div>
      ) : currentContent.is_image && activeSection !== "image_description" ? (
        <div className="card text-center py-16">
          <p className="text-lg text-[--text-secondary]">
            An image has been uploaded. Please check the "Image Description" tab for details.
          </p>
          <button
            onClick={() => setActiveSection("image_description")}
            className="mt-4 px-6 py-2 rounded-lg font-medium text-white glass-button transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Go to Image Description
          </button>
        </div>
      ) : activeSection === "summary" ? (
        <div className="card">
          <h2 className="text-2xl font-semibold mb-6 text-[--accent-primary] text-center">
            Summary
          </h2>
          {currentContent.summary ? (
            <>
              <div className="space-y-4">
                {currentContent.summary
                  .split(/\n\s*\n/)
                  .filter(p => p.trim())
                  .map((paragraph, index) => (
                    <p
                      key={index}
                      className="leading-relaxed text-[--text-secondary]"
                    >
                      {paragraph.trim()}
                    </p>
                  ))}
              </div>
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={() => speakText(currentContent.summary, "summary")}
                  className="px-6 py-2 rounded-lg font-medium glass-button text-white transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                  disabled={isSpeaking.summary}
                >
                  Read Aloud
                </button>
                <button
                  onClick={stopSpeaking}
                  className="px-6 py-2 rounded-full font-medium bg-red-600 text-white hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                  disabled={
                    !isSpeaking.summary &&
                    !isSpeaking.notes &&
                    !isSpeaking.image_description
                  }
                >
                  Stop
                </button>
              </div>
              <DownloadButtons contentType="summary" handleDownload={handleDownload} />
            </>
          ) : (
            <p className="text-lg text-[--text-secondary]">
              No summary available for this content.
            </p>
          )}
        </div>
      ) : activeSection === "notes" ? (
        <div className="card">
          <h2 className="text-2xl font-semibold mb-6 text-[--accent-primary] text-center">
            Short Notes
          </h2>
          {currentContent.short_notes ? (
            <>
              {currentContent.short_notes
                .split("\n\n")
                .map((paragraph, index) => (
                  <p
                    key={index}
                    className="leading-relaxed mb-6 text-[--text-secondary]"
                  >
                    {paragraph.trim()}
                  </p>
                ))}
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={() => speakText(currentContent.short_notes, "notes")}
                  className="px-6 py-2 rounded-full font-medium glass-button text-white transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                  disabled={isSpeaking.notes}
                >
                  Read Aloud
                </button>
                <button
                  onClick={stopSpeaking}
                  className="px-6 py-2 rounded-full font-medium bg-red-600 text-white hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                  disabled={
                    !isSpeaking.summary &&
                    !isSpeaking.notes &&
                    !isSpeaking.image_description
                  }
                >
                  Stop
                </button>
              </div>
              <DownloadButtons contentType="short_notes" handleDownload={handleDownload} />
            </>
          ) : (
            <div className="text-center">
              <p className="text-lg text-[--text-secondary] mb-4">
                Generate notes on demand.
              </p>
              <button
                onClick={async () => {
                  if (!currentContent.raw_text || isGenerating.notes) return;
                  setIsGenerating((p) => ({ ...p, notes: true }));
                  try {
                    const res = await axios.post(
                      endpoint("/generate/notes"),
                      { text: currentContent.raw_text }
                    );
                    const updated = {
                      ...currentContent,
                      short_notes: res.data.short_notes || "",
                    };
                    setUploadedFiles((prev) =>
                      prev.map((f, i) =>
                        i === selectedFileIndex ? updated : f
                      )
                    );
                  } catch {}
                  setIsGenerating((p) => ({ ...p, notes: false }));
                }}
                className={`px-6 py-2 rounded-lg font-medium text-white glass-button transition-all duration-200 shadow-sm hover:shadow-md ${
                  isGenerating.notes ? "opacity-60 cursor-not-allowed" : ""
                }`}
                disabled={isGenerating.notes}
              >
                {isGenerating.notes ? "Generating…" : "Generate Notes"}
              </button>
            </div>
          )}
        </div>
      ) : activeSection === "image_description" ? (
        <div className="card">
          <h2 className="text-2xl font-semibold mb-6 text-[--accent-primary] text-center">
            Image Description
          </h2>
          {currentContent.is_image ? (
            <div className="image-description-container mt-6">
              <div className="image-preview mb-6">
                <img
                  src={currentContent.base64_image}
                  alt="Uploaded"
                  className="max-w-full max-h-96 object-contain rounded-lg shadow-md"
                />
              </div>
              <div className="description-content">
                <div className="space-y-4">
                  {currentContent.image_description
                    .split(/\n\s*\n/)
                    .filter(p => p.trim())
                    .map((paragraph, index) => (
                      <p
                        key={index}
                        className="leading-relaxed text-[--text-secondary]"
                      >
                        {paragraph.trim()}
                      </p>
                    ))}
                </div>
              </div>
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={() =>
                    speakText(
                      currentContent.image_description,
                      "image_description"
                    )
                  }
                  className="px-6 py-2 rounded-full font-medium glass-button text-white transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                  disabled={isSpeaking.image_description}
                >
                  Read Aloud
                </button>
                <button
                  onClick={stopSpeaking}
                  className="px-6 py-2 rounded-full font-medium bg-red-600 text-white hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                  disabled={
                    !isSpeaking.summary &&
                    !isSpeaking.notes &&
                    !isSpeaking.image_description
                  }
                >
                  Stop
                </button>
              </div>
              <DownloadButtons contentType="image_description" handleDownload={handleDownload} />
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-lg text-[--text-secondary]">
                Image descriptions are only available for image files (PNG,
                JPG, JPEG). If you'd like an image description for a PDF,
                please upload a screenshot of the relevant page.
              </p>
            </div>
          )}
        </div>
      ) : activeSection === "flashcards" ? (
        <div className="card">
          <h2 className="text-2xl font-semibold mb-6 text-[--accent-primary] text-center">
            Flashcards
          </h2>
          {currentContent.flashcards && currentContent.flashcards.length > 0 ? (
            <Suspense
              fallback={
                <div className="text-center py-8">
                  <p className="text-lg text-[--text-secondary]">
                    Loading flashcards…
                  </p>
                </div>
              }
            >
              <FlashcardCarousel
                flashcards={currentContent.flashcards}
                onReset={handleReset}
                numFlashcards={numFlashcards}
                setNumFlashcards={setNumFlashcards}
              />
              <DownloadButtons
                contentType="flashcards"
                handleDownload={handleDownload}
              />
            </Suspense>
          ) : (
            <div className="text-center py-8">
              <p className="text-lg text-[--text-secondary] mb-2">
                No flashcards available yet.
              </p>
              <p className="text-sm text-[--text-tertiary]">
                Flashcards are automatically generated when you upload content. Please upload a PDF or YouTube video to get started.
              </p>
            </div>
          )}
        </div>
      ) : activeSection === "mcqs" ? (
        <Suspense
          fallback={
            <div className="card text-center py-16">
              <p className="text-lg text-[--text-secondary]">
                Loading MCQ test…
              </p>
            </div>
          }
        >
          <MCQs
            currentContent={currentContent}
            onUpdate={updateCurrentContent}
            numQuestions={numQuestions}
            setNumQuestions={setNumQuestions}
          />
        </Suspense>
      ) : (
        <div className="card text-center py-16">
          <p className="text-lg text-[--text-secondary]">
            No content available for this section.
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default ContentSections;