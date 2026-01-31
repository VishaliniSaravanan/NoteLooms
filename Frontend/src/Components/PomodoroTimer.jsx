import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BackgroundImage from '../utils/Background.jpg';

const clampMinutes = (value, fallback = 1, max = 240) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric) || numeric <= 0) return fallback;
  return Math.min(Math.max(Math.round(numeric), 1), max);
};

const formatCountdown = (seconds) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
};

const getCurrentClock = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const PomodoroTimer = () => {
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [phase, setPhase] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [focusDraft, setFocusDraft] = useState('25');
  const [breakDraft, setBreakDraft] = useState('5');
  const [currentClock, setCurrentClock] = useState(getCurrentClock());
  const intervalRef = useRef(null);
  const clockRef = useRef(null);

  useEffect(() => {
    clockRef.current = setInterval(() => {
      setCurrentClock(getCurrentClock());
    }, 1000);
    return () => clearInterval(clockRef.current);
  }, []);

  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const nextPhase = phase === 'focus' ? 'break' : 'focus';
          const nextDuration =
            nextPhase === 'focus' ? focusMinutes * 60 : breakMinutes * 60;
          setPhase(nextPhase);
          return nextDuration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, phase, focusMinutes, breakMinutes]);

  useEffect(() => {
    if (!isRunning && phase === 'focus') {
      setTimeLeft(focusMinutes * 60);
    }
  }, [focusMinutes, isRunning, phase]);

  useEffect(() => {
    if (!isRunning && phase === 'break') {
      setTimeLeft(breakMinutes * 60);
    }
  }, [breakMinutes, isRunning, phase]);

  const handleStartPause = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setPhase('focus');
    setTimeLeft(focusMinutes * 60);
  };

  const openSettings = () => {
    setFocusDraft(String(focusMinutes));
    setBreakDraft(String(breakMinutes));
    setIsExpanded(true);
  };

  const handleSave = () => {
    const newFocus = clampMinutes(focusDraft, focusMinutes);
    const newBreak = clampMinutes(breakDraft, breakMinutes);
    setFocusMinutes(newFocus);
    setBreakMinutes(newBreak);
    if (!isRunning) {
      setTimeLeft((phase === 'focus' ? newFocus : newBreak) * 60);
    }
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setIsExpanded(false);
  };

  return (
    <div className="w-full pt-1 pb-2 px-1">
      <motion.div
        className="relative rounded-xl overflow-hidden border border-[#1c2f87]/80 shadow-md cursor-pointer select-none"
        onClick={() => {
          if (!isExpanded) openSettings();
        }}
        animate={{ scale: isExpanded ? 1.02 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        whileTap={{ scale: 0.98 }}
      >
        <img
          src={BackgroundImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#081542]/85 via-[#0b1e70]/80 to-[#0e2d9c]/80" />
        <div className="relative flex items-center justify-between gap-3 px-3 py-2 text-white">
          <div className="flex items-center gap-2 min-w-0">
            <div className="min-w-0">
              <p className="text-lg font-mono tabular-nums leading-tight truncate">
                {formatCountdown(timeLeft)}
              </p>
              <p className="text-[0.6rem] text-blue-100/90 truncate">
                {phase === 'focus' ? 'Focus' : 'Break'} · {currentClock}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); handleStartPause(); }}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white text-[#0b1e70] hover:bg-blue-100 transition-colors"
            >
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleReset(); }}
              className="px-2 py-1 rounded-md text-[0.65rem] font-semibold text-white/90 border border-white/30 hover:bg-white/10 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
  {isExpanded && (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleCancel}
      />

      {/* Modal */}
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={handleCancel}
      >
        <div
          className="w-full max-w-sm rounded-2xl bg-[#050d2a]/95 border border-[#10205f] p-4 text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs uppercase tracking-wider text-blue-200 mb-3">
            Pomodoro Settings
          </p>

          <div className="flex gap-2 mb-4">
            <label className="flex-1">
              <span className="text-[0.65rem] text-blue-100/80 block mb-1">
                Focus (min)
              </span>
              <input
                type="number"
                min={1}
                max={240}
                value={focusDraft}
                onChange={(e) => setFocusDraft(e.target.value)}
                className="w-full rounded-lg border border-blue-500/40 bg-white/5 px-2 py-2 text-sm text-white focus:border-blue-300 focus:outline-none"
              />
            </label>

            <label className="flex-1">
              <span className="text-[0.65rem] text-blue-100/80 block mb-1">
                Break (min)
              </span>
              <input
                type="number"
                min={1}
                max={60}
                value={breakDraft}
                onChange={(e) => setBreakDraft(e.target.value)}
                className="w-full rounded-lg border border-blue-500/40 bg-white/5 px-2 py-2 text-sm text-white focus:border-blue-300 focus:outline-none"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs font-semibold text-white/70 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white text-[#0b1e70] hover:bg-blue-100"
            >
              Save
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>

    </div>
  );
};

export default PomodoroTimer;