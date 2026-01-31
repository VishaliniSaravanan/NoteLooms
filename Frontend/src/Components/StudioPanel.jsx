import React from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { endpoint } from '../utils/api';
import OutputModal from './OutputModal';
import FlashcardCarousel from './FlashcardCarousel';
import MCQs from './MCQs';
import YouTubeTranscript from './YouTubeTranscript';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import {
  IconSummary,
  IconNotes,
  IconMCQ,
  IconFlashcards,
  IconImage,
  IconVolume
} from '../utils/icons';
import PomodoroTimer from './PomodoroTimer';

const ICONS = {
  summary: { Icon: IconSummary, label: 'Summary', color: 'text-blue-400' },
  notes: { Icon: IconNotes, label: 'Short Notes', color: 'text-green-400' },
  mcqs: { Icon: IconMCQ, label: 'MCQs', color: 'text-purple-400' },
  flashcards: { Icon: IconFlashcards, label: 'Flashcards', color: 'text-orange-400' },
  image_description: { Icon: IconImage, label: 'Image Description', color: 'text-yellow-400' },
  transcript: { Icon: IconNotes, label: 'Transcript', color: 'text-cyan-400' }, // Changed from text-pink-400 to text-cyan-400
};

const renderWithLatex = (text) => {
  if (!text) return null;

  let content = text;
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === 'object' && (parsed.summary || parsed.short_notes)) {
      content = parsed.summary || parsed.short_notes || text;
    }
  } catch (e) {
  }

  const parts = content.split(/(\$\$.*?\$\$|\$.*?\$)/s);

  return parts.map((part, i) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const mathContent = part.slice(2, -2).trim();
      try {
        return <BlockMath key={i} math={mathContent} />;
      } catch (error) {
        return <span key={i} className="text-red-400">[LaTeX Error]</span>;
      }
    } else if (part.startsWith('$') && part.endsWith('$') && part.length > 1) {
      const mathContent = part.slice(1, -1).trim();
      try {
        return <InlineMath key={i} math={mathContent} />;
      } catch (error) {
        return <span key={i} className="text-red-400">[LaTeX Error]</span>;
      }
    }
    return <span key={i}>{part}</span>;
  });
};

