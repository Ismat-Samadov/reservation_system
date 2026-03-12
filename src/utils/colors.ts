// ─── Neon Colour Palette ──────────────────────────────────────────────────────

export const BLOCK_COLORS: string[] = [
  '#00ffff', // cyan
  '#ff00ff', // magenta
  '#00ff88', // green
  '#ff6600', // orange
  '#aa00ff', // violet
  '#ffee00', // yellow
  '#ff0066', // hot-pink
  '#00aaff', // sky-blue
  '#ff4444', // red
  '#44ffaa', // seafoam
];

export function getBlockColor(index: number): string {
  return BLOCK_COLORS[index % BLOCK_COLORS.length];
}

/** Return a slightly transparent fill from a hex colour */
export function blockFill(hex: string, alpha = 0.35): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Lighter version of a colour for highlights */
export function lighten(hex: string, amount = 80): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  return `rgb(${r},${g},${b})`;
}

export const BG_TOP    = '#020212';
export const BG_BOTTOM = '#060620';
export const GRID_LINE = 'rgba(80,80,180,0.07)';
