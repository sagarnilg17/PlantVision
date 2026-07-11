// Liquid Glass – Green palette
export const T = {
  // ── Canvas (legacy — prefer glass tokens below) ───────────────────────────
  bg:           '#F6FAF6',
  surface:      '#FFFFFF',
  surfaceVar:   '#E8F0E8',
  border:       '#E0E8E0',
  borderMid:    '#C8D8C8',

  // ── Green ─────────────────────────────────────────────────────────────────
  green:              '#2E7D32',
  greenDark:          '#1B5E20',
  greenLight:         '#E8F5E9',
  greenMid:           '#C8E6C9',
  primaryContainer:   '#B7F0B9',
  onPrimaryContainer: '#002106',

  // ── Text ──────────────────────────────────────────────────────────────────
  text:  '#191D19',
  sub:   '#3F4E3F',
  muted: '#6B7F6B',

  // ── Semantic ──────────────────────────────────────────────────────────────
  danger:       '#BA1A1A',
  dangerLight:  '#FFDAD6',
  dangerBorder: '#FFB4AB',
  warn:         '#7D5700',
  warnLight:    '#FFDEAB',
  amberLight:   '#FFF8F0',
  amberBorder:  '#FFD8A8',
  amberText:    '#7D3C00',

  // ── Legacy shadow/scrim tokens (kept for compatibility) ───────────────────
  shadow:        '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  shadowMd:      '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
  shadowGreen:   '0 4px 20px rgba(46,125,50,0.28)',
  scrimDark:     'rgba(0,0,0,0.45)',
  scrimLight:    'rgba(0,0,0,0.12)',
  shadowOverlay: 'rgba(0,0,0,0.15)',

  // ── Shape ─────────────────────────────────────────────────────────────────
  r:      '20px',
  rLg:    '28px',
  rXl:    '28px',
  rSm:    '12px',
  rSheet: '24px',
  rPill:  '50px',

  // ── Liquid Glass ──────────────────────────────────────────────────────────
  // App background gradient (iOS-safe: applied via fixed div in layout.tsx)
  appGradient: 'linear-gradient(170deg, #C8E6C9 0%, #DFF0E0 22%, #EDF7EE 55%, #F6FAF6 100%)',

  // Scrolling cards — high opacity white (no backdrop-filter = no GPU thrash on mobile)
  glassCard:   'rgba(255,255,255,0.80)',
  glassCardBd: '0.5px solid rgba(255,255,255,0.65)',
  glassCardSh: 'inset 0 1px 0 rgba(255,255,255,0.90), 0 6px 24px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',

  // Fixed chrome (sticky headers, nav, FAB chips) — blur is safe, GPU-composited
  glassChromeBase: 'rgba(255,255,255,0.72)',
  glassChromeBlur: 'blur(40px) saturate(200%) brightness(1.05)',
  glassChromeBd:   '0.5px solid rgba(255,255,255,0.58)',
  glassChromeSh:   'inset 0 1px 0 rgba(255,255,255,0.85), 0 4px 20px rgba(0,0,0,0.06)',

  // Floating panels (speed dial, modals — heavier shadow for elevation)
  glassPanelSh: 'inset 0 1px 0 rgba(255,255,255,0.90), 0 10px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
} as const;
