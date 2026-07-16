export type WeatherForecast = {
  daily: number[]; // precipitation_sum in mm, index 0 = today, up to 7 days
};

// ≥2 mm counts as a meaningful rain day (light drizzle doesn't reach roots)
const RAIN_THRESHOLD_MM = 2;

export function rainyDaysInWindow(forecast: WeatherForecast, windowDays: number): number {
  return forecast.daily
    .slice(0, Math.max(0, windowDays))
    .filter(mm => mm >= RAIN_THRESHOLD_MM)
    .length;
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherForecast | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
      `&daily=precipitation_sum&timezone=auto&forecast_days=7`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const json = await res.json();
    return { daily: (json.daily?.precipitation_sum as number[]) ?? [] };
  } catch {
    return null;
  }
}

export function getLocation(): Promise<{ lat: number; lon: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve(null);
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 300_000 }, // cache position for 5 min
    );
  });
}
