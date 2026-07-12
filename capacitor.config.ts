import type { CapacitorConfig } from '@capacitor/cli';

// Plant Care ships as a "hybrid" Capacitor app: the native Android shell loads
// the deployed Next.js site (which is dynamic + uses Supabase + API routes, so a
// static export isn't viable). Point `server.url` at your production domain.
//
// For a fully offline-capable build you'd instead `next build` a static export
// into `webDir` and drop `server.url` — but this app needs the live server.
const PROD_URL = process.env.CAP_SERVER_URL ?? 'https://plant-vision-three.vercel.app';

const config: CapacitorConfig = {
  appId: 'com.plantvision.app',
  appName: 'Plant Care',
  webDir: 'capacitor/www',
  server: {
    url: PROD_URL,
    androidScheme: 'https',
    // Allow navigation to auth/OAuth + Supabase + tile/image hosts used in-app
    allowNavigation: [
      '*.vercel.app',
      '*.supabase.co',
      '*.tile.openstreetmap.org',
      'nominatim.openstreetmap.org',
      'image.pollinations.ai',
    ],
  },
  android: {
    backgroundColor: '#F6FAF6',
  },
};

export default config;
