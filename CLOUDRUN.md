# Deploying Maali to Cloud Run

Cloud Run runs the Next.js server (pages **and** the `/api/*` routes) in a container.
The `Dockerfile` builds it as a standalone Node server. Your free credits + Cloud
Run's free tier cover a hobby workload comfortably.

## The one thing to get right: build-time vs runtime env vars

Next inlines `NEXT_PUBLIC_*` values into the browser bundle **at build time**, but
the secret keys are only read **at runtime** by the API routes.

| Variable | When | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **build** (also runtime) | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **build** (also runtime) | public |
| `GROQ_API_KEY` | runtime | **secret** |
| `PLANTNET_API_KEY` | runtime | **secret** |
| `OPENAI_API_KEY` (optional) | runtime | **secret** |

The two `NEXT_PUBLIC_*` values are safe to expose (they already ship in every
browser bundle and in the APK) — pass them as **build args**. Never bake the secret
keys into the image; set them as Cloud Run **runtime** env vars.

## Option A — Cloud Run console (matches the "deploy from source" flow)

1. Deploy → **Continuously deploy from a repository** (or upload source). It detects
   the `Dockerfile`.
2. **Build environment variables** → add `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. **Runtime → Variables & Secrets** → add `GROQ_API_KEY`, `PLANTNET_API_KEY`,
   `OPENAI_API_KEY`, and the two `NEXT_PUBLIC_SUPABASE_*` again (the API routes read
   them server-side too).
4. Allow unauthenticated access. Deploy.

## Option B — gcloud CLI

```bash
PROJECT=your-project-id
REGION=us-central1
IMAGE=$REGION-docker.pkg.dev/$PROJECT/maali/maali:latest

# 1. Build + push (public Supabase values as build args)
gcloud builds submit --region=$REGION \
  --config=- <<EOF
steps:
  - name: gcr.io/cloud-builders/docker
    args: ['build',
      '--build-arg=NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL',
      '--build-arg=NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY',
      '-t', '$IMAGE', '.']
images: ['$IMAGE']
EOF

# 2. Deploy with the runtime (incl. secret) env vars
gcloud run deploy maali --image $IMAGE --region $REGION --allow-unauthenticated \
  --set-env-vars NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY,GROQ_API_KEY=$GROQ_API_KEY,PLANTNET_API_KEY=$PLANTNET_API_KEY
```

(Enable the APIs once: `gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com`, and create the Artifact Registry repo `maali`.)

## After it's live

Cloud Run gives you a URL like `https://maali-xxxxx-uc.a.run.app`. Then:

1. **Point the APK at it** — rebuild with that URL so the app calls Cloud Run instead
   of Vercel:
   ```bash
   CAP_API_BASE=https://maali-xxxxx-uc.a.run.app npm run build:android
   cd android && ./gradlew assembleRelease
   ```
2. **Supabase → Auth → URL Configuration** — add the Cloud Run URL to Site URL /
   Redirect URLs (and keep `com.maali.app://login-callback` for the app).
3. You can keep Vercel running in parallel or point everything at Cloud Run — the
   codebase supports both.
```
