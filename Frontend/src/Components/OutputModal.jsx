import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OutputModal({ isOpen, onClose, children, title }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="glass rounded-none sm:rounded-2xl w-full h-screen sm:h-auto sm:max-h-[90vh] sm:max-w-4xl overflow-y-auto p-4 sm:p-6 relative border-[--border-color]"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 400,
              mass: 0.5
            }}
            onClick={e => e.stopPropagation()}
            style={{
              WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
              overscrollBehavior: 'contain', // Better pull-to-refresh behavior
            }}
          >
            {/* Close button - more accessible and touch-friendly */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center bg-[--hover-bg] text-[--text-secondary] hover:text-[--accent-primary] transition-colors z-20"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Header with title */}
            <div className="sticky top-0 bg-[--glass-bg] pt-2 pb-3 mb-4 z-10 border-b border-[--border-color] -mx-4 px-4 sm:mx-0 sm:px-0 sm:rounded-t-lg">
              <h3 className="text-lg sm:text-xl font-semibold text-[--text-primary] pr-6">
                {title}
              </h3>
            </div>
            
            {/* Content */}
            <div className="space-y-4 pb-4 sm:pb-1 -mx-1 px-1">
              {children}
            </div>
            
            {/* Bottom padding for better scrolling on mobile */}
            <div className="h-12 sm:h-4" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}