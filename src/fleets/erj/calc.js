// ─── EMB 145/140/135 LANDING SPEED TABLES ────────────────────────────────────
// Source: EMB 145 POH Chapter 9, Section 11 (Chautauqua Airlines Vol 5, REV. 6, 01 MAY 2008)
// Row format: [weight_lbs, VFS, VREF, VGA9, VTGT]
// Weight: round actual weight UP to next 1,000 lb before lookup.
// VTGT = VREF45 + 10 (entries marked * in source are limited to min 140 kt per POH note).
// Flaps 22 use: only when wind/gust causes VTGT(F45) to be within 5 KIAS of 145 KIAS.

// A. EMB 145 LR/LR2/EP — Flaps 45  (AE3007 A1P)
const EMB145_F45 = [
  [28000, 136, 106, 128, 116],
  [29000, 138, 108, 130, 118],
  [30000, 140, 109, 132, 119],
  [31000, 143, 111, 134, 121],
  [32000, 145, 113, 136, 123],
  [33000, 147, 115, 138, 125],
  [34000, 149, 117, 140, 127],
  [35000, 151, 118, 142, 128],
  [36000, 154, 120, 144, 130],
  [37000, 155, 121, 146, 131],
  [38000, 157, 123, 148, 133],
  [39000, 159, 124, 150, 134],
  [40000, 161, 126, 152, 136],
  [41000, 164, 127, 154, 137],
  [42000, 165, 128, 156, 138],
  [43000, 167, 130, 157, 140],
  [44000, 169, 131, 159, 140], // VTGT limited (< VREF+10)
  [45000, 170, 132, 161, 140], // VTGT limited
  [46000, 172, 134, 163, 140], // VTGT limited
  [47000, 173, 135, 164, 140], // VTGT limited
  [48000, 175, 136, 166, 140], // VTGT limited
  [48500, 176, 137, 167, 140], // VTGT limited
  [49000, 177, 137, 167, 140], // VTGT limited
  [50000, 179, 137, 167, 140], // VTGT limited
];

// B. EMB 145 LR/LR2/EP — Flaps 22  (AE3007 A1P)
const EMB145_F22 = [
  [28000, 135, 111, 128, 121],
  [29000, 137, 113, 130, 123],
  [30000, 139, 113, 132, 123],
  [31000, 142, 116, 134, 126],
  [32000, 144, 118, 136, 128],
  [33000, 146, 120, 138, 130],
  [34000, 148, 121, 140, 131],
  [35000, 150, 123, 142, 133],
  [36000, 152, 125, 144, 135],
  [37000, 154, 127, 146, 137],
  [38000, 156, 128, 148, 138],
  [39000, 158, 130, 150, 140],
  [40000, 160, 131, 152, 141],
  [41000, 162, 133, 154, 143],
  [42000, 165, 134, 156, 144],
  [43000, 165, 136, 157, 146],
  [44000, 167, 137, 159, 147],
  [45000, 169, 139, 161, 149],
  [46000, 171, 140, 163, 150],
  [47000, 174, 142, 164, 152],
  [48000, 175, 143, 166, 153],
  [48500, 176, 144, 167, 154],
  [49000, 177, 144, 167, 154],
  [50000, 179, 144, 167, 154],
];

// C. EMB 140 — Flaps 45  (AE3007 A1/3)
const EMB140_F45 = [
  [28000, 135, 105, 128, 115],
  [29000, 137, 107, 130, 117],
  [30000, 139, 109, 132, 119],
  [31000, 142, 111, 134, 121],
  [32000, 144, 113, 137, 123],
  [33000, 146, 114, 139, 124],
  [34000, 148, 116, 141, 126],
  [35000, 150, 118, 142, 128],
  [36000, 152, 119, 144, 129],
  [37000, 154, 120, 146, 130],
  [38000, 156, 122, 148, 132],
  [39000, 158, 123, 149, 133],
  [40000, 160, 124, 151, 134],
  [41000, 162, 126, 153, 136],
  [42000, 164, 127, 154, 137],
  [43000, 165, 128, 156, 138],
  [44000, 167, 130, 158, 140],
  [45000, 169, 131, 159, 140], // VTGT limited
  [46000, 171, 132, 161, 140], // VTGT limited
];

