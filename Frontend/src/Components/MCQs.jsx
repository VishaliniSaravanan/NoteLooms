import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { endpoint } from "../utils/api";

export default function MCQs({ currentContent, onUpdate, numQuestions = 10, setNumQuestions }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [hasRequestedGeneration, setHasRequestedGeneration] = useState(false);
  const [isTestActive, setIsTestActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testAnswers, setTestAnswers] = useState([]);
  const [testFinished, setTestFinished] = useState(false);
  const [testScore, setTestScore] = useState(0);
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const normalizedMcqs = useMemo(() => {
    if (!currentContent?.mcqs || !Array.isArray(currentContent.mcqs)) return [];

    return currentContent.mcqs.map((mcq, idx) => {
      const rawOptions = Array.isArray(mcq.options) ? mcq.options : [];
      const optionTexts = rawOptions.map((opt) =>
        typeof opt === "string" ? opt : (opt && opt.text) || ""
      );

      let correctLetter = mcq.correct_answer || null;
      if (!correctLetter) {
        const ansText = (mcq.answer || "").trim();
        const ansIndex = optionTexts.indexOf(ansText);
        if (ansIndex >= 0) {
          correctLetter = String.fromCharCode(65 + ansIndex);
        }
      }

      return {
        id: mcq.id || idx + 1,
        question: mcq.question || "",
        options: optionTexts,
        correctLetter,
      };
    });
  }, [currentContent?.mcqs]);

  const totalAvailable = normalizedMcqs.length;
  const effectiveNumQuestions = useMemo(() => {
    const n = numQuestions || 10;
    return Math.min(n, totalAvailable || n);
  }, [numQuestions, totalAvailable]);

  const testMcqs = useMemo(() => {
    if (!normalizedMcqs || normalizedMcqs.length === 0) return [];
    return normalizedMcqs.slice(0, effectiveNumQuestions);
  }, [normalizedMcqs, effectiveNumQuestions]);

  const handleGenerateMCQs = async () => {
    if (!currentContent?.raw_text || isGenerating) return;
    
    setIsGenerating(true);
    setGenerationError("");
    try {
      const res = await axios.post(endpoint("/generate/mcqs"), { 
        text: currentContent.raw_text, 
        num_questions: numQuestions || 10
      });
      
      if (res.data.mcqs && res.data.mcqs.length > 0) {
        const updatedContent = { 
          ...currentContent, 
          mcqs: res.data.mcqs 
        };
        onUpdate(updatedContent);
      } else if (res.data.error) {
        setGenerationError(res.data.error);
      } else {
        setGenerationError("No MCQs could be generated for this content.");
      }
    } catch (error) {
      console.error("MCQ generation error:", error);
      setGenerationError(
        error.response?.data?.error ||
        "Failed to generate MCQs. Please try again later."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Remove auto-generation - MCQs should be generated during upload
  // useEffect(() => {
  //   if (!currentContent?.raw_text) return;
  //   if (currentContent.mcqs && currentContent.mcqs.length > 0) return;
  //   if (isGenerating || hasRequestedGeneration) return;

  //   setHasRequestedGeneration(true);
  //   handleGenerateMCQs();
  // }, [currentContent?.raw_text, currentContent?.mcqs, isGenerating, hasRequestedGeneration]);

  const startTest = () => {
    if (!testMcqs.length) return;
    setIsTestActive(true);
    setTestFinished(false);
    setCurrentIndex(0);
    setTestAnswers(Array(testMcqs.length).fill(null));
    setTestScore(0);
    setTimeLeft(timerMinutes > 0 ? timerMinutes * 60 : 0);
  };

  const handleOptionSelect = (letter) => {
    setTestAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = letter;
      return next;
    });
  };

  const finishTest = () => {
    let correct = 0;
    testMcqs.forEach((q, idx) => {
      if (q.correctLetter && testAnswers[idx] === q.correctLetter) {
        correct += 1;
      }
    });
    setTestScore(correct);
    setTestFinished(true);
  };

  const handleNextOrSubmit = () => {
    if (testAnswers[currentIndex] == null) return;

    if (currentIndex < testMcqs.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishTest();
    }
  };

  const exitTest = () => {
    setIsTestActive(false);
    document.body.style.overflow = '';
  };

  // Handle keyboard and click outside events for exiting test
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Exit on any key press except for space, arrow keys, and tab when in test mode
      if (isTestActive && ![' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
        exitTest();
      }
    };

    const handleClickOutside = (e) => {
      const questionArea = document.querySelector('.question-area');
      if (isTestActive && questionArea && !questionArea.contains(e.target)) {
        exitTest();
      }
    };

    if (isTestActive) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isTestActive]);

  // Timer effect
  useEffect(() => {
    if (!isTestActive || testFinished || timeLeft <= 0) return;

    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          finishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [isTestActive, testFinished, timeLeft, testMcqs, testAnswers]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  if (!currentContent?.mcqs || currentContent.mcqs.length === 0) {
    return (
      <div className="card p-6">
        <h2 className="text-2xl font-semibold mb-6 text-[--accent-primary] text-center">MCQs</h2>
        <div className="text-center">
          {isGenerating ? (
            <>
              <p className="text-lg text-[--text-secondary] mb-4">
                Generating MCQs from your content…
              </p>
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500" />
              </div>
            </>
          ) : generationError ? (
            <>
              <p className="text-lg text-red-400 mb-4">
                {generationError}
              </p>
              {currentContent?.raw_text && (
                <button
                  onClick={handleGenerateMCQs}
                  disabled={isGenerating}
                  className="px-6 py-2 rounded-lg font-medium text-white glass-button transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isGenerating ? "Generating…" : "Generate MCQs"}
                </button>
              )}
            </>
          ) : (
            <>
              <p className="text-lg text-[--text-secondary] mb-2">
                No MCQs available for this content yet.
              </p>
              <p className="text-sm text-[--text-tertiary] mb-4">
                MCQs are automatically generated when you upload content. Please upload a PDF or YouTube video to get started.
              </p>
              {currentContent?.raw_text && (
                <button
                  onClick={handleGenerateMCQs}
                  disabled={isGenerating}
                  className="px-6 py-2 rounded-lg font-medium text-white glass-button transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isGenerating ? "Generating…" : "Generate MCQs Now"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] overflow-y-auto">
      <div className="card p-6 bg-gradient-to-br from-[#050816] via-[#0b1e70] to-[#020617] border border-[--border-color] text-white min-h-full">
        <div className="sticky top-0 bg-gradient-to-b from-[#050816] to-transparent pb-4 -mx-6 px-6 -mt-6 pt-6">
          <h2 className="text-2xl font-semibold mb-2 text-[--accent-primary] text-center">MCQ Test</h2>
          <p className="text-sm text-white/80 text-center">
            Choose how many questions you want and then start a focused, full-screen test.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-6 mt-4">
          <div className="w-full max-w-2xl bg-white/5 rounded-lg p-4">
            <label className="block text-sm font-medium text-white/80 mb-2">
              Number of Questions: {effectiveNumQuestions} (max {totalAvailable})
            </label>
            <select
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-[--bg-primary] border border-[--border-color] text-[--text-primary] focus:ring-2 focus:ring-[--accent-primary] transition-all"
            >
              <option value={10}>10 Questions</option>
              <option value={20}>20 Questions</option>
              <option value={30}>30 Questions</option>
            </select>
          </div>
          <div className="w-full max-w-2xl bg-white/5 rounded-lg p-4">
            <label className="block text-sm font-medium text-white/80 mb-2">
              Timer:
            </label>
            <select
              value={timerMinutes}
              onChange={(e) => setTimerMinutes(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-[--bg-primary] border border-[--border-color] text-[--text-primary] focus:ring-2 focus:ring-[--accent-primary] transition-all"
            >
              <option value={0}>No timer</option>
              <option value={10}>10 minutes</option>
              <option value={20}>20 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
          </div>
          <p className="text-xs text-white/70 text-center">
            Available MCQs from this content: <span className="font-semibold">{totalAvailable}</span>. 
            The test will use up to your chosen amount.
          </p>

          <div className="w-full flex justify-center mt-4">
            <button
              onClick={startTest}
              disabled={!testMcqs.length}
              className={`px-6 py-2 rounded-lg font-medium text-white glass-button transition-all duration-200 shadow-sm hover:shadow-md ${
                !testMcqs.length ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              Start Test
            </button>
          </div>
        </div>
      </div>

      {isTestActive && (
        <div
          className="fixed inset-0 z-[9999] bg-[#050816] text-white flex flex-col overflow-hidden"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)'
          }}
          onClick={exitTest}
        >
          <div className="flex-1 flex flex-col w-full">
            {/* Full-width Top bar - NO padding on sides */}
            <div className="w-full bg-white/5 border-b border-white/10 px-4 sm:px-6 lg:px-8 py-4">
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                  <h2 className="text-lg sm:text-xl font-semibold">MCQ Focus Test</h2>
                  {!testFinished && (
                    <p className="text-xs sm:text-sm text-white/70">
                      Stay on this screen — clicking outside will end the practice attempt.
                    </p>
                  )}
                </div>
                {!testFinished && (
                  <div className="flex flex-col items-end gap-1 text-xs sm:text-sm text-white/80" onClick={(e) => e.stopPropagation()}>
                    <span className="font-semibold">
                      Question {currentIndex + 1} / {testMcqs.length}
                    </span>
                    {timerMinutes > 0 && (
                      <span className="font-mono px-2 py-1 rounded bg-blue-600/30 border border-blue-400/50">
                        ⏱ {formatTime(timeLeft)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Content area with max-width container */}
            <div 
              className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto question-area" 
              onClick={(e) => e.stopPropagation()}
              style={{
                maxHeight: 'calc(100vh - 3.5rem - env(safe-area-inset-top) - env(safe-area-inset-bottom))'
              }}
            >
              <div className="max-w-5xl w-full mx-auto flex flex-col gap-4 flex-1">
                {/* Progress bar */}
                {!testFinished && (
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                      style={{
                        width: `${((currentIndex + 1) / testMcqs.length) * 100}%`,
                      }}
                    />
                  </div>
                )}

                {/* Question content */}
                <div className="flex-1 flex flex-col bg-white/5 border border-white/10 rounded-2xl shadow-2xl px-4 sm:px-6 py-6 sm:py-8 backdrop-blur">
                  {!testFinished ? (
                    <>
                      <div className="mb-6 sm:mb-8">
                        <h3 className="text-xl sm:text-2xl font-semibold mb-4">
                          {currentIndex + 1}. {testMcqs[currentIndex]?.question}
                        </h3>
                        <div className="space-y-3 sm:space-y-4">
                          {testMcqs[currentIndex]?.options.map((option, idx) => {
                            const letter = String.fromCharCode(65 + idx);
                            const isSelected = testAnswers[currentIndex] === letter;
                            return (
                              <button
                                key={idx}
                                onClick={() => handleOptionSelect(letter)}
                                className={`w-full text-left py-3 px-4 rounded-lg border transition-all duration-200 ${
                                  isSelected
                                    ? "bg-blue-600/80 border-blue-300 text-white shadow-lg"
                                    : "bg-white/5 border-white/15 text-white/80 hover:bg-white/10 hover:border-blue-300/70"
                                }`}
                              >
                                <span className="font-semibold mr-2">{letter})</span>
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-auto flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
                        <button
                          onClick={exitTest}
                          className="px-4 py-2 rounded-lg bg-white/5 text-white/80 hover:bg-red-500/20 hover:text-red-200 transition-colors text-xs sm:text-sm"
                        >
                          Exit Test
                        </button>
                        <button
                          onClick={handleNextOrSubmit}
                          disabled={testAnswers[currentIndex] == null}
                          className={`px-6 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 text-sm sm:text-base ${
                            testAnswers[currentIndex] == null ? "opacity-60 cursor-not-allowed" : ""
                          }`}
                        >
                          {currentIndex === testMcqs.length - 1 ? "Submit Test" : "Next Question"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                      <h3 className="text-3xl sm:text-4xl font-bold text-[--accent-primary] mb-4">
                        Test Complete
                      </h3>
                      <p className="text-5xl sm:text-6xl font-extrabold text-green-400 mb-3">
                        {testScore} / {testMcqs.length}
                      </p>
                      <p className="text-base sm:text-lg text-white/80 mb-6 max-w-xl">
                        {testScore >= testMcqs.length * 0.9
                          ? "🌟 Outstanding performance! You really know this content."
                          : testScore >= testMcqs.length * 0.7
                          ? "🎯 Great job! A little more practice and you'll master it."
                          : testScore >= testMcqs.length * 0.5
                          ? "💪 Good effort — review the weaker areas and try again."
                          : "📚 Keep practicing. Revisit the notes and take another test when you're ready."}
                      </p>
                      <button
                        onClick={exitTest}
                        className="px-6 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200"
                      >
                        Exit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}