// ═══════════════════════════════════════════════════════════════════════════════
// 737-800 NON-NORMAL CONFIGURATION LANDING DISTANCE
// Source: United 737-800 Non-Normal Performance Tables, 24 JAN 20
//        IMG_0900 (Airspeed Unreliable Flaps 40 — dedicated page)
//        IMG_0901 (Non-Normal page 1)
//        IMG_0902 (Non-Normal page 2)
//
// Baseline conditions for all tables:
//   Sea level, standard day, no wind
//   Max manual braking, maximum available reverse thrust
//   Touchdown within first 1000 feet, 1% downhill slope
//   Associated flap setting and VREF + 5
//
// Structure per scenario:
//   base[brakingAction] = [dist@106k, dist@116k, dist@126k, dist@136k, dist@146.3k, dist@174.2k]
//   corr = scalar corrections (add per unit of each variable)
//
// Braking action rows: dry | good | medium | poor
// Weight breakpoints:  106, 116, 126, 136, 146.3, 174.2  (×1000 lbs)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── INTERPOLATION ────────────────────────────────────────────────────────────
function lerp(x0, y0, x1, y1, x) {
  if (x1 === x0) return y0;
  const t = Math.max(0, Math.min(1, (x - x0) / (x1 - x0)));
  return y0 + t * (y1 - y0);
}
function interpTable(pairs, x) {
  if (x <= pairs[0][0]) return pairs[0][1];
  if (x >= pairs[pairs.length-1][0]) return pairs[pairs.length-1][1];
  for (let i = 1; i < pairs.length; i++) {
    if (x <= pairs[i][0])
      return lerp(pairs[i-1][0], pairs[i-1][1], pairs[i][0], pairs[i][1], x);
  }
  return pairs[pairs.length-1][1];
}

const WTS = [106, 116, 126, 136, 146.3, 174.2];
function makePairs(row) { return WTS.map((w, i) => [w, row[i]]); }

// ─── ISA DEVIATION ────────────────────────────────────────────────────────────
function isaDeviation(pressureAltFt, oatC) {
  const isaTemp = 15 - 2 * (pressureAltFt / 1000);
  return Math.max(0, oatC - isaTemp);
}

// ═══════════════════════════════════════════════════════════════════════════════
// NON-NORMAL SCENARIO TABLE
//
// Each scenario:
//   id        — key used in config failureOptions
//   base      — { dry, good, medium, poor } each = [d@106k … d@174.2k]
//   corr      — scalar corrections object
//
// Corrections structure (all non-normal tables share the same column layout):
//   altPer1000ft_lo  — ft per 1000 ft PA ≤ 8000 ft
//   altPer1000ft_hi  — ft per 1000 ft PA > 8000 ft
//   tailwindPerKt    — ft per kt tailwind
//   vrefAbove5PerKt  — ft per kt above VREF+5  (N/A shown as null)
//   isaAbovePerDegC  — ft per °C above ISA
//   reverserInop     — [oneInop, bothInop]  (null = N/A in source table)
//   autoland         — ft (as required)
// ═══════════════════════════════════════════════════════════════════════════════

