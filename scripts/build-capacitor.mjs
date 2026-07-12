// Builds the static bundle for the native app and syncs it into android/.
//
// Next static export (`output: 'export'`) can't coexist with dynamic route
// handlers, but this repo keeps its API + OAuth-callback handlers for the Vercel
// web deploy. So for the export build we temporarily disable each `route.ts` by
// renaming it in place (an extension Next ignores), build, then always restore.
// Renaming the files (not their directories) avoids the Windows directory-lock
// EPERM that dir-level moves hit.
//
// The bundled app reaches those endpoints on the deployed server by absolute URL:
//   set CAP_API_BASE (defaults to the production domain).

import { execSync } from 'node:child_process';
import { existsSync, renameSync } from 'node:fs';
import { join } from 'node:path';

const ROOT     = process.cwd();
const API_BASE = process.env.CAP_API_BASE ?? 'https://plant-vision-three.vercel.app';
const OFF      = '.capoff'; // suffix Next does not treat as a route file

// Route handlers that must not be present during static export
const ROUTES = [
  'app/api/vision/route.ts',
  'app/api/diagnose/route.ts',
  'app/api/illustrate/route.ts',
  'app/auth/callback/route.ts',
].map(p => join(ROOT, p));

// Windows can briefly lock freshly-touched files (antivirus / watchers), so retry
// the rename with a short synchronous backoff.
function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
function renameWithRetry(from, to, attempts = 25) {
  for (let i = 0; i < attempts; i++) {
    try { renameSync(from, to); return; }
    catch (e) {
      if ((e.code === 'EPERM' || e.code === 'EBUSY' || e.code === 'EACCES') && i < attempts - 1) {
        sleep(400);
        continue;
      }
      throw e;
    }
  }
}

function stash() {
  for (const p of ROUTES) {
    if (existsSync(p)) renameWithRetry(p, p + OFF);
  }
}

function restore() {
  for (const p of ROUTES) {
    if (existsSync(p + OFF)) renameWithRetry(p + OFF, p);
  }
}

console.log(`\n▸ Building static bundle (API base: ${API_BASE})\n`);

stash();
try {
  execSync('npx next build', {
    stdio: 'inherit',
    env: { ...process.env, BUILD_TARGET: 'static', NEXT_PUBLIC_API_BASE_URL: API_BASE },
  });
} finally {
  restore();
}

console.log('\n▸ Syncing into android/\n');
execSync('npx cap sync android', { stdio: 'inherit' });

console.log('\n✓ Done. Open the project with: npm run cap:open\n');
