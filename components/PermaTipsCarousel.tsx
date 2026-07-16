'use client';

import { useMemo, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sprout, CloudRain } from 'lucide-react';
import { T } from '@/lib/theme';
import { getPersonalizedTips, type PermaTip, type PlantSummary } from '@/lib/permacultureTips';

const SPRING = { type: 'spring' as const, bounce: 0, duration: 0.35 };
const GAP = 12;

// ─── Card face ────────────────────────────────────────────────────────────────

function CardFace({ tip, index, isWeather = false }: { tip: PermaTip; index: number; isWeather?: boolean }) {
  return (
    <div style={{
      background: T.bg,
      border: `1px solid ${T.greenMid}`,
      borderRadius: T.rLg,
      padding: '18px 20px 16px',
      height: 200,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      overflow: 'hidden',
      position: 'relative',
      boxShadow: T.glassCardSh,
    }}>
      {/* Green top stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 20, right: 20, height: 2,
        background: isWeather ? T.green : T.greenMid,
      }} />

      {/* Watermark number */}
      <span style={{
        position: 'absolute', top: 6, right: 14,
        fontSize: 68, fontWeight: 800, lineHeight: 1,
        color: T.green, opacity: 0.055,
        letterSpacing: -2, userSelect: 'none', pointerEvents: 'none',
      } as React.CSSProperties}>
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Icon + category label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
        <span style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'rgba(46,125,50,0.10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {isWeather
            ? <CloudRain size={13} color={T.green} strokeWidth={2.2} aria-hidden="true" />
            : <Sprout size={13} color={T.green} strokeWidth={2.2} aria-hidden="true" />}
        </span>
        {tip.principleShort && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: T.muted,
            letterSpacing: '0.8px', textTransform: 'uppercase',
          }}>
            {tip.principleShort}
          </span>
        )}
      </div>

      {/* Title */}
      <p style={{
        margin: 0, fontSize: 14, fontWeight: 700, color: T.text,
        lineHeight: 1.3, letterSpacing: -0.2,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      } as React.CSSProperties}>
        {tip.title}
      </p>

      {/* Body */}
      <p style={{
        margin: 0, fontSize: 13, color: T.sub,
        lineHeight: 1.55, flex: 1,
        display: '-webkit-box',
        WebkitLineClamp: 3,
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
  plants, tips, heading, subject, rainyDays,
}: {
  plants?: PlantSummary[];
  tips?: PermaTip[];
  heading?: string;
  subject?: string;
  /** Number of rainy days in the forecast — prepends a weather card when > 0 */
  rainyDays?: number | null;
}) {
  const baseTips = useMemo(
    () => tips ?? getPersonalizedTips(plants ?? [], 8),
    [tips, plants],
  );

  const weatherTip: PermaTip | null = rainyDays && rainyDays > 0 ? {
    id: 'weather',
    type: 'energy',
    principleShort: 'Weather',
    icon: 'rain',
    title: `${rainyDays} rainy day${rainyDays > 1 ? 's' : ''} in your forecast`,
    body: rainyDays >= 3
      ? 'Significant rain ahead — your watering schedule is adjusted. Let the soil tell you when it\'s ready, not the calendar.'
      : 'Rain expected soon. Your next watering date is pushed out to account for natural moisture.',
    bg: T.greenLight, border: T.greenMid, labelColor: T.green,
  } : null;

  const allTips = useMemo(
    () => weatherTip ? [weatherTip, ...baseTips] : baseTips,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseTips, rainyDays],
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
            <CardFace tip={tip} index={i} isWeather={tip.id === 'weather'} />
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
