export type TipType = 'principle' | 'companion' | 'energy';

export type PermaTip = {
  id: string;
  type: TipType;
  principle?: number;
  principleShort?: string;
  icon: string;
  title: string;
  body: string;
  plants?: string[]; // companion plant names, if type === 'companion'
  bg: string;
  border: string;
  labelColor: string;
};

export const ALL_TIPS: PermaTip[] = [

  // ── Principle 1: Observe & Interact ──────────────────────────────────────
  {
    id: 'p1-a', type: 'principle', principle: 1, principleShort: 'Observe & Interact',
    icon: '🔍', title: 'Watch before you water',
    body: 'Spend 2 min observing. Yellowing lower leaves = too much water. Dry curling leaves = thirst. The plant tells you.',
    bg: '#EEF4FF', border: '#C7D9FF', labelColor: '#1D4ED8',
  },
  {
    id: 'p1-b', type: 'principle', principle: 1, principleShort: 'Observe & Interact',
    icon: '☀️', title: 'Track the sun before you place',
    body: 'Watch a room for a full day before adding a plant. Light shifts dramatically from morning to afternoon.',
    bg: '#EEF4FF', border: '#C7D9FF', labelColor: '#1D4ED8',
  },
  {
    id: 'p1-c', type: 'principle', principle: 1, principleShort: 'Observe & Interact',
    icon: '🌡️', title: 'Feel the soil, don\'t guess',
    body: 'Stick a finger 2cm into the soil. If it feels damp, wait. Most indoor plant deaths are from over-watering, not under.',
    bg: '#EEF4FF', border: '#C7D9FF', labelColor: '#1D4ED8',
  },

  // ── Principle 2: Catch & Store Energy ────────────────────────────────────
  {
    id: 'p2-a', type: 'energy', principle: 2, principleShort: 'Catch & Store Energy',
    icon: '🌧️', title: 'Collect rainwater',
    body: 'Even a single bucket on a balcony can supply a week of plant water. Rainwater is naturally pH-balanced and chemical-free.',
    bg: '#FFF8E1', border: '#FFE082', labelColor: '#B45309',
  },
  {
    id: 'p2-b', type: 'energy', principle: 2, principleShort: 'Catch & Store Energy',
    icon: '🚿', title: 'Use bathroom steam',
    body: 'Humidity-loving plants (ferns, calathea, orchids) thrive near showers. Move them in — they absorb the steam for free.',
    bg: '#FFF8E1', border: '#FFE082', labelColor: '#B45309',
  },
  {
    id: 'p2-c', type: 'energy', principle: 2, principleShort: 'Catch & Store Energy',
    icon: '🪟', title: 'Reflect winter light',
    body: 'Place a mirror behind north-facing plants in winter. Even diffuse reflected light can prevent leggy growth when daylight is short.',
    bg: '#FFF8E1', border: '#FFE082', labelColor: '#B45309',
  },

  // ── Principle 3: Obtain a Yield ──────────────────────────────────────────
  {
    id: 'p3-a', type: 'principle', principle: 3, principleShort: 'Obtain a Yield',
    icon: '🌿', title: 'Grow herbs on your windowsill',
    body: 'Basil, chives, mint, or coriander on a kitchen sill = fresh herbs with zero food miles. Water once a week, harvest daily.',
    bg: '#F0FDF4', border: '#BBF7D0', labelColor: '#166534',
  },
  {
    id: 'p3-b', type: 'principle', principle: 3, principleShort: 'Obtain a Yield',
    icon: '✂️', title: 'Propagate instead of buying',
    body: 'One mature pothos or spider plant can yield 20+ cuttings per year. Root in water, pot up, give away — no cost.',
    bg: '#F0FDF4', border: '#BBF7D0', labelColor: '#166534',
  },
  {
    id: 'p3-c', type: 'principle', principle: 3, principleShort: 'Obtain a Yield',
    icon: '🌱', title: 'Microgreens in 7 days',
    body: 'A shallow tray of radish, pea, or sunflower seeds on a sunny sill yields nutritious microgreens in under a week.',
    bg: '#F0FDF4', border: '#BBF7D0', labelColor: '#166534',
  },

  // ── Principle 4: Self-Regulation & Feedback ──────────────────────────────
  {
    id: 'p4-a', type: 'principle', principle: 4, principleShort: 'Self-Regulation',
    icon: '🔄', title: 'If it keeps dying, change the species',
    body: 'If the same spot keeps killing plants, the spot is the problem — not you. Match species to conditions, not conditions to species.',
    bg: '#F5F3FF', border: '#DDD6FE', labelColor: '#5B21B6',
  },
  {
    id: 'p4-b', type: 'principle', principle: 4, principleShort: 'Self-Regulation',
    icon: '🍂', title: 'Leaf drop is feedback',
    body: 'Plants shed leaves when moved as a stress response. Give them 2 weeks to stabilise before intervening — it\'s regulation, not death.',
    bg: '#F5F3FF', border: '#DDD6FE', labelColor: '#5B21B6',
  },

  // ── Principle 5: Renewable Resources ─────────────────────────────────────
  {
    id: 'p5-a', type: 'energy', principle: 5, principleShort: 'Renewable Resources',
    icon: '🍌', title: 'Banana peel fertiliser',
    body: 'Soak 2 banana peels in 1L of water for 24 hours. The liquid is rich in potassium — excellent for flowering plants.',
    bg: '#ECFDF5', border: '#A7F3D0', labelColor: '#065F46',
  },
  {
    id: 'p5-b', type: 'energy', principle: 5, principleShort: 'Renewable Resources',
    icon: '🍝', title: 'Cooled pasta water',
    body: 'Unsalted pasta or vegetable cooking water feeds plants with minerals and starch. Never let it go down the drain.',
    bg: '#ECFDF5', border: '#A7F3D0', labelColor: '#065F46',
  },
  {
    id: 'p5-c', type: 'energy', principle: 5, principleShort: 'Renewable Resources',
    icon: '🫖', title: 'Diluted tea feeds acid-lovers',
    body: 'Leftover cold black tea (without milk) is mildly acidic — great for ferns, orchids, blueberries, and gardenias.',
    bg: '#ECFDF5', border: '#A7F3D0', labelColor: '#065F46',
  },

  // ── Principle 6: Produce No Waste ────────────────────────────────────────
  {
    id: 'p6-a', type: 'energy', principle: 6, principleShort: 'Produce No Waste',
    icon: '☕', title: 'Coffee grounds = nitrogen',
    body: 'Sprinkle used coffee grounds on soil monthly. They add nitrogen, improve drainage, and deter fungus gnats.',
    bg: '#FFF7ED', border: '#FED7AA', labelColor: '#92400E',
  },
  {
    id: 'p6-b', type: 'energy', principle: 6, principleShort: 'Produce No Waste',
    icon: '🥚', title: 'Eggshell calcium',
    body: 'Crush dried eggshells and add to soil for slow-release calcium. Or brew as tea — steep crushed shells in water overnight.',
    bg: '#FFF7ED', border: '#FED7AA', labelColor: '#92400E',
  },
  {
    id: 'p6-c', type: 'principle', principle: 6, principleShort: 'Produce No Waste',
    icon: '✂️', title: 'Never bin a cutting',
    body: 'Every trimmed stem is a potential new plant. Drop it in water — most houseplants will root in 1–3 weeks.',
    bg: '#FFF7ED', border: '#FED7AA', labelColor: '#92400E',
  },

  // ── Principle 7: Design From Patterns to Details ─────────────────────────
  {
    id: 'p7-a', type: 'principle', principle: 7, principleShort: 'Patterns to Details',
    icon: '📐', title: 'Group by water needs',
    body: 'Arrange plants in watering zones, not aesthetic zones. One zone for succulents, one for tropicals — one visit covers each group.',
    bg: '#FFF1F2', border: '#FECDD3', labelColor: '#9F1239',
  },
  {
    id: 'p7-b', type: 'principle', principle: 7, principleShort: 'Patterns to Details',
    icon: '🌀', title: 'Plant in spirals',
    body: 'A herb spiral (raised bed coiled inward) creates multiple microclimates — sunny/dry at top, shady/moist at base — in 1m².',
    bg: '#FFF1F2', border: '#FECDD3', labelColor: '#9F1239',
  },

  // ── Principle 8: Integrate Rather Than Segregate ─────────────────────────
  {
    id: 'p8-a', type: 'principle', principle: 8, principleShort: 'Integrate, Don\'t Segregate',
    icon: '🤝', title: 'Spider plant absorbs formaldehyde',
    body: 'Place a spider plant near new furniture, paint, or flooring. It absorbs formaldehyde off-gassing from synthetic materials.',
    bg: '#F0FDFA', border: '#99F6E4', labelColor: '#134E4A',
  },
  {
    id: 'p8-b', type: 'principle', principle: 8, principleShort: 'Integrate, Don\'t Segregate',
    icon: '🌬️', title: 'Cluster plants for humidity',
    body: 'Plants transpire water vapour. Group humidity-lovers together — they create a shared microclimate that reduces the need for misting.',
    bg: '#F0FDFA', border: '#99F6E4', labelColor: '#134E4A',
  },

  // ── Principle 9: Small & Slow Solutions ──────────────────────────────────
  {
    id: 'p9-a', type: 'principle', principle: 9, principleShort: 'Small & Slow Solutions',
    icon: '🐌', title: 'Bottom-water for stronger roots',
    body: 'Set the pot in a shallow tray of water. Roots grow downward toward moisture — slow but the root system will be stronger.',
    bg: '#F7FEE7', border: '#D9F99D', labelColor: '#3F6212',
  },
  {
    id: 'p9-b', type: 'principle', principle: 9, principleShort: 'Small & Slow Solutions',
    icon: '🌱', title: 'Start with one fast grower',
    body: 'Master one forgiving plant (pothos, spider plant) before adding sensitive species. You\'ll learn watering rhythms without casualties.',
    bg: '#F7FEE7', border: '#D9F99D', labelColor: '#3F6212',
  },

  // ── Principle 10: Use & Value Diversity ──────────────────────────────────
  {
    id: 'p10-a', type: 'principle', principle: 10, principleShort: 'Use & Value Diversity',
    icon: '🌈', title: 'Mix leaf textures',
    body: 'Pair smooth leaves with textured, large with small. Diverse canopy shapes reduce shared pests and create more visual stability.',
    bg: '#FDF4FF', border: '#E9D5FF', labelColor: '#6B21A8',
  },
  {
    id: 'p10-b', type: 'principle', principle: 10, principleShort: 'Use & Value Diversity',
    icon: '🏔️', title: 'Layer by root depth',
    body: 'Shallow-rooted herbs + medium-rooted ferns + deep-rooted tropicals can share a large container without competing.',
    bg: '#FDF4FF', border: '#E9D5FF', labelColor: '#6B21A8',
  },

  // ── Principle 11: Use Edges & Value the Marginal ─────────────────────────
  {
    id: 'p11-a', type: 'principle', principle: 11, principleShort: 'Use Edges',
    icon: '🪟', title: 'Window sills are prime real estate',
    body: 'The edge between light and interior is the most energy-rich zone in your home. Give it to your most productive plants.',
    bg: '#EFF6FF', border: '#BFDBFE', labelColor: '#1E40AF',
  },
  {
    id: 'p11-b', type: 'principle', principle: 11, principleShort: 'Use Edges',
    icon: '❄️', title: 'The top of the fridge stays warm',
    body: 'Appliance tops are warm, slightly lit microclimates. Trailing pothos or philodendrons thrive there with minimal care.',
    bg: '#EFF6FF', border: '#BFDBFE', labelColor: '#1E40AF',
  },

  // ── Principle 12: Creatively Respond to Change ───────────────────────────
  {
    id: 'p12-a', type: 'principle', principle: 12, principleShort: 'Respond to Change',
    icon: '🦋', title: 'Move plants when seasons shift',
    body: 'Winter light angles are 30° lower than summer. A south window that worked in July may be too dim by November — observe and move.',
    bg: '#FFF7ED', border: '#FDE68A', labelColor: '#92400E',
  },
  {
    id: 'p12-b', type: 'principle', principle: 12, principleShort: 'Respond to Change',
    icon: '📖', title: 'A dying plant is data',
    body: 'Every plant that dies teaches you something about light, water, or humidity. That knowledge makes every future plant healthier.',
    bg: '#FFF7ED', border: '#FDE68A', labelColor: '#92400E',
  },

  // ── Companion Planting ────────────────────────────────────────────────────
  {
    id: 'comp-1', type: 'companion',
    icon: '🌿', title: 'Basil + Chamomile',
    body: 'Chamomile stimulates basil\'s essential oil production and repels flies. Grow them in the same pot or side by side.',
    plants: ['Basil', 'Chamomile'],
    bg: '#F0FDF4', border: '#86EFAC', labelColor: '#166534',
  },
  {
    id: 'comp-2', type: 'companion',
    icon: '🌿', title: 'Lavender + Rosemary',
    body: 'Both Mediterranean — same dry, sunny, well-drained conditions. Same watering day. Lavender\'s scent deters aphids on rosemary.',
    plants: ['Lavender', 'Rosemary'],
    bg: '#F0FDF4', border: '#86EFAC', labelColor: '#166534',
  },
  {
    id: 'comp-3', type: 'companion',
    icon: '🌿', title: 'Peace Lily + Boston Fern',
    body: 'Both love high humidity and indirect light. Grouped together, they create a shared humidity cloud — less misting for both.',
    plants: ['Peace Lily', 'Boston Fern'],
    bg: '#F0FDF4', border: '#86EFAC', labelColor: '#166534',
  },
  {
    id: 'comp-4', type: 'companion',
    icon: '🌿', title: 'Snake Plant + Aloe Vera',
    body: 'Both succulents. Both neglect-tolerant. They share a sunny, dry shelf with one watering every 2–3 weeks. Zero conflict.',
    plants: ['Snake Plant', 'Aloe Vera'],
    bg: '#F0FDF4', border: '#86EFAC', labelColor: '#166534',
  },
  {
    id: 'comp-5', type: 'companion',
    icon: '🌿', title: 'Pothos + Spider Plant',
    body: 'Together these two process benzene, formaldehyde, and CO₂. A high shelf with both creates an air-purifying canopy.',
    plants: ['Pothos', 'Spider Plant'],
    bg: '#F0FDF4', border: '#86EFAC', labelColor: '#166534',
  },
  {
    id: 'comp-6', type: 'companion',
    icon: '🌿', title: 'Mint + Chives',
    body: 'Chives deter aphids while mint repels ants and flies. Both like moist soil. Keep mint in its own pot to avoid it taking over.',
    plants: ['Mint', 'Chives'],
    bg: '#F0FDF4', border: '#86EFAC', labelColor: '#166534',
  },
  {
    id: 'comp-7', type: 'companion',
    icon: '🌿', title: 'Orchid + Air Plant (Tillandsia)',
    body: 'Both epiphytes — no soil needed. Tillandsia absorbs moisture from the air alongside orchids, creating a humid shared zone.',
    plants: ['Orchid', 'Tillandsia'],
    bg: '#F0FDF4', border: '#86EFAC', labelColor: '#166534',
  },
];

