---
name: Plant Care
description: AI-powered plant companion — identify, diagnose, and care for your plants.
colors:
  primary: "#2E7D32"
  primary-dark: "#1B5E20"
  primary-light: "#E8F5E9"
  primary-mid: "#C8E6C9"
  primary-container: "#B7F0B9"
  on-primary-container: "#002106"
  bg: "#F6FAF6"
  surface: "#FFFFFF"
  surface-variant: "#E8F0E8"
  border: "#E0E8E0"
  border-mid: "#C8D8C8"
  text: "#191D19"
  text-secondary: "#3F4E3F"
  text-muted: "#8B9E8B"
  danger: "#BA1A1A"
  danger-light: "#FFDAD6"
  danger-border: "#FFB4AB"
  warn: "#7D5700"
  warn-light: "#FFDEAB"
  amber-light: "#FFF8F0"
  amber-border: "#FFD8A8"
  amber-text: "#7D3C00"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "26px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.4px"
  headline:
    fontFamily: "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.2px"
  title:
    fontFamily: "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.7px"
rounded:
  sm: "12px"
  md: "20px"
  lg: "28px"
  pill: "50px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "13px 28px"
  button-primary-disabled:
    backgroundColor: "{colors.primary-mid}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.sm}"
    padding: "13px 28px"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "16px"
  chip-healthy:
    backgroundColor: "{colors.primary-light}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  chip-warn:
    backgroundColor: "{colors.warn-light}"
    textColor: "{colors.warn}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  chip-danger:
    backgroundColor: "{colors.danger-light}"
    textColor: "{colors.danger}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  fab:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "16px"
    size: "56px"
---

# Design System: Plant Care

## 1. Overview

**Creative North Star: "The Smart Companion App"**

Plant Care should feel like the best nature apps in Apple's ecosystem — not a reference library you open when stuck, but a companion that's always in your corner. The design is native-feeling and minimal: every screen resolves in under 3 seconds of reading, and every interaction provides feedback that feels earned, not animated for show. The UI lives on the same phone as someone's camera roll; it should belong there completely, with the polish and restraint of a first-party app.

The palette is rooted in a living forest green — organic and warm, not the generic "wellness-app green" of stock-photo nature apps. Surfaces are white and near-white with tonal green undertones; the green itself appears sparingly but with conviction: a confirmation, a CTA, a health indicator. When it appears, it signals something real.

This system explicitly rejects the category reflex: no stock-photo leaves on cream, no gamified streaks or XP bars, no dense scientific card stacks, no developer-tool dark mode with neon accents. The design earns trust through precision — specific watering schedules, exact health diagnoses — and through craft: micro-interactions that reward real actions, whitespace that communicates calm, and nothing on screen that doesn't serve the user's next move.

**Key Characteristics:**
- Single-font system (Plus Jakarta Sans) with weight jumps (400 / 700 / 800) carrying all typographic hierarchy
- Tonal green surfaces; primary green reserved for CTAs and confirmed states only
- M3-inspired elevation: flat by default, gentle drop shadows for interactive cards
- Pill chips for semantic status; rounded-large cards for content; FAB for the primary scan action
- Mobile-first, 480px column, safe-area-aware bottom navigation with M3 speed-dial FAB

---

## 2. Colors: The Living Leaf Palette

