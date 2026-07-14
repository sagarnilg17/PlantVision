'use client';

import { useMemo, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sprout } from 'lucide-react';
import { T } from '@/lib/theme';
import { getPersonalizedTips, type PermaTip, type PlantSummary } from '@/lib/permacultureTips';

const SPRING = { type: 'spring' as const, bounce: 0, duration: 0.35 };
const GAP = 12;

// ─── Card face ────────────────────────────────────────────────────────────────
// Numbered tip + body text only. One library icon (no emoji), no category chips —
// the heading is simply "Tip N" and the card's job is to surface the tip text.

function CardFace({ tip, index }: { tip: PermaTip; index: number }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.94)',
      border: T.glassCardBd,
      borderRadius: T.rLg,
      padding: 20,
      height: 176,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      overflow: 'hidden',
      boxShadow: T.glassCardSh,
    }}>
      {/* Icon + tip number */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'rgba(46,125,50,0.10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Sprout size={18} color={T.green} strokeWidth={2} aria-hidden="true" />
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.green, letterSpacing: 0.2 }}>
          Tip {index + 1}
        </span>
      </div>

      {/* Tip text */}
      <p style={{
        margin: 0, fontSize: 14, color: T.text,
        lineHeight: 1.6, flex: 1,
        display: '-webkit-box',
        WebkitLineClamp: 4,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      } as React.CSSProperties}>
        {tip.body}
      </p>
    </div>
  );
}

// ─── Scroll-snap pager ──────────────────────────────────────────────────────────

export function PermaTipsCarousel({
  plants, tips, heading, subject,
}: {
  plants?: PlantSummary[];
  /** Explicit tip deck — overrides the plants-derived tips (e.g. single-plant tips) */
  tips?: PermaTip[];
  /** Custom header title */
  heading?: string;
  /** Short subject shown in the count badge (e.g. a plant's name) */
  subject?: string;
}) {
  const allTips = useMemo(
    () => tips ?? getPersonalizedTips(plants ?? [], 8),
    [tips, plants],
  );

  const scrollerRef = useRef<HTMLDivElement>(null);
  const rafRef      = useRef<number | null>(null);
  const [active, setActive] = useState(0);

  const today          = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const isPersonalized  = (plants?.length ?? 0) >= 2;
  const headerTitle     = heading ?? (isPersonalized ? 'Tips for Your Garden' : 'Daily Wisdom');
  const badgeText       = subject ?? (isPersonalized ? `${plants!.length} plants` : today);

  const step = () => {
    const first = scrollerRef.current?.querySelector('[data-card]') as HTMLElement | null;
    return first ? first.offsetWidth + GAP : 1;
  };

  const onScroll = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = scrollerRef.current;
      if (!el) return;
      const first = el.querySelector('[data-card]') as HTMLElement | null;
      const s = first ? first.offsetWidth + GAP : 1;
      setActive(Math.max(0, Math.min(allTips.length - 1, Math.round(el.scrollLeft / s))));
    });
  }, [allTips.length]);

  const goTo = (i: number) => {
    scrollerRef.current?.scrollTo({ left: i * step(), behavior: 'smooth' });
  };

  return (
    <div style={{ marginBottom: 28 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, color: T.text, fontWeight: 700, letterSpacing: -0.1 }}>
            {headerTitle}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: T.muted }}>
            {allTips.length} tip{allTips.length !== 1 ? 's' : ''} · swipe to browse
          </p>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, color: T.green,
          background: T.greenLight, border: `1px solid ${T.greenMid}`,
          borderRadius: T.rPill, padding: '4px 10px', whiteSpace: 'nowrap',
        }}>
          {badgeText}
        </span>
      </div>

      {/* ── Paged scroller ── */}
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="no-scrollbar"
        role="group"
        aria-label="Tips — swipe or use arrow keys to browse"
        tabIndex={0}
        style={{
          display: 'flex',
          gap: GAP,
          overflowX: 'auto',
          overflowY: 'visible',
          scrollSnapType: 'x mandatory',
          scrollPaddingInline: 12,
          // Interior padding gives the cards' soft shadows room inside the scroll
          // viewport — without it, overflow-x clips them and the row reads as a
          // filled box rather than floating cards.
          paddingInline: 12,
          paddingTop: 10,
          paddingBottom: 20,
          WebkitOverflowScrolling: 'touch',
        }}>
        {allTips.map((tip, i) => (
          <motion.div
            key={tip.id}
            data-card
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: Math.min(i, 4) * 0.05 }}
            style={{
              flex: '0 0 86%',
              scrollSnapAlign: 'center',
            }}>
            <CardFace tip={tip} index={i} />
          </motion.div>
        ))}
      </div>

      {/* ── Page dots (transform-only, no layout animation) ── */}
      {allTips.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginTop: 2 }}>
          {allTips.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to tip ${i + 1}`}
              aria-current={i === active ? 'true' : undefined}
              style={{
                padding: '11px 9px', border: 'none', background: 'none',
                cursor: 'pointer', lineHeight: 0,
              }}>
              <motion.span
                animate={{
                  scale: i === active ? 1.35 : 1,
                  backgroundColor: i === active ? T.green : T.borderMid,
                }}
                transition={{ duration: 0.22 }}
                style={{ display: 'block', width: 7, height: 7, borderRadius: '50%' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
