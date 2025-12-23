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
    <div className="w-full pt-2 pb-3 px-1">
      <div
        className="relative rounded-2xl overflow-hidden border border-[#1c2f87] shadow-lg cursor-pointer"
        onClick={() => {
          if (!isExpanded) openSettings();
        }}
      >
        <img
          src={BackgroundImage}
          alt="Pomodoro background"
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#081542]/90 via-[#0b1e70]/85 to-[#0e2d9c]/85 backdrop-blur-md" />
        <div className="relative flex items-center justify-between gap-4 px-4 py-3 text-white">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.45em] text-white/70">
              Pomodoro
            </p>
            <p className="text-2xl font-mono tracking-[0.2em] leading-tight">
              {formatCountdown(timeLeft)}
            </p>
            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-blue-100 mt-1">
              {phase === 'focus' ? 'Focus' : 'Break'} · {currentClock}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStartPause();
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-white text-[#0b1e70] hover:bg-blue-100 transition-colors"
            >
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white border border-white/40 hover:bg-white/10 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 rounded-2xl bg-[#050d2a] border border-[#10205f] p-4 text-white shadow-2xl"
          >
            <h3 className="text-sm font-semibold tracking-[0.3em] uppercase text-blue-200 mb-3">
              Timer Settings
            </h3>

            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-[0.3em] text-blue-100">
                Focus Minutes
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={focusDraft}
                  onChange={(e) => setFocusDraft(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-blue-500/40 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-300 focus:outline-none"
                />
              </label>

              <label className="block text-xs uppercase tracking-[0.3em] text-blue-100">
                Break Minutes
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={breakDraft}
                  onChange={(e) => setBreakDraft(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-blue-500/40 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-300 focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={handleCancel}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-white/70 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-[#0b1e70] hover:bg-blue-100 transition-colors"
              >
                Save & Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PomodoroTimer;