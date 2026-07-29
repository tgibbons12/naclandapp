import { calcA319, lookupA319Speeds, lookupClimbLimited } from "./calc.js";

// A319 anti-ice / ice accretion corrections, from the two climb-limited pages in
// AOM 12p.3.2. Like the other A32F types these vary by landing configuration.
// Previously a 0/0/0 stub that was also never referenced — the real values are
// recorded here for when dispatch-side anti-ice inputs are added. They are not
// reachable from the normal in-flight page, which has no anti-ice controls.
const ANTI_ICE = {
  "CONF 3":    { engineOnly: 600, engineWing: 3600, iceAccretion: 12500 },
  "CONF FULL": { engineOnly: 500, engineWing: 3800, iceAccretion: 12200 },
};

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
    autothrust:      false,
    autoland:        false,
    iceAccretion:    false,
    shortRwyStation: false,
    pressureAlt:   1000,
    oatC:          24,
    headwind:      5,
    brakingAction: 6,
  },

  weightLimits: { min: 90000, max: 166400, step: 1000 },
  flapOptions:    [{ value: "CONF 3", label: "3" }, { value: "CONF FULL", label: "Full" }],
  brakeModeOptions: [{ value: "MAX_MAN", label: "Max Manual" }, { value: "MED", label: "MED Auto" }, { value: "LOW", label: "LOW Auto" }],
  // AOM 16p.16: Operative Thrust Reversers is 0, Both or 1. See note in calculate().
  reverserOptions:  [{ value: "0", label: "0" }, { value: "1", label: "1" }, { value: "Both", label: "Both" }],
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
  toggles: ["autothrust", "autoland", "iceAccretion"],
  showShortRunway: true,
  // AOM 12p.5.3 — six station groups carry special inflight landing data for the A319.
  shortRunwayStations: [
    { value: "bos-lga-dca", label: "BOS 27 / LGA / DCA 01-19" },
    { value: "dca-15-33",   label: "DCA 15/33" },
    { value: "jac-01-19",   label: "JAC 01/19" },
    { value: "pei-08-26",   label: "PEI 08/26" },
    { value: "eyw-09-27",   label: "EYW 09/27" },
    { value: "sbp-11-29",   label: "SBP 11/29" },
  ],
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
      // Only "Both" credits reverse thrust. "0" and "1" both fall through to the
      // full no-reverser penalty — see the note in calcFromTables in calc.js.
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
