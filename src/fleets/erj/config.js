import {
  getEMBSpeeds,
  calcEMBDistanceCorrected,
  getEMBClimbLimitWeight,
  getPD15UnfactoredDistance,
  EMB_LIMITS,
} from "./calc.js";

// ─────────────────────────────────────────────────────────────────────────────
// EMB 145/140/135 — shared schema
// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: Unlike the QRH-style fleets (ejet, 737, a32f), this POH section
// publishes FACTORED DISPATCH distances only (40% / 1.667x regulatory factor
// already applied), with a single result per condition rather than a
// MAX_MAN/HI/MED/LO braking-action grid. There is no braking-action selector,
// no temperature/slope correction, and no reverser-inop correction in this
// source data — reverse thrust credit is excluded from the basis entirely.
// Flaps 45 factored dispatch distance: calcEMBDistanceCorrected() (POH §12B).
//
// Flaps 22 UNFACTORED distance: sourced from ANAC QRH-145/1167 Rev 8 PD-15
// (AE3007A1 engines, dry runway, ISA, 0% slope). Wind correction applied
// analytically from tabular deltas. This is NOT a Part 121 dispatch distance —
// it is a raw performance figure for crew reference only.
//
// As a result this config exposes a single "surface" toggle (Dry/Wet) instead
// of the 6-position RCAM braking scale used elsewhere in the app, and the
// primary distance result is a flat number rather than a per-setting object.

const BASE_DEFAULTS = {
  acType:        "EMB145",
  flap:          "45",
  vappAdditive:  10,    // VTGT = VREF45 + 10 (per POH; less if VTGT-limited)
  landingWeight: 40000,
  antiIce:       false,
  iceAccretion:  false,
  pressureAlt:   1000,
  oatC:          24,
  headwind:      5,
  surface:       "dry",
};

const BASE_SCHEMA = {
  acTypeOptions: [
    { value: "EMB145", label: "EMB-145" },
    { value: "EMB140", label: "EMB-140" },
    { value: "EMB135", label: "EMB-135" },
  ],

  flapOptions: [
    { value: "45", label: "45" },
    { value: "22", label: "22" }, // speeds + unfactored distance (PD-15); factored dispatch basis is F45 only
  ],

  // No QRH braking-action scale published for this distance chart — just dry/wet.
  surfaceOptions: [
    { value: "dry", label: "Dry" },
    { value: "wet", label: "Wet (+20%)" },
  ],

  speedSlots: [
    { key: "vref", label: "VREF", color: "#ff3b30" },
    { key: "vtgt", label: "VTGT", color: "#34c759" },
    { key: "vga9", label: "VGA9", color: "#007aff" },
    { key: "vfs",  label: "VFS",  color: "#8e8e93" },
  ],

  toggles: ["antiIce", "iceAccretion"],

  showShortRunway: false,
  showCatII: false,
  showBrakeMode: false,

  // Single flat distance value, not a per-braking-setting object.
  primaryDistKey: "factoredDist",

  weightLimitsByType: {
    EMB145: { min: 28000, max: 50000, step: 500 },
    EMB140: { min: 28000, max: 46517, step: 500 },
    EMB135: { min: 26000, max: 44000, step: 500 },
  },

  calculate(s) {
    const flapNum  = Number(s.flap);
    const isF22    = flapNum === 22;
    const isWet    = String(s.surface).toLowerCase() === "wet";

    const speeds = getEMBSpeeds(s.acType, flapNum, s.landingWeight);

    // Flaps 45: factored dispatch distance (POH §12B) — primary planning value.
    // Flaps 22: unfactored distance from PD-15 (ANAC QRH Rev 8) — crew reference only.
    //   Wet correction (+20%) is applied to the unfactored F22 distance for surface parity,
    //   but this remains an unfactored figure — not a Part 121 dispatch basis.
    const factoredDist = calcEMBDistanceCorrected({
      acType:    s.acType,
      weightLbs: s.landingWeight,
      elevFt:    s.pressureAlt,
      windKt:    s.headwind,
      surface:   s.surface,
    });

    const unfactoredF22Dist = isF22
      ? (() => {
          let d = getPD15UnfactoredDistance({
            weightLbs: s.landingWeight,
            elevFt:    s.pressureAlt,
            windKt:    s.headwind,
          });
          if (isWet) d = Math.round(d * 1.20);
          return d;
        })()
      : null;

    const climbLimited = getEMBClimbLimitWeight({
      acType:       s.acType,
      antiIce:      s.antiIce,
      pressureAlt:  s.pressureAlt,
      oatC:         s.oatC,
      iceAccretion: s.iceAccretion,
    });

    const structural = EMB_LIMITS[s.acType].structural;

    // primaryDist: F45 → factored dispatch; F22 → unfactored PD-15 (clearly labeled in UI)
    const primaryDist = isF22 ? unfactoredF22Dist : factoredDist;

    return {
      speeds: {
        vref: speeds.VREF,
        vtgt: speeds.VTGT,
        vga9: speeds.VGA9,
        vfs:  speeds.VFS,
      },
      factoredDist,
      unfactoredF22Dist,
      climbLimited,
      structural,
      primaryDist,
      // Flag so the UI can label the distance appropriately
      primaryDistIsUnfactored: isF22,
    };
  },
};

function makeVariant(acType, label) {
  return {
    id: acType.toLowerCase(),
    label,
    title: `${label} Required Landing Field Length (Factored Dispatch)`,
    defaults: { ...BASE_DEFAULTS, acType, landingWeight: BASE_SCHEMA.weightLimitsByType[acType].max - 5000 },
    weightLimits: BASE_SCHEMA.weightLimitsByType[acType],
    ...BASE_SCHEMA,
  };
}

export const erj145Config = makeVariant("EMB145", "ERJ-145");
export const erj140Config = makeVariant("EMB140", "ERJ-140");
export const erj135Config = makeVariant("EMB135", "ERJ-135");

// Single combined config exposing the acType selector, matching how the
// E-Jet family handles E170/175/190/195 as one entry with an internal toggle
// rather than four separate registry entries.
export const erjConfig = {
  id: "erj",
  label: "ERJ",
  title: "ERJ-135/140/145 Required Landing Field Length (Factored Dispatch)",
  defaults: { ...BASE_DEFAULTS },
  weightLimits: BASE_SCHEMA.weightLimitsByType.EMB145, // widest range; calculate() clamps per acType
  ...BASE_SCHEMA,
};