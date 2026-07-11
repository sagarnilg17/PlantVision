import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { MotionProvider } from '@/components/MotionProvider';

const sans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans', weight: ['400', '500', '600', '700', '800'] });

export const metadata: Metadata = {
  title: 'Plant Care',
  description: 'Identify your plants, track watering, and diagnose health issues.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Plant Care',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2E7D32',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body>
        {/* Fixed gradient canvas — iOS-safe alternative to background-attachment: fixed */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 0,
            background: 'linear-gradient(170deg, #C8E6C9 0%, #DFF0E0 22%, #EDF7EE 55%, #F6FAF6 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Content sits above the gradient canvas */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <MotionProvider>{children}</MotionProvider>
        </div>
      </body>
    </html>
  );
}
