import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const colorPalette = [
  'bg-slate-900/95 text-slate-100 border-slate-800/50',
  'bg-slate-900/95 text-slate-100 border-slate-800/50',
  'bg-slate-900/95 text-slate-100 border-slate-800/50',
  'bg-slate-900/95 text-slate-100 border-slate-800/50',
  'bg-slate-900/95 text-slate-100 border-slate-800/50',
  'bg-slate-900/95 text-slate-100 border-slate-800/50',
];


const YouTubeTranscript = ({ transcript, youtubeUrl }) => {
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [viewMode, setViewMode] = useState('segmented'); // 'segmented' or 'continuous'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localTranscript, setLocalTranscript] = useState(transcript || []);
  const [inputUrl, setInputUrl] = useState(youtubeUrl || '');

  useEffect(() => {
    if (transcript && Array.isArray(transcript) && transcript.length > 0) {
      setLocalTranscript(transcript);
      setError(null);
    } else if (youtubeUrl) {
      fetchTranscript(youtubeUrl);
    }
  }, [transcript, youtubeUrl]);

  const extractVideoId = (url) => {
    if (!url) return null;
    const patterns = [
      /(?:v=|\/|embed\/)([0-9A-Za-z_-]{11})/,
      /^([0-9A-Za-z_-]{11})$/,
      /youtu\.be\/([0-9A-Za-z_-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const fetchTranscript = async (url = inputUrl) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const videoId = extractVideoId(url);
      if (!videoId) {
        setError('Invalid YouTube URL. Please enter a valid YouTube video URL.');
        setIsLoading(false);
        return;
      }

      // Method 1: Try YouTube's timedtext API directly
      const languages = ['en', 'en-US', 'en-GB', 'a.en']; // Try multiple language codes
      
      for (const lang of languages) {
        try {
          const timedTextUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}`;
          const response = await fetch(timedTextUrl);
          const xmlText = await response.text();
          
          if (xmlText && xmlText.includes('<text') && !xmlText.includes('error')) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            const textElements = xmlDoc.getElementsByTagName('text');
            
            const transcript = Array.from(textElements).map((elem) => {
              const text = elem.textContent || '';
              // Decode HTML entities
              const div = document.createElement('div');
              div.innerHTML = text;
              return {
                start: parseFloat(elem.getAttribute('start') || '0'),
                duration: parseFloat(elem.getAttribute('dur') || '0'),
                text: div.textContent || div.innerText || ''
              };
            });
            
            if (transcript.length > 0) {
              setLocalTranscript(transcript);
              setError(null);
              setIsLoading(false);
              return;
            }
          }
        } catch (langError) {
          console.log(`Failed to fetch transcript in ${lang}`);
        }
      }

      // If we reach here, no captions were found
      setError('No captions available for this video. The video may not have subtitles enabled, or they may be disabled by the creator.');
    } catch (err) {
      console.error('Error fetching transcript:', err);
      setError('Failed to load transcript. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getColorClass = (index) => {
    return colorPalette[index % colorPalette.length];
  };

  const handleSegmentClick = (segment) => {
    const videoId = extractVideoId(inputUrl || youtubeUrl);
    if (videoId) {
      const time = segment.start;
      window.open(`https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(time)}s`, '_blank');
    }
    setSelectedSegment(segment);
  };

  const handleLoadTranscript = () => {
    if (inputUrl.trim()) {
      fetchTranscript(inputUrl);
    }
  };

  // Input form if no transcript loaded
  if (!localTranscript || localTranscript.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-100 mb-2">YouTube Transcript Viewer</h1>
            <p className="text-slate-300">Extract and view transcripts from any YouTube video</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl shadow-blue-900/30">
            {isLoading ? (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="bg-slate-800/90 backdrop-blur-lg border border-white/10 p-6 rounded-2xl max-w-sm w-full mx-4 shadow-2xl">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-slate-300 text-lg">Loading transcript...</p>
                  <p className="text-slate-400 text-sm mt-2">This may take a few moments</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-8 space-y-4">
                <svg className="w-20 h-20 mx-auto text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-red-400 text-lg font-semibold mb-2">{error}</p>
                  <p className="text-slate-400 text-sm">Make sure the video has captions enabled and is publicly available.</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-all duration-200"
                >
                  Try Another Video
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-slate-300 font-medium mb-3 text-sm">
                    Enter YouTube Video URL
                  </label>
                  <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLoadTranscript()}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <button
                  onClick={handleLoadTranscript}
                  disabled={!inputUrl.trim()}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600/90 to-blue-700/90 hover:from-blue-500/90 hover:to-blue-600/90 disabled:from-slate-600/50 disabled:to-slate-700/50 text-white rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:shadow-blue-500/20"
                >
                  Load Transcript
                </button>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-slate-300 text-sm text-center">
                    Works with videos that have captions or auto-generated subtitles
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main transcript display
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-100 mb-2">YouTube Transcript</h1>
          <button
            onClick={() => {
              setLocalTranscript([]);
              setInputUrl('');
              setError(null);
            }}
            className="text-slate-400 hover:text-slate-300 text-sm transition-colors"
          >
            Load Different Video
          </button>
        </div>

     {/* Controls */}
<div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl shadow-blue-900/20">
  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
    <div className="text-sm text-slate-300">
      <span className="font-semibold text-white text-lg">{localTranscript.length}</span> segments
    </div>
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-200">View:</label>
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          className="px-4 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-white text-sm focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all cursor-pointer
                     hover:bg-white hover:text-black"
        >
          <option className="bg-white text-black" value="segmented">Segmented</option>
          <option className="bg-white text-black" value="continuous">Full Text</option>
        </select>
      </div>
    </div>
  </div>
</div>


        {/* Transcript Display */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-blue-900/20 overflow-hidden">
          {viewMode === 'continuous' ? (
            // Enhanced full text view with better paragraph formatting
            <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="prose prose-invert max-w-none">
                {(() => {
                  // First, join all segments with spaces
                  const fullText = localTranscript.map(segment => segment.text).join(' ');
                  
                  // Split into sentences using common sentence terminators followed by space and capital letter
                  const sentences = fullText.match(/[^.!?]+[.!?]\s*/g) || [fullText];
                  
                  // Group sentences into paragraphs (3-5 sentences per paragraph)
                  const paragraphs = [];
                  let currentPara = [];
                  
                  sentences.forEach((sentence, index) => {
                    currentPara.push(sentence.trim());
                    // Start new paragraph after 3-5 sentences
                    if (currentPara.length >= 3 && (Math.random() < 0.3 || index === sentences.length - 1)) {
                      paragraphs.push(currentPara.join(' '));
                      currentPara = [];
                    }
                  });
                  
                  // Add any remaining sentences as the last paragraph
                  if (currentPara.length > 0) {
                    paragraphs.push(currentPara.join(' '));
                  }
                  
                  return paragraphs.map((para, idx) => (
                    <p 
                      key={idx} 
                      className="text-slate-100 text-base md:text-lg leading-relaxed mb-6 last:mb-0 
                               text-justify tracking-wide max-w-4xl mx-auto"
                    >
                      {para}
                    </p>
                  ));
                })()}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700">
                <button
                  onClick={() => {
                    const text = localTranscript.map(segment => segment.text).join(' ');
                    navigator.clipboard.writeText(text);
                    alert('Full transcript copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Full Transcript
                </button>
              </div>
            </div>
          ) : (
            // Segmented view
            <div className="space-y-2 max-h-[70vh] overflow-y-auto p-4 custom-scrollbar">
              {localTranscript.map((segment, index) => {
                const colorClass = getColorClass(index, segment.duration || 0);
                const isSelected = selectedSegment?.start === segment.start;
                
                return (
                  <motion.div
                    key={`${index}-${segment.start}`}
                    onClick={() => handleSegmentClick(segment)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${colorClass} ${
                      isSelected ? 'ring-2 ring-purple-500 scale-[1.02] shadow-lg' : 'hover:scale-[1.01] hover:shadow-md'
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.005, 0.2), duration: 0.3 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-xs font-mono text-slate-400 whitespace-nowrap mt-1 select-none bg-slate-900/50 px-2 py-1 rounded">
                        {formatTime(segment.start)}
                      </span>
                      <span className="flex-1 text-sm md:text-base leading-relaxed break-words">
                        {segment.text}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-slate-400 bg-slate-800/30 backdrop-blur-lg rounded-xl border border-slate-700/50 p-4">
          <p className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {viewMode === 'segmented' 
              ? 'Click any segment to jump to that moment in the video'
              : 'Reading the complete transcript as continuous text'
            }
          </p>
        </div>

        {/* Custom scrollbar styles */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(30, 41, 59, 0.5);
            border-radius: 5px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(139, 92, 246, 0.5);
            border-radius: 5px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(139, 92, 246, 0.8);
          }
        `}</style>
      </div>
    </div>
  );
};

export default YouTubeTranscript;