import Game from '@/components/Game';

/**
 * Root page — full-viewport game canvas.
 * All layout, controls, and overlays are managed inside <Game />.
 */
export default function Home() {
  return (
    <main className="w-screen h-screen overflow-hidden">
      <Game />
    </main>
  );
}
