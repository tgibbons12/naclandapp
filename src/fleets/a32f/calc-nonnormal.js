// ─────────────────────────────────────────────────────────────────────────────
// A32F Non-Normal Inflight Landing Performance
//
// Source: A32F AOM ch.16 (16p.9 – 16p.15), "Landing Distance with Failures Data".
//
// Unlike the normal inflight tables — which are gridded lookups interpolated on
// pressure altitude and weight — the non-normal data is a REFERENCE DISTANCE per
// failure plus a set of linear per-unit corrections. The reference distance
// assumes: sea level, ISA, no wind, no slope, no reverse thrust, manual landing,
// maximum manual braking, and VAPP = VREF + ΔVREF without APPR COR.
//
// Everything the crew changes from that baseline is a separate additive term, so
// there is no interpolation here at all.
// ─────────────────────────────────────────────────────────────────────────────

import { DATA, META, REF_WEIGHT_KLB } from "./nonnormal-data.js";

/** Aircraft/engine combinations the AOM publishes failure data for. */
export const NN_VARIANTS = [
  { value: "a319-cfm",  label: "A319 (CFM)" },
  { value: "a319-iae",  label: "A319 (IAE)" },
  { value: "a320-cfm",  label: "A320 (CFM)" },
  { value: "a320-iae",  label: "A320 (IAE)" },
  { value: "a321-cfm",  label: "A321 (CFM-56)" },
  { value: "a321-iae",  label: "A321 (IAE)" },
  { value: "a321-leap", label: "A321 (LEAP-1A)" },
];

/** ATA-style system groups, in the order the AOM lists them. */
export const SYSTEM_ORDER = [
  "ANTI ICE SYSTEM", "BLEED SYSTEM", "BRAKE SYSTEM", "ELECTRICAL SYSTEM",
  "ENGINE SYSTEM", "FLIGHT CONTROLS SYSTEM", "HYDRAULIC SYSTEM",
  "NAVIGATION SYSTEM", "SLATS AND FLAPS SYSTEM",
];

export function systemsFor(variant) {
  const d = DATA[variant];
  if (!d) return [];
  return SYSTEM_ORDER.filter((s) => d[s]);
}

export function failuresFor(variant, system) {
  const d = DATA[variant]?.[system];
  return d ? Object.keys(d).sort() : [];
}

/** Flap lever positions the AOM publishes for this failure at this RwyCC. */
export function flapsFor(variant, system, failure, rcc) {
  const d = DATA[variant]?.[system]?.[failure]?.[rcc];
  // The AOM orders the lever positions FULL → 3 → 1.
  return d ? ["FULL", "3", "1"].filter((f) => d[f]) : [];
}

/**
 * Required landing distance with a failure.
 *
 * @returns one of
 *   { noData: true }                 no published combination
 *   { noGo: true }                   "greater than 18,000 ft for all conditions"
 *   { distanceFt, refDist, terms }   a usable answer, with the correction
 *                                    breakdown so the Audit view can show its work
 */
export function calcNonNormal({
  variant, system, failure, rcc, flap,
  weightLbs, pressureAlt = 0, oatC = 15, headwind = 0, slopePct = 0,
  spdIncrementKt = 0, reversersOperative = 0, overweightProc = false,
  autoland = false,
}) {
  const cell = DATA[variant]?.[system]?.[failure]?.[rcc]?.[flap];
  if (!cell) return { noData: true };
  if (cell === "NOGO") return { noGo: true };

  const [refDist, perKlb, perSpd, perAlt, perTW, perTemp, perSlope, perRev, perOVW] = cell;
  const m = META[variant]?.[system]?.[rcc] ?? {};
  const baseKlb     = m.baseKlb ?? REF_WEIGHT_KLB[variant];
  const belowPerKlb = m.belowPerKlb ?? 10;
  const autolandFt  = m.autolandFt ?? 0;

  const terms = {};

  // Weight. Above the reference weight the chart's own per-klb figure applies;
  // below it the AOM footnote gives a flat credit instead, so the two directions
  // are not symmetric.
  const dKlb = weightLbs / 1000 - baseKlb;
  terms.weight = dKlb >= 0 ? dKlb * perKlb : dKlb * belowPerKlb;

  // Approach speed. A null perSpd is the chart's "N/A" — the AOM forbids adding
  // any extra approach speed increment for that case, so an increment here is an
  // error rather than something to silently ignore.
  if (spdIncrementKt) {
    if (perSpd == null) return { notAuthorized: true, reason: "Speed increment N/A for this failure" };
    terms.speed = (spdIncrementKt / 5) * perSpd;
  }

  terms.altitude = (pressureAlt / 1000) * perAlt;

  // Only tailwind is charted; a headwind earns no credit in the non-normal data.
  const tailwind = headwind < 0 ? -headwind : 0;
  terms.wind = (tailwind / 5) * perTW;

  // ISA at the field = 15 °C less 2 °C per 1000 ft.
  const isaDev = oatC - (15 - 1.98 * (pressureAlt / 1000));
  terms.temperature = isaDev > 0 ? (isaDev / 10) * perTemp : 0;

  // Only downhill slope is penalised.
  terms.slope = slopePct > 0 ? slopePct * perSlope : 0;

  // Reverse thrust is a credit (perRev is negative). INOP means the failure has
  // disabled reverse entirely and no credit may be taken.
  if (reversersOperative > 0) {
    if (perRev == null) return { notAuthorized: true, reason: "Reversers INOP for this failure" };
    terms.reversers = reversersOperative * perRev;
  }

  if (overweightProc) terms.overweight = perOVW;
  if (autoland)       terms.autoland   = autolandFt;

  const distanceFt = Math.round(
    refDist + Object.values(terms).reduce((a, b) => a + b, 0)
  );

  return {
    distanceFt, refDist, terms,
    baseKlb, baseNoFailure: m.baseNoFailure ?? null,
    // The AOM caps the published data at 18,000 ft; beyond that the charts say
    // the landing distance is not supported for any condition.
    exceedsCharted: distanceFt > 18000,
  };
}
