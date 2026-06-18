import { calcB737, lookupB737Speeds, lookupB737ClimbLimited, lookupB737Gradient, reverseB737ClimbLimit } from "./calc-b737.js";
import { calcB737NonNormal, B737_NN_SCENARIOS } from "./calc-b737-nn.js";

// ─────────────────────────────────────────────────────────────────────────────
// Failure selector options — label shown in UI, vrefLabel shown in speed bar
// ─────────────────────────────────────────────────────────────────────────────
export const B737_FAILURE_OPTIONS = [
  { value: "flaps-up",           label: "All Flaps Up",                        vrefLabel: "VREF 40+55" },
  { value: "anti-skid-inop-f40", label: "Anti-Skid Inop  /  Flaps 40",         vrefLabel: "VREF 40"    },
  { value: "jammed-controls-f15",label: "Jammed/Restricted Controls  /  Flaps 15", vrefLabel: "VREF 15" },
  { value: "le-flaps-transit-f15",label: "LE Flaps Transit  /  Flaps 15",      vrefLabel: "VREF 15+15" },
  { value: "hyd-a-loss-f30",     label: "Hyd System A Loss  /  Flaps 30",      vrefLabel: "VREF 30"    },
  { value: "hyd-a-loss-f40",     label: "Hyd System A Loss  /  Flaps 40",      vrefLabel: "VREF 40"    },
  { value: "hyd-b-loss-f15",     label: "Hyd System B Loss  /  Flaps 15",      vrefLabel: "VREF 15"    },
  { value: "manual-reversion-f15",label: "Manual Reversion / Hyd A+B Loss  /  Flaps 15", vrefLabel: "VREF 15" },
  { value: "one-eng-inop-f15",   label: "One Engine Inop  /  Flaps 15",        vrefLabel: "VREF 15"    },
  { value: "te-asym-f1-14",      label: "TE Flap Asymmetry  /  Lever 1–14",    vrefLabel: "VREF 40+30" },
  { value: "te-asym-f15-25",     label: "TE Flap Asymmetry  /  Lever 15–25",   vrefLabel: "VREF 15"    },
  { value: "te-asym-f30",        label: "TE Flap Asymmetry  /  Lever 30",      vrefLabel: "VREF 30"    },
  { value: "te-disagree-f1-14",  label: "TE Flap Disagree  /  Indicated 1–14", vrefLabel: "VREF 40+30" },
  { value: "te-disagree-f15-29", label: "TE Flap Disagree  /  Indicated 15–29",vrefLabel: "VREF 15"    },
  { value: "te-disagree-f30-39", label: "TE Flap Disagree  /  Indicated 30–39",vrefLabel: "VREF 30"    },
  { value: "te-flaps-up-f0",     label: "TE Flaps Up Landing  /  Flaps < 1",   vrefLabel: "VREF 40+40" },
  { value: "elec-stab-trim-inop",label: "Elec Stabilizer Trim Inop  /  Flaps 15", vrefLabel: "VREF 15" },
  { value: "airspeed-unrel-f15", label: "Airspeed Unreliable  /  Flaps 15",    vrefLabel: "VREF 15"    },
  { value: "airspeed-unrel-f30", label: "Airspeed Unreliable  /  Flaps 30",    vrefLabel: "VREF 30"    },
  { value: "airspeed-unrel-f40", label: "Airspeed Unreliable  /  Flaps 40",    vrefLabel: "VREF 40"    },
];

// ─────────────────────────────────────────────────────────────────────────────
// MACG helper — exposed on configs so App.jsx stays fleet-agnostic
// ─────────────────────────────────────────────────────────────────────────────
const b737MacgHelper = {
  /** Forward: actual gradient (ft/NM) at given weight/conditions */
  gradient(weightLbs, pressureAlt, oatC, antiIceOn = false) {
    return lookupB737Gradient(weightLbs, pressureAlt, oatC, antiIceOn);
  },
  /** Reverse: max weight (lbs, 500 lb steps) meeting required MACG */
  maxWeight(requiredGradFtNm, pressureAlt, oatC, antiIceOn = false) {
    return reverseB737ClimbLimit(requiredGradFtNm, pressureAlt, oatC, antiIceOn);
  },
  /** Convert ft/NM to percent gradient */
  ftNmToPct: (ftNm) => +(ftNm / 60.76).toFixed(1),
  /** Convert percent gradient to ft/NM */
  pctToFtNm: (pct)  => Math.round(pct * 60.76),
  /** Min table weight in lbs */
  minWeightLbs: 120000,
  /** Max table weight in lbs */
  maxWeightLbs: 174200,
};

