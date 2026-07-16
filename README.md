# PlantVision

AI-powered plant companion — identify plants from photos, diagnose health issues in real time, and get a care schedule tuned to your plant's actual environment.

Built with Next.js + Gemini 2.5 Flash. Ships as a web app and Android APK via Capacitor.

---

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Set `GEMINI_API_KEY` in a `.env.local` file.

---

## Docs

| File | What it covers |
|------|----------------|
| [`PRODUCT.md`](PRODUCT.md) | Who this is for, what problem it solves, brand personality, and the design principles that govern every decision |
| [`design.md`](design.md) | The full design system — color palette, typography, component specs, elevation, and the explicit do's/don'ts |
| [`ANDROID.md`](ANDROID.md) | How to build and sign the Android APK via Capacitor |
| [`memory.md`](memory.md) | Tech stack choices, architecture decisions, and gotchas captured as the project evolved |
| [`pr.md`](pr.md) | PR template, branch naming conventions, and the changelog |
| [`user_data.md`](user_data.md) | What user data is collected, how it's stored, what gets sent to external APIs, and the privacy checklist |
