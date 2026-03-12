'use client';

/**
 * Game.tsx — Main game component.
 * Renders the canvas, manages overlay screens, and wires up input events.
 */

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameEngine } from '@/hooks/useGameEngine';
import { Difficulty } from '@/types/game';
import StartScreen    from '@/components/StartScreen';
import HUD            from '@/components/HUD';
import PauseScreen    from '@/components/PauseScreen';
import GameOverScreen from '@/components/GameOverScreen';

export default function Game() {
  const {
    canvasRef,
    dataRef,
    status,
    score,
    highScore,
    combo,
    level,
    difficulty,
    soundEnabled,
    startGame,
    drop,
    pause,
    resume,
    restart,
    toggleSound,
  } = useGameEngine();

  // Track whether current score is a new best
  const [isNewBest, setIsNewBest] = useState(false);

  useEffect(() => {
    if (status === 'gameover') {
      setIsNewBest(score >= highScore && score > 0);
    }
  }, [status, score, highScore]);

  // Touch handler — single tap on canvas drops the block
  const handleCanvasTap = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      if (status === 'playing') drop();
      else if (status === 'paused') resume();
    },
    [status, drop, resume],
  );

  const handleMenu = useCallback(() => {
    // Reset to menu by calling a page-level state trick:
    // We leverage the fact that status 'menu' is set only on load.
    // We'll navigate to menu by reloading game state to 'menu'.
    if (dataRef.current) {
      dataRef.current.status = 'menu';
    }
    // Force React re-render by starting a dummy state cycle
    // (useGameEngine syncs status from the ref via syncUI; here we patch directly)
    window.location.reload();
  }, [dataRef]);

  return (
    <div className="relative w-full h-full bg-[#020212] overflow-hidden select-none touch-none">
      {/* ── Canvas ─────────────────────────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onMouseDown={status === 'playing' || status === 'paused' ? handleCanvasTap : undefined}
        onTouchStart={status === 'playing' || status === 'paused' ? handleCanvasTap : undefined}
        aria-label="ReflexTap game canvas"
      />

      {/* ── Overlay Screens ────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {status === 'menu' && (
          <StartScreen
            key="start"
            onStart={(diff: Difficulty) => {
              setIsNewBest(false);
              startGame(diff);
            }}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
          />
        )}

        {status === 'paused' && (
          <PauseScreen
            key="pause"
            score={score}
            onResume={resume}
            onRestart={() => { setIsNewBest(false); restart(); }}
            onMenu={handleMenu}
          />
        )}

        {status === 'gameover' && (
          <GameOverScreen
            key="gameover"
            score={score}
            highScore={highScore}
            isNewBest={isNewBest}
            difficulty={difficulty}
            onRestart={() => { setIsNewBest(false); restart(); }}
            onMenu={handleMenu}
          />
        )}
      </AnimatePresence>

      {/* ── In-game HUD (only while playing) ──────────────────────────── */}
      {status === 'playing' && (
        <HUD
          score={score}
          highScore={highScore}
          combo={combo}
          level={level}
          onPause={pause}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />
      )}
    </div>
  );
}
