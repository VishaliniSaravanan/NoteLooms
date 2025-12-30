import React, { useState, useEffect } from 'react';
import '../Components/FlashcardCarousel.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaRedo } from 'react-icons/fa';

const FlashcardCarousel = ({ flashcards, onReset, numFlashcards, setNumFlashcards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, flashcards.length));
    setFlipped(false);
  };

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, flashcards.length)) % Math.max(1, flashcards.length));
    setFlipped(false);
  };

  const handleNumFlashcardsChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (value >= 1 && value <= Math.min(50, flashcards.length)) {
      setNumFlashcards(value);
      setCurrentIndex(0);
      setFlipped(false);
    }
  };

  const handleCardFlip = () => {
    setFlipped(!flipped);
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isModalOpen]);

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="text-center p-6 text-[--text-secondary]">
        No flashcards available. Please upload content to generate flashcards.
      </div>
    );
  }

  const displayedFlashcards = flashcards.slice(0, numFlashcards);
  const currentFlashcard = displayedFlashcards[currentIndex] || { front: "No Question Available", back: "No Answer Available" };

  return (
    <div className="carousel-container w-full max-w-4xl mx-auto px-2 sm:px-4 lg:px-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 sm:mb-6 p-2 sm:p-0">
        <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
          <label htmlFor="numFlashcards" className="text-xs sm:text-sm font-medium text-[--text-secondary] whitespace-nowrap flex-shrink-0">
            Cards to show:
          </label>
          <input
            type="range"
            id="numFlashcards"
            value={numFlashcards}
            onChange={handleNumFlashcardsChange}
            min="1"
            max={Math.min(50, flashcards.length)}
            className="flex-1 min-w-0 h-2 bg-[--border-color] rounded-lg appearance-none cursor-pointer"
          />
          <input
            type="number"
            value={numFlashcards}
            onChange={(e) => {
              const inputValue = e.target.value;
              // Allow empty input while typing
              if (inputValue === '') {
                setNumFlashcards('');
                return;
              }
              const value = parseInt(inputValue, 10);
              if (!isNaN(value) && value >= 1 && value <= Math.min(50, flashcards.length)) {
                setNumFlashcards(value);
                setCurrentIndex(0);
                setFlipped(false);
              }
            }}
            onBlur={(e) => {
              // Ensure valid value on blur
              const value = parseInt(e.target.value, 10);
              if (isNaN(value) || value < 1) {
                setNumFlashcards(1);
              } else if (value > Math.min(50, flashcards.length)) {
                setNumFlashcards(Math.min(50, flashcards.length));
              }
            }}
            min="1"
            max={Math.min(50, flashcards.length)}
            className="w-20 sm:w-24 text-xs font-mono bg-[--hover-bg] px-2 py-1 rounded border border-[--border-color] text-[--text-primary] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-shrink-0"
          />
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-[--hover-bg] hover:bg-[--accent-primary]/10 text-[--text-primary] transition-colors w-full sm:w-auto justify-center"
        >
          <FaRedo className="text-[--accent-primary]" />
          Reset Flashcards
        </button>
      </div>
      {/* Flashcard Preview Button */}
      <div className="flex justify-center">
        <motion.button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 rounded-lg font-medium glass-button text-white transition-all duration-200 shadow-sm hover:shadow-md"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Tap to view flash cards
        </motion.button>
      </div>
      
      <div className="flex justify-center mt-4 text-xs text-[--text-secondary]">
        {displayedFlashcards.length} {displayedFlashcards.length === 1 ? 'card' : 'cards'} available
      </div>

      {/* Flashcard Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsModalOpen(false)}
        >
          <motion.div
            className="relative w-full max-w-lg mx-auto px-4 sm:px-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute -top-10 right-4 sm:right-6 text-white hover:text-gray-300 transition-colors z-10"
              aria-label="Close flashcard"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="relative flex justify-center">
              <motion.div
                key={currentIndex}
                className="flashcard perspective-1000 w-full max-w-full h-64 sm:h-80 md:h-96 cursor-pointer relative"
                onClick={handleCardFlip}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardFlip();
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Flashcard ${currentIndex + 1} of ${displayedFlashcards.length}. ${flipped ? 'Showing answer' : 'Showing question'}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  className="relative w-full h-full preserve-3d"
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  <div
                    className="absolute w-full h-full backface-hidden flex flex-col justify-center items-center p-4 sm:p-6 flashcard-front"
                    style={{ transform: 'rotateY(0deg)' }}
                  >
                    <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-[--text-primary] text-center w-full break-words relative overflow-hidden" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: '0.5rem' }}>
                      <span className="w-full px-2">{currentFlashcard.front}</span>
                      <div className="absolute bottom-2 right-2 text-xs text-[--text-secondary] opacity-70 pointer-events-none">
                        Tap to flip
                      </div>
                    </div>
                  </div>
                  <div
                    className="absolute w-full h-full backface-hidden flex flex-col justify-center items-center p-4 sm:p-6 flashcard-back"
                    style={{ transform: 'rotateY(180deg)' }}
                  >
                    <div className="text-sm sm:text-base md:text-lg lg:text-xl font-medium text-[--text-secondary] w-full break-words relative overflow-hidden" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: '0.5rem' }}>
                      <span className="w-full px-2">{currentFlashcard.back}</span>
                      <div className="absolute bottom-2 right-2 text-xs text-[--text-secondary] opacity-70 pointer-events-none">
                        Tap to flip back
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
            
            {/* Navigation arrows at the bottom */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevCard();
                }}
                disabled={displayedFlashcards.length <= 1}
                aria-label="Previous flashcard"
                className="text-white hover:text-gray-300 transition-colors disabled:opacity-30 flex items-center justify-center"
              >
                <FaChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>
              
              <div className="text-sm text-white">
                Card {currentIndex + 1} of {displayedFlashcards.length}
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextCard();
                }}
                disabled={displayedFlashcards.length <= 1}
                aria-label="Next flashcard"
                className="text-white hover:text-gray-300 transition-colors disabled:opacity-30 flex items-center justify-center"
              >
                <FaChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FlashcardCarousel;