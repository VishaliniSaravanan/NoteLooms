import { motion, AnimatePresence } from "framer-motion";

const MobileMenu = ({ mobileTab, setMobileTab, activeSection, setActiveSection }) => {
  // Button is at bottom: calc(env(safe-area-inset-bottom) + 1.5rem)
  // Button height is 3.5rem (w-14 h-14 = 56px)
  // Menu should appear above the button with some spacing
  // Total: env(safe-area-inset-bottom) + 1.5rem + 3.5rem + 0.5rem = env(safe-area-inset-bottom) + 5.5rem
  
  return (
    <AnimatePresence>
      {(mobileTab === "menu" || (window.innerWidth >= 1024 && mobileTab === "menu")) && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileTab("chat")}
          />
          {/* Menu Popup - appears above buttons */}
          <motion.div
            className="fixed left-4 right-4 bg-[--bg-primary] rounded-2xl p-6 max-h-[70vh] overflow-y-auto z-50 lg:hidden glass shadow-2xl border border-[--border-color]"
            style={{ 
              bottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)',
            }}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
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
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;