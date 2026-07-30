import {
  calcA320,
  lookupA320ClimbLimited,
  A320_ANTI_ICE,
  lookupA319Speeds,
} from "./calc.js";

// ─────────────────────────────────────────────────────────────────────────────
// A320
//
// Landing distance + climb-limited data: A32F AOM 12p.5.4 / 12p.3.4.
//
// NOTE ON SPEEDS: the AOM performance chapter carries no A320 landing speed
// table. The A319 shares the A320 wing, so lookupA319Speeds stands in below.
// These are NOT rendered — `showSpeeds` is unset, so the bottom bar hides the
// speed block for this fleet, matching the real Land App. If speeds are ever
// turned on here, swap in a real A320 table first: the A319 table tops out at
// 154.3k lb and clamps above that, while this grid runs to 169.7k lb.
// ─────────────────────────────────────────────────────────────────────────────

export const a320Config = {
  id: "a320",
  label: "A320",
  title: "Airbus A32F In-Flight Normal Landing Distance",
  maxWeight: 169700,

  defaults: {
    flap:          "CONF FULL",
    brakeMode:     "MAX_MAN",
    reversers:     "Both",
    vappAdditive:  5,
    landingWeight: 142100,
    autothrust:      false,
    autoland:        false,
    iceAccretion:    false,
    shortRwyStation: false,
    pressureAlt:   1000,
    oatC:          24,
    headwind:      5,
    brakingAction: 6,
  },

  // Distance tables are gridded 100–169.7k lb; MLW is 142.1k lb.
  weightLimits: { min: 100000, max: 169700, step: 1000 },
  flapOptions:      [{ value: "CONF 3", label: "3" }, { value: "CONF FULL", label: "Full" }],
  brakeModeOptions: [{ value: "MAX_MAN", label: "Manual" }, { value: "MED", label: "Auto MED" }, { value: "LOW", label: "Auto LO" }],
  reverserOptions:  [{ value: "Both", label: "Both" }, { value: "None", label: "None" }],
  vappOptions: [{ value: 5, label: "VLS+5" }, { value: 10, label: "VLS+10" }, { value: 15, label: "VLS+15" }],
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
  toggles: ["iceAccretion", "autoland"],
  showShortRunway: true,
  shortRunwayLabel: "Short Runways",
  shortRunwayAsList: true,
  showClimbLimited: false,
  // AOM 12p.5.5 — two station groups carry special inflight landing data for the A320.
  shortRunwayStations: [
    { value: "bos-lga-dca", label: "BOS 27 / LGA / DCA 01-19" },
    { value: "dca-15-33",   label: "DCA 15/33" },
  ],
  showCatII: false,
  showBrakeMode: true,
  primaryDistKey: "byRwyCC",

  calculate(s) {
    const confFull = s.flap === "CONF FULL";
    const speeds   = lookupA319Speeds(s.landingWeight, confFull);
    const vls  = speeds.VLS;
    const vapp = vls + s.vappAdditive;

    const distances = calcA320({
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

    let climbLimitedKlbs = lookupA320ClimbLimited(confFull, s.pressureAlt, s.oatC);
    if (climbLimitedKlbs != null) {
      const antiIce = A320_ANTI_ICE[s.flap] ?? A320_ANTI_ICE["CONF FULL"];
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
  },
};
