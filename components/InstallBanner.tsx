'use client';

import { useState, useEffect } from 'react';
import { T } from '@/lib/theme';

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallBanner() {
  const [prompt,    setPrompt]    = useState<InstallEvent | null>(null);
  const [showIOS,   setShowIOS]   = useState(false);
  const [dismissed, setDismissed] = useState(true); // start hidden until we know

  useEffect(() => {
    // Already installed as PWA — don't show anything
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const key = 'pwa-install-dismissed';
    if (localStorage.getItem(key)) return;

    // iOS: beforeinstallprompt never fires; show manual instructions
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
    if (isIOS) {
      setShowIOS(true);
      setDismissed(false);
      return;
    }

    // Android/Chrome: wait for the native prompt event
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

  if (dismissed || (!prompt && !showIOS)) return null;

  return (
    <div style={{
      marginBottom: 16,
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: T.r, padding: 16,
      boxShadow: T.shadow,
      display: 'flex', gap: 14, alignItems: 'flex-start',
      animation: 'fadeUp 0.22s ease',
    }}>
      {/* Icon */}
      <div style={{ width: 40, height: 40, borderRadius: 12, background: T.greenLight, border: `1px solid ${T.greenMid}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
        🌿
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: T.text }}>
          Install Plant Care app
        </p>
        {showIOS ? (
          <p style={{ margin: 0, fontSize: 12, color: T.sub, lineHeight: 1.55 }}>
            Tap <strong>Share</strong> → <strong>Add to Home Screen</strong> in Safari to install
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: 12, color: T.sub, lineHeight: 1.55 }}>
            Get the full app experience — works offline, no browser bar
          </p>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
        {!showIOS && (
          <button onClick={install} style={{
            background: T.green, color: '#fff', border: 'none',
            borderRadius: T.rPill, padding: '7px 14px',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(46,125,50,0.35)',
          }}>
            Install
          </button>
        )}
        <button onClick={dismiss} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: T.muted, fontSize: 18, lineHeight: 1, padding: '4px 6px',
        }}>
          ×
        </button>
      </div>
    </div>
  );
}
