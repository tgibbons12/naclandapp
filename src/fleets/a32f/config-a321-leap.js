import {
  calcA321Neo,
  lookupA321NeoClimbLimited,
  A321NEO_ANTI_ICE,
  lookupA321Speeds,
} from "./calc.js";
import { calcSpecial } from "./calc-special.js";
import { MEL_PENALTY_OPTIONS } from "./limits.js";

// ─────────────────────────────────────────────────────────────────────────────
// A321 LEAP-1A  (A321-253NX)
//
// Landing distance + climb-limited data: A32F AOM 12p.5.7 / 12p.3.
//
// NOTE ON SPEEDS: the AOM performance chapter carries no LEAP-1A landing speed
// table, so lookupA321Speeds (IAE/CFM56 ceo values) stands in below. These are
// NOT rendered — `showSpeeds` is unset, so the bottom bar hides the speed block
// for this fleet, matching the real Land App. If speeds are ever turned on here,
// swap in a real A321neo speed table first; the ceo values are not correct for
// the neo and the ceo table also tops out below this variant's MLW.
// ─────────────────────────────────────────────────────────────────────────────

export const a321LeapConfig = {
  id: "a321-leap",
  // Short name for the Aircraft Type picker; formal designation in the bottom bar.
  // The AOM uses both — "A321NA/A321NX" in the SNA special tables, "A321 LEAP-1A"
  // in the normal inflight and climb-limited sections.
  label: "A321 (LEAP-1A)",
  bottomLabel: "A321 (LEAP-1A)",
  title: "Airbus A32F In-Flight Normal Landing Distance",
  maxWeight: 205000,

  defaults: {
    flap:          "CONF FULL",
    brakeMode:     "MAX_MAN",
    reversers:     "Both",
    vappAdditive:  5,
    landingWeight: 174600,
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

  // Distance tables are gridded 140–205k lb; below 140k the interpolation clamps.
  weightLimits: { min: 140000, max: 205000, step: 1000 },
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
  showCrosswindLimit: true,
  melOptions: MEL_PENALTY_OPTIONS,
  // AOM 12p.5.8 — same four station groups as the ceo, with A321NA/A321NX tables.
  shortRunwayStations: [
    { value: "bos-lga-dca", label: "BOS 27 / LGA / DCA 01-19" },
    { value: "dca-15-33",   label: "DCA 15/33" },
    { value: "sna-02l",     label: "SNA 02L" },
    { value: "sna-20r",     label: "SNA 20R" },
  ],
  showCatII: false,
  showBrakeMode: true,
  primaryDistKey: "byRwyCC",

  calculate(s) {
    const confFull = s.flap === "CONF FULL";
    const speeds   = lookupA321Speeds(s.landingWeight, confFull);
    const vls  = speeds.VLS;
    const vapp = vls + s.vappAdditive;

    const distances = calcA321Neo({
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

    let climbLimitedKlbs = lookupA321NeoClimbLimited(confFull, s.pressureAlt, s.oatC);
    if (climbLimitedKlbs != null) {
      const antiIce = A321NEO_ANTI_ICE[s.flap] ?? A321NEO_ANTI_ICE["CONF FULL"];
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
      typeKey:       "a321-leap",
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
