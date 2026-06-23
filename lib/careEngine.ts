// ============================================================
// Care engine — deterministic reasoning layer (no AI).
// Combines AI base watering + light level + season into a
// concrete watering interval and contextual notes.
// ============================================================

export type LightLevel = 'low' | 'medium' | 'bright';

// northern/southern hemisphere season from month + latitude
export function currentSeason(lat: number | null): 'spring' | 'summer' | 'autumn' | 'winter' {
  const m = new Date().getMonth(); // 0-11
  const north = [
    'winter', 'winter', 'spring', 'spring', 'spring', 'summer',
    'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter',
  ][m] as 'spring' | 'summer' | 'autumn' | 'winter';
  if (lat !== null && lat < 0) {
    // flip for southern hemisphere
    const flip = { spring: 'autumn', summer: 'winter', autumn: 'spring', winter: 'summer' } as const;
    return flip[north];
  }
  return north;
}

// parse "Every 3-4 days" -> 3 (use the lower bound, safer)
function baseDays(freq: string): number {
  const nums = freq.match(/\d+/g)?.map(Number) ?? [5];
  return Math.min(...nums);
}

export type CareEngineInput = {
  baseWateringFrequency: string;   // from AI, e.g. "Every 3-4 days"
  light: LightLevel | null;
  lat: number | null;
};

export type CareEngineOutput = {
  intervalDays: number;
  reason: string[];
  season: string;
};

export function computeWatering(input: CareEngineInput): CareEngineOutput {
  let days = baseDays(input.baseWateringFrequency);
  const reason: string[] = [`Base interval ${days} days from species care profile.`];
  const season = currentSeason(input.lat);

  // Light: more light -> faster drying -> water more often (shorter interval)
  if (input.light === 'bright') {
    days = Math.max(1, days - 1);
    reason.push('Bright light dries soil faster — watering slightly more often.');
  } else if (input.light === 'low') {
    days = days + 2;
    reason.push('Low light slows drying — watering less often to avoid root rot.');
  }

  // Season: dormant in winter, active in summer
  if (season === 'winter') {
    days = days + 2;
    reason.push('Winter dormancy — reduced watering needs.');
  } else if (season === 'summer') {
    days = Math.max(1, days - 1);
    reason.push('Summer growth — slightly higher water demand.');
  }

  return { intervalDays: days, reason, season };
}

export function nextWateringDate(lastWatered: string | null, intervalDays: number): string {
  const base = lastWatered ? new Date(lastWatered) : new Date();
  base.setDate(base.getDate() + intervalDays);
  return base.toISOString().slice(0, 10);
}
