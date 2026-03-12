'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import {
  GameData, GameStatus, Difficulty, Block,
  MovingBlock, FallingPiece, Particle, PerfectLabel,
} from '@/types/game';
import {
  BLOCK_HEIGHT, INITIAL_BLOCK_WIDTH_RATIO, MIN_BLOCK_WIDTH,
  PERFECT_THRESHOLD, CAMERA_TARGET_RATIO, CAMERA_LERP,
  SPEED_CONFIG, SCORE_NORMAL, SCORE_PERFECT, COMBO_BONUS,
  BLOCKS_PER_LEVEL, GRAVITY, PIECE_DRIFT, PIECE_SPIN_MAX,
  PARTICLE_COUNT, PARTICLE_SPEED, FLASH_DECAY, LABEL_DECAY,
} from '@/utils/constants';
import { getBlockColor } from '@/utils/colors';
import { getHighScore, saveHighScore } from '@/utils/storage';
import {
  playDrop, playPerfect, playGameOver, playCombo, setSoundEnabled,
} from '@/utils/sounds';

// ─── Factory helpers ──────────────────────────────────────────────────────────

let particleIdCounter = 0;

function makeBaseBlock(canvasWidth: number, canvasHeight: number): Block {
  const w = canvasWidth * INITIAL_BLOCK_WIDTH_RATIO;
  return {
    x:      (canvasWidth - w) / 2,
    y:      canvasHeight - 80 - BLOCK_HEIGHT,
    width:  w,
    height: BLOCK_HEIGHT,
    color:  getBlockColor(0),
  };
}

function makeMovingBlock(
  topBlock: Block,
  canvasWidth: number,
  speed: number,
): MovingBlock {
  return {
    x:         0,
    y:         topBlock.y - BLOCK_HEIGHT,
    width:     topBlock.width,
    height:    BLOCK_HEIGHT,
    color:     getBlockColor(Math.floor(Math.random() * 10) + 1),
    speed,
    direction: 1,
  };
}

function makeParticles(x: number, y: number, color: string, count: number): Particle[] {
  return Array.from({ length: count }, () => {
    const angle  = Math.random() * Math.PI * 2;
    const speed  = PARTICLE_SPEED * (0.4 + Math.random() * 0.6);
    return {
      id:    particleIdCounter++,
      x,
      y,
      vx:    Math.cos(angle) * speed,
      vy:    Math.sin(angle) * speed - 2,
      color,
      size:  2 + Math.random() * 4,
      life:  1,
      decay: 0.025 + Math.random() * 0.02,
    };
  });
}

function buildInitialData(
  difficulty: Difficulty,
  soundEnabled: boolean,
  canvasWidth: number,
  canvasHeight: number,
): GameData {
  const baseBlock   = makeBaseBlock(canvasWidth, canvasHeight);
  const speed       = SPEED_CONFIG[difficulty].base;
  const movingBlock = makeMovingBlock(baseBlock, canvasWidth, speed);
  const highScore   = getHighScore(difficulty);

  return {
    status:        'playing',
    blocks:        [baseBlock],
    movingBlock,
    fallingPieces: [],
    particles:     [],
    perfectLabels: [],
    cameraY:       0,
    targetCameraY: 0,
    score:         0,
    highScore,
    combo:         0,
    level:         1,
    config:        { difficulty, soundEnabled },
    canvasWidth,
    canvasHeight,
    baseY:         canvasHeight - 80,
    blockCount:    1,
    flashIntensity: 0,
    lastFrameTime:  performance.now(),
  };
}

// ─── Drop Logic ───────────────────────────────────────────────────────────────

