// Material 3 – Green seed palette
export const T = {
  // Surfaces (M3 tonal elevation)
  bg:           '#F6FAF6',
  surface:      '#FFFFFF',
  surfaceVar:   '#E8F0E8',
  border:       '#E0E8E0',
  borderMid:    '#C8D8C8',

  // Green – primary
  green:        '#2E7D32',
  greenDark:    '#1B5E20',
  greenLight:   '#E8F5E9',
  greenMid:     '#C8E6C9',

  // M3 container tokens
  primaryContainer:   '#B7F0B9',
  onPrimaryContainer: '#002106',

  // Text (M3 on-surface)
  text:         '#191D19',
  sub:          '#3F4E3F',
  muted:        '#8B9E8B',

  // Semantic
  danger:       '#BA1A1A',
  dangerLight:  '#FFDAD6',
  dangerBorder: '#FFB4AB',

  warn:         '#7D5700',
  warnLight:    '#FFDEAB',
  amberLight:   '#FFF8F0',
  amberBorder:  '#FFD8A8',
  amberText:    '#7D3C00',

  // Elevation (M3 uses tonal, not drop shadows)
  shadow:       '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  shadowMd:     '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
  shadowGreen:  '0 4px 20px rgba(46,125,50,0.28)',

  // M3 shape scale
  r:     '20px',   // medium
  rLg:   '28px',   // large
  rXl:   '28px',   // extra-large
  rSm:   '12px',   // small
  rPill: '50px',
} as const;
