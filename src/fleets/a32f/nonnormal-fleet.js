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
    // AOM 16p.16 inputs
    addSystem:       null,
    addFailure:      "none",
    autothrust:      false,
    iceAccretion:    false,
    fmgcVref:        false,
    melFactor:       1,
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
  };
}

/** Raw chart lookup for one failure, with every correction applied. */
function ild(s, system, failure, flap) {
  return calcNonNormal({
    variant:  s.nnVariant,
    system, failure, flap,
    rcc:      s.brakingAction,
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
}

// ─────────────────────────────────────────────────────────────────────────────
// AOM 16p.5.1 / 16p.5.2 — the published method.
//
//   Single failure:   Landing Distance = ILD × MEL factor × 1.15
//   Two failures:     the failure with the LONGER reference distance is worked in
//                     full; the other contributes only
//                       ΔLD = [REF DIST with failure] − [REF DIST without failure]
//                     with no corrections applied, at the selected flap (FLAPS 3
//                     if that failure has no table for it). Then
//                       ILD = LDG DIST + ΔLD, × MEL factor × 1.15
//
// NOTE ON THE 15% MARGIN: 16p.5.1 gives the full method as
//   Landing Distance = ILD × MEL factor × 1.15
// but the Land App displays the ILD — the raw chart result with corrections and
// the MEL factor applied, *before* the safety margin. Confirmed against the AOM
// chart value for A320 (IAE) GND SPLR FAULT: the app reads 4500 ft, which is the
// reference distance itself, not 5175. The crew applies the 15% separately.
// ─────────────────────────────────────────────────────────────────────────────
const SAFETY_MARGIN = 1;

export function calculateNonNormal(s) {
  const primary = ild(s, s.system, s.failure, s.flap);
  if (primary == null || primary.noData || primary.noGo || primary.notAuthorized) {
    return { ...(primary ?? { noData: true }), primaryDist: null, nonNormal: true };
  }

  let deltaLD = 0, second = null;
  if (s.addSystem && s.addFailure && s.addFailure !== "none") {
    // ΔLD uses the raw reference distances only — no corrections.
    const flapFor = flapsFor(s.nnVariant, s.addSystem, s.addFailure, s.brakingAction);
    const useFlap = flapFor.includes(s.flap) ? s.flap : (flapFor.includes("3") ? "3" : flapFor[0]);
    second = ild(s, s.addSystem, s.addFailure, useFlap);
    if (second?.noGo) return { noGo: true, primaryDist: null, nonNormal: true };
    if (second?.refDist != null && second.baseNoFailure != null) {
      deltaLD = second.refDist - second.baseNoFailure;
      // If the second failure is the more limiting one, the AOM works that one in
      // full instead — swap the roles.
      if (second.refDist > primary.refDist) {
        const swapDelta = primary.refDist - primary.baseNoFailure;
        const dist = Math.round((second.distanceFt + swapDelta) * (s.melFactor ?? 1) * SAFETY_MARGIN);
        return { ...second, deltaLD: swapDelta, swapped: true,
                 primaryDist: dist, ildFt: second.distanceFt + swapDelta, nonNormal: true };
      }
    }
  }

  const ildFt = primary.distanceFt + deltaLD;
  const primaryDist = Math.round(ildFt * (s.melFactor ?? 1) * SAFETY_MARGIN);
  return { ...primary, deltaLD, ildFt, primaryDist, nonNormal: true };
}

export { systemsFor, failuresFor, flapsFor };
