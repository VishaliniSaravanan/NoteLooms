import { motion, AnimatePresence } from "framer-motion";

const MobileMenu = ({ mobileTab, setMobileTab, activeSection, setActiveSection }) => {
  return (
    <AnimatePresence>
      {(mobileTab === "menu" || (window.innerWidth >= 1024 && mobileTab === "menu")) && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-40 flex items-end justify-start lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setMobileTab("chat")}
        >
          <motion.div
            className="w-full bg-[--bg-primary] rounded-tr-3xl p-6 max-h-[80vh] overflow-y-auto"
            style={{ borderTopRightRadius: '1.5rem', borderTopLeftRadius: '0' }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="space-y-3">
              {[
                { id: "summary", label: "Summary" },
                { id: "notes", label: "Notes" },
                { id: "mcqs", label: "MCQs" },
                { id: "flashcards", label: "Flashcards" },
                { id: "image_description", label: "Image Description" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => {
                    setActiveSection(id);
                    setMobileTab("chat");
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                    activeSection === id
                      ? "glass-button text-white shadow-md hover:shadow-lg"
                      : "bg-[--bg-secondary] text-[--text-primary] hover:bg-[--hover-bg]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;