// D. EMB 140 — Flaps 22  (AE3007 A1/3)
const EMB140_F22 = [
  [28000, 135, 107, 128, 117],
  [29000, 137, 109, 130, 119],
  [30000, 139, 111, 132, 121],
  [31000, 142, 113, 134, 123],
  [32000, 144, 115, 137, 125],
  [33000, 146, 116, 139, 126],
  [34000, 148, 118, 141, 128],
  [35000, 150, 120, 142, 130],
  [36000, 152, 121, 144, 131],
  [37000, 154, 123, 146, 133],
  [38000, 156, 124, 148, 134],
  [39000, 158, 126, 149, 136],
  [40000, 160, 127, 151, 137],
  [41000, 162, 128, 153, 138],
  [42000, 164, 130, 154, 140],
  [43000, 165, 131, 156, 141],
  [44000, 167, 133, 158, 143],
  [45000, 169, 134, 159, 144],
  [46000, 171, 135, 161, 145],
];

// E. EMB 135 LR — Flaps 45  (AE3007 A1/3)
const EMB135_F45 = [
  [26000, 133, 103, 125, 113],
  [27000, 135, 104, 125, 114],
  [28000, 137, 106, 128, 116],
  [29000, 140, 108, 131, 118],
  [30000, 141, 110, 133, 120],
  [31000, 143, 112, 135, 122],
  [32000, 146, 113, 137, 123],
  [33000, 148, 115, 139, 125],
  [34000, 151, 117, 142, 127],
  [35000, 153, 119, 144, 129],
  [36000, 155, 120, 145, 130],
  [37000, 157, 121, 147, 131],
  [38000, 159, 122, 149, 132],
  [39000, 161, 124, 151, 134],
  [40000, 163, 126, 153, 136],
  [41000, 164, 127, 155, 137],
  [42000, 166, 128, 157, 138],
  [43000, 168, 130, 158, 140],
  [44000, 170, 131, 159, 140], // VTGT limited
];

// F. EMB 135 LR — Flaps 22  (AE3007 A1/3)
const EMB135_F22 = [
  [26000, 133, 108, 125, 118],
  [27000, 135, 110, 126, 120],
  [28000, 137, 112, 128, 122],
  [29000, 137, 114, 131, 124],
  [30000, 139, 116, 133, 126],
  [31000, 142, 118, 135, 128],
  [32000, 144, 119, 137, 129],
  [33000, 146, 121, 139, 131],
  [34000, 148, 123, 142, 133],
  [35000, 150, 125, 144, 135],
  [36000, 152, 126, 145, 136],
  [37000, 154, 128, 147, 138],
  [38000, 156, 130, 149, 140],
  [39000, 158, 131, 151, 141],
  [40000, 160, 133, 153, 143],
  [41000, 162, 134, 155, 144],
  [42000, 164, 136, 157, 146],
  [43000, 165, 138, 158, 148],
  [44000, 167, 139, 159, 149],
];

