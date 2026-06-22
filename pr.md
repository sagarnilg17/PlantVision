# pr.md
> Pull request templates + changelog. Copy the template per PR, log releases below.

---

## PR Template

```
## What
<!-- One-line summary of what this PR does -->

## Why
<!-- Why this change was needed -->

## Changes
- 
- 

## Test Plan
- [ ] Tested on iOS
- [ ] Tested on Android
- [ ] Tested on Web
- [ ] No regressions in existing chat flow

## Screenshots
<!-- Before / After if UI change -->

## Notes
<!-- Anything reviewers should know -->
```

---

## Changelog

### v0.1.0 — Initial Boilerplate
- Expo blank app scaffolded
- Gemini 1.5 Flash integration via `@google/generative-ai`
- Zustand store for messages + user state
- `useChat` hook wiring service ↔ store
- Dark theme tokens in `theme.ts`
- HomeScreen with chat UI
- `design.md`, `memory.md`, `pr.md`, `user_data.md` added

---

## Branch Naming
```
feat/   → new feature
fix/    → bug fix
chore/  → deps, config, cleanup
design/ → UI only changes
```

### v0.2.0 — Claude Vision + Vercel Deploy
- Next.js `vision-app` created alongside Expo boilerplate
- `/api/vision` route — server-side Claude API call (key never exposed to client)
- Camera via `getUserMedia` with rear-facing default for mobile
- Custom prompt per capture
- Token usage + model logged per run
- History feed showing all analysis results in session
