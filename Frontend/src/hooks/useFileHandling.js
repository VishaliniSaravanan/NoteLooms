import axios from "axios";
import toast from 'react-hot-toast';
import { endpoint } from "../utils/api";

const useFileHandling = ({
  previewFiles,
  setPreviewFiles,
  uploadedFiles,
  setUploadedFiles,
  selectedFileIndex,
  setSelectedFileIndex,
  setIsLoading,
  setError,
  setCurrentFlashcardIndex,
  setNumFlashcards,
  addMoreFilesInputRef,
  layoutMode,
  setIsPreviewModalOpen,
  setIsPreviewMinimized,
}) => {
  const handleFileSelect = (data) => {
    setError(null);
    
    if (data.error) {
      setError(data.error);
      return;
    }

    const isYouTubeLink = typeof data === "string" && data.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i);
    
    if (isYouTubeLink) {
      const youtubeFile = [{ type: "youtube", url: data, name: "YouTube Video" }];
      setPreviewFiles(youtubeFile);
      setIsPreviewModalOpen(true);
      setIsPreviewMinimized(false);
    } else if (Array.isArray(data)) {
      const filesWithPreview = data.map((file) => {
        const fileObj = {
          name: file.name,
          size: file.size,
          type: file.type,
          file: file,
        };
        
        if (file.type?.startsWith("image/") || file.type === "application/pdf") {
          fileObj.preview = URL.createObjectURL(file);
        }
        
        return fileObj;
      });
      setPreviewFiles((prev) => {
        const newFiles = [...prev, ...filesWithPreview];
        if (newFiles.length > 0) {
          setIsPreviewModalOpen(true);
          setIsPreviewMinimized(false);
        }
        return newFiles;
      });
    }
  };

  const handleFileUpload = async () => {
    if (previewFiles.length === 0) {
      toast.error("No files to upload. Please select files first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    let hasFiles = false;

    previewFiles.forEach((previewFile) => {
      if (previewFile.type === "youtube") {
        formData.append("youtube_url", previewFile.url);
      } else if (previewFile.file) {
        formData.append(`files`, previewFile.file);
        hasFiles = true;
      }
    });

    if (!hasFiles && !previewFiles.some(f => f.type === "youtube")) {
      const errorMsg = "No valid files to upload.";
      setError(errorMsg);
      setIsLoading(false);
      toast.error(errorMsg, { id: "upload" });
      if (import.meta.env.DEV) console.error(errorMsg);
      return;
    }

    formData.append("quick_mode", "false");
    try {
      const response = await axios.post(endpoint("/upload"), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      processResponse(response.data, previewFiles);
      const currentFiles = [...previewFiles];
      currentFiles.forEach((file) => {
        if (file?.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
      setPreviewFiles([]);
      // After upload completes, hide any preview modal in both layouts
      setIsPreviewModalOpen(false);
      setIsPreviewMinimized(false);
    } catch (error) {
      console.error("Upload error:", error);
      const errorMsg = error.response?.data?.error || error.message || "Failed to process the upload. Please ensure the URL is valid or try another file.";
      setError(errorMsg);
      toast.error(errorMsg, { id: "upload" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePreviewFile = (index) => {
    setPreviewFiles((prev) => {
      const file = prev[index];
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleAddMoreFiles = () => {
    if (addMoreFilesInputRef.current) {
      addMoreFilesInputRef.current.click();
    }
  };

  const openUploadedSource = (file) => {
    if (!file) return;

    if (file.type === "youtube") {
      const youtubeUrl =
        file.sourceMeta?.youtubeUrl || file.filename || file.url || "";
      if (youtubeUrl) {
        window.open(youtubeUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.error("Original YouTube link unavailable.");
      }
      return;
    }

    if (file.sourceMeta?.file instanceof File) {
      const blobUrl = URL.createObjectURL(file.sourceMeta.file);
      const viewer = window.open(blobUrl, "_blank", "noopener,noreferrer");
      if (viewer) {
        viewer.onload = () => {
          URL.revokeObjectURL(blobUrl);
        };
      } else {
        URL.revokeObjectURL(blobUrl);
        toast.error("Please allow pop-ups to view the file.");
      }
      return;
    }

    if (file.base64_image) {
      window.open(file.base64_image, "_blank", "noopener,noreferrer");
      return;
    }

    toast.error("Original file preview unavailable. Please re-upload.");
  };

  const handleUploadedFileClick = (index) => {
    setSelectedFileIndex(index);
    const file = uploadedFiles[index];
    if (file) {
      openUploadedSource(file);
    }
  };

  const processResponse = (data, sourceContext = []) => {
    const youtubeCount = uploadedFiles.filter(file => file.type === "youtube").length;
    let newYoutubeIndex = youtubeCount + 1;

    const processedFiles = data.map((fileData, index) => {
      const sourceInfo = sourceContext[index];
      const youtubeUrl =
        sourceInfo?.url ||
        (fileData.type === "youtube" ? fileData.filename : null);
      let displayFilename = fileData.filename;
      if (fileData.type === "youtube") {
        displayFilename = `YouTube Video ${newYoutubeIndex++}`;
      }

      const cleanSummary = fileData.summary ? fileData.summary.replace(/\*\*/g, "") : "";
      const cleanNotes = fileData.short_notes
        ? fileData.short_notes
            .replace(/\*/g, "")
            .replace(/\//g, "")
            .replace(/\d{1,2}\//g, "")
            .replace(/^\.|\.$/g, "")
            .replace(/\r\n|\r|\n\s*\n/g, "\n\n")
            .trim()
        : "";
      const cleanFlashcards = fileData.flashcards && fileData.flashcards.length > 0
        ? fileData.flashcards.map((card) => ({
            front: card.front.replace(/\*\*/g, ""),
            back: card.back.replace(/\*\*/g, ""),
          }))
        : [];
      const cleanMcqs = fileData.mcqs && fileData.mcqs.length > 0
        ? fileData.mcqs.map((mcq) => ({
            ...mcq,
            question: mcq.question.replace(/\*\*/g, ""),
            options: mcq.options.map((option) => option.replace(/\*\*/g, "")),
            answer: mcq.answer.replace(/\*\*/g, ""),
          }))
        : [];
      const cleanImageDescription = fileData.image_description
        ? fileData.image_description.replace(/\*\*/g, "")
        : fileData.is_image
        ? "Please check the 'Image Description' tab for details."
        : "Image descriptions are only available for image files (PNG, JPG, JPEG).";

      return {
        type: fileData.type,
        filename: displayFilename,
        summary: cleanSummary,
        short_notes: cleanNotes,
        mcqs: cleanMcqs,
        flashcards: cleanFlashcards,
        raw_text: fileData.raw_text || "",
        image_description: cleanImageDescription,
        base64_image: fileData.base64_image || "",
        is_image: fileData.is_image,
        transcript: fileData.transcript || null,
        youtube_id: fileData.youtube_id || null,
        sourceMeta: {
          file: sourceInfo?.file || null,
          youtubeUrl,
        },
      };
    });

    setUploadedFiles((prev) => [...prev, ...processedFiles]);
    setSelectedFileIndex(uploadedFiles.length);
    setCurrentFlashcardIndex(0);
    setNumFlashcards(Math.min(10, processedFiles[0]?.flashcards.length || 0));
  };

  return {
    handleFileSelect,
    handleFileUpload,
    handleRemovePreviewFile,
    handleAddMoreFiles,
    openUploadedSource,
    handleUploadedFileClick,
    processResponse,
  };
};

export default useFileHandling;