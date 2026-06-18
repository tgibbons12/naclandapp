import {
  getEMBSpeeds,
  calcEMBDistanceCorrected,
  getEMBClimbLimitWeight,
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
// Distances are published for Flaps 45 only.
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
    { value: "22", label: "22" }, // speeds only — no Flaps-22 distance chart published
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
    const speeds = getEMBSpeeds(s.acType, Number(s.flap), s.landingWeight);

    // Distance chart is Flaps-45 / no-reverse only; that's the only published
    // dispatch basis regardless of which flap setting was used for speeds.
    const factoredDist = calcEMBDistanceCorrected({
      acType:    s.acType,
      weightLbs: s.landingWeight,
      elevFt:    s.pressureAlt,
      windKt:    s.headwind,
      surface:   s.surface,
    });

    const climbLimited = getEMBClimbLimitWeight({
      acType:       s.acType,
      antiIce:      s.antiIce,
      pressureAlt:  s.pressureAlt,
      oatC:         s.oatC,
      iceAccretion: s.iceAccretion,
    });

    const structural = EMB_LIMITS[s.acType].structural;

    return {
      speeds: {
        vref: speeds.VREF,
        vtgt: speeds.VTGT,
        vga9: speeds.VGA9,
        vfs:  speeds.VFS,
      },
      factoredDist,
      climbLimited,
      structural,
      primaryDist: factoredDist,
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
