import React, { useState, useEffect } from 'react';
import '../Components/FlashcardCarousel.css';
import { motion } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaRedo } from 'react-icons/fa';

const FlashcardCarousel = ({ flashcards, onReset, numFlashcards, setNumFlashcards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

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

      {/* Inline flashcard: no modal, card visible here */}
      <div className="flex flex-col items-center w-full max-w-lg mx-auto mt-6">
        <div
          className="flashcard perspective-1000 w-full cursor-pointer relative flex-shrink-0 flashcard-fixed-size"
          style={{ height: 'clamp(200px, 42vh, 320px)' }}
          onClick={handleCardFlip}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCardFlip();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`Flashcard ${currentIndex + 1} of ${displayedFlashcards.length}. ${flipped ? 'Showing answer' : 'Showing question'}. Click to flip.`}
        >
          <motion.div
            className="relative w-full h-full preserve-3d"
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <div
              className="absolute inset-0 w-full h-full backface-hidden flex flex-col flashcard-front rounded-2xl"
              style={{ transform: 'rotateY(0deg)' }}
            >
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-center items-center p-4 text-center">
                <span className="text-base sm:text-lg font-medium text-[--text-primary] break-words w-full px-2">{currentFlashcard.front}</span>
                <span className="text-xs text-[--text-secondary] opacity-70 mt-2 block">Click to flip</span>
              </div>
            </div>
            <div
              className="absolute inset-0 w-full h-full backface-hidden flex flex-col flashcard-back rounded-2xl"
              style={{ transform: 'rotateY(180deg)' }}
            >
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-center items-center p-4 text-center">
                <span className="text-sm sm:text-base font-medium text-[--text-secondary] break-words w-full px-2">{currentFlashcard.back}</span>
                <span className="text-xs text-[--text-secondary] opacity-70 mt-2 block">Click to flip back</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-4 w-full">
          <button
            type="button"
            onClick={prevCard}
            disabled={displayedFlashcards.length <= 1}
            aria-label="Previous flashcard"
            className="p-2 rounded-lg bg-[--hover-bg] text-[--text-primary] disabled:opacity-30 hover:bg-[--border-color] transition-colors"
          >
            <FaChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-[--text-secondary]">
            Card {currentIndex + 1} of {displayedFlashcards.length}
          </span>
          <button
            type="button"
            onClick={nextCard}
            disabled={displayedFlashcards.length <= 1}
            aria-label="Next flashcard"
            className="p-2 rounded-lg bg-[--hover-bg] text-[--text-primary] disabled:opacity-30 hover:bg-[--border-color] transition-colors"
          >
            <FaChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardCarousel;