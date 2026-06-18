import { calcA321, lookupA321Speeds, lookupA321ClimbLimited } from "./calc.js";

const BASE_DEFAULTS = {
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
};

const BASE_SCHEMA = {
  weightLimits:   { min: 110000, max: 205000, step: 1000 },
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
};

function makeCalculate(antiIce) {
  return function calculate(s) {
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
      if (s.wingAntiIce) corr += antiIce.engineWing;
      else if (s.engineAntiIce) corr += antiIce.engineOnly;
      if (s.iceAccretion) corr += antiIce.iceAccretion;
      climbLimitedKlbs = climbLimitedKlbs - corr / 1000;
    }

    return {
      speeds: { vls, vapp, f: speeds.F, s: speeds.S, o: speeds.O },
      distances,
      climbLimitedKlbs,
      primaryDist: distances ? distances[s.brakingAction] : null,
    };
  };
}

// IAE Non-Sharklet: Engine Anti-ice 790, Engine+Wing 3700, Ice Accretion 15800
export const a321IaeConfig = {
  id: "a321-iae",
  label: "A321 IAE",
  title: "A321 IAE/CFM56 In-Flight Normal Landing Distance",
  defaults: { ...BASE_DEFAULTS },
  ...BASE_SCHEMA,
  antiIceCorrections: { engineOnly: 790, engineWing: 3700, iceAccretion: 15800 },
  calculate: makeCalculate({ engineOnly: 790, engineWing: 3700, iceAccretion: 15800 }),
};

// CFM Non-Sharklet: Engine Anti-ice 780, Engine+Wing 3500, Ice Accretion 15000
export const a321CfmConfig = {
  id: "a321-cfm",
  label: "A321 CFM",
  title: "A321 IAE/CFM56 In-Flight Normal Landing Distance",
  defaults: { ...BASE_DEFAULTS },
  ...BASE_SCHEMA,
  antiIceCorrections: { engineOnly: 780, engineWing: 3500, iceAccretion: 15000 },
  calculate: makeCalculate({ engineOnly: 780, engineWing: 3500, iceAccretion: 15000 }),
};