/** Returns a deterministic set of tips for today, mixing principles + companions */
export function getDailyTips(count = 6): PermaTip[] {
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();

  const principles = ALL_TIPS.filter(t => t.type !== 'companion');
  const companions = ALL_TIPS.filter(t => t.type === 'companion');

  const pStart = seed % principles.length;
  const cStart = (seed * 7) % companions.length;

  const result: PermaTip[] = [];
  for (let i = 0; i < 4; i++) result.push(principles[(pStart + i) % principles.length]);
  for (let i = 0; i < 2; i++) result.push(companions[(cStart + i) % companions.length]);

  return result.slice(0, count);
}

// ─── Personalised tips ────────────────────────────────────────────────────────

export type PlantSummary = {
  plant_name: string;
  nickname: string | null;
  light_level: string | null;
  watering_frequency: string | null;
};

function label(p: PlantSummary) { return p.nickname || p.plant_name; }
function parseInterval(freq: string | null): number {
  if (!freq) return 7;
  const m = freq.match(/(\d+)/);
  return m ? parseInt(m[1]) : 7;
}

/**
 * Build tips that reference the user's actual plant names.
 * Falls back to getDailyTips() when fewer than 2 plants are known.
 */
export function getPersonalizedTips(plants: PlantSummary[], count = 6): PermaTip[] {
  if (plants.length < 2) return getDailyTips(count);

  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const tips: PermaTip[] = [];

  // ── 1. Matching companion pairs from the static library ───────────────────
  const companions = ALL_TIPS.filter(t => t.type === 'companion');
  for (const c of companions) {
    if (tips.length >= 2) break;
    const matches = (c.plants ?? []).filter(cp =>
      plants.some(up =>
        up.plant_name.toLowerCase().includes(cp.toLowerCase()) ||
        cp.toLowerCase().includes(up.plant_name.toLowerCase().split(' ')[0])
      )
    );
    if (matches.length > 0) {
      tips.push({ ...c, id: 'pers-' + c.id,
        body: c.body + ` You have ${matches.join(' & ')} — try this pairing.` });
    }
  }

  // ── 2. Pair plants that share light level ─────────────────────────────────
  for (const lvl of ['low', 'medium', 'high'] as const) {
    if (tips.length >= 3) break;
    const group = plants.filter(p => p.light_level === lvl);
    if (group.length < 2) continue;
    const a = label(group[0]); const b = label(group[1]);
    const icon = lvl === 'low' ? '🌥️' : lvl === 'medium' ? '⛅' : '☀️';
    const lightLabel = lvl === 'low' ? 'low-light' : lvl === 'medium' ? 'medium-light' : 'bright-light';
    tips.push({
      id: `pers-light-${lvl}`, type: 'companion', icon,
      title: `${a} + ${b}`,
      body: `Both are ${lightLabel} plants — group them in the same spot. One check covers both and they'll create a shared microclimate.`,
      plants: [a, b],
      bg: '#F0FDFA', border: '#99F6E4', labelColor: '#134E4A',
    });
  }

  // ── 3. Pair drought-tolerant plants (watering ≥ 10 days) ─────────────────
  if (tips.length < 4) {
    const dry = plants.filter(p => parseInterval(p.watering_frequency) >= 10);
    if (dry.length >= 2) {
      const a = label(dry[0]); const b = label(dry[1]);
      tips.push({
        id: 'pers-drought', type: 'principle', principle: 7,
        principleShort: 'Patterns to Details', icon: '🏜️',
        title: `Water ${a} + ${b} together`,
        body: `Both are drought-tolerant. Schedule one shared watering day — less effort, no accidental over-watering, and you'll spot problems in both at once.`,
        bg: '#FFF1F2', border: '#FECDD3', labelColor: '#9F1239',
      });
    }
  }

  // ── 4. Named observation tip for one of their plants ─────────────────────
  if (tips.length < 5) {
    const p = plants[seed % plants.length];
    tips.push({
      id: 'pers-observe', type: 'principle', principle: 1,
      principleShort: 'Observe & Interact', icon: '🔍',
      title: `Watch your ${label(p)}`,
      body: `Spend 2 minutes observing. Yellowing lower leaves = too much water. Dry curling edges = thirst. ${label(p)} tells you before it's too late.`,
      bg: '#EEF4FF', border: '#C7D9FF', labelColor: '#1D4ED8',
    });
  }

  // ── 5. Named propagation tip ──────────────────────────────────────────────
  if (tips.length < 6) {
    const p = plants[(seed * 3) % plants.length];
    tips.push({
      id: 'pers-propagate', type: 'principle', principle: 3,
      principleShort: 'Obtain a Yield', icon: '✂️',
      title: `Propagate your ${label(p)}`,
      body: `Trim a healthy stem and stand it in water. Most houseplants root in 2–3 weeks — a free new plant from something you already have.`,
      bg: '#F0FDF4', border: '#BBF7D0', labelColor: '#166534',
    });
  }

  // ── 6. Pad with general principle tips if still short ─────────────────────
  const usedIds = new Set(tips.map(t => t.id));
  const general = ALL_TIPS.filter(t => t.type !== 'companion' && !usedIds.has(t.id));
  const gStart = seed % general.length;
  for (let i = 0; tips.length < count && i < general.length; i++) {
    tips.push(general[(gStart + i) % general.length]);
  }

  return tips.slice(0, count);
}

