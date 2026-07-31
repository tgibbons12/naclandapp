// ─────────────────────────────────────────────────────────────────────────────
// A32F Non-Normal page wiring
//
// The non-normal data is published per aircraft AND engine (seven combinations),
// which is a finer split than the normal page's four aircraft types — so the
// non-normal tab carries its own aircraft/engine picker rather than inheriting
// the normal page's selection.
//
// Inputs follow AOM 16p.16 "A320 Land Non-Normal Landing Performance".
// ─────────────────────────────────────────────────────────────────────────────

import { calcNonNormal, systemsFor, failuresFor, flapsFor } from "./calc-nonnormal.js";

/** Sensible opening state for the non-normal page, per aircraft/engine key. */
export function nnDefaultsFor(nnVariant) {
  const system  = systemsFor(nnVariant)[0] ?? null;
  const failure = system ? failuresFor(nnVariant, system)[0] ?? null : null;
  return {
    nnVariant,
    system,
    failure,
    flap:            "FULL",
    landingWeight:   150000,
    pressureAlt:     0,
    oatC:            15,
    headwind:        0,
    slopePct:        0,
    brakingAction:   6,
    spdIncrementKt:  0,
    reversersOperative: 0,
    overweightProc:  false,
    autoland:        false,
    melPenaltyFt:    0,
  };
}

export function calculateNonNormal(s) {
  const r = calcNonNormal({
    variant:  s.nnVariant,
    system:   s.system,
    failure:  s.failure,
    rcc:      s.brakingAction,
    flap:     s.flap,
    weightLbs:          s.landingWeight,
    pressureAlt:        s.pressureAlt,
    oatC:               s.oatC,
    headwind:           s.headwind,
    slopePct:           s.slopePct,
    spdIncrementKt:     s.spdIncrementKt,
    reversersOperative: s.reversersOperative,
    overweightProc:     s.overweightProc,
    autoland:           s.autoland,
  });

  // MEL/CDL landing distance adjustment is applied on top of the chart result,
  // exactly as on the normal page.
  const primaryDist = r.distanceFt != null
    ? r.distanceFt + (s.melPenaltyFt ?? 0)
    : null;

  return { ...r, primaryDist, nonNormal: true };
}

export { systemsFor, failuresFor, flapsFor };
