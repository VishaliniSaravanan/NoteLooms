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
    <div className="carousel-container w-full max-w-4xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 sm:mb-6 p-2 sm:p-0">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="numFlashcards" className="text-xs sm:text-sm font-medium text-[--text-secondary] whitespace-nowrap">
            Cards to show:
          </label>
          <input
            type="range"
            id="numFlashcards"
            value={numFlashcards}
            onChange={handleNumFlashcardsChange}
            min="1"
            max={Math.min(50, flashcards.length)}
            className="flex-1 h-2 bg-[--border-color] rounded-lg appearance-none cursor-pointer"
          />
          <input
            type="number"
            value={numFlashcards}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value) && value >= 1 && value <= Math.min(50, flashcards.length)) {
                setNumFlashcards(value);
                setCurrentIndex(0);
                setFlipped(false);
              }
            }}
            min="1"
            max={Math.min(50, flashcards.length)}
            className="w-16 text-xs font-mono bg-[--hover-bg] px-2 py-1 rounded border border-[--border-color] text-[--text-primary] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      <div className="relative w-full max-w-md mx-auto">
        <button
          onClick={prevCard}
          disabled={displayedFlashcards.length <= 1}
          aria-label="Previous flashcard"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-6 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[--card-bg] shadow-md flex items-center justify-center text-[--text-primary] hover:bg-[--hover-bg] transition-colors"
        >
          <FaChevronLeft className="w-4 h-4" />
        </button>
        <motion.div
          key={currentIndex}
          className="flashcard perspective-1000 w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl h-48 sm:h-64 md:h-80 lg:h-96 xl:h-[24rem] cursor-pointer mx-auto relative"
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
          style={{ maxWidth: '100%', margin: '0 auto' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="relative w-full h-full preserve-3d"
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <div
              className="absolute w-full h-full backface-hidden flex flex-col justify-center items-center p-4 flashcard-front"
              style={{ transform: 'rotateY(0deg)' }}
            >
              <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-[--text-primary] text-center p-3 w-full break-words relative" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
                <span className="px-3 py-1">{currentFlashcard.front}</span>
                <div className="absolute bottom-2 right-2 text-xs text-[--text-secondary] opacity-70 pointer-events-none">
                  Tap to flip
                </div>
              </div>
            </div>
            <div
              className="absolute w-full h-full backface-hidden flex flex-col justify-center items-center p-4 flashcard-back"
              style={{ transform: 'rotateY(180deg)' }}
            >
              <div className="text-sm sm:text-base md:text-lg lg:text-xl font-medium text-[--text-secondary] p-3 w-full break-words relative" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
                <span className="px-3 py-1">{currentFlashcard.back}</span>
                <div className="absolute bottom-2 right-2 text-xs text-[--text-secondary] opacity-70 pointer-events-none">
                  Tap to flip back
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
        <button
          onClick={nextCard}
          disabled={displayedFlashcards.length <= 1}
          aria-label="Next flashcard"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-6 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[--card-bg] shadow-md flex items-center justify-center text-[--text-primary] hover:bg-[--hover-bg] transition-colors"
        >
          <FaChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex justify-center mt-4 text-xs text-[--text-secondary]">
        Card {currentIndex + 1} of {displayedFlashcards.length}
      </div>
    </div>
  );
};

export default FlashcardCarousel;