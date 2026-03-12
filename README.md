# ReflexTap 🎮

> **Drop. Stack. Survive.**

A fast-paced, addictive neon tower-stacking browser game. Tap at the right moment to drop a sliding block onto the stack — only the overlapping part stays. Miss too much and it's game over.

---

## ✨ Features

- **Neon glassmorphism aesthetic** — dark background, glowing blocks, particle effects
- **HTML5 Canvas rendering** — smooth 60fps game loop via `requestAnimationFrame`
- **3 Difficulty levels** — Easy / Medium / Hard, each with different speeds and acceleration
- **Perfect drop system** — land within 7px of exact alignment for bonus points & particles
- **Combo multiplier** — chain perfect drops for escalating bonuses
- **Level progression** — speed ramps up every 8 blocks
- **High scores** — persisted per-difficulty via `localStorage`
- **Synthetic sound effects** — Web Audio API tones, no asset files required; toggle on/off
- **Animated UI** — Framer Motion transitions for all overlays and score updates
- **Full pause / resume** — keyboard and UI button
- **Mobile-first** — touch events, viewport lock, no double-tap zoom

---

## 🕹️ Controls

| Action          | Keyboard           | Mobile / Mouse       |
|-----------------|--------------------|----------------------|
| Drop block      | `Space` / `↓`     | Tap / Click canvas   |
| Pause           | `P` / `Escape`     | ⏸ button            |
| Resume (paused) | `Space` / `Escape` | Tap canvas           |

---

## 🛠️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Framework  | Next.js 15 (App Router)             |
| Language   | TypeScript (strict mode)            |
| Styling    | Tailwind CSS v4                     |
| Animation  | Framer Motion                       |
| Rendering  | HTML5 Canvas API                    |
| Sound      | Web Audio API (synthetic, no files) |
| Storage    | `localStorage` (high scores)        |
| Deploy     | Vercel (zero config)                |

---

## 🚀 Run Locally

```bash
# 1. Clone the repo
git clone <repo-url>
cd stack

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the game loads instantly.

---

## ☁️ Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (first time)
vercel

# Or connect your GitHub repo at vercel.com and push to deploy automatically
```

No environment variables or extra configuration needed.

---

## 🎮 Gameplay

1. Choose a difficulty on the start screen.
2. A neon block slides left and right at the top of the screen.
3. **Tap / press Space** to drop it.
4. Only the part that overlaps the previous block survives — the rest falls off.
5. Land perfectly (within 7px) for a **PERFECT** bonus + particle burst.
6. Chain perfects for a **combo multiplier**.
7. The tower grows upward; the camera follows smoothly.
8. Miss entirely → **Game Over**.
9. Block shrinks below 18px → **Game Over**.

---

## 📂 Project Structure

```
src/
├── app/
│   ├── layout.tsx       # Root layout, metadata, viewport
│   ├── page.tsx         # Entry point → <Game />
│   └── globals.css      # Global styles & Tailwind import
├── components/
│   ├── Game.tsx         # Canvas + overlay orchestrator
│   ├── HUD.tsx          # In-game heads-up display
│   ├── StartScreen.tsx  # Main menu
│   ├── PauseScreen.tsx  # Pause overlay
│   └── GameOverScreen.tsx
├── hooks/
│   └── useGameEngine.ts # Game loop, physics, drop logic, rendering
├── types/
│   └── game.ts          # TypeScript interfaces
└── utils/
    ├── constants.ts     # Tunable game constants
    ├── colors.ts        # Neon palette helpers
    ├── storage.ts       # localStorage high score persistence
    └── sounds.ts        # Web Audio API sound synthesis
```

---

## 📜 License

MIT
