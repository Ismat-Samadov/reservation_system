import { Difficulty } from '@/types/game';

// ─── Block Dimensions ─────────────────────────────────────────────────────────
export const BLOCK_HEIGHT = 36;
export const INITIAL_BLOCK_WIDTH_RATIO = 0.52; // fraction of canvas width
export const MIN_BLOCK_WIDTH = 18;             // game over below this
export const PERFECT_THRESHOLD = 7;           // px — snap zone for perfect drop

// ─── Camera ───────────────────────────────────────────────────────────────────
export const CAMERA_TARGET_RATIO = 0.32;  // keep moving block at this fraction from top
export const CAMERA_LERP = 0.09;          // smoothing factor per frame

// ─── Speed Config per Difficulty ─────────────────────────────────────────────
export const SPEED_CONFIG: Record<Difficulty, { base: number; increment: number }> = {
  easy:   { base: 1.6,  increment: 0.018 },
  medium: { base: 2.8,  increment: 0.034 },
  hard:   { base: 4.5,  increment: 0.058 },
};

// ─── Score ────────────────────────────────────────────────────────────────────
export const SCORE_NORMAL  = 10;
export const SCORE_PERFECT = 30;
export const COMBO_BONUS   = 5;   // extra pts per combo step

// ─── Level Thresholds ─────────────────────────────────────────────────────────
export const BLOCKS_PER_LEVEL = 8;

// ─── Physics ──────────────────────────────────────────────────────────────────
export const GRAVITY          = 0.45;   // px / frame²
export const PIECE_DRIFT      = 1.2;    // max horizontal drift for falling pieces
export const PIECE_SPIN_MAX   = 0.08;   // max rotation speed
export const PARTICLE_COUNT   = 16;     // per perfect drop
export const PARTICLE_SPEED   = 5;

// ─── Visuals ──────────────────────────────────────────────────────────────────
export const FLASH_DECAY      = 0.06;   // how fast perfect flash fades
export const LABEL_DECAY      = 0.025;  // "PERFECT!" label fade speed
