import { motion, AnimatePresence } from "framer-motion";

const ConfirmationModal = ({ showConfirmModal, confirmMessage, handleConfirm, handleCancel }) => {
  return (
    <AnimatePresence>
      {showConfirmModal && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass rounded-2xl p-8 max-w-md w-full shadow-2xl backdrop-blur-xl border border-[--border-color]/50"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <h3 className="text-xl font-semibold mb-4 text-[--text-primary] text-center">Confirm Action</h3>
            <p className="text-[--text-secondary] mb-6 text-center leading-relaxed">{confirmMessage}</p>
            <div className="flex justify-center gap-4">
              <motion.button
                onClick={handleCancel}
                className="px-6 py-2 rounded-lg font-medium text-[--text-primary] bg-[--hover-bg] hover:bg-blue-500/10 transition-all duration-200 border border-[--border-color]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleConfirm}
                className="px-6 py-2 rounded-lg font-medium text-white glass-button transition-all duration-200 shadow-md hover:shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Confirm
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;