const NN_SCENARIOS = [

  // ── IMG_0901: All Flaps Up Landing (TE+LE Flap 0)  VREF 40+55 ──────────────
  {
    id: "flaps-up",
    base: {
      dry:    [3660, 3910, 4160, 4410, 4710, 6270],
      good:   [4960, 5250, 5540, 5830, 6130, 6850],
      medium: [7020, 7480, 7940, 8400, 8870, 10070],
      poor:   [9450, 10130, 10810, 11490, 12190, 14000],
    },
    corr: { altPer1000ft_lo:170, altPer1000ft_hi:350, tailwindPerKt:70, vrefAbove5PerKt:30, isaAbovePerDegC:15, reverserInop:[140,310], autoland:945 },
  },

  // ── IMG_0901: Anti-Skid Inoperative Flaps 40  VREF 40 ───────────────────────
  {
    id: "anti-skid-inop-f40",
    base: {
      dry:    [4590, 4880, 5170, 5460, 5760, 6510],
      good:   [5130, 5470, 5810, 6150, 6500, 7390],
      medium: [6630, 7100, 7570, 8040, 8520, 9780],
      poor:   [9690, 10350, 11010, 11670, 12350, 14190],
    },
    corr: { altPer1000ft_lo:140, altPer1000ft_hi:190, tailwindPerKt:95, vrefAbove5PerKt:40, isaAbovePerDegC:15, reverserInop:[370,880], autoland:980 },
  },

  // ── IMG_0901: Jammed/Restricted Flight Controls Flaps 15  VREF 15 ───────────
  {
    id: "jammed-controls-f15",
    base: {
      dry:    [2780, 2960, 3140, 3320, 3510, 4100],
      good:   [3870, 4120, 4370, 4620, 4870, 5520],
      medium: [5310, 5690, 6070, 6450, 6840, 7880],
      poor:   [7090, 7620, 8150, 8680, 9220, 10700],
    },
    corr: { altPer1000ft_lo:80, altPer1000ft_hi:100, tailwindPerKt:45, vrefAbove5PerKt:25, isaAbovePerDegC:10, reverserInop:[80,170], autoland:615 },
  },

  // ── IMG_0901: Leading Edge Flaps Transit Flaps 15  VREF 15+15 ───────────────
  {
    id: "le-flaps-transit-f15",
    base: {
      dry:    [3130, 3330, 3530, 3730, 3940, 4590],
      good:   [4410, 4690, 4970, 5250, 5540, 6260],
      medium: [6060, 6490, 6920, 7350, 7790, 8930],
      poor:   [8040, 8640, 9240, 9840, 10460, 12140],
    },
    corr: { altPer1000ft_lo:90, altPer1000ft_hi:120, tailwindPerKt:45, vrefAbove5PerKt:35, isaAbovePerDegC:15, reverserInop:[340,780], autoland:940 },
  },

  // ── IMG_0901: Loss of Hydraulic System A Flaps 30  VREF 30 ──────────────────
  {
    id: "hyd-a-loss-f30",
    base: {
      dry:    [3060, 3230, 3400, 3570, 3750, 4310],
      good:   [4380, 4660, 4940, 5220, 5510, 6230],
      medium: [5950, 6370, 6790, 7210, 7640, 8780],
      poor:   [7770, 8360, 8950, 9540, 10150, 11770],
    },
    corr: { altPer1000ft_lo:80, altPer1000ft_hi:110, tailwindPerKt:45, vrefAbove5PerKt:30, isaAbovePerDegC:10, reverserInop:[100,170], autoland:650 },
  },

  // ── IMG_0901: Loss of Hydraulic System A Flaps 40  VREF 40 ──────────────────
  {
    id: "hyd-a-loss-f40",
    base: {
      dry:    [2950, 3110, 3270, 3430, 3600, 4100],
      good:   [4160, 4430, 4700, 4970, 5250, 5920],
      medium: [5600, 6000, 6400, 6800, 7210, 8270],
      poor:   [7340, 7890, 8440, 8990, 9550, 11030],
    },
    corr: { altPer1000ft_lo:80, altPer1000ft_hi:100, tailwindPerKt:45, vrefAbove5PerKt:35, isaAbovePerDegC:15, reverserInop:[90,140], autoland:615 },
  },

  // ── IMG_0901: Loss of Hydraulic System B Flaps 15  VREF 15 ──────────────────
  {
    id: "hyd-b-loss-f15",
    base: {
      dry:    [3270, 3450, 3630, 3810, 4000, 4470],
      good:   [4600, 4900, 5200, 5500, 5810, 6620],
      medium: [6220, 6680, 7140, 7600, 8070, 9300],
      poor:   [8270, 8890, 9510, 10130, 10770, 12500],
    },
    corr: { altPer1000ft_lo:90, altPer1000ft_hi:120, tailwindPerKt:50, vrefAbove5PerKt:30, isaAbovePerDegC:10, reverserInop:[130,220], autoland:675 },
  },

  // ── IMG_0901: Manual Reversion / Loss Sys A+B Flaps 15  VREF 15 ─────────────
  {
    id: "manual-reversion-f15",
    base: {
      dry:    [4540, 4800, 5060, 5320, 5580, 6230],
      good:   [6580, 7010, 7440, 7870, 8310, 9420],
      medium: [8760, 9380, 10000, 10620, 11250, 12930],
      poor:   [11310, 12130, 12950, 13770, 14610, 16900],
    },
    corr: { altPer1000ft_lo:130, altPer1000ft_hi:170, tailwindPerKt:65, vrefAbove5PerKt:50, isaAbovePerDegC:15, reverserInop:[-30,210], autoland:935 },
  },

  // ── IMG_0901: One Engine Inoperative Flaps 15  VREF 15 ──────────────────────
  {
    id: "one-eng-inop-f15",
    base: {
      dry:    [2800, 2990, 3180, 3370, 3570, 4190],
      good:   [4060, 4320, 4580, 4840, 5110, 5780],
      medium: [5840, 6260, 6680, 7100, 7530, 8640],
      poor:   [8290, 8910, 9530, 10150, 10780, 12460],
    },
    corr: { altPer1000ft_lo:80, altPer1000ft_hi:100, tailwindPerKt:45, vrefAbove5PerKt:25, isaAbovePerDegC:10, reverserInop:[0,90], autoland:630 },
  },

  // ── IMG_0902: TE Flap Asymmetry (1 ≤ Flap Lever < 15)  VREF 40+30 ──────────
  {
    id: "te-asym-f1-14",
    base: {
      dry:    [3090, 3280, 3470, 3660, 3870, 4620],
      good:   [4340, 4590, 4840, 5090, 5340, 5990],
      medium: [5980, 6380, 6780, 7180, 7590, 8650],
      poor:   [7990, 8570, 9150, 9730, 10330, 11890],
    },
    corr: { altPer1000ft_lo:90, altPer1000ft_hi:140, tailwindPerKt:45, vrefAbove5PerKt:25, isaAbovePerDegC:10, reverserInop:[90,200], autoland:695 },
  },

  // ── IMG_0902: TE Flap Asymmetry (Flap Lever 15 or 25)  VREF 15 ──────────────
  {
    id: "te-asym-f15-25",
    base: {
      dry:    [2780, 2960, 3140, 3320, 3510, 4100],
      good:   [3870, 4120, 4370, 4620, 4870, 5520],
      medium: [5310, 5690, 6070, 6450, 6840, 7880],
      poor:   [7090, 7620, 8150, 8680, 9220, 10700],
    },
    corr: { altPer1000ft_lo:80, altPer1000ft_hi:100, tailwindPerKt:45, vrefAbove5PerKt:35, isaAbovePerDegC:15, reverserInop:[270,610], autoland:830 },
  },

  // ── IMG_0902: TE Flap Asymmetry (Flap Lever 30)  VREF 30 ────────────────────
  {
    id: "te-asym-f30",
    base: {
      dry:    [2700, 2860, 3020, 3180, 3350, 3820],
      good:   [3740, 3970, 4200, 4430, 4660, 5250],
      medium: [5050, 5400, 5750, 6100, 6460, 7410],
      poor:   [6640, 7130, 7620, 8110, 8620, 9960],
    },
    corr: { altPer1000ft_lo:70, altPer1000ft_hi:90, tailwindPerKt:40, vrefAbove5PerKt:25, isaAbovePerDegC:10, reverserInop:[240,550], autoland:790 },
  },

  // ── IMG_0902: TE Flap Disagree (1 ≤ Indicated < 15)  VREF 40+30 ─────────────
  {
    id: "te-disagree-f1-14",
    base: {
      dry:    [3090, 3280, 3470, 3660, 3870, 4620],
      good:   [4340, 4590, 4840, 5090, 5340, 5990],
      medium: [5980, 6380, 6780, 7180, 7590, 8650],
      poor:   [7990, 8570, 9150, 9730, 10330, 11890],
    },
    corr: { altPer1000ft_lo:90, altPer1000ft_hi:140, tailwindPerKt:45, vrefAbove5PerKt:25, isaAbovePerDegC:10, reverserInop:[90,200], autoland:695 },
  },

  // ── IMG_0902: TE Flap Disagree (15 ≤ Indicated < 30)  VREF 15 ───────────────
  {
    id: "te-disagree-f15-29",
    base: {
      dry:    [2780, 2960, 3140, 3320, 3510, 4100],
      good:   [3870, 4120, 4370, 4620, 4870, 5520],
      medium: [5310, 5690, 6070, 6450, 6840, 7880],
      poor:   [7090, 7620, 8150, 8680, 9220, 10700],
    },
    corr: { altPer1000ft_lo:80, altPer1000ft_hi:100, tailwindPerKt:45, vrefAbove5PerKt:35, isaAbovePerDegC:15, reverserInop:[270,610], autoland:830 },
  },

  // ── IMG_0902: TE Flap Disagree (30 ≤ Indicated < 40)  VREF 30 ───────────────
  {
    id: "te-disagree-f30-39",
    base: {
      dry:    [2700, 2860, 3020, 3180, 3350, 3820],
      good:   [3740, 3970, 4200, 4430, 4660, 5250],
      medium: [5050, 5400, 5750, 6100, 6460, 7410],
      poor:   [6640, 7130, 7620, 8110, 8620, 9960],
    },
    corr: { altPer1000ft_lo:70, altPer1000ft_hi:90, tailwindPerKt:40, vrefAbove5PerKt:25, isaAbovePerDegC:10, reverserInop:[240,550], autoland:790 },
  },

  // ── IMG_0902: TE Flaps Up Landing Flaps < 1  VREF 40+40 ─────────────────────
  {
    id: "te-flaps-up-f0",
    base: {
      dry:    [3320, 3530, 3740, 3950, 4180, 5100],
      good:   [4550, 4810, 5070, 5330, 5600, 6270],
      medium: [6350, 6770, 7190, 7610, 8040, 9120],
      poor:   [8560, 9170, 9780, 10390, 11010, 12660],
    },
    corr: { altPer1000ft_lo:90, altPer1000ft_hi:230, tailwindPerKt:50, vrefAbove5PerKt:30, isaAbovePerDegC:10, reverserInop:[110,230], autoland:765 },
  },

  // ── IMG_0902: Electric Stabilizer Trim Inoperative  VREF 15 ─────────────────
  {
    id: "elec-stab-trim-inop",
    base: {
      dry:    [2780, 2960, 3140, 3320, 3510, 4100],
      good:   [3870, 4120, 4370, 4620, 4870, 5520],
      medium: [5310, 5690, 6070, 6450, 6840, 7880],
      poor:   [7090, 7620, 8150, 8680, 9220, 10700],
    },
    corr: { altPer1000ft_lo:80, altPer1000ft_hi:100, tailwindPerKt:45, vrefAbove5PerKt:35, isaAbovePerDegC:15, reverserInop:[270,610], autoland:830 },
  },

  // ── IMG_0902: Airspeed Unreliable Flaps 15  VREF 15 ─────────────────────────
  {
    id: "airspeed-unrel-f15",
    base: {
      dry:    [2860, 3050, 3240, 3430, 3630, 4280],
      good:   [3990, 4250, 4510, 4770, 5040, 5710],
      medium: [5450, 5850, 6250, 6650, 7060, 8120],
      poor:   [7240, 7800, 8360, 8920, 9500, 11030],
    },
    corr: { altPer1000ft_lo:80, altPer1000ft_hi:110, tailwindPerKt:45, vrefAbove5PerKt:null, isaAbovePerDegC:10, reverserInop:[90,200], autoland:645 },
  },

  // ── IMG_0902: Airspeed Unreliable Flaps 30  VREF 30 ─────────────────────────
  {
    id: "airspeed-unrel-f30",
    base: {
      dry:    [2780, 2950, 3120, 3290, 3470, 3970],
      good:   [3860, 4100, 4340, 4580, 4820, 5470],
      medium: [5180, 5550, 5920, 6290, 6670, 7650],
      poor:   [6830, 7340, 7850, 8360, 8880, 10270],
    },
    corr: { altPer1000ft_lo:80, altPer1000ft_hi:100, tailwindPerKt:45, vrefAbove5PerKt:null, isaAbovePerDegC:15, reverserInop:[270,610], autoland:825 },
  },

  // ── IMG_0900: Airspeed Unreliable Flaps 40  VREF 40 ─────────────────────────
  {
    id: "airspeed-unrel-f40",
    base: {
      dry:    [2680, 2840, 3000, 3160, 3330, 3800],
      good:   [3720, 3950, 4180, 4410, 4640, 5230],
      medium: [4970, 5320, 5670, 6020, 6380, 7300],
      poor:   [6500, 6990, 7480, 7970, 8480, 9790],
    },
    corr: { altPer1000ft_lo:70, altPer1000ft_hi:100, tailwindPerKt:40, vrefAbove5PerKt:null, isaAbovePerDegC:10, reverserInop:[70,150], autoland:570 },
  },

];

