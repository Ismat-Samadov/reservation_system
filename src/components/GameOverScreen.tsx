'use client';

import { motion } from 'framer-motion';
import { Difficulty } from '@/types/game';

interface Props {
  score:      number;
  highScore:  number;
  isNewBest:  boolean;
  difficulty: Difficulty;
  onRestart:  () => void;
  onMenu:     () => void;
}

const DIFF_COLORS: Record<Difficulty, string> = {
  easy:   '#00ff88',
  medium: '#00ffff',
  hard:   '#ff00ff',
};

const TIER_LABELS: [number, string][] = [
  [200, 'LEGENDARY'],
  [120, 'MASTER'],
  [70,  'EXPERT'],
  [40,  'SKILLED'],
  [20,  'ROOKIE'],
  [0,   'BEGINNER'],
];

function getTier(score: number) {
  for (const [threshold, label] of TIER_LABELS) {
    if (score >= threshold) return label;
  }
  return 'BEGINNER';
}

export default function GameOverScreen({
  score, highScore, isNewBest, difficulty, onRestart, onMenu,
}: Props) {
  const color = DIFF_COLORS[difficulty];
  const tier  = getTier(score);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4"
      style={{ background: 'rgba(2,2,18,0.9)', backdropFilter: 'blur(10px)' }}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-full max-w-xs rounded-2xl p-8 flex flex-col items-center gap-5"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${color}44`,
          boxShadow: `0 0 50px ${color}18`,
        }}
      >
        {/* Title */}
        <div className="text-center">
          <motion.h2
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
            className="text-4xl font-black font-mono tracking-widest"
            style={{ color: '#ff4444', textShadow: '0 0 20px rgba(255,68,68,0.5)' }}
          >
            GAME OVER
          </motion.h2>
          <p className="text-xs font-mono tracking-widest mt-1"
             style={{ color: `${color}cc` }}>
            {difficulty.toUpperCase()} MODE
          </p>
        </div>

        {/* Score */}
        <div className="w-full text-center py-4 rounded-xl"
             style={{ background: `${color}0d`, border: `1px solid ${color}33` }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.2 }}
            className="text-5xl font-black font-mono"
            style={{ color, textShadow: `0 0 30px ${color}80` }}
          >
            {score}
          </motion.div>
          <p className="text-slate-500 text-xs font-mono mt-1">SCORE</p>
        </div>

        {/* New best / best */}
        {isNewBest ? (
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.35 }}
            className="text-center"
          >
            <span className="text-sm font-mono font-bold tracking-widest"
                  style={{ color: '#ffee00', textShadow: '0 0 15px rgba(255,238,0,0.6)' }}>
              ★ NEW BEST! ★
            </span>
          </motion.div>
        ) : (
          <p className="text-slate-500 text-xs font-mono">
            Best: {highScore}
          </p>
        )}

        {/* Tier */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="text-center"
        >
          <span className="text-base font-mono font-bold tracking-widest"
                style={{ color: `${color}cc` }}>
            {tier}
          </span>
        </motion.div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full mt-1">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onRestart}
            className="w-full py-3 rounded-lg font-mono font-bold text-base"
            style={{
              background: `linear-gradient(135deg, ${color}22, ${color}44)`,
              border: `2px solid ${color}`,
              color,
              boxShadow: `0 0 20px ${color}28`,
            }}
          >
            ↺ PLAY AGAIN
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onMenu}
            className="w-full py-3 rounded-lg font-mono font-bold text-base"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '2px solid rgba(255,255,255,0.1)',
              color: '#777',
            }}
          >
            ← MENU
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
