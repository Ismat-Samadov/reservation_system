// ─── Core Data Types ──────────────────────────────────────────────────────────

export interface Block {
  x: number;       // left edge in world coords
  y: number;       // top edge in world coords
  width: number;
  height: number;
  color: string;
}

export interface MovingBlock extends Block {
  speed: number;
  direction: 1 | -1;
}

export interface FallingPiece extends Block {
  id: number;
  vy: number;       // vertical velocity
  vx: number;       // horizontal drift
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;    // 1 → 0
  decay: number;
}

export interface PerfectLabel {
  id: number;
  x: number;
  y: number;
  life: number;   // 1 → 0
}

// ─── Game State ───────────────────────────────────────────────────────────────

export type GameStatus = 'menu' | 'playing' | 'paused' | 'gameover';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameConfig {
  difficulty: Difficulty;
  soundEnabled: boolean;
}

export interface HighScores {
  easy: number;
  medium: number;
  hard: number;
}

export interface DropResult {
  success: boolean;
  perfect: boolean;
  newBlock: Block | null;
  fallingPiece: FallingPiece | null;
}

// ─── Mutable Game Data (lives in a ref, not React state) ─────────────────────

export interface GameData {
  status: GameStatus;
  blocks: Block[];
  movingBlock: MovingBlock;
  fallingPieces: FallingPiece[];
  particles: Particle[];
  perfectLabels: PerfectLabel[];
  cameraY: number;          // current smooth camera offset
  targetCameraY: number;    // camera destination
  score: number;
  highScore: number;
  combo: number;
  level: number;
  config: GameConfig;
  canvasWidth: number;
  canvasHeight: number;
  baseY: number;            // world Y of the "ground"
  blockCount: number;       // total blocks placed (for color cycling)
  flashIntensity: number;   // 0..1 for perfect-drop screen flash
  lastFrameTime: number;
}
