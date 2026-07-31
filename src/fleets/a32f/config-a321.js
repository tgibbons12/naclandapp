import {
  calcA321,
  lookupA321Speeds,
  lookupA321ClimbLimited,
  A321_ANTI_ICE,
} from "./calc.js";
import { calcSpecial } from "./calc-special.js";
import { MEL_PENALTY_OPTIONS } from "./limits.js";

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
  label: "A321 (IAE, CFM-56)",
  title: "Airbus A32F In-Flight Normal Landing Distance",
  maxWeight: 205000,

  defaults: {
    flap:          "CONF FULL",
    brakeMode:     "MAX_MAN",
    reversers:     "Both",
    vappAdditive:  5,
    landingWeight: 171500,
    autothrust:      false,
    autoland:        false,
    iceAccretion:    false,
    shortRwyStation: false,
    shortRwyId:      "none",
    melPenaltyFt:    0,
    pressureAlt:   1000,
    oatC:          24,
    headwind:      5,
    brakingAction: 6,
  },

  // Distance tables are gridded 140–205k lb; MLW is 171.5k lb.
  weightLimits: { min: 110000, max: 205000, step: 1000 },
  flapOptions:      [{ value: "CONF 3", label: "3" }, { value: "CONF FULL", label: "Full" }],
  brakeModeOptions: [{ value: "MAX_MAN", label: "Manual" }, { value: "MED", label: "Auto MED" }, { value: "LOW", label: "Auto LO" }],
  reverserOptions:  [{ value: "Both", label: "Both" }, { value: "None", label: "None" }],
  // The tables publish corrections only at VLS+10 and VLS+15, so the real app
  // offers three fixed choices rather than a free stepper.
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
  showCrosswindLimit: true,
  melOptions: MEL_PENALTY_OPTIONS,
  // AOM 12p.5.8 — four station groups, each with its own IAE/CFM-56 table set.
  // The BOS/LGA/DCA group shares one table across three airports with different
  // LDAs, so it is listed per field.
  shortRunwayStations: [
    { value: "bos-27",    label: "BOS 27" },
    { value: "lga",       label: "LGA (all runways)" },
    { value: "dca-01-19", label: "DCA 01/19" },
    { value: "dca-15-33", label: "DCA 15/33" },
    { value: "sna-02l",   label: "SNA 02L" },
    { value: "sna-20r",   label: "SNA 20R" },
  ],
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

    // A special station replaces the normal result entirely — the AOM directs its
    // table be used "in lieu of" the normal data, so the normal distance must not
    // be presented alongside it.
    const special = calcSpecial({
      station:       s.shortRwyId,
      typeKey:       "a321",
      brakeMode:     s.brakeMode,
      weightLbs:     s.landingWeight,
      oatC:          s.oatC,
      headwind:      s.headwind,
      vappAdditive:  s.vappAdditive,
      brakingAction: s.brakingAction,
      reversers:     s.reversers,
    });

    return {
      speeds: { vls, vapp, f: speeds.F, s: speeds.S, o: speeds.O },
      distances,
      climbLimitedKlbs,
      special,
      primaryDist: special
        ? (special.requiredFt ?? null)
        : (distances ? distances[s.brakingAction] : null),
    };
  },
};