function processDrop(data: GameData): { data: GameData; miss: boolean } {
  const { movingBlock, blocks, canvasWidth, canvasHeight, config, blockCount } = data;
  const topBlock = blocks[blocks.length - 1];

  const overlapLeft  = Math.max(movingBlock.x, topBlock.x);
  const overlapRight = Math.min(movingBlock.x + movingBlock.width, topBlock.x + topBlock.width);
  const overlapWidth = overlapRight - overlapLeft;

  // ── MISS ──────────────────────────────────────────────────────────────────
  if (overlapWidth <= 0) {
    if (config.soundEnabled) playGameOver();
    saveHighScore(config.difficulty, data.score);
    return {
      data: { ...data, status: 'gameover' },
      miss: true,
    };
  }

  // ── PERFECT ───────────────────────────────────────────────────────────────
  const isPerfect = Math.abs(overlapWidth - topBlock.width) < PERFECT_THRESHOLD;

  const newBlockX     = isPerfect ? topBlock.x     : overlapLeft;
  const newBlockWidth = isPerfect ? topBlock.width  : overlapWidth;
  const newBlockY     = movingBlock.y;
  const newColor      = getBlockColor(blockCount);

  const newBlock: Block = {
    x:      newBlockX,
    y:      newBlockY,
    width:  newBlockWidth,
    height: BLOCK_HEIGHT,
    color:  newColor,
  };

  // Game over if block shrank below minimum
  if (newBlockWidth < MIN_BLOCK_WIDTH && !isPerfect) {
    if (config.soundEnabled) playGameOver();
    saveHighScore(config.difficulty, data.score);
    return { data: { ...data, status: 'gameover' }, miss: true };
  }

  // ── FALLING PIECE ─────────────────────────────────────────────────────────
  const newFallingPieces: FallingPiece[] = [...data.fallingPieces];
  if (!isPerfect) {
    const leftSide    = movingBlock.x < topBlock.x;
    const pieceX      = leftSide ? movingBlock.x : overlapRight;
    const pieceWidth  = movingBlock.width - newBlockWidth;
    if (pieceWidth > 0) {
      newFallingPieces.push({
        id:            particleIdCounter++,
        x:             pieceX,
        y:             newBlockY,
        width:         pieceWidth,
        height:        BLOCK_HEIGHT,
        color:         newColor,
        vy:            -1,
        vx:            leftSide ? -PIECE_DRIFT : PIECE_DRIFT,
        rotation:      0,
        rotationSpeed: (Math.random() - 0.5) * PIECE_SPIN_MAX,
        opacity:       1,
      });
    }
  }

  // ── PARTICLES on perfect ───────────────────────────────────────────────────
  const newParticles: Particle[] = [...data.particles];
  if (isPerfect) {
    const cx = newBlockX + newBlockWidth / 2;
    const cy = newBlockY + BLOCK_HEIGHT / 2;
    newParticles.push(...makeParticles(cx, cy, newColor, PARTICLE_COUNT));
  }

  // ── SCORE ────────────────────────────────────────────────────────────────
  const newCombo   = isPerfect ? data.combo + 1 : 0;
  const basePoints = isPerfect ? SCORE_PERFECT : SCORE_NORMAL;
  const comboBonus = isPerfect ? newCombo * COMBO_BONUS : 0;
  const newScore   = data.score + basePoints + comboBonus;
  const newHigh    = Math.max(newScore, data.highScore);

  if (isPerfect && config.soundEnabled) {
    playPerfect();
    if (newCombo > 1) playCombo(newCombo);
  } else if (config.soundEnabled) {
    playDrop();
  }

  // ── LEVEL ────────────────────────────────────────────────────────────────
  const newBlockCount = blockCount + 1;
  const newLevel      = Math.floor(newBlockCount / BLOCKS_PER_LEVEL) + 1;

  // ── NEW MOVING BLOCK ─────────────────────────────────────────────────────
  const speedCfg     = SPEED_CONFIG[config.difficulty];
  const newSpeed     = speedCfg.base + newBlockCount * speedCfg.increment;
  const newMoving    = makeMovingBlock(newBlock, canvasWidth, newSpeed);

  // ── CAMERA TARGET ─────────────────────────────────────────────────────────
  const targetCameraY = Math.max(
    0,
    canvasHeight * CAMERA_TARGET_RATIO - newMoving.y,
  );

  // ── PERFECT LABELS ───────────────────────────────────────────────────────
  const newLabels: PerfectLabel[] = [...data.perfectLabels];
  if (isPerfect) {
    newLabels.push({
      id:   particleIdCounter++,
      x:    newBlockX + newBlockWidth / 2,
      y:    newBlockY - 10,
      life: 1,
    });
  }

  return {
    miss: false,
    data: {
      ...data,
      blocks:        [...blocks, newBlock],
      movingBlock:   newMoving,
      fallingPieces: newFallingPieces,
      particles:     newParticles,
      perfectLabels: newLabels,
      score:         newScore,
      highScore:     newHigh,
      combo:         newCombo,
      level:         newLevel,
      blockCount:    newBlockCount,
      targetCameraY,
      flashIntensity: isPerfect ? 1 : data.flashIntensity,
    },
  };
}

