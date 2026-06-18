import { calcA319, lookupA319Speeds, lookupClimbLimited } from "./calc.js";

const ANTI_ICE = { engineOnly: 0, engineWing: 0, iceAccretion: 0 }; // stub — add values when data available

export const a319Config = {
  id: "a319",
  label: "A319",
  title: "A319 In-Flight Normal Landing Distance",
  maxWeight: 166400,

  defaults: {
    flap:          "CONF FULL",
    brakeMode:     "MAX_MAN",
    reversers:     "Both",
    vappAdditive:  5,
    landingWeight: 137700,
    engineAntiIce: false,
    wingAntiIce:   false,
    iceAccretion:  false,
    pressureAlt:   1000,
    oatC:          24,
    headwind:      5,
    brakingAction: 6,
  },

  weightLimits: { min: 90000, max: 166400, step: 1000 },
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
    const speeds   = lookupA319Speeds(s.landingWeight);
    const vls  = speeds.VLS;
    const vapp = vls + s.vappAdditive;

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

    let climbLimitedKlbs = lookupClimbLimited(confFull, s.pressureAlt, s.oatC);

    return {
      speeds: { vls, vapp, f: speeds.F, s: speeds.S, o: speeds.O },
      distances,
      climbLimitedKlbs,
      primaryDist: distances ? distances[s.brakingAction] : null,
    };
  },
};
