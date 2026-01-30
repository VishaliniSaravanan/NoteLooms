import { useState, useMemo, useEffect, useRef } from "react";
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
  const intervalRef = useRef(null);
  const testAnswersRef = useRef([]);
  const testMcqsRef = useRef([]);
  const hasTimerRef = useRef(false);

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
      const correctIdx = correctLetter ? correctLetter.charCodeAt(0) - 65 : 0;
      const correctText = optionTexts[correctIdx];
      const explanation = (mcq.explanation || "").trim() || (correctText ? `The correct answer is ${correctText}.` : "");

      return {
        id: mcq.id || idx + 1,
        question: mcq.question || "",
        options: optionTexts,
        correctLetter,
        explanation,
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

  testAnswersRef.current = testAnswers;
  testMcqsRef.current = testMcqs;

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
      if (import.meta.env.DEV) console.error("MCQ generation error:", error);
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
    hasTimerRef.current = timerMinutes > 0;
    setIsTestActive(true);
    setTestFinished(false);
    setCurrentIndex(0);
    setTestAnswers(Array(testMcqs.length).fill(null));
    setTestScore(0);
    setTimeLeft(timerMinutes > 0 ? timerMinutes * 60 : -1);
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

  // When time hits 0, finish test using refs for latest answers
  useEffect(() => {
    if (!isTestActive || testFinished || timeLeft !== 0) return;
    const mcqs = testMcqsRef.current;
    const answers = testAnswersRef.current;
    let correct = 0;
    mcqs.forEach((q, idx) => {
      if (q.correctLetter && answers[idx] === q.correctLetter) correct += 1;
    });
    setTestScore(correct);
    setTestFinished(true);
  }, [isTestActive, testFinished, timeLeft]);

  // Timer: only run when test has a timer (no timer = don't start interval, so no auto 0/10)
  useEffect(() => {
    if (!isTestActive || testFinished || !hasTimerRef.current) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev <= 0 ? prev : (prev <= 1 ? 0 : prev - 1)));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isTestActive, testFinished]);

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
    <div className="w-full">
      <div className="card p-4 sm:p-6 bg-[--bg-primary] border border-[--border-color]">
        <div className="pb-4">
          <h2 className="text-2xl font-semibold mb-2 text-[--accent-primary] text-center">MCQ Test</h2>
          <p className="text-sm text-[--text-secondary] text-center">
            Choose how many questions you want and then start a focused, full-screen test.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-6 mt-4">
          <div className="w-full max-w-2xl bg-[--bg-secondary] rounded-lg p-4">
            <label className="block text-sm font-medium text-[--text-secondary] mb-2">
              Number of Questions: {effectiveNumQuestions} (max {totalAvailable})
            </label>
            <input
              type="number"
              value={numQuestions}
              onChange={(e) => {
                const inputValue = e.target.value;
                // Allow empty input while typing
                if (inputValue === '') {
                  setNumQuestions('');
                  return;
                }
                const value = parseInt(inputValue, 10);
                if (!isNaN(value) && value >= 1 && value <= Math.min(40, totalAvailable)) {
                  setNumQuestions(value);
                }
              }}
              onBlur={(e) => {
                // Ensure valid value on blur
                const value = parseInt(e.target.value, 10);
                if (isNaN(value) || value < 1) {
                  setNumQuestions(10);
                } else if (value > Math.min(40, totalAvailable)) {
                  setNumQuestions(Math.min(40, totalAvailable));
                }
              }}
              min="1"
              max={Math.min(40, totalAvailable)}
              className="w-full px-3 py-2 rounded-lg bg-[--bg-primary] border border-[--border-color] text-[--text-primary] focus:ring-2 focus:ring-[--accent-primary] transition-all"
              placeholder="Enter number of questions"
            />
          </div>
          <div className="w-full max-w-2xl bg-[--bg-secondary] rounded-lg p-4">
            <label className="block text-sm font-medium text-[--text-secondary] mb-2">
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
          <p className="text-xs text-[--text-tertiary] text-center">
            Available MCQs from this content: <span className="font-semibold text-[--text-secondary]">{totalAvailable}</span>. 
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
          className="fixed inset-0 z-[9999] bg-[#050816] text-white flex flex-col overflow-hidden question-area"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
          onClick={exitTest}
        >
          {/* Single top bar */}
          <div className="w-full flex-shrink-0 bg-white/5 border-b border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">MCQ Test</h2>
            {!testFinished && (
              <div className="flex items-center gap-3 text-sm text-white/80">
                <span>Q{currentIndex + 1}/{testMcqs.length}</span>
                {timerMinutes > 0 && (
                  <span className="font-mono px-2 py-0.5 rounded bg-blue-600/30 border border-blue-400/50">
                    ⏱ {formatTime(timeLeft)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Single scrollable content area — no inner card */}
          <div
            className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-2xl mx-auto">
              {!testFinished ? (
                <>
                  <div className="w-full bg-white/10 rounded-full h-1.5 mb-6">
                    <div
                      className="h-1.5 rounded-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${((currentIndex + 1) / testMcqs.length) * 100}%` }}
                    />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-4">
                    {currentIndex + 1}. {testMcqs[currentIndex]?.question}
                  </h3>
                  <div className="space-y-2 mb-4">
                    {testMcqs[currentIndex]?.options.map((option, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const q = testMcqs[currentIndex];
                      const isSelected = testAnswers[currentIndex] === letter;
                      const isCorrectOption = q?.correctLetter === letter;
                      const hasAnswered = testAnswers[currentIndex] != null;
                      const showCorrectWrong = hasAnswered && (isSelected || isCorrectOption);
                      const isUserCorrect = hasAnswered && isSelected && isCorrectOption;
                      const isUserWrong = hasAnswered && isSelected && !isCorrectOption;
                      const isRevealedCorrect = hasAnswered && !isSelected && isCorrectOption;
                      const optionStyle = !showCorrectWrong
                        ? "bg-white/5 border-white/15 text-white/80 hover:bg-white/10"
                        : isUserCorrect
                        ? "bg-green-600/80 border-green-400 text-white"
                        : isUserWrong
                        ? "bg-red-600/80 border-red-400 text-white"
                        : isRevealedCorrect
                        ? "bg-green-600/50 border-green-400/70 text-white"
                        : "bg-white/5 border-white/15 text-white/60";
                      return (
                        <button
                          key={idx}
                          onClick={() => !hasAnswered && handleOptionSelect(letter)}
                          disabled={hasAnswered}
                          className={`w-full text-left py-2.5 px-3 rounded-lg border text-sm transition-colors ${optionStyle}`}
                        >
                          <span className="font-semibold mr-2">{letter})</span>
                          {option}
                          {hasAnswered && isCorrectOption && (
                            <span className="ml-2 text-xs opacity-90">✓ Correct</span>
                          )}
                          {hasAnswered && isSelected && !isCorrectOption && (
                            <span className="ml-2 text-xs opacity-90">✗ Wrong</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {testAnswers[currentIndex] != null && testMcqs[currentIndex]?.explanation && (
                    <div className="mb-6 p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white/80">
                      <span className="font-medium text-white/90">Explanation: </span>
                      {testMcqs[currentIndex].explanation}
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10">
                    <button
                      onClick={exitTest}
                      className="px-4 py-2 rounded-lg text-white/80 hover:bg-red-500/20 hover:text-red-200 text-sm"
                    >
                      Exit
                    </button>
                    <button
                      onClick={handleNextOrSubmit}
                      disabled={testAnswers[currentIndex] == null}
                      className={`px-5 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 text-sm ${
                        testAnswers[currentIndex] == null ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {currentIndex === testMcqs.length - 1 ? "Submit" : "Next"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <h3 className="text-2xl font-bold text-[--accent-primary] mb-2">Done</h3>
                  <p className="text-4xl font-bold text-green-400 mb-4">
                    {testScore} / {testMcqs.length}
                  </p>
                  <p className="text-sm text-white/70 mb-6 max-w-md mx-auto">
                    {testScore >= testMcqs.length * 0.9
                      ? "Outstanding!"
                      : testScore >= testMcqs.length * 0.7
                      ? "Great job."
                      : testScore >= testMcqs.length * 0.5
                      ? "Good effort — review and try again."
                      : "Keep practicing."}
                  </p>
                  <button
                    onClick={exitTest}
                    className="px-5 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Exit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}