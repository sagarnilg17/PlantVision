'use client';

import { useMemo, useState } from 'react';
import {
  motion, AnimatePresence,
  useMotionValue, useTransform,
} from 'framer-motion';
import { T } from '@/lib/theme';
import { getPersonalizedTips, type PermaTip, type PlantSummary } from '@/lib/permacultureTips';

const SPRING = { type: 'spring' as const, stiffness: 360, damping: 38 };
const STACK_VISIBLE = 3;

// ─── Card face ────────────────────────────────────────────────────────────────

function CardFace({ tip, stackIndex }: { tip: PermaTip; stackIndex: number }) {
  const isTop = stackIndex === 0;
  return (
    <div style={{
      background: tip.bg,
      border: `1.5px solid ${tip.border}`,
      borderRadius: T.rLg,           // M3 large shape = 28px
      padding: 20,
      height: 174,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      overflow: 'hidden',
      boxShadow: isTop
        ? '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05)'
        : '0 2px 8px rgba(0,0,0,0.04)',
      transition: 'box-shadow 0.2s',
    }}>

      {/* Label + icon row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 800,
          color: tip.labelColor,
          textTransform: 'uppercase', letterSpacing: 0.8,
          background: 'rgba(255,255,255,0.55)',
          borderRadius: 8, padding: '3px 8px',
          flexShrink: 0,
        }}>
          {tip.type === 'companion'
            ? '🤝 Companions'
            : `P${tip.principle} · ${tip.principleShort}`}
        </span>
        <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{tip.icon}</span>
      </div>

      {/* Title */}
      <p style={{
        margin: 0, fontSize: 15, fontWeight: 800,
        color: '#1a1a1a', lineHeight: 1.3, letterSpacing: -0.3,
      }}>
        {tip.title}
      </p>

      {/* Body */}
      <p style={{
        margin: 0, fontSize: 12.5, color: '#525c52',
        lineHeight: 1.65, flex: 1,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      } as React.CSSProperties}>
        {tip.body}
      </p>

      {/* Companion tags */}
      {tip.type === 'companion' && tip.plants && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {tip.plants.slice(0, 3).map(p => (
            <span key={p} style={{
              fontSize: 10, fontWeight: 700, color: tip.labelColor,
              background: 'rgba(255,255,255,0.7)',
              border: `1px solid ${tip.border}`,
              borderRadius: 50, padding: '2px 9px',
            }}>{p}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Single swipeable card ─────────────────────────────────────────────────────

function SwipeCard({
  tip, stackIndex, onDismiss,
}: {
  tip: PermaTip;
  stackIndex: number;
  onDismiss: (() => void) | undefined;
}) {
  const isTop = stackIndex === 0;

  // Spring physics for drag feedback
  const x       = useMotionValue(0);
  const rotate  = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-160, -80, 0, 80, 160], [0, 1, 1, 1, 0]);

  // Stack position: front card sits highest, back cards are scaled + shifted down
  const scale   = 1 - stackIndex * 0.048;
  const yOffset = stackIndex * 12;
  const zIndex  = STACK_VISIBLE - stackIndex + 1;

  // Swipe direction hint colours (shown at extremes of drag)
  const leftHint  = useTransform(x, [-120, -40], [1, 0]);
  const rightHint = useTransform(x, [40, 120], [0, 1]);

  return (
    <motion.div
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.92}
      onDragEnd={(_, info) => {
        if (isTop && Math.abs(info.offset.x) > 80) onDismiss?.();
      }}
      initial={{ scale: scale * 0.95, y: yOffset + 22, opacity: 0 }}
      animate={{ scale, y: yOffset, opacity: 1, zIndex }}
      exit={{ x: 380, rotate: 24, opacity: 0, transition: { duration: 0.28, ease: [0.43, 0.13, 0.23, 0.96] } }}
      transition={SPRING}
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        ...(isTop ? { x, rotate, opacity } : {}),
        cursor: isTop ? 'grab' : 'default',
        userSelect: 'none',
        touchAction: 'pan-y',
        WebkitUserSelect: 'none',
      } as React.CSSProperties}
      whileTap={isTop ? { scale: 1.015, cursor: 'grabbing' } : {}}
    >
      {/* Swipe direction hint overlays */}
      {isTop && (
        <>
          <motion.div style={{
            position: 'absolute', inset: 0, borderRadius: T.rLg, zIndex: 1,
            background: 'rgba(186,26,26,0.12)',
            pointerEvents: 'none', opacity: leftHint,
          }} />
          <motion.div style={{
            position: 'absolute', inset: 0, borderRadius: T.rLg, zIndex: 1,
            background: 'rgba(46,125,50,0.12)',
            pointerEvents: 'none', opacity: rightHint,
          }} />
        </>
      )}
      <CardFace tip={tip} stackIndex={stackIndex} />
    </motion.div>
  );
}

// ─── Main carousel ─────────────────────────────────────────────────────────────

export function PermaTipsCarousel({ plants }: { plants?: PlantSummary[] }) {
  const allTips = useMemo(() => getPersonalizedTips(plants ?? [], 8), [plants]);
  const [topIdx, setTopIdx] = useState(0);

  const remaining   = allTips.length - topIdx;
  const visibleTips = allTips.slice(topIdx, topIdx + STACK_VISIBLE);
  const today       = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const isPersonalized = (plants?.length ?? 0) >= 2;

  const handleDismiss = () => setTopIdx(i => Math.min(i + 1, allTips.length));
  const handleReset   = () => setTopIdx(0);

  return (
    <div style={{ marginBottom: 28 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700 }}>
            {isPersonalized ? 'Tips for Your Garden' : 'Daily Wisdom'}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: T.muted }}>
            {remaining > 0
              ? `${remaining} tip${remaining !== 1 ? 's' : ''} · swipe to dismiss`
              : 'All read · great work!'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {remaining > 0 ? (
            <motion.span
              key="badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={SPRING}
              style={{
                fontSize: 10, fontWeight: 700, color: T.green,
                background: T.greenLight, border: `1px solid ${T.greenMid}`,
                borderRadius: 50, padding: '4px 10px', whiteSpace: 'nowrap',
              }}
            >
              {isPersonalized ? `${plants!.length} plants` : today}
            </motion.span>
          ) : (
            <motion.button
              key="reset"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={SPRING}
              onClick={handleReset}
              whileTap={{ scale: 0.95 }}
              style={{
                fontSize: 11, fontWeight: 600, color: T.green,
                background: T.greenLight, border: `1px solid ${T.greenMid}`,
                borderRadius: 50, padding: '5px 12px', cursor: 'pointer',
              }}
            >
              See again
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Stack ── */}
      <div style={{ position: 'relative', height: remaining > 0 ? 212 : 86 }}>
        <AnimatePresence>
          {visibleTips.map((tip, i) => (
            <SwipeCard
              key={tip.id}
              tip={tip}
              stackIndex={i}
              onDismiss={i === 0 ? handleDismiss : undefined}
            />
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {remaining === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={SPRING}
            style={{
              background: T.greenLight,
              border: `1.5px solid ${T.greenMid}`,
              borderRadius: T.rLg,
              padding: '20px 20px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}
          >
            <span style={{ fontSize: 28 }}>🌿</span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>All caught up!</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: T.sub }}>
                You've read all {allTips.length} tips
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Progress dots ── */}
      {remaining > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 14 }}>
          {allTips.map((_, i) => {
            const isActive = i === topIdx;
            const isRead   = i < topIdx;
            return (
              <motion.div
                key={i}
                animate={{
                  width:      isActive ? 20 : 6,
                  background: isActive ? T.green : isRead ? T.greenMid : T.border,
                  opacity:    isRead ? 0.5 : 1,
                }}
                transition={{ duration: 0.22 }}
                style={{ height: 6, borderRadius: 3 }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