export default function StudioPanel({ 
  currentContent, 
  isGenerating, 
  setIsGenerating, 
  setActiveOutput, 
  activeOutput, 
  handleExport,
  speakText,
  updateCurrentContent,
  mode = 'modern',
  setMode,
  numQuestions = 10,
  setNumQuestions,
  numFlashcards = 10,
  setNumFlashcards
}) {
  const handleClassicMode = () => {
    const newMode = mode === 'classic' ? 'modern' : 'classic';
    if (setMode) {
      setMode(newMode);
      toast.success(`Switched to ${newMode} mode`);
    } else {
      if (import.meta.env.DEV) console.warn('setMode function not provided');
      toast.error('Mode switching not available');
    }
  };

  const handleGenerate = async (type) => {
    if (isGenerating[type]) return;
    
    // Use existing content if available
    if (type === 'summary' && currentContent?.summary) {
      setActiveOutput({ type, data: { summary: currentContent.summary } });
      return;
    }
    if (type === 'notes' && currentContent?.short_notes) {
      setActiveOutput({ type, data: { short_notes: currentContent.short_notes } });
      return;
    }
    if (type === 'flashcards' && currentContent?.flashcards?.length > 0) {
      setActiveOutput({ type, data: { flashcards: currentContent.flashcards } });
      return;
    }
    if (type === 'mcqs' && currentContent?.mcqs?.length > 0) {
      setActiveOutput({ type, data: { mcqs: currentContent.mcqs } });
      return;
    }
    if (type === 'image_description' && currentContent?.image_description) {
      setActiveOutput({ type, data: { image_description: currentContent.image_description } });
      return;
    }
    
    if (!currentContent?.raw_text) {
      toast.error('No content available to generate from');
      return;
    }
    
    setIsGenerating(prev => ({ ...prev, [type]: true }));
    
    toast.loading(`Generating ${ICONS[type]?.label || type}...`, {
      id: `generate-${type}`,
      position: 'bottom-center',
      duration: Infinity
    });
    
    try {
      let res;
      if (type === 'notes') {
        res = await axios.post(endpoint('/generate/notes'), { text: currentContent.raw_text });
      } else if (type === 'flashcards') {
        res = await axios.post(endpoint('/generate/flashcards'), { text: currentContent.raw_text });
      } else if (type === 'mcqs') {
        res = await axios.post(endpoint('/generate/mcqs'), { 
          text: currentContent.raw_text, 
          num_questions: numQuestions || 10 
        });
      } else {
        toast.error(`Generation for ${type} not implemented`);
        return;
      }
      
      const updatedContent = { ...currentContent };
      if (type === 'notes') updatedContent.short_notes = res.data.short_notes || '';
      if (type === 'flashcards') updatedContent.flashcards = res.data.flashcards || [];
      if (type === 'mcqs') updatedContent.mcqs = res.data.mcqs || [];
      
      updateCurrentContent(updatedContent);

      // If the backend returned an error message (e.g. quota exceeded), show it clearly
      if (res.data.error && (!res.data.mcqs || res.data.mcqs.length === 0)) {
        toast.error(res.data.error, {
          id: `generate-${type}`,
          position: 'bottom-center'
        });
      } else {
      setActiveOutput({ type, data: res.data });
      toast.success(`${ICONS[type]?.label || type} generated successfully!`, {
        id: `generate-${type}`,
        position: 'bottom-center'
      });
      }
    } catch (error) {
      toast.error(`Failed to generate ${type}: ${error.response?.data?.message || error.message}`, {
        id: `generate-${type}`,
        position: 'bottom-center'
      });
      console.error(`Error generating ${type}:`, error);
    } finally {
      setIsGenerating(prev => ({ ...prev, [type]: false }));
    }
  };

  const renderOutput = (type, data) => {
    switch (type) {
      case 'flashcards':
        const flashcardData = data.flashcards || currentContent?.flashcards || [];
        return (
          <div className="space-y-4 flex flex-col items-center w-full">
            <div className="w-full flex justify-center -mx-2 sm:mx-0">
              <FlashcardCarousel 
                flashcards={flashcardData} 
                onReset={() => {}}
                numFlashcards={numFlashcards || Math.min(10, flashcardData.length)}
                setNumFlashcards={(value) => {
                  if (setNumFlashcards) {
                    setNumFlashcards(value);
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-[--border-color]">
              <button onClick={() => handleExport(type, 'docx', data)} className="px-4 py-2 rounded glass-button text-sm">DOCX</button>
              <button onClick={() => handleExport(type, 'pdf', data)} className="px-4 py-2 rounded glass-button text-sm">PDF</button>
              <button onClick={() => handleExport(type, 'csv', data)} className="px-4 py-2 rounded glass-button text-sm">CSV</button>
            </div>
          </div>
        );
      
      case 'mcqs':
        const mcqContent = {
          ...currentContent,
          mcqs: data.mcqs || currentContent?.mcqs || []
        };
        return (
          <div className="space-y-4 bg-[--bg-primary]">
            {mcqContent.mcqs && mcqContent.mcqs.length > 0 ? (
              <>
                <MCQs 
                  currentContent={mcqContent} 
                  onUpdate={(updated) => {
                    const newContent = { ...currentContent, mcqs: updated.mcqs || [] };
                    updateCurrentContent(newContent);
                    setActiveOutput({ type, data: { mcqs: updated.mcqs || [] } });
                  }}
                  numQuestions={numQuestions}
                  setNumQuestions={setNumQuestions}
                />
                <div className="flex justify-end gap-2 pt-4 border-t border-[--border-color]">
                  <button onClick={() => handleExport(type, 'docx', data)} className="px-4 py-2 rounded glass-button text-sm">DOCX</button>
                  <button onClick={() => handleExport(type, 'pdf', data)} className="px-4 py-2 rounded glass-button text-sm">PDF</button>
                  <button onClick={() => handleExport(type, 'csv', data)} className="px-4 py-2 rounded glass-button text-sm">CSV</button>
                </div>
              </>
            ) : (
              <div className="p-4 text-center text-[--text-secondary]">
                <p className="mb-4">No MCQs available. Please generate MCQs first.</p>
                <button
                  onClick={() => handleGenerate('mcqs')}
                  className="px-4 py-2 rounded-lg glass-button text-sm"
                  disabled={isGenerating.mcqs}
                >
                  {isGenerating.mcqs ? 'Generating...' : 'Generate MCQs'}
                </button>
              </div>
            )}
          </div>
        );
      
      case 'summary':
      case 'notes':
        const content = data.summary || data.short_notes || '';
        return (
          <div className="space-y-4">
            <div className="prose dark:prose-invert max-w-none">
              <div className="bg-[--hover-bg] p-4 rounded-lg border border-[--border-color] space-y-4">
                {content
                  .split(/\n\s*\n/)
                  .filter(p => p.trim())
                  .map((paragraph, index) => (
                    <div key={index} className="leading-relaxed">
                      {renderWithLatex(paragraph.trim())}
                    </div>
                  ))}
              </div>
            </div>
            <motion.button 
              onClick={() => speakText(content, type)} 
              className="px-4 py-2 rounded-lg glass-button flex items-center gap-2 text-sm font-medium transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconVolume className="w-4 h-4" />
              Read Aloud
            </motion.button>
            <div className="flex justify-end gap-2 pt-4 border-t border-[--border-color]">
              <button onClick={() => handleExport(type, 'docx', data)} className="px-4 py-2 rounded glass-button text-sm">DOCX</button>
              <button onClick={() => handleExport(type, 'pdf', data)} className="px-4 py-2 rounded glass-button text-sm">PDF</button>
              <button onClick={() => handleExport(type, 'txt', data)} className="px-4 py-2 rounded glass-button text-sm">TXT</button>
            </div>
          </div>
        );
      
      case 'image_description':
        return (
          <div className="space-y-6">
            {currentContent?.base64_image && (
              <div className="bg-[--bg-secondary] p-4 rounded-xl border border-[--border-color] shadow-sm">
                <img 
                  src={currentContent.base64_image} 
                  alt="Uploaded content" 
                  className="max-h-96 w-auto mx-auto object-contain rounded-lg"
                />
              </div>
            )}
            
            <div className="bg-[--bg-secondary] p-6 rounded-xl border border-[--border-color]">
              <h3 className="text-lg font-semibold mb-4 text-[--text-primary]">
                Image Description
              </h3>
              <div className="prose dark:prose-invert max-w-none">
                <div className="text-[--text-secondary] leading-relaxed text-base space-y-4">
                  {(data.image_description || 'No image description available')
                    .split(/\n\s*\n/)
                    .filter(p => p.trim())
                    .map((paragraph, index) => (
                      <p key={index}>
                        {paragraph.trim()}
                      </p>
                    ))}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[--border-color]">
              <motion.button 
                onClick={() => speakText(data.image_description, type)} 
                className="px-5 py-2.5 rounded-lg glass-button flex items-center gap-2 text-sm font-medium transition-all duration-200"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <IconVolume className="w-4 h-4" />
                Read Aloud
              </motion.button>
              
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => handleExport(type, 'docx', data)} 
                  className="px-4 py-2 rounded-lg bg-[--hover-bg] text-[--text-primary] hover:bg-[--accent-primary]/10 transition-colors text-sm font-medium"
                >
                  Export DOCX
                </button>
                <button 
                  onClick={() => handleExport(type, 'pdf', data)} 
                  className="px-4 py-2 rounded-lg bg-[--hover-bg] text-[--text-primary] hover:bg-[--accent-primary]/10 transition-colors text-sm font-medium"
                >
                  Export PDF
                </button>
                <button 
                  onClick={() => handleExport(type, 'txt', data)} 
                  className="px-4 py-2 rounded-lg bg-[--hover-bg] text-[--text-primary] hover:bg-[--accent-primary]/10 transition-colors text-sm font-medium"
                >
                  Export TXT
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'transcript':
        return (
          <div className="space-y-4">
            <YouTubeTranscript 
              transcript={data.transcript || []} 
              youtubeUrl={data.youtubeUrl || currentContent?.sourceMeta?.youtubeUrl}
            />
            <div className="flex justify-end gap-2 pt-4 border-t border-[--border-color]">
              <button 
                onClick={() => handleExport('transcript', 'txt', { transcript: data.transcript })} 
                className="px-4 py-2 rounded-lg bg-[--hover-bg] text-[--text-primary] hover:bg-[--accent-primary]/10 transition-colors text-sm font-medium"
              >
                Export TXT
              </button>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="p-4 bg-[--hover-bg] rounded-lg border border-[--border-color]">
            <p className="text-[--text-secondary]">No content available for this type.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 p-2 sm:p-4">
      <div className="sticky top-0 z-20">
        <PomodoroTimer />
      </div>
      
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {Object.entries(ICONS).map(([key, { Icon, label, color }]) => {
          return (
            <motion.button
              key={key}
              onClick={() => {
                if (key === 'transcript') {
                  if (currentContent?.transcript && currentContent?.type === 'youtube') {
                    setActiveOutput({ 
                      type: key, 
                      data: { 
                        transcript: currentContent.transcript, 
                        youtubeUrl: currentContent.sourceMeta?.youtubeUrl || currentContent.filename 
                      } 
                    });
                  } else {
                    toast.error('No transcript available. Please upload a YouTube video with captions.');
                  }
                } else {
                  handleGenerate(key);
                }
              }}
              disabled={isGenerating[key]}
              className={`relative aspect-square w-full flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg transition-all duration-200 ${
                activeOutput?.type === key
                  ? 'bg-[--accent-primary]/10 border-2 border-[--accent-primary] scale-[1.02] shadow-md'
                  : 'bg-[--card-bg] hover:bg-[--hover-bg] border border-[--border-color] hover:shadow-sm'
              } ${isGenerating[key] ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              whileHover={!isGenerating[key] ? { scale: 1.02 } : {}}
              whileTap={!isGenerating[key] ? { scale: 0.98 } : {}}
            >
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${color} bg-opacity-10 flex items-center justify-center mb-1 sm:mb-2`}>
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
              </div>
              <span className="text-xs sm:text-sm font-medium text-[--text-primary] text-center px-1">
                {label}
              </span>
              {isGenerating[key] && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-[--accent-primary]"></div>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {activeOutput && (
        <OutputModal
          isOpen={!!activeOutput}
          onClose={() => setActiveOutput(null)}
          title={ICONS[activeOutput.type]?.label || 'Output'}
          onExport={(format) => handleExport(activeOutput.type, format, activeOutput.data)}
          size="xl"
        >
          <div className="max-h-[70vh] overflow-y-auto p-1">
            {renderOutput(activeOutput.type, activeOutput.data)}
          </div>
        </OutputModal>
      )}
    </div>
  );
}