import { motion } from "framer-motion";
import { IconFolder, IconChat, IconTools } from "../utils/icons";

const MobileNavigation = ({ mobileTab, setMobileTab }) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass p-2 flex justify-center gap-3 z-40 border-t border-[--border-color]">
      <motion.button
        onClick={() => setMobileTab('sources')}
        className={`flex flex-col items-center gap-0.5 w-16 py-1 rounded-lg transition-all duration-200 ${
          mobileTab === 'sources'
            ? 'glass-button text-white shadow-md hover:shadow-lg'
            : 'bg-transparent text-[--text-secondary] hover:text-[--text-primary]'
        }`}
        whileTap={{ scale: 0.95 }}
      >
        <IconFolder className="w-4 h-4" />
        <span className="text-xs font-medium truncate">Sources</span>
      </motion.button>
      <motion.button
        onClick={() => setMobileTab('chat')}
        className={`flex flex-col items-center gap-0.5 w-16 py-1 rounded-lg transition-all duration-200 ${
          mobileTab === 'chat'
            ? 'glass-button text-white shadow-md hover:shadow-lg'
            : 'bg-transparent text-[--text-secondary] hover:text-[--text-primary]'
        }`}
        whileTap={{ scale: 0.95 }}
      >
        <IconChat className="w-4 h-4" />
        <span className="text-xs font-medium">Chat</span>
      </motion.button>
      <motion.button
        onClick={() => setMobileTab('studio')}
        className={`flex flex-col items-center gap-0.5 w-16 py-1 rounded-lg transition-all duration-200 ${
          mobileTab === 'studio'
            ? 'glass-button text-white shadow-md hover:shadow-lg'
            : 'bg-transparent text-[--text-secondary] hover:text-[--text-primary]'
        }`}
        whileTap={{ scale: 0.95 }}
      >
        <IconTools className="w-4 h-4" />
        <span className="text-xs font-medium truncate">Studio</span>
      </motion.button>
    </nav>
  );
};

export default MobileNavigation;