// ─────────────────────────────────────────────────────────────────────────────
// 737-800  (CFM56-7B27)
// ─────────────────────────────────────────────────────────────────────────────
export const b737800Config = {
  id:        "b737-800",
  label:     "737-800",
  title:     "737-800 In-Flight Normal Landing Distance",
  maxWeight: 162800,

  defaults: {
    flap:          "FLAPS 30",
    brakeMode:     "MAX_AUTO",
    reversers:     "Both",
    vrefAdditive:  5,
    landingWeight: 130000,
    pressureAlt:   1000,
    oatC:          24,
    headwind:      5,
    brakingAction: 6,
  },

  nnDefaults: {
    failure:       "one-eng-inop-f15",
    reversers:     "Both",
    vrefAdditive:  5,
    landingWeight: 130000,
    pressureAlt:   1000,
    oatC:          24,
    headwind:      5,
    brakingAction: 6,
  },

  weightLimits: { min: 100000, max: 162800, step: 1000 },

  flapOptions: [
    { value: "FLAPS 30", label: "Flaps 30" },
    { value: "FLAPS 40", label: "Flaps 40" },
  ],

  brakeModeOptions: [
    { value: "MAX_AUTO", label: "MAX AUTO"    },
    { value: "AUTO_3",   label: "Autobrake 3" },
    { value: "AUTO_2",   label: "Autobrake 2" },
    { value: "AUTO_1",   label: "Autobrake 1" },
  ],

  reverserOptions: [
    { value: "Both", label: "Both"          },
    { value: "Idle", label: "Idle / Stowed"  },
    { value: "None", label: "None"           },
  ],

  brakingOptions: [
    { value: 6, label: "6 - Dry"      },
    { value: 5, label: "5 - Good"     },
    { value: 4, label: "4 - Good/Med" },
    { value: 3, label: "3 - Medium"   },
    { value: 2, label: "2 - Med/Poor" },
    { value: 1, label: "1 - Poor"     },
  ],

  failureOptions: B737_FAILURE_OPTIONS,

  speedSlots: [
    { key: "vref15", label: "VREF 15", color: "#ff9500" },
    { key: "vref30", label: "VREF 30", color: "#ff3b30" },
    { key: "vref40", label: "VREF 40", color: "#ff3b30" },
    { key: "vapp",   label: "VAPP",    color: "#34c759" },
  ],

  toggles: [],

  showShortRunway: false,
  showCatII:       false,
  showBrakeMode:   true,
  primaryDistKey:  "byRwyCC",

  // ── Normal landing distance ─────────────────────────────────────────────────
  calculate(s) {
    const spds     = lookupB737Speeds(s.landingWeight, s.flap);
    const { vref } = spds;
    const vapp     = vref + s.vrefAdditive;

    const distances = calcB737({
      weightLbs:    s.landingWeight,
      flap:         s.flap,
      brakeMode:    s.brakeMode,
      pressureAlt:  s.pressureAlt,
      oatC:         s.oatC,
      headwind:     s.headwind,
      vrefAdditive: s.vrefAdditive,
      reversers:    s.reversers,
    });

    const climbLimitedKlbs = lookupB737ClimbLimited(
      s.flap, s.pressureAlt, s.oatC, false,
    );

    // Apply 15% safety factor to all CC distances
    const required = distances
      ? Object.fromEntries(
          Object.entries(distances).map(([cc, ft]) => [cc, Math.round(ft * 1.15 / 10) * 10])
        )
      : null;

    return {
      speeds: { vref15: spds.vref15, vref30: spds.vref30, vref40: spds.vref40, vref, vrefNN: vref, vapp },
      distances: required,
      climbLimitedKlbs,
      primaryDist: required ? required[s.brakingAction] : null,
    };
  },

  macg: b737MacgHelper,

  // ── Non-normal landing distance ─────────────────────────────────────────────
  calculateNonNormal(s) {
    const failureOpt = B737_FAILURE_OPTIONS.find(f => f.value === s.failure);
    const vrefLabel  = failureOpt?.vrefLabel ?? "VREF";

    // Derive the correct flap, VREF, and any QRH additive from vrefLabel.
    // e.g. "VREF 40+55" -> base vref40 + 55 kts, "VREF 15+15" -> vref15 + 15 kts
    const vrefMatch     = vrefLabel.match(/VREF\s*(\d+)(?:\+(\d+))?/);
    const vrefNum       = vrefMatch ? parseInt(vrefMatch[1]) : 30;
    const vrefAdditive  = vrefMatch?.[2] ? parseInt(vrefMatch[2]) : 0;
    const flapForSpeed  = vrefNum === 40 ? "FLAPS 40" : vrefNum === 15 ? "FLAPS 15" : "FLAPS 30";
    const spds          = lookupB737Speeds(s.landingWeight, flapForSpeed);
    const vrefBase      = vrefNum === 40 ? spds.vref40 : vrefNum === 15 ? spds.vref15 : spds.vref30;
    const vref          = vrefBase + vrefAdditive;
    const vapp          = vref + s.vrefAdditive;

    const adjusted = calcB737NonNormal({
      failureId:    s.failure,
      weightLbs:    s.landingWeight,
      pressureAlt:  s.pressureAlt,
      oatC:         s.oatC,
      headwind:     s.headwind,
      vrefAdditive: s.vrefAdditive,
      reversers:    s.reversers,
    });

    // Apply 15% safety factor
    const required = adjusted
      ? Object.fromEntries(
          Object.entries(adjusted).map(([cc, ft]) => [cc, Math.round(ft * 1.15 / 10) * 10])
        )
      : null;

    return {
      speeds: { vref15: spds.vref15, vref30: spds.vref30, vref40: spds.vref40, vref, vrefNN: vref, vapp },
      vrefLabel,
      distances: required,
      climbLimitedKlbs: null,   // climb limit not published for non-normal
      primaryDist: required ? required[s.brakingAction] : null,
    };
  },
};


// ─────────────────────────────────────────────────────────────────────────────
// 737 MAX 8  (CFM LEAP-1B) — same QRH data as -800
// ─────────────────────────────────────────────────────────────────────────────
export const b737max8Config = {
  ...b737800Config,
  id:    "b737-max8",
  label: "737 MAX 8",
  title: "737 MAX 8 In-Flight Normal Landing Distance",
};
