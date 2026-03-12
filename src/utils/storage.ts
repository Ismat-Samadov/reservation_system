import { Difficulty, HighScores } from '@/types/game';

const KEY = 'reflextap_high_scores';

const DEFAULT: HighScores = { easy: 0, medium: 0, hard: 0 };

export function loadHighScores(): HighScores {
  if (typeof window === 'undefined') return { ...DEFAULT };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveHighScore(difficulty: Difficulty, score: number): void {
  if (typeof window === 'undefined') return;
  try {
    const scores = loadHighScores();
    if (score > scores[difficulty]) {
      scores[difficulty] = score;
      localStorage.setItem(KEY, JSON.stringify(scores));
    }
  } catch {
    // storage unavailable — silently ignore
  }
}

export function getHighScore(difficulty: Difficulty): number {
  return loadHighScores()[difficulty];
}
