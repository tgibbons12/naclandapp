import { calcA321, lookupA321Speeds, lookupA321ClimbLimited } from "./calc.js";

// Anti-ice corrections — stub until sharklet-specific data confirmed
// Using IAE/CFM56 values as placeholder
const ANTI_ICE = { engineOnly: 780, engineWing: 3500, iceAccretion: 15000 };

export const a321IaeSLConfig = {
  id: "a321-iae-sl",
  label: "A321 IAE-SL",
  title: "A321 IAE Sharklet In-Flight Normal Landing Distance",
  maxWeight: 210000,

  defaults: {
    flap:          "CONF FULL",
    brakeMode:     "MAX_MAN",
    reversers:     "Both",
    vappAdditive:  5,
    landingWeight: 171500,
    engineAntiIce: false,
    wingAntiIce:   false,
    iceAccretion:  false,
    pressureAlt:   1000,
    oatC:          24,
    headwind:      5,
    brakingAction: 6,
  },

  weightLimits: { min: 110000, max: 210000, step: 1000 },
  flapOptions:    [{ value: "CONF FULL", label: "CONF FULL" }, { value: "CONF 3", label: "CONF 3" }],
  brakeModeOptions: [{ value: "MAX_MAN", label: "Max Manual" }, { value: "MED", label: "MED Auto" }, { value: "LOW", label: "LOW Auto" }],
  reverserOptions:  [{ value: "Both", label: "Both" }, { value: "None", label: "None" }],
  brakingOptions: [
    { value: 6, label: "6 - Dry",      surface: "dry"  },
    { value: 5, label: "5 - Good",     surface: "dry"  },
    { value: 4, label: "4 - Good/Med", surface: "poor" },
    { value: 3, label: "3 - Medium",   surface: "poor" },
    { value: 2, label: "2 - Med/Poor", surface: "poor" },
    { value: 1, label: "1 - Poor",     surface: "poor" },
  ],
  speedSlots: [
    { key: "vls",  label: "VLS",  color: "#ff3b30" },
    { key: "vapp", label: "VAPP", color: "#34c759" },
    { key: "f",    label: "F",    color: "#007aff" },
    { key: "s",    label: "S",    color: "#ff9500" },
    { key: "o",    label: "O",    color: "#8e8e93" },
  ],
  toggles: ["engineAntiIce", "wingAntiIce", "iceAccretion"],
  showShortRunway: false,
  showCatII: false,
  showBrakeMode: true,
  primaryDistKey: "byRwyCC",

  calculate(s) {
    const confFull = s.flap === "CONF FULL";
    const speeds   = lookupA321Speeds(s.landingWeight, confFull);
    const vls  = speeds.VLS;
    const vapp = vls + s.vappAdditive;

    const distances = calcA321({
      weightLbs:    s.landingWeight,
      flap:         s.flap,
      brakeMode:    s.brakeMode,
      pressureAlt:  s.pressureAlt,
      oatC:         s.oatC,
      headwind:     s.headwind,
      vappAdditive: s.vappAdditive,
      reversers:    s.reversers === "Both",
    });

    let climbLimitedKlbs = lookupA321ClimbLimited(confFull, s.pressureAlt, s.oatC);
    if (climbLimitedKlbs != null) {
      let corr = 0;
      if (s.wingAntiIce) corr += ANTI_ICE.engineWing;
      else if (s.engineAntiIce) corr += ANTI_ICE.engineOnly;
      if (s.iceAccretion) corr += ANTI_ICE.iceAccretion;
      climbLimitedKlbs = climbLimitedKlbs - corr / 1000;
    }

    return {
      speeds: { vls, vapp, f: speeds.F, s: speeds.S, o: speeds.O },
      distances,
      climbLimitedKlbs,
      primaryDist: distances ? distances[s.brakingAction] : null,
    };
  },
};
