'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  score:     number;
  highScore: number;
  combo:     number;
  level:     number;
  onPause:   () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export default function HUD({
  score, highScore, combo, level, onPause, soundEnabled, onToggleSound,
}: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Top bar */}
      <div className="flex items-start justify-between px-4 pt-4 sm:px-6 sm:pt-5">
        {/* Score */}
        <div className="flex flex-col">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={score}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-3xl sm:text-4xl font-black font-mono leading-none"
              style={{
                color: '#00ffff',
                textShadow: '0 0 20px rgba(0,255,255,0.6)',
              }}
            >
              {score}
            </motion.span>
          </AnimatePresence>
          <span className="text-xs text-slate-500 font-mono tracking-widest mt-0.5">
            BEST {highScore}
          </span>
        </div>

        {/* Center: level */}
        <div className="flex flex-col items-center">
          <span
            className="text-xs font-mono tracking-widest"
            style={{ color: '#ff00ff', textShadow: '0 0 10px rgba(255,0,255,0.5)' }}
          >
            LVL
          </span>
          <span
            className="text-2xl font-black font-mono leading-none"
            style={{ color: '#ff00ff', textShadow: '0 0 15px rgba(255,0,255,0.4)' }}
          >
            {level}
          </span>
        </div>

        {/* Right: controls */}
        <div className="flex gap-2 pointer-events-auto">
          <button
            onClick={onToggleSound}
            className="w-9 h-9 rounded-md border border-slate-700 text-slate-400
                       hover:border-cyan-500 hover:text-cyan-400 transition-colors
                       flex items-center justify-center text-base"
            aria-label="Toggle sound"
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <button
            onClick={onPause}
            className="w-9 h-9 rounded-md border border-slate-700 text-slate-400
                       hover:border-cyan-500 hover:text-cyan-400 transition-colors
                       flex items-center justify-center font-mono font-bold text-sm"
            aria-label="Pause"
          >
            ⏸
          </button>
        </div>
      </div>

      {/* Combo indicator */}
      <AnimatePresence>
        {combo > 1 && (
          <motion.div
            key={combo}
            initial={{ scale: 0.5, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-1/2 -translate-x-1/2 top-20 sm:top-24
                       font-mono font-black text-center"
          >
            <div
              className="text-lg sm:text-xl"
              style={{
                color: '#ffee00',
                textShadow: '0 0 20px rgba(255,238,0,0.8)',
              }}
            >
              {combo}× COMBO!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom: mobile tap hint (first few blocks) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <span className="text-slate-700 text-xs font-mono tracking-widest">
          TAP · SPACE · CLICK
        </span>
      </div>
    </div>
  );
}
