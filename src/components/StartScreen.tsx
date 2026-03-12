'use client';

import { motion } from 'framer-motion';
import { Difficulty } from '@/types/game';
import { getHighScore } from '@/utils/storage';

interface Props {
  onStart: (difficulty: Difficulty) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const DIFFICULTIES: { key: Difficulty; label: string; desc: string; color: string }[] = [
  { key: 'easy',   label: 'EASY',   desc: 'Slow & forgiving',   color: '#00ff88' },
  { key: 'medium', label: 'MEDIUM', desc: 'Balanced challenge',  color: '#00ffff' },
  { key: 'hard',   label: 'HARD',   desc: 'Fast & unforgiving',  color: '#ff00ff' },
];

export default function StartScreen({ onStart, soundEnabled, onToggleSound }: Props) {
  const scores = {
    easy:   getHighScore('easy'),
    medium: getHighScore('medium'),
    hard:   getHighScore('hard'),
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center mb-8"
      >
        <h1 className="text-6xl sm:text-7xl font-black tracking-widest font-mono"
          style={{
            background: 'linear-gradient(135deg, #00ffff, #ff00ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 20px rgba(0,255,255,0.5))',
          }}
        >
          REFLEX
        </h1>
        <h2 className="text-4xl sm:text-5xl font-black tracking-widest font-mono"
          style={{
            background: 'linear-gradient(135deg, #ff00ff, #00ff88)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 15px rgba(255,0,255,0.5))',
          }}
        >
          TAP
        </h2>
        <p className="text-slate-400 text-sm tracking-widest mt-2 font-mono">
          DROP · STACK · SURVIVE
        </p>
      </motion.div>

      {/* Difficulty buttons */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        {DIFFICULTIES.map(({ key, label, desc, color }, i) => (
          <motion.button
            key={key}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onStart(key)}
            className="relative w-full py-4 px-6 rounded-lg font-mono font-bold text-lg
                       flex items-center justify-between group overflow-hidden"
            style={{
              border: `2px solid ${color}`,
              background: `${color}14`,
              boxShadow: `0 0 20px ${color}22`,
            }}
          >
            {/* Hover glow */}
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: `${color}18` }}
            />
            <div className="flex flex-col items-start relative z-10">
              <span style={{ color }}>{label}</span>
              <span className="text-xs text-slate-400 font-normal">{desc}</span>
            </div>
            <div className="flex flex-col items-end relative z-10">
              <span className="text-xs text-slate-500 font-normal">BEST</span>
              <span className="text-sm" style={{ color }}>
                {scores[key] > 0 ? scores[key] : '—'}
              </span>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Controls hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center text-slate-500 text-xs font-mono space-y-1"
      >
        <p>SPACE / TAP — drop block</p>
        <p>P / ESC — pause</p>
      </motion.div>

      {/* Sound toggle */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={onToggleSound}
        className="mt-6 px-4 py-2 rounded-md font-mono text-xs border border-slate-700
                   text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
      >
        {soundEnabled ? '🔊 SOUND ON' : '🔇 SOUND OFF'}
      </motion.button>
    </div>
  );
}