// Build a lookup map for O(1) access
const NN_MAP = Object.fromEntries(NN_SCENARIOS.map(s => [s.id, s]));

// ─── BRAKING ACTION → TABLE ROW ───────────────────────────────────────────────
// Non-normal tables have only 4 rows: dry / good / medium / poor.
// Map CC codes to these rows (same interpolation as normal ops for CC 4 and CC 2).
const NN_CC_SURFACES = {
  6: ['dry',    'dry'],
  5: ['good',   'good'],
  4: ['good',   'medium'],
  3: ['medium', 'medium'],
  2: ['medium', 'poor'],
  1: ['poor',   'poor'],
};

// ─── ALTITUDE CORRECTION ──────────────────────────────────────────────────────
function altCorrection(pressureAltFt, corr) {
  if (pressureAltFt <= 0) return 0;
  if (pressureAltFt <= 8000) return (pressureAltFt / 1000) * corr.altPer1000ft_lo;
  const base  = 8 * corr.altPer1000ft_lo;
  const above = ((pressureAltFt - 8000) / 1000) * corr.altPer1000ft_hi;
  return base + above;
}

// ─── REVERSER CORRECTION ──────────────────────────────────────────────────────
// "Both" = max reverse (baseline, no addition)
// "Idle" = one reverser inoperative → reverserInop[0]
// "None" = both inoperative → reverserInop[1]
// null in table (N/A) → treat as 0
function reverserCorr(inopPair, reversers) {
  if (reversers === "Both" || !inopPair) return 0;
  if (reversers === "None") return inopPair[1] ?? 0;
  return inopPair[0] ?? 0;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Compute non-normal adjusted landing distances for all six RwyCC values.
 * Returns the ADJUSTED distance (pre-15% factor). Apply ×1.15 in UI layer.
 *
 * @param {object} p
 * @param {string}  p.failureId    - scenario id from NN_SCENARIOS
 * @param {number}  p.weightLbs    - landing weight in lbs
 * @param {number}  p.pressureAlt  - pressure altitude in feet
 * @param {number}  p.oatC         - OAT °C
 * @param {number}  p.headwind     - headwind knots (negative = tailwind)
 * @param {number}  p.vrefAdditive - knots above VREF (baseline = 5)
 * @param {string}  p.reversers    - "Both" | "Idle" | "None"
 * @returns {{ 6:ft, 5:ft, 4:ft, 3:ft, 2:ft, 1:ft } | null}
 */
export function calcB737NonNormal({ failureId, weightLbs, pressureAlt,
                                    oatC, headwind, vrefAdditive, reversers }) {
  const scenario = NN_MAP[failureId];
  if (!scenario) return null;

  const wKlbs = weightLbs / 1000;
  const { base, corr } = scenario;

  const dAlt  = altCorrection(pressureAlt, corr);
  const dWind = -corr.tailwindPerKt * headwind;   // headwind reduces distance
  const dVref = (corr.vrefAbove5PerKt != null && vrefAdditive > 5)
                  ? corr.vrefAbove5PerKt * (vrefAdditive - 5)
                  : 0;
  const dISA  = corr.isaAbovePerDegC * isaDeviation(pressureAlt, oatC);
  const dRev  = reverserCorr(corr.reverserInop, reversers);

  const result = {};
  for (const cc of [6, 5, 4, 3, 2, 1]) {
    const [surfLo, surfHi] = NN_CC_SURFACES[cc];
    const dLo   = interpTable(makePairs(base[surfLo]), wKlbs);
    const dHi   = surfHi === surfLo ? dLo : interpTable(makePairs(base[surfHi]), wKlbs);
    const dBase = (dLo + dHi) / 2;
    result[cc]  = Math.round((dBase + dAlt + dWind + dVref + dISA + dRev) / 10) * 10;
  }
  return result;
}

// Re-export scenario list for config to build failureOptions from
export const B737_NN_SCENARIOS = NN_SCENARIOS;
