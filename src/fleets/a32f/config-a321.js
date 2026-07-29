import {
  calcA321,
  lookupA321Speeds,
  lookupA321ClimbLimited,
  A321_ANTI_ICE,
} from "./calc.js";

// ─────────────────────────────────────────────────────────────────────────────
// A321 IAE/CFM-56
//
// One entry, matching the real Land App, which offers the A321 as a single
// "IAE/CFM combination" (AOM 16p.16). The AOM publishes one A321 IAE/CFM-56
// table set for both engines — the distance tables (12p.5.6) and the two
// climb-limited tables (12p.3.6) are engine-agnostic.
//
// This replaces the former a321IaeSL / a321Iae / a321Cfm trio, which split one
// aircraft into three entries on a misreading: the "IAE vs CFM" anti-ice numbers
// were actually the CONF 3 vs CONF FULL numbers off the two climb-limited pages.
//
// NOTE ON SPEEDS: lookupA321Speeds is real data, but speeds are not rendered for
// this fleet — `showSpeeds` is unset, matching the real app.
// ─────────────────────────────────────────────────────────────────────────────

export const a321Config = {
  id: "a321",
  label: "A321 IAE/CFM",
  title: "A321 IAE/CFM56 In-Flight Normal Landing Distance",
  maxWeight: 205000,

  defaults: {
    flap:          "CONF FULL",
    brakeMode:     "MAX_MAN",
    reversers:     "Both",
    vappAdditive:  5,
    landingWeight: 171500,
    autothrust:      false,
    autoland:        false,
    shortRwyStation: false,
    pressureAlt:   1000,
    oatC:          24,
    headwind:      5,
    brakingAction: 6,
  },

  // Distance tables are gridded 140–205k lb; MLW is 171.5k lb.
  weightLimits: { min: 110000, max: 205000, step: 1000 },
  flapOptions:      [{ value: "CONF 3", label: "3" }, { value: "CONF FULL", label: "Full" }],
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
  toggles: ["autothrust", "autoland"],
  showShortRunway: true,
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
      // Only "Both" credits reverse thrust. "0" and "1" both fall through to the
      // full no-reverser penalty — see the note in calcFromTables in calc.js.
      reversers:    s.reversers === "Both",
    });

    let climbLimitedKlbs = lookupA321ClimbLimited(confFull, s.pressureAlt, s.oatC);
    if (climbLimitedKlbs != null) {
      const antiIce = A321_ANTI_ICE[s.flap] ?? A321_ANTI_ICE["CONF FULL"];
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
