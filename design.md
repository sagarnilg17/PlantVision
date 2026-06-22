# design.md
> Single source of truth for all visual decisions. Edit here → reflect in `src/constants/theme.ts`.

---

## Color Palette

| Token        | Hex       | Role                          |
|--------------|-----------|-------------------------------|
| `bg`         | `#0F0F0F` | App background                |
| `surface`    | `#1A1A1A` | Cards, inputs, bubbles        |
| `primary`    | `#6C63FF` | CTAs, user bubbles, active    |
| `accent`     | `#FF6584` | Highlights, tags, alerts      |
| `text`       | `#F5F5F5` | Primary text                  |
| `subtext`    | `#9E9E9E` | Captions, timestamps          |
| `placeholder`| `#555555` | Input placeholders            |
| `border`     | `#2A2A2A` | Dividers, outlines            |
| `error`      | `#FF4D4D` | Error states                  |
| `success`    | `#00C896` | Success states                |

---

## Typography

| Role      | Family  | Size | Weight | Usage              |
|-----------|---------|------|--------|--------------------|
| `heading` | System  | 24   | 700    | Screen titles      |
| `body`    | System  | 15   | 400    | Chat, paragraphs   |
| `caption` | System  | 12   | 400    | Timestamps, labels |
| `mono`    | Courier | 13   | 400    | Code blocks        |

> Swap `System` for a custom font by installing via expo-font and updating `theme.ts`.

---

## Spacing Scale

| Token | Value | Usage                  |
|-------|-------|------------------------|
| `xs`  | 4     | Icon gaps, tight items |
| `sm`  | 8     | Inner padding          |
| `md`  | 16    | Default section gap    |
| `lg`  | 24    | Card padding           |
| `xl`  | 40    | Screen top padding     |

---

## Border Radius

| Token  | Value | Usage            |
|--------|-------|------------------|
| `sm`   | 8     | Input fields     |
| `md`   | 16    | Cards, bubbles   |
| `lg`   | 24    | Bottom sheets    |
| `full` | 9999  | Pill buttons     |

---

## Component Patterns

### Chat Bubble
- User: `primary` bg, `flex-end`, radius `md`
- Model: `surface` bg, `flex-start`, radius `md`
- Max width: 80% of screen

### Input Bar
- Background: `surface`, radius `full`
- Send button: `primary` bg, 44x44 circle
- Sits above keyboard with `KeyboardAvoidingView`

### Buttons
- Primary: `primary` bg, white text, radius `full`
- Ghost: transparent, `primary` border + text
- Destructive: `error` bg

---

## Dark Mode
Default is dark. If light mode needed, invert bg/surface and use `#111` for text.

---

## Notes / Iterations
<!-- Log design decisions here -->
- `v0.1` — Initial dark theme, purple primary, pink accent