A palette grown from a single seed: forest green (#2E7D32). The green is warm and organic, not technical or decorative. Everything around it is near-neutral with just enough green tint to feel intentional — the canvas breathes the same air as the plants. No hue enters the system without a semantic reason.

### Primary

- **Living Forest** (#2E7D32): The primary action color and the single confirmation signal. Used on CTAs, the FAB, active nav items, watering indicators, and health chips. Its rarity is deliberate — when it appears, it means something is working or confirmed.
- **Deep Grove** (#1B5E20): The pressed and open state for the FAB; used on the header avatar gradient. Darker, heavier — anchors important UI without adding a new hue.

### Secondary

- **Leaf Container** (#B7F0B9): The M3 primary container — background for selected chips and tinted states where the full green would be too strong. The ghost of the forest.
- **Mint Mid** (#C8E6C9): Border ring for confirmed shot thumbnails, selected light-level buttons, and angle indicators. The green in its most restrained form.

### Neutral

- **Fog White** (#F6FAF6): App background — near-white with a barely-perceptible green undertone. Never pure white at the page level; never warm cream.
- **Pure Surface** (#FFFFFF): Cards and inputs — unmixed white that lifts slightly off the background through tonal difference alone.
- **Tonal Mist** (#E8F0E8): Surface variant — hovered containers, alternative backgrounds, avatar background tints.
- **Petal Border** (#E0E8E0): Default dividers and card borders. Soft enough to disappear at a glance; present enough to define structure.
- **Stem Border** (#C8D8C8): Stronger dividers; mid-emphasis separations between semantic sections.
- **Near Black** (#191D19): Headline text — not pure black; carries just enough green cast to stay cohesive with the system.
- **Dark Earth** (#3F4E3F): Body and supporting text.
- **Sage Muted** (#8B9E8B): Captions, timestamps, inactive nav labels. Not for body-weight text on Pure Surface — contrast ≈3.3:1, below AA threshold for normal text weight.

### Semantic

- **Alert Red** (#BA1A1A): Error states only. No decorative use.
- **Amber Text** (#7D3C00): Watering urgency text on amber container.
- **Amber Container** (#FFF8F0): Watering urgency card background.
- **Warning Leaf** (#7D5700): Warning text for "mild stress" health labels.
- **Warning Container** (#FFDEAB): Warning chip backgrounds.

### Named Rules

**The One Green Rule.** The primary green (#2E7D32) is used for actions and confirmations only — never as a decorative background tint or a section accent. Every other occurrence uses the tonal ramp. When green appears, it demands attention; that only works if it's rare.

**The Living White Rule.** Surfaces are never pure CSS white at the page level. The app background (#F6FAF6) carries a barely-perceptible green cast; all card-whites (#FFFFFF) float above it. This is how the depth layer is created without shadow.

**The No-Warm-Cream Rule.** Any background in the OKLCH range L 0.84-0.97, C < 0.06, hue 40-100 is forbidden — that is the generic "nature app" look. The tint must be green-cast (hue toward 145), not warm.

---

## 3. Typography

**Body Font:** Plus Jakarta Sans, loaded via `next/font/google` as CSS variable `--font-sans`

Single-family system — no display serif or second family. Hierarchy is carried entirely through weight (400 / 700 / 800) and size. The weight jumps are large enough to read at a glance on a phone screen without relying on subtle differences.

**Character:** Plus Jakarta Sans is a geometric humanist sans with subtle warmth in its letterforms — the two-story `a`, the lifted optical baseline, the slight openness in round characters. At 800 weight it reads as confident and purposeful without feeling cold; at 400 it stays clean and readable without the clinical neutrality of utility-first typefaces. The right register for an app that gives specific, trustworthy answers and still feels like it was made by someone who cares about plants.

### Hierarchy

- **Display** (800 weight, 26px, line-height 1.15, letter-spacing -0.4px): Dashboard hero headline ("My Garden"). One per screen. Never stack two display-weight elements.
- **Headline** (700 weight, 20px, line-height 1.3, letter-spacing -0.2px): Page-level titles (Scan a Plant, plant detail header). One per screen.
- **Title** (700 weight, 16px, line-height 1.25): Card plant names, section headers. The content layer workhorse.
- **Body** (400 weight, 14-15px, line-height 1.5): Instructional text, descriptions, care notes. Max 65ch per line.
- **Caption** (400 weight, 12px, italic for scientific names, line-height 1.4): Scientific names, timestamps, secondary metadata.
- **Label** (700 weight, 10-12px, UPPERCASE, letter-spacing 0.7-1.2px): Structural metadata only — the stats strip ("PLANTS", "THRIVING") and plant-list count ("ALL PLANTS · 4"). Not section eyebrows.

### Named Rules

**The Weight-Jump Rule.** Adjacent typographic levels must differ by ≥200 weight units when they share a similar size. A 16px title at 700 must sit next to body at 400; two 700-weight elements at adjacent sizes produce ambiguous hierarchy and are prohibited.

**The Italic-for-Science Rule.** Italic is reserved for scientific names (`fontStyle: italic`). No decorative italic use elsewhere. The exception exists so it carries meaning.

---

## 4. Elevation

Hybrid M3 strategy: tonal layering for the background stack, selective drop shadows for interactive content.

**Tonal layering** (no shadow): Fog White background (#F6FAF6) → Pure Surface cards (#FFFFFF). The card lifts off the canvas through color alone at rest. This is the default; most surfaces use no shadow at all.

**Drop shadows** are reserved for interactive cards, fixed-position elements, and the primary action:

### Shadow Vocabulary

- **Ambient** (`0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)`): Resting state for secondary panels. The minimum presence.
- **Card** (`0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)`): Primary plant cards and results panels. Enough separation from the background; no drama.
- **Green Glow** (`0 4px 20px rgba(46,125,50,0.28)`): The FAB and the header avatar badge. The only colored shadow in the system — ties the primary action to the primary green, makes the FAB feel alive.
- **Nav Lift** (`0 -4px 20px rgba(0,0,0,0.07)`): Bottom navigation bar, upward direction, separating fixed chrome from scrollable content.

### Named Rules

**The Flat-at-Rest Rule.** Surfaces are flat by default; shadows appear only as a response to elevation (cards), action (FAB), or fixed positioning (nav). Never add shadow for aesthetic weight alone — if something needs to feel important, use green, not shadow.

---

## 5. Components

### Buttons

Rounded-small (12px radius) at all sizes. No full-pill shape except status chips.

- **Primary:** Living Forest (#2E7D32) background, white text, 13px vertical / 28px horizontal padding (15px vertical on full-width CTAs), 700 weight, 14-15px. Green Glow shadow. On press: `transform: scale(0.97)`.
- **Primary (disabled):** Mint Mid (#C8E6C9) background, Sage Muted text. Stay in the green family — never a neutral gray disabled state.
- **Ghost:** Pure Surface background, Petal Border (1px), Dark Earth text. Identical shape to primary. Used for Upload, Reset, Scan Again — secondary actions that don't compete with the primary CTA.

### Chips

Pill (50px radius). Two semantic families; never used decoratively.

- **Health chip:** Three variants by state. Healthy: primary-light bg / primary text / primary-mid border. Mild stress: warn-light bg / warn text / amber-border. Needs care: danger-light bg / danger text / danger-border. Always prefixed with a 6px filled color dot.
- **Watering chip:** Overdue → amber-light bg / amber-text / amber-border. Upcoming → primary-light bg / primary / primary-mid border. Always includes 💧 emoji prefix.

### Cards / Containers

Rounded-medium (20px radius), Pure Surface background, 1px Petal Border, Card shadow.

- **Plant card layout:** Avatar/image left (88×88px, 18px radius, 16px outer margin), text center (16px title, 11px italic caption, chips row, health section), chevron right (13px icon, 14px right padding).
- **Internal dividers:** 1px Petal Border horizontal lines only when a new semantic section starts within the card (e.g., health section below the watering + light chip row).
- **Urgency container:** Amber Container (#FFF8F0) background, Amber Border, same card radius. No icon stripe or left-side accent border.
- **Scan results panel:** 2px Living Forest border when selected (plus `0 0 0 1px rgba(46,125,50,0.13)` inner ring), 2px Petal Border when unselected.

### Inputs / Fields

Rounded-small (12px radius). Pure Surface background, 1.5px Petal Border.

- **Focus:** Border shifts to Living Forest (#2E7D32) at 1.5px. No glow — the color change is sufficient.
- **Error:** Border shifts to Alert Red (#BA1A1A).
- **Search variant:** 15px search icon at left in Sage Muted, 34px left text padding. Clear button (×, 18px circle, border-colored) appears at right when text is present.

### Navigation

**Bottom tab bar:** Fixed, 56px, Pure Surface, 1px Petal Border top, Nav Lift shadow. Three tabs (Garden, Schedule, Profile). Active: Living Forest text + icon at 2.5px stroke, 700 label weight. Inactive: Sage Muted, 2px stroke, 500 label weight.

**M3 FAB speed dial:** 56×56px, 16px border-radius, Living Forest, Green Glow. Positioned 16px from the right edge, `bottom: calc(env(safe-area-inset-bottom, 4px) + 76px)`. On open: rotates 45° (plus → ×), background transitions to Deep Grove, spawns labeled mini-FABs (Pure Surface, 16px radius, 12px gap, upward stack) with spring animation (stiffness 400, damping 30). Background scrim (`rgba(25,29,25,0.32)`) covers the rest of the screen.

### Plant Avatar

Square at configurable size (default 88px), border-radius ≈ 20% of dimension. Three states: illustration (object-fit contain, Pure Surface bg), photo (object-fit cover, primary-light bg), letter-initial (first char, 40% font-size, 800 weight, Living Forest). All states: 1px Petal Border.

### Skeleton Loaders

Identical dimensions to their live counterparts. Background Petal Border (#E0E8E0), no shimmer. Opacity stacked for successive skeletons (1.0 / 0.75 / 0.50). The tonal difference from the card background carries the inactive read; no animation needed.

---

## 6. Do's and Don'ts

### Do:

- **Do** keep Living Forest (#2E7D32) on ≤10% of any screen's total surface area. The rarity is the signal. When green is everywhere it means nothing.
- **Do** carry all typographic hierarchy through weight, not size alone. Adjacent levels must differ by ≥200 weight units when they share similar sizes.
- **Do** use the tonal ramp (primary-light → primary-mid → primary → primary-dark) for state progression: container background → border → label/icon → pressed.
- **Do** animate state transitions only — watering confirmation, FAB open/close, card entrance. Use Framer Motion spring (`stiffness: 340, damping: 36`) for entrances; `transition: 0.12-0.15s ease` for micro-interactions.
- **Do** honor `prefers-reduced-motion` by removing translate and scale animations and keeping only fade transitions.
- **Do** verify ≥4.5:1 contrast on all body text. Sage Muted (#8B9E8B) on Pure Surface is ≈3.3:1 — only valid for uppercase/bold label text; never use it for body-weight copy.
- **Do** use green-family colors for disabled states (primary-mid bg / text-muted text) rather than neutral gray. The system stays in its own palette.
- **Do** set `max-width: 480px; margin: 0 auto` on all pages. This is a mobile-first PWA; desktop view is wide-centered, not reflowed.

### Don't:

- **Don't** use stock-photo leaves, hand-drawn botanical illustrations, leaf-icon decoration, or bubbly rounded-everything. That is the generic "nature app" look the system explicitly rejects.
- **Don't** add streaks, XP bars, achievement badges, or celebration confetti. This is a tool for living things, not a habit tracker (anti-reference: Duolingo / gamified wellness apps).
- **Don't** build dense scientific card stacks, taxonomy trees, or reference-database UX. Users should not feel like they opened Wikipedia (anti-reference: PictureThis / iNaturalist).
- **Don't** use dark mode with neon accents, purple gradients, robot iconography, or any developer-tool aesthetic. The app lives next to someone's camera roll, not their terminal (anti-reference: cold AI / tech products).
- **Don't** use a warm cream or sand body background (OKLCH L 0.84-0.97, C < 0.06, hue 40-100). The page background is Fog White with a green cast (#F6FAF6); warmth comes from content and imagery.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored stripe on any card, list item, or callout. Use full border + background tint for semantic differentiation.
- **Don't** apply gradient text (`background-clip: text` with a gradient). Solid color only; emphasis through weight or size.
- **Don't** add uppercase eyebrow labels ("ABOUT", "FEATURES") above every section heading. The only uppercase label pattern in this system is structural metadata (stats strip, list count). One use-case, not a section scaffold.
- **Don't** fabricate new color roles. The semantic palette (danger, warn, amber) is complete. A new color requires a new semantic need, not a desire for variety.
- **Don't** nest cards inside cards. Internal grouping within a card uses dividers and background tints, not a nested card shape.
