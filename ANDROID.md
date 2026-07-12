# Android / Play Store build guide

Plant Care ships to Android as a **Capacitor app with the UI bundled locally**. The
web app is exported to static files (`out/`) and packaged into the APK, so the shell
loads instantly from `capacitor://localhost` and works offline. Only the parts that
genuinely need a server go over the network:

- **AI endpoints** (`/api/vision`, `/api/diagnose`, `/api/illustrate`) — they hold
  secret keys, so they stay on the Vercel deployment and are called by absolute URL.
- **Supabase** — auth + data, same as on the web.

## How it's wired

- **`npm run build:android`** → runs `scripts/build-capacitor.mjs`, which:
  1. Temporarily disables the `route.ts` handlers (static export can't include them),
  2. builds a static export into `out/` with `BUILD_TARGET=static` and
     `NEXT_PUBLIC_API_BASE_URL` pointing at the deployed API,
  3. restores the handlers, and
  4. runs `cap sync android` to copy the bundle into `android/`.
- **API base URL** — defaults to `https://plant-vision-three.vercel.app`; override
  with `CAP_API_BASE` (set a custom domain there).
- **App ID:** `com.plantvision.app` · **Name:** Plant Care

## Prerequisites (on your machine — not doable in this environment)

1. **JDK 21** (bundled with recent Android Studio).
2. **Android Studio** (SDK + platform tools).
3. `npm install`.

## One-time Supabase config (for Google sign-in in the app)

The app returns from Google OAuth via a deep link. In the Supabase dashboard →
**Authentication → URL Configuration → Redirect URLs**, add:

```
com.plantvision.app://login-callback
```

(Email one-time-code login works without this; only Google OAuth needs it.) The
Android side is already wired: `AndroidManifest.xml` registers the
`com.plantvision.app` scheme, and `NativeAuthBridge` completes the session.

## Build & run (debug)

```bash
# point at a custom API host if needed:
#   PowerShell:  $env:CAP_API_BASE="https://your-domain.com"
#   bash:        export CAP_API_BASE="https://your-domain.com"
npm run build:android    # export UI + sync into android/
npm run cap:open         # open android/ in Android Studio
```

In Android Studio: **Run ▶** on an emulator or a device.

## App icons & splash

Default Capacitor icons are in place. To brand them, drop a 1024×1024 PNG at
`resources/icon.png` (optional `resources/splash.png` 2732×2732), then:

```bash
npm i -D @capacitor/assets
npx capacitor-assets generate --android
npm run build:android
```

## Release build (signed .aab for the Play Store)

1. **Generate an upload keystore** (once — keep it safe, you can't re-key later):

   ```bash
   keytool -genkey -v -keystore plant-care-upload.keystore \
     -alias plant-care -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Register the signing config.** Create `android/keystore.properties`
   (git-ignored — never commit it):

   ```properties
   storeFile=../plant-care-upload.keystore
   storePassword=YOUR_STORE_PASSWORD
   keyAlias=plant-care
   keyPassword=YOUR_KEY_PASSWORD
   ```

   Then wire a `release` signingConfig in `android/app/build.gradle` that loads it
   (standard Gradle — see the Capacitor signing docs).

3. **Build the App Bundle:**

   ```bash
   npm run build:android          # make sure the latest UI is bundled first
   cd android
   ./gradlew bundleRelease         # Windows: .\gradlew.bat bundleRelease
   ```

   Output: `android/app/build/outputs/bundle/release/app-release.aab`

## Upload to Google Play

1. Create the app in the [Play Console](https://play.google.com/console) (one-time
   $25 developer account).
2. Upload the `.aab` to an internal-testing track first.
3. Complete the store listing: title, descriptions, screenshots, feature graphic,
   privacy policy URL, and the data-safety form.
4. Promote to production once internal testing looks good.

## Updating the app

- **Content/logic that lives in the bundled UI** → re-run `npm run build:android`,
  rebuild the `.aab`, and ship a new Play Store release.
- **The AI endpoints** are served from Vercel, so fixing those only needs a web
  deploy — no new app release required.
