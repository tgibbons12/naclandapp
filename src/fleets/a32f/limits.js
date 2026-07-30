// ═══════════════════════════════════════════════════════════════════════════════
// A32F OPERATIONAL LIMITS
// Source: A32F AOM 18.2.4 "Wind Limits" (rev 17 OCT 23) and 18.2.3 "Weight Limits"
// (rev 01 JUL 25).
// ═══════════════════════════════════════════════════════════════════════════════

// Landing crosswind limit, knots, by runway condition code. All winds are
// predicated on the PEAK GUST value, not the steady state.
//
// The two footnotes in the source narrow these on runways under 148 ft wide:
//   RCC 6 / 5  → 20 kt
//   RCC 4 to 1 → 10 kt
const LANDING_XWIND = {
  6: { wide: 35, narrow: 20 },
  5: { wide: 35, narrow: 20 },
  4: { wide: 29, narrow: 10 },
  3: { wide: 25, narrow: 10 },
  2: { wide: 20, narrow: 10 },
  1: { wide: 15, narrow: 10 },
};

// Separate from the RCC table: below 3/4 sm (RVR 4000 / 1200 m) the limit is
// 15 kt regardless of runway condition. Autoland has its own limits again —
// see AOM 18-12, not modelled here.
const LOW_VIS_XWIND = 15;

/**
 * Maximum landing crosswind for a runway condition code.
 * @param {number}  rcc         6…1
 * @param {boolean} narrowRwy   runway less than 148 ft wide
 * @param {boolean} lowVis      visibility below 3/4 sm (RVR 4000)
 * @returns {number|null} knots, or null if the code is unknown
 */
export function landingCrosswindLimit(rcc, { narrowRwy = false, lowVis = false } = {}) {
  const row = LANDING_XWIND[rcc];
  if (!row) return null;
  const base = narrowRwy ? row.narrow : row.wide;
  return lowVis ? Math.min(base, LOW_VIS_XWIND) : base;
}

// Certificated maximum landing weights, lbs (AOM 18.2.3). The performance tables
// round these — 171,500 and 174,600 — so these are the certificated figures, kept
// for reference rather than used as table bounds.
export const CERTIFICATED_MLW = {
  a319:        137788,
  a320:        142198,
  a321:        171519, // non-sharklet and IAE sharklet are identical
  "a321-leap": 174606, // A321NA / A321NX
};

// MEL / CDL landing penalties. AOM 12p.2.1: "Weight and/or usable landing length
// penalties for inoperative systems or components are contained within affected
// MEL/CDL items. The penalties are applied to the Climb Limited Landing Weight or
// Usable Landing Length." The penalty therefore comes from the crew's MEL item, not
// from a table here — this list is only the granularity of the picker. A length
// penalty is equivalent to adding that distance to the required landing length.
export const MEL_PENALTY_OPTIONS = [
  { value: 0,    label: "None" },
  { value: 100,  label: "+100 ft" },
  { value: 200,  label: "+200 ft" },
  { value: 300,  label: "+300 ft" },
  { value: 400,  label: "+400 ft" },
  { value: 500,  label: "+500 ft" },
  { value: 750,  label: "+750 ft" },
  { value: 1000, label: "+1000 ft" },
  { value: 1500, label: "+1500 ft" },
  { value: 2000, label: "+2000 ft" },
];

// Maximum tailwind component for landing (AOM 18.2.4). Sharklet aircraft get 15 kt,
// non-sharklet 10 kt. Autoland is more restrictive again.
export const MAX_TAILWIND_KT = { sharklet: 15, nonSharklet: 10 };
