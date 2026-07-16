# How PlantVision Makes Decisions

This document explains the reasoning pipeline behind every scan — what runs, in what order, and why each step is designed the way it is.

---

## The Pipeline

```
Photo(s) → PlantNet identification → Gemini care profile → Care engine → Gemini health diagnosis
```

Each stage has a distinct job and a distinct approach (vision model, language model, or deterministic code). They don't overlap.

---

## Stage 1 — Plant Identification (PlantNet)

Identification is handled by [PlantNet](https://plantnet.org/), a botanical computer vision model trained on millions of herbarium specimens and citizen-science observations. PlantNet is not a general-purpose image model — it is built specifically for plant taxonomy.

**How it works:**
- Up to 3 photos are submitted (more angles improve accuracy). Each image is tagged with its organ type — `leaf`, `flower`, `fruit`, `bark` — so the model applies the right feature set.
- PlantNet returns a ranked list of candidate species, each with a confidence score (0–1).
- The top 3 candidates are surfaced to the user; the top match is used downstream.

**Why PlantNet and not the LLM for this:**
General language models hallucinate species names under uncertainty. PlantNet's score is a calibrated botanical probability — if it returns 0.91 for *Monstera deliciosa*, that means something specific. Gemini is kept out of identification entirely.

**Score interpretation (internal rule, not shown to users):**
- ≥ 0.70 — high confidence match
- 0.40–0.69 — plausible, show alternatives
- < 0.40 — uncertain, prompt user to retake with a clearer angle

---

## Stage 2 — Care Profile (Gemini 2.5 Flash + species cache)

Once the species is known, Gemini generates a structured care profile using a strict JSON schema — no free text that needs parsing, no hallucinated fields.

**What's generated:**
- `wateringFrequency` — expressed as "Every X days" or "Every X–Y days" (the range form is deliberate; see Stage 3)
- `wateringTips` — contextual notes (e.g., let topsoil dry between waterings)
- `potSize` — recommended pot diameter
- `potSizeReason` — the botanical reason (root spread, drainage needs)
- `careTips` — exactly 3 short tips; the prompt caps this to prevent information overwhelm
- `toxicToAnimals` / `toxicToHumans` — boolean flags
- `toxicityNotes` — one sentence naming the affected parties and the effect

**Caching:**
Care profiles are cached by scientific name in Supabase after the first generation. A *Monstera deliciosa* profile generated for one user is reused for the next — the species care facts don't change. This keeps latency low and avoids redundant API calls for common plants.

---

## Stage 3 — Care Engine (deterministic, no AI)

The AI returns a baseline watering interval for the species in ideal conditions. The care engine adjusts that baseline to the user's actual environment using two variables: light level and season.

**Algorithm:**

```
interval = baseDays(species frequency)   // lower bound of the AI's range

if light == "bright":  interval -= 1     // faster evaporation
if light == "low":     interval += 2     // slower drying; root rot risk

if season == "summer": interval -= 1     // higher growth demand
if season == "winter": interval += 2     // dormancy
```

**Why the lower bound of the range:**
If the species guide says "Every 5–7 days", using 5 is conservative in the direction of over-checking rather than under-watering. The engine errs toward "check sooner" since checking is free; root rot from neglect is not.

**Season is hemisphere-aware:**
The engine uses the user's latitude (from browser geolocation) to flip seasons for the southern hemisphere. July is winter in Wellington, not summer.

**Light levels are user-declared:**
Light is not inferred from photos (shadows and white balance are too unreliable). The user selects low / medium / bright during onboarding for each plant, with example photos as reference.

**The output:**
A concrete number of days until next watering, plus a plain-English explanation of every adjustment made (e.g., "Low light slows drying — watering less often to avoid root rot."). The reasoning is always shown, not just the number.

---

## Stage 4 — Health Diagnosis (Gemini 2.5 Flash)

Diagnosis runs separately from identification and care, using the plant photos and the already-known species name.

**The model is instructed to:**
- Focus exclusively on visible symptoms — leaf colour, spots, wilting, pests, soil surface, stem condition
- Never re-identify the plant (species is already confirmed)
- Return 2–3 differentials ranked by likelihood (`high` / `medium` / `low`), never a single confident verdict
- Use hedged language throughout ("possible", "consistent with", "may indicate")
- List `missingEvidence` for each differential — what would be needed to confirm it that a photo can't show (root condition, soil moisture, smell)
- Ask 2–3 clarifying questions the user can answer without specialist knowledge

**Why differentials instead of a verdict:**
A single photo cannot distinguish overwatering from root rot from fungal wilt — all can produce yellowing leaves. Presenting ranked differentials forces the app to communicate uncertainty honestly, and the clarifying questions help the user narrow it down themselves.

**Health statuses:**
`healthy` → `mild stress` → `needs attention` → `urgent`

These map directly to the chip colours in the UI (green → amber → amber → red). "Urgent" triggers a more prominent card treatment and is reserved for signs of rapid decline (wilting stem, widespread necrosis, active pest infestation).

---

## What the AI never does

- Makes a single confident diagnosis from one photo
- Infers light level or watering history from the image
- Generates species names during identification (PlantNet owns that)
- Stores or learns from individual user photos — each request is stateless at the model level
