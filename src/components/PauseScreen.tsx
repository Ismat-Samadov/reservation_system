'use client';

import { motion } from 'framer-motion';

interface Props {
  onResume:  () => void;
  onRestart: () => void;
  onMenu:    () => void;
  score:     number;
}

export default function PauseScreen({ onResume, onRestart, onMenu, score }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4"
      style={{ background: 'rgba(2,2,18,0.85)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="w-full max-w-xs rounded-2xl p-8 flex flex-col items-center gap-6"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(0,255,255,0.2)',
          boxShadow: '0 0 40px rgba(0,255,255,0.08)',
        }}
      >
        <div className="text-center">
          <h2
            className="text-4xl font-black font-mono tracking-widest"
            style={{ color: '#00ffff', textShadow: '0 0 20px rgba(0,255,255,0.5)' }}
          >
            PAUSED
          </h2>
          <p className="text-slate-400 text-sm font-mono mt-1">Score: {score}</p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onResume}
            className="w-full py-3 rounded-lg font-mono font-bold text-base
                       transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #00ffff22, #00ffff44)',
              border: '2px solid #00ffff',
              color: '#00ffff',
              boxShadow: '0 0 20px rgba(0,255,255,0.2)',
            }}
          >
            ▶ RESUME
          </button>
          <button
            onClick={onRestart}
            className="w-full py-3 rounded-lg font-mono font-bold text-base
                       transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '2px solid rgba(255,255,255,0.15)',
              color: '#aaa',
            }}
          >
            ↺ RESTART
          </button>
          <button
            onClick={onMenu}
            className="w-full py-3 rounded-lg font-mono font-bold text-base
                       transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '2px solid rgba(255,255,255,0.08)',
              color: '#666',
            }}
          >
            ← MENU
          </button>
        </div>

        <p className="text-slate-600 text-xs font-mono">SPACE / ESC to resume</p>
      </motion.div>
    </motion.div>
  );
}
