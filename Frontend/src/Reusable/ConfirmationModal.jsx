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
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="glass rounded-2xl p-8 max-w-md w-full shadow-2xl backdrop-blur-xl border border-[--border-color]/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-xl font-semibold mb-4 text-[--text-primary] text-center">Confirm Action</h3>
            <p className="text-[--text-secondary] mb-6 text-center leading-relaxed">{confirmMessage}</p>
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 rounded-lg font-medium text-[--text-primary] bg-[--hover-bg] hover:bg-blue-500/10 transition-colors duration-200 border border-[--border-color] active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-6 py-2 rounded-lg font-medium text-white glass-button transition-colors duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;