import type { CapacitorConfig } from '@capacitor/cli';

// Maali bundles the UI into the app: `npm run build:android` produces a static
// Next export in `out/`, which Capacitor packages and serves locally from
// capacitor://localhost — so the shell loads instantly and works offline. The AI
// endpoints and Supabase are still reached over the network by absolute URL
// (NEXT_PUBLIC_API_BASE_URL), since they need secret keys / a live server.
const config: CapacitorConfig = {
  appId: 'com.maali.app',
  appName: 'Maali',
  webDir: 'out',
  android: {
    backgroundColor: '#F6FAF6',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
