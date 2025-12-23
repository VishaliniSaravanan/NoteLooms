import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { endpoint } from "../utils/api";
import { IconClose, IconArchive, IconChat, IconFolder } from "../utils/icons";
import toast from "react-hot-toast";

const SessionHistory = ({ isOpen, onClose, onLoadSession, currentSessionId, onSessionSaved }) => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  // Listen for session save events to auto-refresh
  useEffect(() => {
    const handleSessionSaved = () => {
      if (isOpen) {
        setTimeout(() => loadSessions(), 500); // Refresh after a short delay
      }
    };
    window.addEventListener('sessionSaved', handleSessionSaved);
    return () => window.removeEventListener('sessionSaved', handleSessionSaved);
  }, [isOpen]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(endpoint('/api/sessions'));
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSession = async (sessionId) => {
    try {
      const response = await axios.get(endpoint(`/api/sessions/${sessionId}`));
      const sessionData = response.data;
      
      if (onLoadSession) {
        onLoadSession(sessionData);
        toast.success("Session loaded successfully");
        onClose();
      }
    } catch (error) {
      console.error("Error loading session:", error);
      console.error("Error details:", error.response?.data);
      toast.error(`Failed to load session: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    
    if (deleteConfirmId !== sessionId) {
      setDeleteConfirmId(sessionId);
      return;
    }

    try {
      await axios.delete(endpoint(`/api/sessions/${sessionId}`));
      toast.success("Session deleted");
      loadSessions();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error deleting session:", error);
      console.error("Error details:", error.response?.data);
      toast.error(`Failed to delete session: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleSaveCurrentSession = async () => {
    try {
      // Get current session data from props or state
      // This will be passed from parent component
      const sessionName = prompt("Enter a name for this session:", `Session ${new Date().toLocaleString()}`);
      if (!sessionName) return;

      // The parent component should provide current data
      if (onLoadSession) {
        // This is a callback to get current state - we'll handle this differently
        toast.error("Please use the save functionality from the main interface");
      }
    } catch (error) {
      console.error("Error saving session:", error);
      toast.error("Failed to save session");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[--bg-primary] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-[--border-color]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[--border-color]">
            <div className="flex items-center gap-3">
              <IconArchive className="w-6 h-6 text-[--accent-primary]" />
              <h2 className="text-2xl font-bold text-[--text-primary]">Session History</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[--bg-secondary] transition-colors"
            >
              <IconClose className="w-5 h-5 text-[--text-secondary]" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--accent-primary]"></div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12">
                <IconArchive className="w-16 h-16 text-[--text-tertiary] mx-auto mb-4 opacity-50" />
                <p className="text-[--text-secondary] text-lg mb-2">No saved sessions</p>
                <p className="text-[--text-tertiary] text-sm">
                  Your uploaded files and chat history will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <motion.div
                    key={session.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleLoadSession(session.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      currentSessionId === session.id
                        ? "border-[--accent-primary] bg-[--accent-primary]/10"
                        : "border-[--border-color] hover:border-[--accent-primary] bg-[--bg-secondary]"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[--text-primary] mb-1">
                          {session.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-[--text-secondary]">
                          <div className="flex items-center gap-1">
                            <IconFolder className="w-4 h-4" />
                            <span>{session.file_count || 0} files</span>
                          </div>
                          {session.has_chat && (
                            <div className="flex items-center gap-1">
                              <IconChat className="w-4 h-4" />
                              <span>Chat</span>
                            </div>
                          )}
                          <span>{formatDate(session.updated_at)}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className={`ml-4 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          deleteConfirmId === session.id
                            ? "bg-red-600 text-white"
                            : "bg-[--bg-primary] text-[--text-secondary] hover:bg-red-600 hover:text-white"
                        }`}
                      >
                        {deleteConfirmId === session.id ? "Confirm" : "Delete"}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[--border-color]">
            <p className="text-xs text-[--text-tertiary] text-center">
              Click on a session to resume your work
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SessionHistory;

