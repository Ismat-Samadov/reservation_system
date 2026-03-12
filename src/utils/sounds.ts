/**
 * Synthetic sound system using the Web Audio API.
 * All sounds are generated programmatically — no asset files required.
 */

let ctx: AudioContext | null = null;
let enabled = true;

function getCtx(): AudioContext | null {
  if (!enabled) return null;
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  // Resume if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.4,
  startTime = 0,
) {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + startTime;
  const osc  = c.createOscillator();
  const gain = c.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, t);

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(gainPeak, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

function playNoise(duration: number, gainPeak = 0.15) {
  const c = getCtx();
  if (!c) return;
  const bufLen = c.sampleRate * duration;
  const buf    = c.createBuffer(1, bufLen, c.sampleRate);
  const data   = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

  const src  = c.createBufferSource();
  const gain = c.createGain();
  const t    = c.currentTime;

  src.buffer = buf;
  gain.gain.setValueAtTime(gainPeak, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  src.connect(gain);
  gain.connect(c.destination);
  src.start(t);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Short click when a block is placed normally. */
export function playDrop() {
  playNoise(0.06, 0.18);
  playTone(220, 0.07, 'square', 0.12);
}

/** Chime arpeggio on a perfect drop. */
export function playPerfect() {
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => playTone(freq, 0.2, 'sine', 0.35, i * 0.07));
}

/** Low thud when a falling piece exits. */
export function playMiss() {
  playTone(80, 0.15, 'sawtooth', 0.3);
  playNoise(0.12, 0.1);
}

/** Descending melody on game over. */
export function playGameOver() {
  const notes = [440, 330, 262, 196];
  notes.forEach((freq, i) => playTone(freq, 0.35, 'sine', 0.4, i * 0.18));
}

/** Rising blip for combo milestones. */
export function playCombo(step: number) {
  const freq = 400 + step * 60;
  playTone(Math.min(freq, 1200), 0.12, 'triangle', 0.28);
}

/** Toggle all sounds on/off. */
export function setSoundEnabled(on: boolean) {
  enabled = on;
}

export function isSoundEnabled() {
  return enabled;
}
