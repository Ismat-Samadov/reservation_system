import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ReflexTap — Drop. Stack. Survive.',
  description:
    'Drop falling blocks perfectly to build an infinite neon tower. ' +
    'Addictive browser game built with Next.js, TypeScript, and Canvas.',
  keywords: ['game', 'stack', 'reflex', 'arcade', 'mobile', 'browser game'],
  authors: [{ name: 'StackArcade' }],
  openGraph: {
    title: 'ReflexTap',
    description: 'Drop. Stack. Survive.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,   // prevent zoom on double-tap (mobile)
  userScalable: false,
  themeColor: '#020212',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="antialiased h-full overflow-hidden bg-[#020212]">
        {children}
      </body>
    </html>
  );
}