// ─── SPEED LOOKUP ────────────────────────────────────────────────────────────
// Returns { VFS, VREF, VGA9, VTGT } for a given table and weight.
// Weight is rounded UP to the next 1,000 lb before lookup per POH procedure.
function lookupEMBSpeeds(table, weightLbs) {
  const roundedUp = Math.ceil(weightLbs / 1000) * 1000;
  for (let i = 0; i < table.length; i++) {
    if (roundedUp <= table[i][0]) {
      const [, VFS, VREF, VGA9, VTGT] = table[i];
      return { VFS, VREF, VGA9, VTGT };
    }
  }
  // At or above max table weight — return last row
  const [, VFS, VREF, VGA9, VTGT] = table[table.length - 1];
  return { VFS, VREF, VGA9, VTGT };
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────────
// acType: "EMB145" | "EMB140" | "EMB135"
// flaps:  45 | 22
// weightLbs: actual landing weight in lbs
export function getEMBSpeeds(acType, flaps, weightLbs) {
  let table;
  if (acType === "EMB145") table = flaps === 22 ? EMB145_F22 : EMB145_F45;
  else if (acType === "EMB140") table = flaps === 22 ? EMB140_F22 : EMB140_F45;
  else table = flaps === 22 ? EMB135_F22 : EMB135_F45; // EMB135
  return lookupEMBSpeeds(table, weightLbs);
}

// ─── EMB 145/140/135 FACTORED LANDING DISTANCE TABLES ────────────────────────
// Source: EMB 145 POH Chapter 9, Section 12B (Chautauqua Airlines Vol 5, REV. 6, 01 MAY 2008)
// Use only when AeroData landing data is unavailable.
// Distances are FACTORED (regulatory 1.667× / Part 121 40% factor already included).
// Basis: zero slope, ISA, dry runway, 50 ft threshold crossing at Vref,
//        brakes + spoilers only — NO reverse thrust credit.
// Flaps 45 only — this is the dispatch chart configuration; no Flaps-22 distance
// data is published in this POH section.
//
// ── WIND/SURFACE CORRECTIONS (apply to factored distance) ──────────────────
//   Tailwind:  ADD 15% per 10 kt
//   Headwind:  SUBTRACT 5% per 10 kt
//   Wet runway: ADD 20%
//   Wet + wind: apply wind correction first, then wet factor
//
// ── LOOKUP CONVENTION ──────────────────────────────────────────────────────
//   Elevations in the table: SL(0), 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000 ft
//   EMB 135 table only goes to 5000 ft.
//   Interpolate between weight rows and elevation columns as needed.
//   Weights below table minimum: use minimum weight row values.
//
// ── DATA FORMAT ────────────────────────────────────────────────────────────
//   Each entry: [weight_lbs, distSL, dist1k, dist2k, dist3k, dist4k, dist5k, dist6k, dist7k, dist8k]
//   EMB135 omits dist6k..dist8k (table stops at 5000 ft).

// 8. EMB 145 LR/LR2/EP — Required Landing Field Length, Flaps 45
//    Weights below 33,000 lb: use 33,000 row
const EMB145_DIST = [
  [33000, 3850, 3935, 4015, 4110, 4200, 4300, 4400, 4500, 4605],
  [34000, 3935, 4015, 4105, 4200, 4290, 4390, 4495, 4600, 4710],
  [35000, 4000, 4100, 4185, 4280, 4380, 4480, 4585, 4700, 4815],
  [36000, 4090, 4180, 4275, 4375, 4460, 4575, 4680, 4790, 4905],
  [37000, 4170, 4260, 4350, 4450, 4550, 4655, 4770, 4890, 5015],
  [38000, 4240, 4335, 4430, 4530, 4640, 4745, 4860, 4980, 5110],
  [39000, 4320, 4415, 4510, 4615, 4730, 4845, 4965, 5080, 5220],
  [40000, 4390, 4490, 4595, 4705, 4815, 4940, 5060, 5185, 5330],
  [41000, 4475, 4575, 4680, 4795, 4915, 5035, 5160, 5290, 5435],
  [42000, 4550, 4660, 4770, 4880, 5000, 5120, 5260, 5380, 5530],
  [43000, 4640, 4740, 4860, 4970, 5090, 5225, 5360, 5490, 5640],
  [44000, 4720, 4830, 4940, 5065, 5190, 5320, 5460, 5595, 5745],
  [45000, 4795, 4920, 5040, 5155, 5280, 5410, 5555, 5700, 5855],
  [46000, 4880, 4995, 5120, 5250, 5370, 5515, 5655, 5805, 5955],
  [47000, 4960, 5080, 5200, 5335, 5460, 5605, 5750, 5905, 6060],
  [48000, 5050, 5170, 5295, 5425, 5560, 5705, 5855, 6005, 6170],
  [49000, 5101, 5334, 5468, 5509, 5801, 6135, 6268, 6385, 6651],
  [50000, 5168, 5368, 5509, 5928, 6010, 6235, 6351, 6535, 6818],
];

// 9. EMB 140 — Required Landing Field Length, Flaps 45
//    Weights below 33,000 lb: use 33,000 row
//    Max structural LW: 41,266 lb; table includes MTOW row at 46,517 lb
const EMB140_DIST = [
  [33000, 3910, 3925, 4090, 4175, 4275, 4375, 4450, 4575, 4675],
  [34000, 3990, 4075, 4190, 4250, 4350, 4450, 4550, 4650, 4750],
  [35000, 4050, 4175, 4250, 4325, 4450, 4525, 4650, 4750, 4850],
  [36000, 4150, 4230, 4325, 4425, 4510, 4625, 4710, 4825, 4950],
  [37000, 4225, 4300, 4400, 4500, 4600, 4700, 4810, 4925, 5075],
  [38000, 4290, 4390, 4490, 4590, 4690, 4790, 4900, 5025, 5150],
  [39000, 4375, 4450, 4550, 4650, 4775, 4875, 5000, 5125, 5250],
  [40000, 4450, 4525, 4625, 4725, 4850, 4975, 5090, 5225, 5350],
  [41000, 4510, 4590, 4710, 4825, 4950, 5090, 5190, 5310, 5450],
  [42000, 4590, 4690, 4800, 4910, 5025, 5150, 5275, 5425, 5550],
  [43000, 4675, 4780, 4890, 5000, 5125, 5250, 5375, 5500, 5650],
  [44000, 4750, 4850, 4980, 5090, 5200, 5325, 5475, 5600, 5750],
  [45000, 4825, 4950, 5050, 5175, 5300, 5425, 5575, 5700, 5850],
  [46000, 4900, 5000, 5125, 5275, 5390, 5525, 5670, 5800, 5950],
  [46517, 4925, 5025, 5150, 5290, 5410, 5550, 5690, 5825, 5990],
];

// C. EMB 135 LR — Required Landing Field Length, Flaps 45
//    Table stops at 5,000 ft elevation; weights below 28,000 lb: use 28,000 row
//    Row format: [weight, distSL, dist1k, dist2k, dist3k, dist4k, dist5k]
const EMB135_DIST = [
  [28000, 3425, 3496, 3570, 3648, 3728, 3811],
  [29000, 3511, 3585, 3661, 3741, 3823, 3910],
  [30000, 3596, 3671, 3751, 3833, 3918, 4008],
  [31000, 3681, 3760, 3841, 3925, 4013, 4105],
  [32000, 3766, 3846, 3931, 4016, 4108, 4200],
  [33000, 3850, 3933, 4018, 4106, 4200, 4295],
  [34000, 3933, 4018, 4105, 4195, 4290, 4390],
  [35000, 4013, 4100, 4188, 4281, 4378, 4480],
  [36000, 4091, 4180, 4271, 4368, 4466, 4570],
  [37000, 4170, 4258, 4353, 4451, 4553, 4660],
  [38000, 4245, 4336, 4433, 4535, 4640, 4750],
  [39000, 4320, 4415, 4516, 4621, 4730, 4845],
  [40000, 4396, 4493, 4598, 4706, 4820, 4938],
  [41000, 4476, 4576, 4685, 4796, 4913, 5033],
  [42000, 4555, 4660, 4770, 4885, 5005, 5128],
  [43000, 4636, 4745, 4856, 4975, 5098, 5225],
  [44000, 4718, 4828, 4943, 5063, 5190, 5320],
];

// ─── ELEVATION BREAKPOINTS ────────────────────────────────────────────────────
const ELEV_COLS_9 = [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000]; // EMB145/140
const ELEV_COLS_5 = [0, 1000, 2000, 3000, 4000, 5000];                  // EMB135

// ─── BILINEAR INTERPOLATION HELPER ───────────────────────────────────────────
function bilinearLookup(table, elevCols, weightLbs, elevFt) {
  const minWeight = table[0][0];
  const maxWeight = table[table.length - 1][0];
  const clampedW  = Math.max(minWeight, Math.min(maxWeight, weightLbs));

  // Clamp elevation to table range
  const maxElev  = elevCols[elevCols.length - 1];
  const clampedE = Math.max(0, Math.min(maxElev, elevFt));

  // Find bounding elevation columns
  let eIdx = elevCols.length - 2;
  for (let i = 0; i < elevCols.length - 1; i++) {
    if (clampedE <= elevCols[i + 1]) { eIdx = i; break; }
  }
  const eFrac = (clampedE - elevCols[eIdx]) / (elevCols[eIdx + 1] - elevCols[eIdx]);
  const col1  = eIdx + 1; // data starts at index 1 (after weight)
  const col2  = eIdx + 2;

  // Find bounding weight rows
  let wLo = 0, wHi = table.length - 1;
  for (let i = 0; i < table.length - 1; i++) {
    if (clampedW >= table[i][0] && clampedW <= table[i + 1][0]) {
      wLo = i; wHi = i + 1; break;
    }
  }
  const wFrac = (clampedW - table[wLo][0]) / (table[wHi][0] - table[wLo][0]) || 0;

  // Interpolate at both weight rows across elevation, then interpolate weight
  const dLo = table[wLo][col1] + eFrac * (table[wLo][col2] - table[wLo][col1]);
  const dHi = table[wHi][col1] + eFrac * (table[wHi][col2] - table[wHi][col1]);
  return dLo + wFrac * (dHi - dLo);
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────
// Returns factored landing field length in feet (Part 121, dry, no reverse).
// Apply corrections manually or use calcEMBDistanceCorrected() below.
//
// acType:    "EMB145" | "EMB140" | "EMB135"
// weightLbs: actual landing weight
// elevFt:    airport elevation in feet (MSL, not pressure altitude —
//            table already accounts for altimeter correction per POH §12B.3)
export function getEMBFactoredDistance(acType, weightLbs, elevFt) {
  if (acType === "EMB145") return bilinearLookup(EMB145_DIST, ELEV_COLS_9, weightLbs, elevFt);
  if (acType === "EMB140") return bilinearLookup(EMB140_DIST, ELEV_COLS_9, weightLbs, elevFt);
  return bilinearLookup(EMB135_DIST, ELEV_COLS_5, weightLbs, elevFt);
}

// Returns corrected factored field length after applying wind and surface corrections.
//
// windKt:  positive = headwind (reduces), negative = tailwind (increases)
// surface: "dry" | "wet"  (no contaminated table in this POH section)
//
// Correction order per POH footnotes:
//   1. Apply headwind/tailwind percentage to base factored distance
//   2. Apply wet runway factor on top of wind-corrected distance
export function calcEMBDistanceCorrected({ acType, weightLbs, elevFt, windKt = 0, surface = "dry" }) {
  let dist = getEMBFactoredDistance(acType, weightLbs, elevFt);

  // Wind correction: ±% per 10 kt
  if (windKt > 0) {
    // Headwind: subtract 5% per 10 kt
    dist *= (1 - 0.005 * windKt);
  } else if (windKt < 0) {
    // Tailwind: add 15% per 10 kt
    dist *= (1 + 0.015 * Math.abs(windKt));
  }

  // Wet runway: add 20%
  if (surface.toLowerCase() === "wet") {
    dist *= 1.20;
  }

  return Math.round(dist / 10) * 10;
}

// ─── APPROACH CLIMB LIMIT WEIGHT TABLES ───────────────────────────────────────
// Source: EMB 145 POH Chapter 9, Section 12A (Chautauqua Airlines Vol 5, REV. 6, 01 MAY 2008)
// "Use only if AeroData Landing Data for the landing airport are not available
// or incomplete on the flight release." Approach Flaps 9, Landing Flaps 45.
//
// Anti-Ice OFF table is indexed by OAT +10°C..+52°C (temps above which weight
// is climb-limited at a given elevation). Anti-Ice ON table is indexed by OAT
// +10°C down to -40°C (anti-ice must be OFF above +10°C per POH note).
// Elevation columns: -1000, SL(0), 2000, 4000, 6000, 8000 ft.
// Missing/dashed cells in the source chart (above the structural ceiling at
// that elevation/temp) are represented as null.
//
// Row format: [tempC, wAtNeg1000, wAtSL, wAt2000, wAt4000, wAt6000, wAt8000]

const ELEV_COLS_CLIMB = [-1000, 0, 2000, 4000, 6000, 8000];

const EMB145_CLIMB_OFF = [
  [10, 54100, 53200, 53200, 53200, 52000, 48500],
  [15, 54100, 53200, 53200, 53200, 52000, 48500],
  [20, 54100, 53200, 53200, 53200, 52000, 49300],
  [25, 54000, 53200, 53200, 53100, 51000, 47000],
  [30, 53800, 53100, 53100, 52800, 48800, 44800],
  [35, 53800, 53100, 53100, 50600, 46600, null],
  [40, 53800, 53100, 52000, 48100, 46100, null],
  [45, 53700, 52700, 49100, null,  null,  null],
  [52, 50100, null,  null,  null,  null,  null],
];
const EMB145_CLIMB_ON = [
  [10,  53000, 52300, 52300, 51900, 47800, 43000],
  [5,   53100, 52500, 52500, 52500, 50700, 45500],
  [0,   53100, 52500, 52500, 52500, 51500, 48600],
  [-5,  53300, 52500, 52500, 52400, 51500, 49300],
  [-10, 53300, 52500, 52500, 52400, 51500, 48800],
  [-20, 53200, 52500, 52500, 52500, 51500, 48900],
  [-30, 53400, 52500, 52500, 52500, 51500, 48900],
  [-40, 53400, 52500, 52500, 52500, 51500, 49000],
];

const EMB140_CLIMB_OFF = [
  [10, 57900, 57000, 56800, 56400, 53100, 52500],
  [15, 57800, 56900, 56700, 56200, 53000, 52300],
  [20, 57700, 56800, 56500, 56200, 52300, 50100],
  [25, 57700, 56700, 56400, 56100, 52000, 47500],
  [30, 57600, 56500, 56300, 54100, 49900, 45500],
  [35, 57500, 56400, 55800, 51900, null,  null],
  [40, 57200, 56400, 53400, 49100, null,  null],
  [45, 56200, 56400, 50100, null,  null,  null],
  [52, 52000, null,  null,  null,  null,  null],
];
const EMB140_CLIMB_ON = [
  [10,  57200, 56400, 56200, 55600, 54300, 50400],
  [5,   57300, 56500, 56300, 55700, 54400, 51600],
  [0,   57400, 56500, 56400, 55800, 54600, 51900],
  [-5,  57500, 56500, 56400, 56400, 55100, 52100],
  [-10, 57600, 56500, 56500, 56400, 55200, 52200],
  [-20, 57700, 56500, 56500, 56400, 55200, 52300],
  [-30, 57700, 56600, 56600, 56500, 55200, 52300],
  [-40, 57700, 56600, 56600, 56500, 55300, 52300],
];

const EMB135_CLIMB_OFF = [
  [10, 52400, 51800, 51700, 51500, 50900, 48300],
  [15, 52400, 51800, 51700, 51500, 50900, 48300],
  [20, 52400, 51800, 51700, 51500, 50900, 48000],
  [25, 52400, 51800, 51700, 51500, 49500, 45500],
  [30, 52400, 51800, 51700, 51300, 47500, 43500],
  [35, 52400, 51800, 51700, 49000, 45000, null],
  [40, 52400, 51800, 50500, 46500, null,  null],
  [45, 52400, 51000, 47000, null,  null,  null],
  [52, 48800, null,  null,  null,  null,  null],
];
const EMB135_CLIMB_ON = [
  [10,  51800, 51000, 50800, 50600, 46500, 41600],
  [5,   51900, 51000, 50800, 50600, 49000, 44200],
  [0,   52000, 51000, 50800, 50600, 50300, 47500],
  [-5,  52000, 51000, 50800, 50600, 50300, 47500],
  [-10, 52000, 51000, 50800, 50600, 50300, 47500],
  [-20, 52100, 51000, 50800, 50600, 50300, 47500],
  [-30, 52100, 51000, 50800, 50600, 50300, 47500],
  [-40, 52100, 51000, 50800, 50600, 50300, 47500],
];

// Structural max landing weight + ice accretion penalty (lbs), per variant.
export const EMB_LIMITS = {
  EMB145: { structural: 42549, icePenalty: 8050 },
  EMB140: { structural: 41266, icePenalty: 3440 }, // anti-ice-on table note; off-table note says 3465
  EMB135: { structural: 40785, icePenalty: 8267 },
};

// Bilinear interpolation across temp rows / elevation columns. Returns null
// if either bounding cell is null (off the chart — i.e. above the structural
// ceiling at that elevation/temp combination).
function climbBilinear(table, tempC, elevFt) {
  const temps = table.map(r => r[0]);
  const minT  = Math.min(...temps);
  const maxT  = Math.max(...temps);
  const cT    = Math.max(minT, Math.min(maxT, tempC));

  // Table rows are listed warm→cold or cold→warm depending on variant; sort indices by temp.
  const order = table.map((_, i) => i).sort((a, b) => table[a][0] - table[b][0]);

  let tLo = order[0], tHi = order[order.length - 1];
  for (let i = 0; i < order.length - 1; i++) {
    const a = order[i], b = order[i + 1];
    if (cT >= table[a][0] && cT <= table[b][0]) { tLo = a; tHi = b; break; }
  }
  const tFrac = table[tHi][0] === table[tLo][0] ? 0
    : (cT - table[tLo][0]) / (table[tHi][0] - table[tLo][0]);

  const maxElev  = ELEV_COLS_CLIMB[ELEV_COLS_CLIMB.length - 1];
  const minElev  = ELEV_COLS_CLIMB[0];
  const cE       = Math.max(minElev, Math.min(maxElev, elevFt));
  let eIdx = ELEV_COLS_CLIMB.length - 2;
  for (let i = 0; i < ELEV_COLS_CLIMB.length - 1; i++) {
    if (cE <= ELEV_COLS_CLIMB[i + 1]) { eIdx = i; break; }
  }
  const eFrac = (cE - ELEV_COLS_CLIMB[eIdx]) / (ELEV_COLS_CLIMB[eIdx + 1] - ELEV_COLS_CLIMB[eIdx]);
  const col1 = eIdx + 1, col2 = eIdx + 2; // +1 to skip temp column

  const cell = (rowIdx, col) => table[rowIdx][col];
  const c00 = cell(tLo, col1), c01 = cell(tLo, col2);
  const c10 = cell(tHi, col1), c11 = cell(tHi, col2);
  if (c00 == null || c01 == null || c10 == null || c11 == null) return null;

  const rowLo = c00 + eFrac * (c01 - c00);
  const rowHi = c10 + eFrac * (c11 - c10);
  return rowLo + tFrac * (rowHi - rowLo);
}

// Returns the Approach Climb Limit Weight (lbs) for a variant, with optional
// ice-accretion penalty applied per POH §12.A criteria (icing encountered +
// SPS/ICE SPEEDS advisory + OAT ≤ +10°C — caller decides when those apply).
//
// acType:     "EMB145" | "EMB140" | "EMB135"
// antiIce:    boolean — selects the Anti-Ice ON/OFF chart
// pressureAlt: ft
// oatC:       °C
// iceAccretion: boolean — subtract the published ice penalty if true
export function getEMBClimbLimitWeight({ acType, antiIce, pressureAlt, oatC, iceAccretion = false }) {
  const tables = {
    EMB145: { off: EMB145_CLIMB_OFF, on: EMB145_CLIMB_ON },
    EMB140: { off: EMB140_CLIMB_OFF, on: EMB140_CLIMB_ON },
    EMB135: { off: EMB135_CLIMB_OFF, on: EMB135_CLIMB_ON },
  };
  const set   = tables[acType] ?? tables.EMB145;
  const table = antiIce ? set.on : set.off;

  let weight = climbBilinear(table, oatC, pressureAlt);
  if (weight == null) return null;

  if (iceAccretion) {
    weight -= EMB_LIMITS[acType].icePenalty;
  }
  // Climb limit weight can't exceed structural MLW.
  weight = Math.min(weight, EMB_LIMITS[acType].structural);

  return Math.round(weight);
}

// ─── NOTES ───────────────────────────────────────────────────────────────────
// 1. These are DISPATCH (planning) distances. The actual stopping distance must
//    not exceed 60% of the required landing field length (POH §12B.6).
// 2. No ISA/temperature or slope correction columns exist in this table.
//    The POH provides no correction for those variables in this dispatch chart.
// 3. Reverse thrust is explicitly excluded from the basis (POH note).
//    No reverser-inop delta is needed — it's already the worst case.
// 4. The EMB 140 table includes a 46,517 lb MTOW row; structural MLW is 41,266 lb.
//    The EMB 145 structural MLW is 42,549 lb (from Approach Climb chart note).
//    The EMB 135 structural MLW is 40,785 lb.
// 5. No Ice-Accretion correction exists for the dispatch distance chart itself —
//    ice accretion only affects the separate Approach Climb Limit Weight chart
//    (see climb-limit table below), per POH §12.A.