// ─── Per-frame update ─────────────────────────────────────────────────────────

function updateFrame(data: GameData, dt: number): GameData {
  // Cap dt to prevent physics spiral after tab-switch
  const d = Math.min(dt / 16.67, 3);

  // Moving block
  const mb     = data.movingBlock;
  let newX     = mb.x + mb.speed * mb.direction * d;
  let newDir   = mb.direction;

  if (newX <= 0) {
    newX  = 0;
    newDir = 1;
  } else if (newX + mb.width >= data.canvasWidth) {
    newX  = data.canvasWidth - mb.width;
    newDir = -1;
  }

  const updatedMoving: MovingBlock = { ...mb, x: newX, direction: newDir };

  // Falling pieces
  const updatedPieces: FallingPiece[] = data.fallingPieces
    .map(p => ({
      ...p,
      vy:       p.vy + GRAVITY * d,
      vx:       p.vx,
      y:        p.y + p.vy * d,
      x:        p.x + p.vx * d,
      rotation: p.rotation + p.rotationSpeed * d,
      opacity:  p.y > data.canvasHeight + data.cameraY + 200 ? 0 : p.opacity,
    }))
    .filter(p => p.opacity > 0 && p.y < data.canvasHeight + data.cameraY + 300);

  // Particles
  const updatedParticles: Particle[] = data.particles
    .map(p => ({
      ...p,
      x:    p.x + p.vx * d,
      y:    p.y + p.vy * d,
      vy:   p.vy + 0.1 * d,
      life: p.life - p.decay * d,
    }))
    .filter(p => p.life > 0);

  // Perfect labels
  const updatedLabels: PerfectLabel[] = data.perfectLabels
    .map(l => ({ ...l, y: l.y - 0.8 * d, life: l.life - LABEL_DECAY * d }))
    .filter(l => l.life > 0);

  // Camera smooth follow
  const cameraY = data.cameraY + (data.targetCameraY - data.cameraY) * CAMERA_LERP;

  // Flash decay
  const flashIntensity = Math.max(0, data.flashIntensity - FLASH_DECAY * d);

  return {
    ...data,
    movingBlock:   updatedMoving,
    fallingPieces: updatedPieces,
    particles:     updatedParticles,
    perfectLabels: updatedLabels,
    cameraY,
    flashIntensity,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface GameEngineReturn {
  dataRef: React.MutableRefObject<GameData | null>;
  // UI state that triggers React re-renders
  status:      GameStatus;
  score:       number;
  highScore:   number;
  combo:       number;
  level:       number;
  difficulty:  Difficulty;
  soundEnabled: boolean;
  // Controls
  startGame:   (difficulty: Difficulty) => void;
  drop:        () => void;
  pause:       () => void;
  resume:      () => void;
  restart:     () => void;
  toggleSound: () => void;
  // Canvas ref for the engine to draw into
  canvasRef:   React.MutableRefObject<HTMLCanvasElement | null>;
}

export function useGameEngine(): GameEngineReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dataRef   = useRef<GameData | null>(null);
  const rafRef    = useRef<number>(0);

  // Minimal React state for UI re-renders
  const [status,    setStatus]    = useState<GameStatus>('menu');
  const [score,     setScore]     = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [combo,     setCombo]     = useState(0);
  const [level,     setLevel]     = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [soundEnabled, setSoundEnabledState] = useState(true);

  // Sync a subset of ref data → React state (cheap, avoids full re-render)
  const syncUI = useCallback((d: GameData) => {
    setStatus(d.status);
    setScore(d.score);
    setHighScore(d.highScore);
    setCombo(d.combo);
    setLevel(d.level);
  }, []);

  // ── Rendering ──────────────────────────────────────────────────────────────
  const render = useCallback((data: GameData, ctx: CanvasRenderingContext2D) => {
    const { canvasWidth: W, canvasHeight: H, cameraY, blocks,
            movingBlock, fallingPieces, particles, perfectLabels, flashIntensity } = data;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#020212');
    bg.addColorStop(1, '#060624');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(80,80,200,0.06)';
    ctx.lineWidth   = 1;
    const gridSize  = 60;
    const gridOffY  = cameraY % gridSize;
    for (let x = 0; x <= W; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = -gridOffY; y <= H; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Helper: draw a neon block rect
    const drawBlock = (
      bx: number, by: number, bw: number, bh: number,
      color: string, alpha = 0.4, glowSize = 14, isMoving = false,
    ) => {
      const ry = by + cameraY;
      if (ry > H + 60 || ry + bh < -60) return;

      // Outer glow
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur  = glowSize;

      // Fill
      ctx.fillStyle = color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
      // Build rgba from hex
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fillRect(bx, ry, bw, bh);

      // Top highlight
      const hi = ctx.createLinearGradient(bx, ry, bx, ry + bh * 0.4);
      hi.addColorStop(0, `rgba(255,255,255,0.25)`);
      hi.addColorStop(1, `rgba(255,255,255,0)`);
      ctx.fillStyle = hi;
      ctx.fillRect(bx, ry, bw, bh * 0.4);

      // Border
      ctx.strokeStyle = color;
      ctx.lineWidth   = isMoving ? 2.5 : 2;
      ctx.strokeRect(bx + 0.5, ry + 0.5, bw - 1, bh - 1);

      ctx.restore();
    };

    // Ground shadow line
    ctx.save();
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur  = 20;
    ctx.strokeStyle = 'rgba(0,255,255,0.15)';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(0, data.baseY + cameraY + BLOCK_HEIGHT);
    ctx.lineTo(W, data.baseY + cameraY + BLOCK_HEIGHT);
    ctx.stroke();
    ctx.restore();

    // Draw placed blocks
    blocks.forEach((bl, i) => {
      drawBlock(bl.x, bl.y, bl.width, bl.height, bl.color,
        i === 0 ? 0.55 : 0.38, i === 0 ? 20 : 14);
    });

    // Draw moving block (animated pulse)
    const pulse = 0.38 + 0.1 * Math.sin(performance.now() / 200);
    drawBlock(movingBlock.x, movingBlock.y, movingBlock.width, movingBlock.height,
      movingBlock.color, pulse, 22, true);

    // Draw falling pieces (rotated)
    fallingPieces.forEach(p => {
      const ry  = p.y + cameraY;
      const cx  = p.x + p.width / 2;
      const cy  = ry + p.height / 2;
      ctx.save();
      ctx.globalAlpha = p.opacity * 0.7;
      ctx.translate(cx, cy);
      ctx.rotate(p.rotation);
      drawBlock(-p.width / 2, -p.height / 2, p.width, p.height, p.color, 0.5, 8);
      ctx.restore();
      ctx.globalAlpha = 1;
    });

    // Draw particles
    particles.forEach(pt => {
      const pr = pt.x;
      const py = pt.y + cameraY;
      ctx.save();
      ctx.globalAlpha  = pt.life;
      ctx.shadowColor  = pt.color;
      ctx.shadowBlur   = 8;
      ctx.fillStyle    = pt.color;
      ctx.beginPath();
      ctx.arc(pr, py, pt.size * pt.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // "PERFECT!" labels
    perfectLabels.forEach(l => {
      const ly = l.y + cameraY;
      ctx.save();
      ctx.globalAlpha  = l.life;
      ctx.shadowColor  = '#ffee00';
      ctx.shadowBlur   = 20;
      ctx.fillStyle    = '#ffee00';
      ctx.font         = `bold ${Math.floor(18 + (1 - l.life) * 4)}px monospace`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PERFECT!', l.x, ly);
      ctx.restore();
    });

    // Perfect flash overlay
    if (flashIntensity > 0) {
      ctx.save();
      ctx.globalAlpha = flashIntensity * 0.18;
      ctx.fillStyle   = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }, []);

  // ── Game loop ──────────────────────────────────────────────────────────────
  const loop = useCallback((timestamp: number) => {
    const data = dataRef.current;
    if (!data || data.status !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dt = timestamp - data.lastFrameTime;
    const updated = updateFrame({ ...data, lastFrameTime: timestamp }, dt);
    dataRef.current = updated;

    render(updated, ctx);
    syncUI(updated);

    rafRef.current = requestAnimationFrame(loop);
  }, [render, syncUI]);

  // ── Start game ─────────────────────────────────────────────────────────────
  const startGame = useCallback((diff: Difficulty) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    cancelAnimationFrame(rafRef.current);
    const data = buildInitialData(diff, soundEnabled, W, H);
    dataRef.current = data;
    setDifficulty(diff);
    syncUI(data);

    rafRef.current = requestAnimationFrame(loop);
  }, [loop, syncUI, soundEnabled]);

  // ── Drop ───────────────────────────────────────────────────────────────────
  const drop = useCallback(() => {
    const data = dataRef.current;
    if (!data || data.status !== 'playing') return;

    const { data: newData } = processDrop(data);
    dataRef.current = newData;
    syncUI(newData);

    if (newData.status === 'gameover') {
      cancelAnimationFrame(rafRef.current);
    }
  }, [syncUI]);

  // ── Pause / Resume ─────────────────────────────────────────────────────────
  const pause = useCallback(() => {
    const data = dataRef.current;
    if (!data || data.status !== 'playing') return;
    cancelAnimationFrame(rafRef.current);
    dataRef.current = { ...data, status: 'paused' };
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    const data = dataRef.current;
    if (!data || data.status !== 'paused') return;
    const now = performance.now();
    dataRef.current = { ...data, status: 'playing', lastFrameTime: now };
    setStatus('playing');
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  // ── Restart ────────────────────────────────────────────────────────────────
  const restart = useCallback(() => {
    const data = dataRef.current;
    const diff = data?.config.difficulty ?? difficulty;
    startGame(diff);
  }, [startGame, difficulty]);

  // ── Sound toggle ───────────────────────────────────────────────────────────
  const toggleSound = useCallback(() => {
    const next = !soundEnabled;
    setSoundEnabledState(next);
    setSoundEnabled(next);
    if (dataRef.current) {
      dataRef.current.config.soundEnabled = next;
    }
  }, [soundEnabled]);

  // ── Keyboard events ────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (status === 'playing') drop();
        else if (status === 'paused') resume();
      }
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (status === 'playing') pause();
        else if (status === 'paused') resume();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [status, drop, pause, resume]);

  // ── Canvas resize ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      const data   = dataRef.current;
      const canvas = canvasRef.current;
      if (!data || data.status !== 'playing' || !canvas) return;
      const W   = canvas.offsetWidth;
      const H   = canvas.offsetHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(dpr, dpr);
      dataRef.current = { ...data, canvasWidth: W, canvasHeight: H, baseY: H - 80 };
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return {
    dataRef, canvasRef,
    status, score, highScore, combo, level, difficulty, soundEnabled,
    startGame, drop, pause, resume, restart, toggleSound,
  };
}
