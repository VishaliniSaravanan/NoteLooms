import { useState, useEffect, useRef, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { endpoint } from "../utils/api";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { IconClose } from '../utils/icons';

const renderWithLatex = (text) => {
  if (!text) return null;
  const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/s);
  return parts.map((part, i) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const content = part.slice(2, -2).trim();
      return <BlockMath key={i} math={content} />;
    } else if (part.startsWith('$') && part.endsWith('$') && part.length > 1) {
      const content = part.slice(1, -1).trim();
      return <InlineMath key={i} math={content} />;
    }
    return <span key={i}>{part}</span>;
  });
};

const MemoizedMessageContent = memo(({ text }) => {
  const content = useMemo(() => renderWithLatex(text), [text]);
  return <div className="text-base leading-relaxed whitespace-pre-wrap">{content}</div>;
});
MemoizedMessageContent.displayName = 'MemoizedMessageContent';

function Chatbot({ content, onClose }) {
  const STORAGE_KEY = 'studyAssistantChat';
  
  // Detect if device is mobile/tablet (not desktop) - only show photo/homework mention on mobile/tablet
  const isMobileOrTablet = typeof window !== 'undefined' && window.innerWidth < 1024;
  
  const getInitialGreeting = () => {
    if (isMobileOrTablet) {
      return {
        sender: "bot",
        text: "Hi! I'm your study assistant. I can help with your uploaded notes (including photos), explain concepts, and answer general knowledge questions—always in a clear, focused way. What would you like to work on today?"
      };
    } else {
      return {
        sender: "bot",
        text: "Hi! I'm your study assistant. I can help with your uploaded notes, explain concepts, and answer general knowledge questions—always in a clear, focused way. What would you like to work on today?"
      };
    }
  };
  
  const initialGreeting = getInitialGreeting();

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        if (import.meta.env.DEV) console.error('Error parsing saved messages:', e);
      }
    }
    return [initialGreeting];
  });
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  
  // Popular emojis organized by category
  const emojiCategories = {
    'Frequently Used': ['😀', '😂', '❤️', '👍', '😊', '🎉', '🔥', '💯', '✨', '🙏', '😍', '🥳'],
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙'],
    'Gestures': ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍'],
    'Objects': ['💻', '📱', '⌚', '📷', '🎮', '🎯', '🎨', '📚', '✏️', '📝', '📌', '📍', '🔍', '💡', '🔦', '🕯️', '🧯', '🛢️', '💊', '💉'],
    'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️'],
    'Activities': ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅', '🏒', '🏑', '🏏', '⛳', '🏹', '🎣', '🥊', '🥋', '🎽']
  };

  const saveTimeoutRef = useRef(null);
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      saveTimeoutRef.current = null;
    }, 600);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const insertEmoji = (emoji) => {
    setUserInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleSendMessage = async () => {
    const trimmed = userInput.trim();
    if (!trimmed) return;

    // Simple front-end safety filter for obviously inappropriate queries
    const blockedPatterns = [
      /18\+/i,
      /nsfw/i,
      /porn/i,
      /sex(ual)?/i,
      /nude/i,
      /erotic/i
    ];

    if (blockedPatterns.some((re) => re.test(trimmed))) {
      const newUserMessage = { sender: "user", text: trimmed };
      const safeReply = {
        sender: "bot",
        text:
          "I can't help with that topic. Let's keep things focused on learning, general knowledge, and healthy study or life questions."
      };
      setMessages((prev) => [...prev, newUserMessage, safeReply]);
      setUserInput("");
      return;
    }

    const newUserMessage = { sender: "user", text: trimmed };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setUserInput("");
    setIsLoading(true);

    try {
      const response = await axios.post(endpoint("/chat"), {
        message: userInput,
        history: updatedMessages,
        content: content,
      });

      const botResponse = response.data.response;
      setMessages((prev) => [...prev, { sender: "bot", text: botResponse }]);
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Sorry, I couldn't process your request. Please try again.";
      setMessages((prev) => [...prev, { sender: "bot", text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading) {
      handleSendMessage();
    }
  };

  return (
    <motion.div
      className="chatbot-container rounded-2xl shadow-xl overflow-hidden bg-[--card-bg] border-[--border-color] border max-h-[70vh] flex flex-col w-full relative z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ minHeight: '300px' }}
    >
      <div
        className="chatbot-header p-4 flex justify-between items-center bg-[--bg-secondary] text-[--text-primary] border-b border-[--border-color]"
      >
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-[--accent-primary]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Study Assistant
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[--hover-bg] text-[--text-secondary] hover:text-[--text-primary] transition-colors duration-200 active:scale-95"
            disabled={isLoading}
          >
            <IconClose className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[70%] p-3 rounded-lg break-words ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-white"
              }`}
            >
              <MemoizedMessageContent text={msg.text} />
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[70%] p-3 rounded-lg bg-gray-700 text-white flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div
        className="p-3 sm:p-4 border-t flex items-center gap-2 border-[--border-color] bg-[--bg-secondary] relative z-10"
      >
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              ref={emojiPickerRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-0 mb-2 w-80 sm:w-96 bg-[--card-bg] border border-[--border-color] rounded-xl shadow-2xl z-[60] max-h-96 overflow-hidden flex flex-col"
            >
              <div className="p-3 border-b border-[--border-color] bg-[--bg-secondary] flex items-center justify-between">
                <h4 className="text-sm font-semibold text-[--text-primary]">Emoji Picker</h4>
                <button
                  onClick={() => setShowEmojiPicker(false)}
                  className="text-[--text-secondary] hover:text-[--text-primary] transition-colors"
                >
                  <IconClose className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-3">
                {Object.entries(emojiCategories).map(([category, emojis]) => (
                  <div key={category} className="mb-4">
                    <h5 className="text-xs font-semibold text-[--text-secondary] mb-2 uppercase tracking-wide">
                      {category}
                    </h5>
                    <div className="grid grid-cols-8 gap-1">
                      {emojis.map((emoji, idx) => (
                        <button
                          key={`${category}-${idx}`}
                          onClick={() => insertEmoji(emoji)}
                          className="text-2xl p-2 hover:bg-[--hover-bg] rounded-lg transition-colors cursor-pointer"
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 rounded-lg hover:bg-[--hover-bg] text-[--text-secondary] hover:text-[--text-primary] transition-colors duration-200 flex-shrink-0 z-10 active:scale-95"
          disabled={isLoading}
          aria-label="Open emoji picker"
        >
          <svg className="w-5 h-5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message... "
          className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border outline-none bg-[--bg-primary] border-[--border-color] text-[--text-primary] placeholder:text-[--text-tertiary] focus:ring-2 focus:ring-[--accent-primary] focus:border-[--accent-primary] transition-all duration-200 text-sm sm:text-base"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={handleSendMessage}
          disabled={isLoading || !userInput.trim()}
          className={`px-4 py-2 lg:px-5 lg:py-2.5 rounded-lg font-medium flex items-center gap-1 lg:gap-2 transition-colors duration-200 text-sm lg:text-base active:scale-[0.98] ${
            isLoading || !userInput.trim()
              ? "bg-gray-600 cursor-not-allowed text-gray-400"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
          }`}
        >
          {isLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Sending...</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span className="hidden sm:inline">Send</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

export default Chatbot;