import { calcA319, lookupA319Speeds, lookupClimbLimited } from "./calc.js";
// lookupA319Speeds(weightLbs, confFull) — VLS is config-aware but same value for A319

export const a319Config = {
  id: "a319",
  label: "A319",
  title: "A319 In-Flight Normal Landing Distance",

  defaults: {
    flap:          "CONF FULL",
    brakeMode:     "MAX_MAN",
    reversers:     "Both",
    vappAdditive:  5,   // 5 = VLS+5 baseline (no distance correction)
    landingWeight: 137700,
    antiIce:       false,
    engineAntiIce: false,
    wingAntiIce:   false,
    iceAccretion:  false,
    pressureAlt:   1000,
    oatC:          24,
    headwind:      5,
    brakingAction: 6,
  },

  weightLimits: { min: 90000, max: 154300, step: 1000 },

  flapOptions: [
    { value: "CONF FULL", label: "CONF FULL" },
    { value: "CONF 3",    label: "CONF 3"    },
  ],

  brakeModeOptions: [
    { value: "MAX_MAN", label: "Max Manual" },
    { value: "MED",     label: "MED Auto"   },
    { value: "LOW",     label: "LOW Auto"   },
  ],

  reverserOptions: [
    { value: "Both", label: "Both" },
    { value: "None", label: "None" },
  ],

  brakingOptions: [
    { value: 6, label: "6 - Dry",      surface: "dry"  },
    { value: 5, label: "5 - Good",     surface: "dry"  },
    { value: 4, label: "4 - Good/Med", surface: "poor" },
    { value: 3, label: "3 - Medium",   surface: "poor" },
    { value: 2, label: "2 - Med/Poor", surface: "poor" },
    { value: 1, label: "1 - Poor",     surface: "poor" },
  ],

  // Bottom bar speed slots
  speedSlots: [
    { key: "vls",  label: "VLS",  color: "#ff3b30" },
    { key: "vapp", label: "VAPP", color: "#34c759" },
    { key: "f",    label: "F",    color: "#007aff" },
    { key: "s",    label: "S",    color: "#ff9500" },
    { key: "o",    label: "O",    color: "#8e8e93" },
  ],

  // Landing distance result is keyed by RwyCC (6,5,4,3,2,1)
  // primaryDistKey = the RwyCC matching current braking action
  primaryDistKey: "byRwyCC",

  toggles: ["engineAntiIce", "wingAntiIce", "iceAccretion"],

  showShortRunway: false,
  showCatII: false,
  showAcType: false,
  showBrakeMode: true,

  // Anti-ice weight corrections for climb-limited weight (lbs)
  antiIceCorrections: {
    engineOnly:  600,
    engineWing:  3600,
    iceAccretion: 12500,
  },

  calculate(s) {
    // VLS/F/S/O speeds are identical for CONF FULL and CONF 3 — single shared table
    const confFull = s.flap === "CONF FULL";
    const speeds = lookupA319Speeds(s.landingWeight, confFull);
    const vls  = speeds.VLS;
    const vapp = vls + s.vappAdditive;
    const f    = speeds.F;
    const spd  = speeds.S;

    const distances = calcA319({
      weightLbs:    s.landingWeight,
      flap:         s.flap,
      brakeMode:    s.brakeMode,
      pressureAlt:  s.pressureAlt,
      oatC:         s.oatC,
      headwind:     s.headwind,
      vappAdditive: s.vappAdditive,
      reversers:    s.reversers === "Both",
    });

    // Climb limited weight
    let climbLimitedKlbs = lookupClimbLimited(confFull, s.pressureAlt, s.oatC);

    if (climbLimitedKlbs != null) {
      let correction = 0;
      if (s.wingAntiIce) correction += this.antiIceCorrections.engineWing;
      else if (s.engineAntiIce) correction += this.antiIceCorrections.engineOnly;
      if (s.iceAccretion) correction += this.antiIceCorrections.iceAccretion;
      climbLimitedKlbs = climbLimitedKlbs - correction / 1000;
    }

    return {
      speeds: { vls, vapp, f, s: spd, o: speeds.O },
      distances,
      climbLimitedKlbs,
      primaryDist: distances ? distances[s.brakingAction] : null,
    };
  },
};
