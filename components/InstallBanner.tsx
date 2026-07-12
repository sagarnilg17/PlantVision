'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { T } from '@/lib/theme';

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const SPRING_UI = { type: 'spring' as const, bounce: 0, duration: 0.35 };

export function InstallBanner() {
  const [prompt,    setPrompt]    = useState<InstallEvent | null>(null);
  const [showIOS,   setShowIOS]   = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    const key = 'pwa-install-dismissed';
    if (localStorage.getItem(key)) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
    if (isIOS) { setShowIOS(true); setDismissed(false); return; }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallEvent);
      setDismissed(false);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem('pwa-install-dismissed', '1');
    setDismissed(true);
    setPrompt(null);
    setShowIOS(false);
  };

  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') dismiss();
  };

  return (
    <AnimatePresence>
      {!dismissed && (prompt || showIOS) && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={SPRING_UI}
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            background: T.glassChromeBase,
            backdropFilter: T.glassChromeBlur,
            WebkitBackdropFilter: T.glassChromeBlur,
            borderBottom: T.glassChromeBd,
            boxShadow: T.glassChromeSh,
          }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 14px',
          }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>🌿</span>
            <p style={{ flex: 1, margin: 0, fontSize: 12, fontWeight: 500, color: T.text, lineHeight: 1.4 }}>
              {showIOS
                ? 'Tap Share → Add to Home Screen for the full app'
                : 'Install for offline access — no browser bar'}
            </p>
            {!showIOS && (
              <motion.button
                onClick={install}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.18 }}
                style={{
                  background: T.green, color: '#fff', border: 'none',
                  borderRadius: T.rPill, padding: '5px 12px',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(46,125,50,0.30)',
                }}>
                Install
              </motion.button>
            )}
            <button
              onClick={dismiss}
              aria-label="Dismiss install prompt"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: T.muted, fontSize: 18, lineHeight: 1,
                padding: '2px 4px', flexShrink: 0,
              }}>
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
