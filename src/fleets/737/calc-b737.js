// ─── INTERPOLATION HELPERS ────────────────────────────────────────────────────

/** Linear interpolation between two (x,y) pairs, clamped to [x0,x1]. */
function lerp(x0, y0, x1, y1, x) {
  if (x1 === x0) return y0;
  const t = Math.max(0, Math.min(1, (x - x0) / (x1 - x0)));
  return y0 + t * (y1 - y0);
}

/** Interpolate from a sorted [[key, value], ...] pair array. */
function interpTable(pairs, x) {
  if (x <= pairs[0][0])                return pairs[0][1];
  if (x >= pairs[pairs.length-1][0])   return pairs[pairs.length-1][1];
  for (let i = 1; i < pairs.length; i++) {
    if (x <= pairs[i][0])
      return lerp(pairs[i-1][0], pairs[i-1][1], pairs[i][0], pairs[i][1], x);
  }
  return pairs[pairs.length-1][1];
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOW THE BOEING QRH CALC WORKS
//
// Step 1  Look up Actual Landing Distance from the base table.
//         Table is at: sea level, standard day, no wind, VREF+5 at threshold,
//         both reversers max, auto speed brakes, 1% downhill slope.
//         Indexed by: braking action × autobrake position × gross weight.
//
// Step 2  Add corrections:
//   • Pressure altitude  (+N ft per 1000 ft, two tiers: ≤8000 ft, >8000 ft)
//   • Tailwind           (+N ft per kt tailwind)  [headwind = subtract]
//   • Vref additive      (+N ft per kt above VREF+5)
//   • Temperature        (+N ft per °C above ISA)
//   • Reverser(s) inop   (tabulated per braking action × autobrake position)
//
// Step 3  Apply 15% safety margin → Required Landing Distance (done in UI layer).
//
// This file returns the adjusted distance (post-Step-2, pre-Step-3).
// ═══════════════════════════════════════════════════════════════════════════════

// ─── STEP-1 BASE TABLES ───────────────────────────────────────────────────────
// Source: United 737-800 Normal Performance Tables, 24 JAN 20
//
// Each entry is [[grossWeightKlbs, actualLandingDistanceFeet], ...]
// Weight breakpoints: 106, 116, 126, 136, 146.3, 174.2 (×1000 lbs)
//
// Braking-action rows: dry | good | medium | poor
// Autobrake positions: 1 | 2 | 3 | maxAuto | offMax

// ══ FLAPS 30  (IMG_0900) ══════════════════════════════════════════════════════
const F30_BASE = {
  dry: {
    1:       [[106,6460],[116,6990],[126,7520],[136,8050],[146.3,8590],[174.2,9960]],
    2:       [[106,5890],[116,6340],[126,6790],[136,7240],[146.3,7700],[174.2,8840]],
    3:       [[106,4730],[116,5060],[126,5390],[136,5720],[146.3,6050],[174.2,6860]],
    maxAuto: [[106,3420],[116,3620],[126,3820],[136,4020],[146.3,4230],[174.2,4730]],
    offMax:  [[106,2720],[116,2880],[126,3040],[136,3200],[146.3,3370],[174.2,3840]],
  },
  good: {
    1:       [[106,6460],[116,6990],[126,7520],[136,8050],[146.3,8590],[174.2,9960]],
    2:       [[106,5890],[116,6340],[126,6790],[136,7240],[146.3,7700],[174.2,8840]],
    3:       [[106,4770],[116,5100],[126,5430],[136,5760],[146.3,6090],[174.2,6900]],
    maxAuto: [[106,4000],[116,4250],[126,4500],[136,4750],[146.3,5000],[174.2,5650]],
    offMax:  [[106,3770],[116,4000],[126,4230],[136,4460],[146.3,4690],[174.2,5310]],
  },
  medium: {
    1:       [[106,6570],[116,7100],[126,7630],[136,8160],[146.3,8700],[174.2,10070]],
    2:       [[106,6160],[116,6620],[126,7080],[136,7540],[146.3,8010],[174.2,9180]],
    3:       [[106,5420],[116,5800],[126,6180],[136,6560],[146.3,6950],[174.2,7930]],
    maxAuto: [[106,5190],[116,5560],[126,5930],[136,6300],[146.3,6680],[174.2,7660]],
    offMax:  [[106,5110],[116,5470],[126,5830],[136,6190],[146.3,6560],[174.2,7510]],
  },
  poor: {
    1:       [[106,7420],[116,7990],[126,8560],[136,9130],[146.3,9720],[174.2,11220]],
    2:       [[106,7230],[116,7760],[126,8290],[136,8820],[146.3,9360],[174.2,10810]],
    3:       [[106,6880],[116,7390],[126,7900],[136,8410],[146.3,8930],[174.2,10320]],
    maxAuto: [[106,6860],[116,7360],[126,7860],[136,8360],[146.3,8880],[174.2,10270]],
    offMax:  [[106,6820],[116,7320],[126,7820],[136,8320],[146.3,8840],[174.2,10210]],
  },
};

// Step-2 scalar corrections — Flaps 30 (from IMG_0900 Step 2 block)
const F30_CORR = {
  altPer1000ft_lo:   290,   // ft per 1000 ft PA, ≤ 8000 ft
  altPer1000ft_hi:   390,   // ft per 1000 ft PA, > 8000 ft
  tailwindPerKt:     185,   // ft per kt tailwind (subtract for headwind)
  vrefAbove5PerKt:    60,   // ft per kt above VREF+5
  isaAbovePerDegC:    25,   // ft per °C above ISA
  manualSpeedBrakes: 190,   // additional ft when using manual speed brakes [a]
  autoland:         1200,   // ft for autolanding
  // Reverser inoperative addition by surface × autobrake position — [oneInop, bothInop]
  reverserInop: {
    dry:    { 1:[640,950],    2:[200,200],   3:[0,0],      maxAuto:[0,10],    offMax:[70,140]   },
    good:   { 1:[640,950],    2:[200,200],   3:[10,50],    maxAuto:[250,560], offMax:[230,510]  },
    medium: { 1:[690,1140],   2:[340,730],   3:[460,1340], maxAuto:[620,1490],offMax:[620,1480] },
    poor:   { 1:[1240,3050],  2:[1090,3030], 3:[1320,3460],maxAuto:[1310,3440],offMax:[1310,3430]},
  },
};

// ══ FLAPS 40  (IMG_0898) ══════════════════════════════════════════════════════
const F40_BASE = {
  dry: {
    1:       [[106,6040],[116,6530],[126,7020],[136,7510],[146.3,8010],[174.2,9270]],
    2:       [[106,5470],[116,5890],[126,6310],[136,6730],[146.3,7150],[174.2,8190]],
    3:       [[106,4390],[116,4690],[126,4990],[136,5290],[146.3,5600],[174.2,6320]],
    maxAuto: [[106,3230],[116,3410],[126,3590],[136,3770],[146.3,3960],[174.2,4400]],
    offMax:  [[106,2620],[116,2770],[126,2920],[136,3070],[146.3,3230],[174.2,3670]],
  },
  good: {
    1:       [[106,6040],[116,6530],[126,7020],[136,7510],[146.3,8010],[174.2,9270]],
    2:       [[106,5470],[116,5890],[126,6310],[136,6730],[146.3,7150],[174.2,8190]],
    3:       [[106,4460],[116,4760],[126,5060],[136,5360],[146.3,5670],[174.2,6390]],
    maxAuto: [[106,3820],[116,4060],[126,4300],[136,4540],[146.3,4780],[174.2,5400]],
    offMax:  [[106,3630],[116,3850],[126,4070],[136,4290],[146.3,4510],[174.2,5070]],
  },
  medium: {
    1:       [[106,6170],[116,6660],[126,7150],[136,7640],[146.3,8140],[174.2,9400]],
    2:       [[106,5740],[116,6170],[126,6600],[136,7030],[146.3,7460],[174.2,8520]],
    3:       [[106,5100],[116,5460],[126,5820],[136,6180],[146.3,6550],[174.2,7470]],
    maxAuto: [[106,4940],[116,5290],[126,5640],[136,5990],[146.3,6350],[174.2,7270]],
    offMax:  [[106,4880],[116,5220],[126,5560],[136,5900],[146.3,6250],[174.2,7140]],
  },
  poor: {
    1:       [[106,7000],[116,7540],[126,8080],[136,8620],[146.3,9170],[174.2,10560]],
    2:       [[106,6820],[116,7320],[126,7820],[136,8320],[146.3,8840],[174.2,10180]],
    3:       [[106,6550],[116,7030],[126,7510],[136,7990],[146.3,8490],[174.2,9800]],
    maxAuto: [[106,6510],[116,6990],[126,7470],[136,7950],[146.3,8440],[174.2,9730]],
    offMax:  [[106,6510],[116,6980],[126,7450],[136,7920],[146.3,8400],[174.2,9690]],
  },
};

// Step-2 scalar corrections — Flaps 40 (from IMG_0898 Step 2 block)
const F40_CORR = {
  altPer1000ft_lo:   260,
  altPer1000ft_hi:   360,
  tailwindPerKt:     180,
  vrefAbove5PerKt:    60,
  isaAbovePerDegC:    25,
  manualSpeedBrakes: 180,
  autoland:         1120,
  reverserInop: {
    dry:    { 1:[520,720],    2:[110,110],   3:[0,0],      maxAuto:[0,10],    offMax:[60,120]   },
    good:   { 1:[520,720],    2:[110,110],   3:[10,50],    maxAuto:[220,500], offMax:[210,460]  },
    medium: { 1:[560,910],    2:[250,630],   3:[490,1280], maxAuto:[560,1320],offMax:[560,1320] },
    poor:   { 1:[1100,2670],  2:[960,2730],  3:[1190,3070],maxAuto:[1180,3060],offMax:[1180,3050]},
  },
};

// ─── BRAKING ACTION / RwyCC → TABLE ROW ──────────────────────────────────────
// CC6 = Dry, CC5 = Good, CC4 = Good/Med (interpolated), CC3 = Medium,
// CC2 = Med/Poor (interpolated), CC1 = Poor
const CC_SURFACES = {
  6: ['dry',    'dry'],       // [lo, hi] for interpolation (both same = exact)
  5: ['good',   'good'],
  4: ['good',   'medium'],    // 50/50 interpolation
  3: ['medium', 'medium'],
  2: ['medium', 'poor'],      // 50/50 interpolation
  1: ['poor',   'poor'],
};

// ─── ALTITUDE CORRECTION ──────────────────────────────────────────────────────
function altCorrection(pressureAltFt, corr) {
  if (pressureAltFt <= 0) return 0;
  if (pressureAltFt <= 8000) {
    return (pressureAltFt / 1000) * corr.altPer1000ft_lo;
  }
  const base  = 8 * corr.altPer1000ft_lo;
  const above = ((pressureAltFt - 8000) / 1000) * corr.altPer1000ft_hi;
  return base + above;
}

// ─── ISA DEVIATION ────────────────────────────────────────────────────────────
function isaDeviation(pressureAltFt, oatC) {
  const isaTemp = 15 - 2 * (pressureAltFt / 1000);
  return Math.max(0, oatC - isaTemp);  // only positive deviations add distance
}

// ─── REVERSER CORRECTION ─────────────────────────────────────────────────────
// reversers: "Both" = baseline (no addition) | "Idle" = one inop | "None" = both inop
function reverserCorr(corrTable, surface, abPos, reversers) {
  if (reversers === "Both") return 0;
  const pair = corrTable?.[surface]?.[abPos];
  if (!pair) return 0;
  return reversers === "None" ? pair[1] : pair[0];
}

// ─── MAIN EXPORT: calcB737 ────────────────────────────────────────────────────
/**
 * Compute adjusted landing distances for all six RwyCC values.
 *
 * @param {object} p
 * @param {number}  p.weightLbs      - landing weight in lbs
 * @param {string}  p.flap           - "FLAPS 30" | "FLAPS 40"
 * @param {string}  p.brakeMode      - "MAX_AUTO" | "AUTO_3" | "AUTO_2" | "AUTO_1"
 * @param {number}  p.pressureAlt    - pressure altitude in feet
 * @param {number}  p.oatC           - outside air temperature °C
 * @param {number}  p.headwind       - headwind component in knots (negative = tailwind)
 * @param {number}  p.vrefAdditive   - knots added to VREF (normal = 5)
 * @param {string}  p.reversers      - "Both" | "Idle" | "None"
 * @returns {object}  { 6: ft, 5: ft, 4: ft, 3: ft, 2: ft, 1: ft }
 */
export function calcB737({ weightLbs, flap, brakeMode, pressureAlt,
                           oatC, headwind, vrefAdditive, reversers }) {
  const wKlbs = weightLbs / 1000;
  const base  = flap === "FLAPS 40" ? F40_BASE : F30_BASE;
  const corr  = flap === "FLAPS 40" ? F40_CORR : F30_CORR;

  // Map config brakeMode key → table autobrake position label
  const AB_POS = { MAX_AUTO:"maxAuto", AUTO_3:"3", AUTO_2:"2", AUTO_1:"1" };
  const abPos  = AB_POS[brakeMode] ?? "maxAuto";

  // Step-2 corrections common to all CC values
  const dAlt  = altCorrection(pressureAlt, corr);
  const dWind = -corr.tailwindPerKt * headwind;   // headwind reduces, tailwind adds
  const dVref = vrefAdditive > 5 ? corr.vrefAbove5PerKt * (vrefAdditive - 5) : 0;
  const dISA  = corr.isaAbovePerDegC * isaDeviation(pressureAlt, oatC);

  const result = {};
  for (const cc of [6, 5, 4, 3, 2, 1]) {
    const [surfLo, surfHi] = CC_SURFACES[cc];
    const dLo   = interpTable(base[surfLo][abPos], wKlbs);
    const dHi   = surfHi === surfLo ? dLo : interpTable(base[surfHi][abPos], wKlbs);
    const dBase = (dLo + dHi) / 2;

    // Reverser correction: use the more conservative (higher) surface for interpolated CCs
    const dRev  = reverserCorr(corr.reverserInop, surfHi, abPos, reversers);

    result[cc] = Math.round((dBase + dAlt + dWind + dVref + dISA + dRev) / 10) * 10;
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VREF SPEEDS  (knots)
// Source: "LANDING REFERENCE (VREF) SPEEDS (-800)"  IMG_0896
//
// Columns: [weightKlbs, Vref_Flaps15, Vref_Flaps30, Vref_Flaps40]
//
// All three VREF values are real QRH table data.
// VREF 15 = go-around / missed approach reference speed (clean-ish config).
// VREF 30 = normal landing flap reference speed.
// VREF 40 = short-field landing flap reference speed.
// VAPP    = selected VREF + pilot additive (displayed separately in the UI).
// ═══════════════════════════════════════════════════════════════════════════════
const VREF_TABLE = [
  // [wKlbs, VREF15, VREF30, VREF40]
  [90,  122, 116, 109],
  [100, 129, 123, 116],
  [110, 135, 129, 122],
  [120, 142, 135, 128],
  [130, 148, 141, 133],
  [140, 154, 146, 139],
  [150, 159, 151, 144],
  [160, 164, 156, 148],
  [170, 169, 160, 153],
  [180, 174, 165, 157],
];

/**
 * Return 737NG VREF speeds for all three certified flap settings.
 *
 * @param {number} weightLbs  - landing weight in lbs
 * @param {string} flap       - "FLAPS 30" | "FLAPS 40"  (selects which VREF is "active")
 * @returns {{
 *   vref15: number,   // VREF Flaps 15  — go-around / missed approach ref
 *   vref30: number,   // VREF Flaps 30  — normal landing ref
 *   vref40: number,   // VREF Flaps 40  — short-field landing ref
 *   vref:   number,   // VREF for the selected flap setting (vref30 or vref40)
 * }}
 */
export function lookupB737Speeds(weightLbs, flap) {
  const wKlbs = weightLbs / 1000;

  const f15Pairs = VREF_TABLE.map(r => [r[0], r[1]]);
  const f30Pairs = VREF_TABLE.map(r => [r[0], r[2]]);
  const f40Pairs = VREF_TABLE.map(r => [r[0], r[3]]);

  const vref15 = Math.round(interpTable(f15Pairs, wKlbs));
  const vref30 = Math.round(interpTable(f30Pairs, wKlbs));
  const vref40 = Math.round(interpTable(f40Pairs, wKlbs));

  // "Active" VREF — the one that matches the selected landing flap setting
  const vref = flap === "FLAPS 40" ? vref40 : vref30;

  return { vref15, vref30, vref40, vref };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAXIMUM CLIMB GRADIENT CAPABILITY  (go-around climb limit)
// Source: "MAXIMUM CLIMB GRADIENT CAPABILITY (-800)"  IMG_0901
//
// The table gives climb gradient in Feet/NM at specific weights, pressure
// altitudes, and ISA deviations.  We find the highest weight at which the
// two-engine go-around gradient meets the FAR 121 minimum (2.1% ≈ 111 Ft/NM)
// and return it in klbs.  Returns null if all weights in the table pass.
//
// Table dimensions:
//   Pressure altitudes : 0, 3000, 6000, 9000, 12000 ft
//   ISA deviations     : -10, 0, +10, +20, +30 °C
//   Weights            : 120, 130, 135, 140, 146.3, 174.2 klbs
// ═══════════════════════════════════════════════════════════════════════════════
const CL_ALTS    = [0, 3000, 6000, 9000, 12000];
const CL_ISA_DEV = [-10, 0, 10, 20, 30];
const CL_WEIGHTS = [120, 130, 135, 140, 146.3, 174.2];

// CLIMB_GRAD[altIdx][isaDevIdx] = [gradFtNM @ 120k, 130k, 135k, 140k, 146.3k, 174.2k]
const CLIMB_GRAD = [
  // Altitude 0 ft
  [ [814,715,675,634,590,436],   // ISA -10
    [808,709,664,628,582,430],   // ISA   0
    [794,698,659,619,577,424],   // ISA +10
    [693,607,570,536,497,359],   // ISA +20
    [597,521,486,455,420,296],   // ISA +30
  ],
  // Altitude 3000 ft
  [ [775,681,639,600,559,408],
    [770,672,634,596,552,403],
    [758,667,626,588,545,399],
    [675,588,552,519,478,342],
    [581,506,473,440,406,284],
  ],
  // Altitude 6000 ft
  [ [673,590,554,522,481,347],
    [669,587,548,516,476,344],
    [665,580,545,511,474,341],
    [589,514,480,447,413,290],
    [510,441,411,383,350,239],
  ],
  // Altitude 9000 ft
  [ [574,502,470,439,406,287],
    [571,498,466,436,402,285],
    [565,495,461,432,399,282],
    [504,437,406,379,348,240],
    [438,376,349,323,294,195],
  ],
  // Altitude 12000 ft
  [ [502,436,406,379,348,241],
    [499,432,403,376,346,239],
    [495,430,400,373,342,237],
    [438,376,349,324,296,198],
    [377,322,297,274,248,157],
  ],
];

// FAR 121 two-engine go-around gradient requirement
const MIN_GRAD_FT_PER_NM   = 111;   // 2.1%
// Anti-ice deduction per QRH note (IMG_0901)
const ANTI_ICE_DEDUCT       =  58;   // Ft/NM

/**
 * Return climb-limited landing weight in klbs, or null if no limit applies.
 *
 * @param {string}  flap        - "FLAPS 30" | "FLAPS 40" (same table for both)
 * @param {number}  pressureAlt - pressure altitude (ft)
 * @param {number}  oatC        - OAT (°C)
 * @param {boolean} antiIceOn   - true if engine or wing anti-ice is on
 */
export function lookupB737ClimbLimited(flap, pressureAlt, oatC, antiIceOn = false) {
  const isaTemp = 15 - 2 * (pressureAlt / 1000);
  const isaDev  = oatC - isaTemp;

  // Clamp to table bounds
  const alt  = Math.max(CL_ALTS[0],    Math.min(CL_ALTS[CL_ALTS.length-1],       pressureAlt));
  const dev  = Math.max(CL_ISA_DEV[0], Math.min(CL_ISA_DEV[CL_ISA_DEV.length-1], isaDev));

  // Altitude bracket
  let a0 = 0, a1 = CL_ALTS.length - 1;
  for (let i = 0; i < CL_ALTS.length - 1; i++) {
    if (alt >= CL_ALTS[i] && alt <= CL_ALTS[i+1]) { a0 = i; a1 = i+1; break; }
  }
  const tA = CL_ALTS[a0] === CL_ALTS[a1] ? 0 : (alt - CL_ALTS[a0]) / (CL_ALTS[a1] - CL_ALTS[a0]);

  // ISA deviation bracket
  let d0 = 0, d1 = CL_ISA_DEV.length - 1;
  for (let i = 0; i < CL_ISA_DEV.length - 1; i++) {
    if (dev >= CL_ISA_DEV[i] && dev <= CL_ISA_DEV[i+1]) { d0 = i; d1 = i+1; break; }
  }
  const tD = CL_ISA_DEV[d0] === CL_ISA_DEV[d1] ? 0 : (dev - CL_ISA_DEV[d0]) / (CL_ISA_DEV[d1] - CL_ISA_DEV[d0]);

  const minGrad = MIN_GRAD_FT_PER_NM;

  for (let wi = 0; wi < CL_WEIGHTS.length; wi++) {
    // Bilinear interpolation across altitude and ISA deviation
    const g00 = CLIMB_GRAD[a0][d0][wi], g01 = CLIMB_GRAD[a0][d1][wi];
    const g10 = CLIMB_GRAD[a1][d0][wi], g11 = CLIMB_GRAD[a1][d1][wi];
    let grad  = g00*(1-tA)*(1-tD) + g01*(1-tA)*tD + g10*tA*(1-tD) + g11*tA*tD;

    if (antiIceOn) grad -= ANTI_ICE_DEDUCT;

    if (grad < minGrad) {
      // This weight fails — the limit is the previous (lighter) weight
      return wi > 0 ? CL_WEIGHTS[wi - 1] : CL_WEIGHTS[0];
    }
  }

  return null;  // All table weights pass — no effective climb limit
}

// ═══════════════════════════════════════════════════════════════════════════════
// MACG HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Shared bilinear interpolation setup for the climb gradient table.
 * Returns { tA, tD, a0, a1, d0, d1 } bracket coefficients.
 */
function climbBrackets(pressureAlt, oatC) {
  const isaTemp = 15 - 2 * (pressureAlt / 1000);
  const isaDev  = oatC - isaTemp;
  const alt = Math.max(CL_ALTS[0],    Math.min(CL_ALTS[CL_ALTS.length-1],       pressureAlt));
  const dev = Math.max(CL_ISA_DEV[0], Math.min(CL_ISA_DEV[CL_ISA_DEV.length-1], isaDev));

  let a0 = 0, a1 = CL_ALTS.length - 1;
  for (let i = 0; i < CL_ALTS.length - 1; i++) {
    if (alt >= CL_ALTS[i] && alt <= CL_ALTS[i+1]) { a0 = i; a1 = i+1; break; }
  }
  const tA = CL_ALTS[a0] === CL_ALTS[a1] ? 0 : (alt - CL_ALTS[a0]) / (CL_ALTS[a1] - CL_ALTS[a0]);

  let d0 = 0, d1 = CL_ISA_DEV.length - 1;
  for (let i = 0; i < CL_ISA_DEV.length - 1; i++) {
    if (dev >= CL_ISA_DEV[i] && dev <= CL_ISA_DEV[i+1]) { d0 = i; d1 = i+1; break; }
  }
  const tD = CL_ISA_DEV[d0] === CL_ISA_DEV[d1] ? 0 : (dev - CL_ISA_DEV[d0]) / (CL_ISA_DEV[d1] - CL_ISA_DEV[d0]);

  return { tA, tD, a0, a1, d0, d1 };
}

/**
 * Forward: return actual climb gradient (ft/NM) at a specific weight.
 *
 * @param {number} weightLbs    - landing weight in lbs
 * @param {number} pressureAlt  - pressure altitude (ft)
 * @param {number} oatC         - OAT (°C)
 * @param {boolean} antiIceOn
 * @returns {number} gradient in ft/NM
 */
export function lookupB737Gradient(weightLbs, pressureAlt, oatC, antiIceOn = false) {
  const wKlbs = weightLbs / 1000;
  const { tA, tD, a0, a1, d0, d1 } = climbBrackets(pressureAlt, oatC);

  // Interpolate gradient at each table weight bracket
  // Find the two table weights that bracket wKlbs
  let wi0 = CL_WEIGHTS.length - 2, wi1 = CL_WEIGHTS.length - 1;
  if (wKlbs <= CL_WEIGHTS[0]) { wi0 = 0; wi1 = 0; }
  else {
    for (let i = 0; i < CL_WEIGHTS.length - 1; i++) {
      if (wKlbs >= CL_WEIGHTS[i] && wKlbs <= CL_WEIGHTS[i+1]) { wi0 = i; wi1 = i+1; break; }
    }
  }
  const tW = CL_WEIGHTS[wi0] === CL_WEIGHTS[wi1] ? 0
    : (wKlbs - CL_WEIGHTS[wi0]) / (CL_WEIGHTS[wi1] - CL_WEIGHTS[wi0]);

  function gradAt(wi) {
    const g00 = CLIMB_GRAD[a0][d0][wi], g01 = CLIMB_GRAD[a0][d1][wi];
    const g10 = CLIMB_GRAD[a1][d0][wi], g11 = CLIMB_GRAD[a1][d1][wi];
    return g00*(1-tA)*(1-tD) + g01*(1-tA)*tD + g10*tA*(1-tD) + g11*tA*tD;
  }

  let grad = gradAt(wi0) * (1 - tW) + gradAt(wi1) * tW;
  if (antiIceOn) grad -= ANTI_ICE_DEDUCT;
  return Math.round(grad);
}

/**
 * Reverse: given a required MACG (ft/NM), return the maximum landing weight (lbs)
 * at which the gradient meets or exceeds that value, in 500 lb increments.
 * Returns null if even the lightest table weight fails.
 *
 * @param {number} requiredGrad  - MACG in ft/NM
 * @param {number} pressureAlt
 * @param {number} oatC
 * @param {boolean} antiIceOn
 * @returns {number|null} max weight in lbs (500 lb steps), or null
 */
export function reverseB737ClimbLimit(requiredGrad, pressureAlt, oatC, antiIceOn = false) {
  const { tA, tD, a0, a1, d0, d1 } = climbBrackets(pressureAlt, oatC);

  // Scan downward in 500 lb steps from max table weight to min
  const minLbs = CL_WEIGHTS[0] * 1000;
  const maxLbs = CL_WEIGHTS[CL_WEIGHTS.length - 1] * 1000;

  // Binary search isn't needed — just sweep from heavy to light in 500 lb steps
  // Find the heaviest weight where gradient >= requiredGrad
  for (let wLbs = maxLbs; wLbs >= minLbs; wLbs -= 500) {
    const wKlbs = wLbs / 1000;

    let wi0 = CL_WEIGHTS.length - 2, wi1 = CL_WEIGHTS.length - 1;
    for (let i = 0; i < CL_WEIGHTS.length - 1; i++) {
      if (wKlbs >= CL_WEIGHTS[i] && wKlbs <= CL_WEIGHTS[i+1]) { wi0 = i; wi1 = i+1; break; }
    }
    const tW = CL_WEIGHTS[wi0] === CL_WEIGHTS[wi1] ? 0
      : (wKlbs - CL_WEIGHTS[wi0]) / (CL_WEIGHTS[wi1] - CL_WEIGHTS[wi0]);

    function gradAt(wi) {
      const g00 = CLIMB_GRAD[a0][d0][wi], g01 = CLIMB_GRAD[a0][d1][wi];
      const g10 = CLIMB_GRAD[a1][d0][wi], g11 = CLIMB_GRAD[a1][d1][wi];
      return g00*(1-tA)*(1-tD) + g01*(1-tA)*tD + g10*tA*(1-tD) + g11*tA*tD;
    }

    let grad = gradAt(wi0) * (1 - tW) + gradAt(wi1) * tW;
    if (antiIceOn) grad -= ANTI_ICE_DEDUCT;

    if (grad >= requiredGrad) return wLbs;
  }
  return null; // Even lightest table weight fails
}