// ─── Single-plant tips ─────────────────────────────────────────────────────────

export type PlantTipInput = {
  plant_name: string;
  nickname: string | null;
  light_level: string | null;
  watering_frequency: string | null;
  care_tips?: string[] | null;
  toxicity_info?: string | null;
};

function parseToxicity(raw: string | null | undefined): { animals?: boolean; humans?: boolean; notes?: string } | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/**
 * Build a deck of tips that speak about ONE specific plant, drawn from its own
 * light level, watering rhythm, toxicity and scan-generated care notes — plus a
 * matching companion pairing from the library where one exists.
 */
export function getPlantTips(p: PlantTipInput, count = 6): PermaTip[] {
  const name = p.nickname || p.plant_name;
  const tips: PermaTip[] = [];

  // 1. Light-specific placement advice
  if (p.light_level) {
    const byLight = {
      low: {
        icon: '🌥️', title: `Keep ${name} out of direct sun`,
        body: `${name} does best in low, indirect light. A north-facing sill — or a few feet back from a brighter window — avoids scorched leaves.`,
      },
      medium: {
        icon: '⛅', title: `Bright, indirect light suits ${name}`,
        body: `Set ${name} near a filtered window and rotate the pot a quarter-turn each week, so it grows evenly instead of leaning toward the light.`,
      },
      bright: {
        icon: '☀️', title: `Give ${name} plenty of light`,
        body: `${name} loves bright light — a south or west aspect keeps growth compact. Too little light and it turns leggy and pale.`,
      },
    } as const;
    const key = p.light_level === 'low' ? 'low' : p.light_level === 'medium' ? 'medium' : 'bright';
    const m = byLight[key];
    tips.push({ id: 'plant-light', type: 'principle', principleShort: 'Light',
      icon: m.icon, title: m.title, body: m.body,
      bg: '', border: '', labelColor: '#1D4ED8' });
  }

  // 2. Watering rhythm
  const interval = parseInterval(p.watering_frequency);
  tips.push({
    id: 'plant-water', type: 'principle', principleShort: 'Watering', icon: '💧',
    title: interval >= 10 ? `Let ${name} dry out` : `Keep ${name} evenly moist`,
    body: interval >= 10
      ? `${name} is drought-tolerant. Water about every ${interval} days and let the top few cm of soil dry fully first — over-watering is the main risk.`
      : `${name} likes steady moisture. Check every ${interval} days and water once the top 2 cm feels dry; never leave it standing in a full saucer.`,
    bg: '', border: '', labelColor: '#0E7490',
  });

  // 3. Safety, only when the species is toxic
  const tox = parseToxicity(p.toxicity_info);
  if (tox && (tox.animals || tox.humans)) {
    const who = tox.animals && tox.humans ? 'pets and children' : tox.animals ? 'pets' : 'children';
    tips.push({
      id: 'plant-tox', type: 'principle', principleShort: 'Safety', icon: '⚠️',
      title: `Keep ${name} away from ${who}`,
      body: tox.notes?.trim()
        || `${name} is toxic if chewed or eaten. Keep it on a high shelf or in a room your ${who} can't reach.`,
      bg: '', border: '', labelColor: '#B91C1C',
    });
  }

  // 4. Scan-generated care notes (already specific to this species)
  const careTitles = ['Care note', 'Pro tip', 'Good to know'];
  (p.care_tips ?? []).slice(0, 3).forEach((t, i) => {
    if (!t?.trim()) return;
    tips.push({
      id: `plant-care-${i}`, type: 'principle', principleShort: careTitles[i] ?? 'Care note',
      icon: ['🌿', '🪴', '✨'][i] ?? '🌿',
      title: careTitles[i] ?? 'Care note', body: t.trim(),
      bg: '', border: '', labelColor: '#166534',
    });
  });

  // 5. Propagation, named for this plant
  tips.push({
    id: 'plant-propagate', type: 'principle', principleShort: 'Propagation', icon: '✂️',
    title: `Grow more ${name}`,
    body: `Snip a healthy stem just below a node and stand it in water. Most houseplants root in 2–3 weeks — a free new ${name} from the one you already have.`,
    bg: '', border: '', labelColor: '#166534',
  });

  // 6. Matching companion pairing from the library, if the species appears in one
  const first = p.plant_name.toLowerCase().split(' ')[0];
  const companion = ALL_TIPS.find(t => t.type === 'companion'
    && (t.plants ?? []).some(cp => {
      const c = cp.toLowerCase();
      return c.includes(first) || first.includes(c) || p.plant_name.toLowerCase().includes(c);
    }));
  if (companion) {
    tips.push({ ...companion, id: 'plant-companion' });
  }

  return tips.slice(0, count);
}
