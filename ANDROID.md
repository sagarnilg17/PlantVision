# Android / Play Store build guide

Plant Care ships to Android as a **Capacitor hybrid app**: a thin native shell
(`android/`) that loads the deployed Next.js site. The app is dynamic (SSR,
Supabase auth, API routes), so a static export isn't viable — the shell points at
your production URL instead.

## How it's wired

- **`capacitor.config.ts`** — `server.url` is the site the shell loads.
  Defaults to `https://plant-vision-three.vercel.app`; override at sync time with
  the `CAP_SERVER_URL` env var (e.g. a custom domain).
- **`capacitor/www/`** — offline fallback shell shown only until the remote URL loads.
- **`android/`** — the generated native Gradle project (committed).
- **App ID:** `com.plantvision.app` · **Name:** Plant Care

## Prerequisites (on your machine — can't be done in this environment)

1. **JDK 21** (bundled with recent Android Studio).
2. **Android Studio** (SDK + platform tools).
3. Node deps installed: `npm install`.

## One-time: point the shell at the right URL

If your production domain differs from the default, set it before syncing:

```bash
# PowerShell
$env:CAP_SERVER_URL = "https://your-domain.com"; npm run cap:sync
# bash
CAP_SERVER_URL="https://your-domain.com" npm run cap:sync
```

## App icons & splash

Default Capacitor icons are in place. To brand them, drop a 1024×1024 PNG at
`resources/icon.png` (and optional `resources/splash.png` 2732×2732), then:

```bash
npm i -D @capacitor/assets
npx capacitor-assets generate --android
npm run cap:sync
```

## Build & run (debug)

```bash
npm run cap:sync      # copy config + web assets into android/
npm run cap:open      # opens android/ in Android Studio
```

In Android Studio: **Run ▶** on an emulator or a device with USB debugging.

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

   Then in `android/app/build.gradle`, load it and wire a `release` signingConfig
   (see the Capacitor signing docs — this is standard Gradle).

3. **Build the App Bundle:**

   ```bash
   cd android
   ./gradlew bundleRelease        # Windows: .\gradlew.bat bundleRelease
   ```

   Output: `android/app/build/outputs/bundle/release/app-release.aab`

## Upload to Google Play

1. Create the app in the [Play Console](https://play.google.com/console) (one-time
   $25 developer account).
2. Upload the `.aab` to an internal-testing track first.
3. Complete the store listing: title, short/full description, screenshots
   (phone + optional tablet), feature graphic, privacy policy URL, data-safety form.
4. Because the app loads a remote URL, be ready to explain in the review notes that
   it's your own PWA content (not arbitrary web browsing).
5. Promote to production once internal testing looks good.

## Keeping the app in sync

The native shell rarely changes — most updates ship instantly by deploying the web
app to Vercel (the shell just reloads the live URL). Re-run `npm run cap:sync` and
rebuild the `.aab` only when you change `capacitor.config.ts`, native plugins, icons,
or the app version.
