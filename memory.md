# memory.md
> Running context for this project. Update as decisions are made so any session can pick up fast.

---

## Project Identity
- **App name:** MyApp *(update in `src/constants/config.ts`)*
- **Platform:** Expo (React Native) — iOS + Android + Web
- **Primary AI:** Gemini 1.5 Flash (free tier)
- **Fallback AI:** Anthropic Claude (paid — key in `.env`)
- **State:** Zustand
- **Storage:** AsyncStorage

---

## Architecture Decisions
| Decision | Choice | Reason |
|----------|--------|--------|
| AI provider | Gemini | Free tier, fast, sufficient for chat |
| State management | Zustand | Minimal boilerplate, no context hell |
| Navigation | Expo Router (add when needed) | File-based, works with Expo |
| Styling | StyleSheet (no Tailwind) | Native performance |

---

## Current Folder Structure
```
src/
  components/    # Reusable UI pieces
  screens/       # Full screen views
  hooks/         # Custom hooks (useChat, etc.)
  services/      # API calls (gemini.ts, etc.)
  store/         # Zustand stores
  constants/     # config.ts, theme.ts
  types/         # index.ts — shared types
  utils/         # Helpers
```

---

## Known Gotchas
- Gemini key must be prefixed `EXPO_PUBLIC_` to be accessible in app
- `@google/generative-ai` works in Expo bare/managed with metro bundler
- Zustand persist requires `@react-native-async-storage/async-storage`
- KeyboardAvoidingView behavior differs iOS (`padding`) vs Android (`height`)

---

## Sessions Log
<!-- Add a line per session with what changed -->
- `setup` — Boilerplate scaffolded, Gemini service wired, Zustand store, HomeScreen chat UI

- `vision` — Added Next.js vision-app for Vercel deployment. Claude handles all computer vision via `/api/vision` route. Camera via `getUserMedia` (rear-facing default). Token usage tracked per run.
