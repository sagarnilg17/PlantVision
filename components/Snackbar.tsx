'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { T } from '@/lib/theme';

export type SnackState = { message: string; onUndo?: () => void } | null;

/**
 * Bottom snackbar with an optional Undo. Sits above the nav, auto-dismisses, and
 * announces via aria-live so screen-reader users get confirmation of the action.
 */
export function Snackbar({
  snack, onDismiss, duration = 5000,
}: {
  snack: SnackState;
  onDismiss: () => void;
  duration?: number;
}) {
  useEffect(() => {
    if (!snack) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [snack, onDismiss, duration]);

  return (
    <AnimatePresence>
      {snack && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
          style={{
            position: 'fixed', left: '50%', transform: 'translateX(-50%)',
            bottom: 'calc(env(safe-area-inset-bottom, 4px) + 80px)',
            zIndex: 300, width: 'calc(100% - 32px)', maxWidth: 448,
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px 12px 16px',
            background: T.glassChromeBase,
            backdropFilter: T.glassChromeBlur,
            WebkitBackdropFilter: T.glassChromeBlur,
            border: T.glassChromeBd,
            boxShadow: T.glassPanelSh,
            borderRadius: T.rSm,
          }}>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: T.text }}>
            {snack.message}
          </span>
          {snack.onUndo && (
            <motion.button
              onClick={() => { snack.onUndo!(); onDismiss(); }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.18 }}
              style={{
                flexShrink: 0, padding: '6px 14px',
                background: 'rgba(46,125,50,0.12)', color: T.greenDark,
                border: 'none', borderRadius: T.rPill,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>
              Undo
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
