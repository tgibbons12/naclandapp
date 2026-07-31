// ─────────────────────────────────────────────────────────────────────────────
// A32F Special Inflight Landing — generic table engine + station data
//
// Source: A32F AOM "Inflight Landing Data", sections
//   12p.5.3  A319 Special Inflight Landing  (6 station groups)
//   12p.5.5  A320 Special Inflight Landing  (2 station groups)
//   12p.5.8  A321 Special Inflight Landing  (4 station groups)
//
// These tables are a different animal from the normal inflight landing data.
// They publish a REQUIRED RUNWAY LANDING LENGTH (touchdown point, reverse-thrust
// and 15% margin assumptions already baked in) rather than a bare landing
// distance, and the AOM directs them be used "in lieu of" the normal data —
// so a station selection replaces the normal result entirely.
//
// SNA 02L/20R live in calc-short-runway.js and are dispatched to from here.
// ─────────────────────────────────────────────────────────────────────────────

import { calcSNA, hasSpecialData as hasSNAData } from "./calc-short-runway.js";

// ── interpolation helpers ────────────────────────────────────────────────────
// Both clamp at the table edges. The AOM tables are not to be extrapolated, and
// clamping to the nearest published row/column is the conservative reading in
// the weight axis (heavier is always longer) — callers should still keep the
// weight picker inside the certificated range.

function interp1(xs, ys, x) {
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  for (let i = 0; i < xs.length - 1; i++) {
    if (x <= xs[i + 1]) {
      const t = (x - xs[i]) / (xs[i + 1] - xs[i]);
      return ys[i] + t * (ys[i + 1] - ys[i]);
    }
  }
  return ys[ys.length - 1];
}

function interp2(rowKeys, colKeys, grid, r, c) {
  // Interpolate along the column axis within each bracketing row, then between
  // the two rows.
  const rowAt = (idx) => interp1(colKeys, grid[idx], c);
  if (r <= rowKeys[0]) return rowAt(0);
  if (r >= rowKeys[rowKeys.length - 1]) return rowAt(rowKeys.length - 1);
  for (let i = 0; i < rowKeys.length - 1; i++) {
    if (r <= rowKeys[i + 1]) {
      const t = (r - rowKeys[i]) / (rowKeys[i + 1] - rowKeys[i]);
      return rowAt(i) + t * (rowAt(i + 1) - rowAt(i));
    }
  }
  return rowAt(rowKeys.length - 1);
}

// ── shared axes ──────────────────────────────────────────────────────────────
const OAT_FULL  = [-8, -4, 0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40];
const OAT_GOOD  = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40];
const OAT_JAC   = [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10];
const OAT_PEI   = [12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32];
const OAT_SBP   = [-10, 0, 10, 20, 30, 32, 34, 36, 38, 40, 42, 44];
const TW_PEI    = [0, 3, 5, 7, 9, 11, 13, 15];
const TW_EYW    = [0, 3, 5, 7];

const W_A319      = [118, 120, 122, 124, 126, 128, 130, 132, 134, 136, 137, 137.7];
const W_A319_BOS  = [114, 116, 118, 120, 122, 124, 126, 128, 130, 132, 134, 136, 138];
const W_A320_BOS  = [118, 120, 122, 124, 126, 128, 130, 132, 134, 136, 138, 140, 142];
const W_A320_DCA  = [118, 120, 122, 124, 126, 128, 130, 132, 134, 136, 138, 140, 142, 142.1];
const W_A321_BOS  = [126, 130, 134, 138, 142, 146, 150, 154, 158, 162, 166, 170, 172];
const W_A321_DCA  = [120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 171.5];
const W_LEAP_BOS  = [130, 134, 138, 142, 146, 150, 154, 158, 162, 166, 170, 174, 174.6];
const W_LEAP_DCA  = [120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 174.6];

// A row that is flat below +12°C, as the MEDIUM(3) BOS/LGA/DCA tables are.
const flat6 = (v, rest) => [v, v, v, v, v, v, ...rest];

// ─────────────────────────────────────────────────────────────────────────────
// BOS 27 / LGA / DCA 01-19  —  MED autobrake, basis MEDIUM (RCC 3)
// Touchdown in first 1200 ft. Used when braking action is expected worse than
// Good (RCC 5); RCC 2 or less is "too short for landing".
// LDA is left null: the group covers three airports with different LDAs, so the
// AOM publishes no shading and the crew compares against the field in use.
// ─────────────────────────────────────────────────────────────────────────────

const BOS_A319 = {
  weights: W_A319_BOS,
  byRcc: { 3: { kind: "oat", cols: OAT_FULL, grid: [
    flat6(5164, [5190, 5296, 5402, 5507, 5613, 5719, 5825]),
    flat6(5210, [5236, 5342, 5448, 5553, 5659, 5765, 5871]),
    flat6(5256, [5282, 5388, 5494, 5599, 5705, 5811, 5917]),
    flat6(5302, [5328, 5434, 5540, 5645, 5751, 5857, 5963]),
    flat6(5348, [5374, 5480, 5586, 5691, 5797, 5903, 6009]),
    flat6(5394, [5420, 5526, 5632, 5737, 5843, 5949, 6055]),
    flat6(5440, [5466, 5572, 5678, 5783, 5889, 5995, 6101]),
    flat6(5486, [5512, 5618, 5724, 5829, 5935, 6041, 6147]),
    flat6(5532, [5558, 5664, 5770, 5875, 5981, 6087, 6193]),
    flat6(5578, [5604, 5710, 5816, 5921, 6027, 6133, 6239]),
    flat6(5624, [5650, 5756, 5862, 5967, 6073, 6179, 6285]),
    flat6(5670, [5696, 5802, 5908, 6013, 6119, 6225, 6331]),
    flat6(5716, [5742, 5848, 5954, 6059, 6165, 6271, 6377]),
  ] } },
  corr: { 3: { tailwindPerKt: 168, apprPer5kt: 460 } },
};

const BOS_A320 = {
  weights: W_A320_BOS,
  byRcc: { 3: { kind: "oat", cols: OAT_FULL, grid: [
    flat6(5244, [5269, 5371, 5472, 5573, 5674, 5775, 5877]),
    flat6(5313, [5338, 5440, 5541, 5642, 5743, 5844, 5946]),
    flat6(5382, [5407, 5509, 5610, 5711, 5812, 5913, 6015]),
    flat6(5451, [5476, 5578, 5679, 5780, 5881, 5982, 6084]),
    flat6(5520, [5545, 5647, 5748, 5849, 5950, 6051, 6153]),
    flat6(5589, [5614, 5716, 5817, 5918, 6019, 6120, 6222]),
    flat6(5658, [5683, 5785, 5886, 5987, 6088, 6189, 6291]),
    flat6(5727, [5752, 5854, 5955, 6056, 6157, 6258, 6360]),
    flat6(5796, [5821, 5923, 6024, 6125, 6226, 6327, 6429]),
    flat6(5865, [5890, 5992, 6093, 6194, 6295, 6396, 6498]),
    flat6(5934, [5959, 6061, 6162, 6263, 6364, 6465, 6567]),
    flat6(6003, [6028, 6130, 6231, 6332, 6433, 6534, 6636]),
    flat6(6072, [6097, 6199, 6300, 6401, 6502, 6603, 6705]),
  ] } },
  corr: { 3: { tailwindPerKt: 146, apprPer5kt: 740 } },
};

const BOS_A321 = {
  weights: W_A321_BOS,
  byRcc: { 3: { kind: "oat", cols: OAT_FULL, grid: [
    flat6(6314, [6344, 6466, 6588, 6710, 6832, 6953, 7075]),
    flat6(6360, [6390, 6512, 6634, 6756, 6878, 6999, 7121]),
    flat6(6406, [6436, 6558, 6680, 6802, 6924, 7045, 7167]),
    flat6(6452, [6482, 6604, 6726, 6848, 6970, 7091, 7213]),
    flat6(6498, [6528, 6650, 6772, 6894, 7016, 7137, 7259]),
    flat6(6544, [6574, 6696, 6818, 6940, 7062, 7183, 7305]),
    flat6(6590, [6620, 6742, 6864, 6986, 7108, 7229, 7351]),
    flat6(6636, [6666, 6788, 6910, 7032, 7154, 7275, 7397]),
    flat6(6682, [6712, 6834, 6956, 7078, 7200, 7321, 7443]),
    flat6(6728, [6758, 6880, 7002, 7124, 7246, 7367, 7489]),
    flat6(6774, [6804, 6926, 7048, 7170, 7292, 7413, 7535]),
    flat6(6820, [6850, 6972, 7094, 7216, 7338, 7459, 7581]),
    flat6(6843, [6873, 6995, 7117, 7239, 7361, 7482, 7604]),
  ] } },
  corr: { 3: { tailwindPerKt: 170, apprPer5kt: 860 } },
};

// The LEAP table is gridded at every temperature column — unlike the ceo tables
// it is not flat below +12°C.
const BOS_LEAP = {
  weights: W_LEAP_BOS,
  byRcc: { 3: { kind: "oat", cols: OAT_FULL, grid: [
    [4992, 5050, 5108, 5167, 5225, 5282, 5340, 5397, 5454, 5511, 5568, 5626, 5682],
    [5110, 5170, 5230, 5289, 5348, 5407, 5466, 5525, 5584, 5643, 5701, 5760, 5818],
    [5227, 5288, 5349, 5410, 5471, 5532, 5592, 5652, 5713, 5773, 5833, 5893, 5953],
    [5345, 5408, 5471, 5533, 5595, 5657, 5720, 5782, 5843, 5905, 5967, 6028, 6090],
    [5462, 5526, 5591, 5655, 5719, 5782, 5846, 5909, 5973, 6036, 6099, 6162, 6225],
    [5579, 5645, 5711, 5776, 5841, 5907, 5973, 6037, 6102, 6167, 6232, 6297, 6361],
    [5697, 5765, 5832, 5899, 5966, 6033, 6100, 6166, 6233, 6299, 6366, 6431, 6497],
    [5810, 5879, 5948, 6016, 6085, 6153, 6222, 6290, 6358, 6425, 6493, 6561, 6628],
    [5917, 5987, 6057, 6127, 6197, 6267, 6337, 6406, 6475, 6545, 6614, 6683, 6752],
    [6024, 6096, 6168, 6239, 6310, 6381, 6452, 6523, 6594, 6665, 6736, 6806, 6877],
    [6130, 6203, 6276, 6348, 6421, 6494, 6567, 6639, 6711, 6784, 6856, 6927, 6999],
    [6236, 6311, 6385, 6460, 6534, 6608, 6682, 6756, 6830, 6903, 6976, 7049, 7122],
    [6252, 6327, 6402, 6477, 6551, 6625, 6699, 6774, 6848, 6921, 6994, 7068, 7141],
  ] } },
  corr: { 3: { tailwindPerKt: 125, apprPer5kt: 350 } },
};

// ─────────────────────────────────────────────────────────────────────────────
// DCA Runway 15/33  —  Max Manual braking, basis DRY (6) / GOOD (5)
// Touchdown in first 1000 ft. RCC 4 or less is "too short for landing".
// LDA 5204 ft, confirmed from the A321 IAE/CFM chart's shading boundary
// (5139 ft unshaded, 5208 ft shaded) and DCA 15/33's published length.
// ─────────────────────────────────────────────────────────────────────────────

const DCA_A319 = {
  weights: W_A319,
  byRcc: {
    6: { kind: "flat", vals: [3196, 3223, 3250, 3277, 3304, 3331, 3358, 3386, 3413, 3440, 3454, 3463] },
    5: { kind: "oat", cols: OAT_GOOD, grid: [
      [3649, 3690, 3730, 3771, 3813, 3854, 3895, 3937, 3978, 4020, 4062],
      [3692, 3733, 3775, 3817, 3859, 3901, 3943, 3985, 4028, 4070, 4113],
      [3735, 3778, 3820, 3862, 3905, 3948, 3991, 4034, 4078, 4121, 4165],
      [3778, 3821, 3864, 3908, 3951, 3995, 4039, 4083, 4127, 4171, 4215],
      [3821, 3865, 3910, 3954, 3998, 4043, 4087, 4132, 4177, 4222, 4267],
      [3865, 3910, 3955, 4000, 4045, 4091, 4136, 4182, 4228, 4273, 4319],
      [3910, 3956, 4001, 4047, 4093, 4139, 4186, 4232, 4278, 4325, 4372],
      [3955, 4001, 4048, 4095, 4141, 4188, 4235, 4283, 4330, 4377, 4425],
      [3999, 4046, 4094, 4141, 4189, 4237, 4284, 4332, 4381, 4429, 4477],
      [4043, 4091, 4140, 4188, 4236, 4285, 4334, 4383, 4432, 4481, 4530],
      [4066, 4114, 4163, 4211, 4260, 4309, 4358, 4408, 4457, 4507, 4556],
      [4081, 4130, 4179, 4228, 4277, 4326, 4376, 4425, 4475, 4525, 4575],
    ] },
  },
  corr: {
    6: { tailwindPerKt: 50, apprPer5kt: 150 },
    5: { tailwindPerKt: 90, apprPer5kt: 240 },
  },
};

const DCA_A320 = {
  weights: W_A320_DCA,
  byRcc: {
    6: { kind: "flat", vals: [3223, 3253, 3282, 3310, 3339, 3368, 3398, 3428, 3458, 3488, 3518, 3549, 3594, 3596] },
    5: { kind: "oat", cols: OAT_GOOD, grid: [
      [3666, 3707, 3748, 3789, 3831, 3872, 3914, 3956, 3998, 4040, 4082],
      [3712, 3754, 3796, 3838, 3881, 3923, 3966, 4009, 4051, 4094, 4138],
      [3759, 3801, 3844, 3887, 3931, 3974, 4018, 4061, 4105, 4149, 4193],
      [3805, 3848, 3892, 3936, 3980, 4024, 4069, 4113, 4158, 4202, 4247],
      [3851, 3896, 3940, 3985, 4030, 4075, 4120, 4166, 4211, 4257, 4303],
      [3898, 3943, 3989, 4035, 4080, 4126, 4172, 4219, 4265, 4312, 4359],
      [3945, 3992, 4038, 4085, 4131, 4178, 4225, 4273, 4320, 4368, 4415],
      [3993, 4041, 4088, 4135, 4183, 4231, 4279, 4327, 4375, 4424, 4472],
      [4041, 4089, 4137, 4185, 4234, 4283, 4331, 4380, 4430, 4479, 4529],
      [4088, 4137, 4186, 4235, 4285, 4334, 4384, 4434, 4485, 4535, 4585],
      [4136, 4186, 4236, 4286, 4336, 4387, 4438, 4489, 4540, 4591, 4643],
      [4184, 4235, 4286, 4337, 4388, 4440, 4492, 4544, 4596, 4648, 4701],
      [4233, 4285, 4337, 4389, 4441, 4494, 4546, 4599, 4652, 4706, 4759],
      [4236, 4287, 4339, 4391, 4444, 4496, 4549, 4602, 4655, 4708, 4762],
    ] },
  },
  corr: {
    6: { tailwindPerKt: 60, apprPer5kt: 170 },
    5: { tailwindPerKt: 90, apprPer5kt: 240 },
  },
};

const DCA_A321 = {
  weights: W_A321_DCA,
  byRcc: {
    6: { kind: "flat", vals: [3295, 3367, 3438, 3510, 3581, 3653, 3724, 3796, 3867, 3941, 4020, 4049] },
    5: { kind: "oat", cols: OAT_GOOD, grid: [
      [3552, 3591, 3629, 3668, 3707, 3746, 3785, 3824, 3866, 3911, 3955],
      [3657, 3698, 3739, 3779, 3820, 3861, 3902, 3943, 3987, 4034, 4081],
      [3765, 3807, 3850, 3893, 3935, 3978, 4021, 4065, 4111, 4161, 4209],
      [3873, 3918, 3962, 4007, 4052, 4097, 4142, 4187, 4236, 4288, 4339],
      [3983, 4029, 4076, 4123, 4170, 4217, 4264, 4311, 4362, 4416, 4470],
      [4094, 4143, 4191, 4240, 4289, 4338, 4388, 4437, 4490, 4547, 4603],
      [4206, 4256, 4307, 4358, 4409, 4460, 4512, 4563, 4619, 4678, 4736],
      [4319, 4372, 4425, 4478, 4531, 4585, 4638, 4692, 4750, 4812, 4873],
      [4430, 4485, 4540, 4596, 4651, 4707, 4762, 4818, 4879, 4943, 5006],
      [4543, 4600, 4657, 4714, 4772, 4830, 4888, 4946, 5009, 5076, 5142],
      [4655, 4714, 4773, 4833, 4893, 4953, 5013, 5074, 5139, 5208, 5276],
      [4689, 4749, 4809, 4869, 4930, 4990, 5051, 5112, 5178, 5248, 5317],
    ] },
  },
  corr: {
    6: { tailwindPerKt: 60, apprPer5kt: 180 },
    5: { tailwindPerKt: 100, apprPer5kt: 260 },
  },
};

const DCA_LEAP = {
  weights: W_LEAP_DCA,
  byRcc: {
    6: { kind: "flat", vals: [3092, 3096, 3131, 3193, 3255, 3318, 3381, 3448, 3515, 3584, 3652, 3715] },
    5: { kind: "oat", cols: OAT_GOOD, grid: [
      [3383, 3417, 3452, 3487, 3522, 3557, 3592, 3627, 3662, 3697, 3733],
      [3398, 3433, 3468, 3503, 3539, 3574, 3609, 3645, 3680, 3716, 3753],
      [3456, 3492, 3529, 3565, 3601, 3638, 3674, 3711, 3748, 3785, 3822],
      [3546, 3585, 3622, 3660, 3698, 3737, 3775, 3814, 3852, 3891, 3930],
      [3639, 3678, 3718, 3758, 3798, 3838, 3878, 3918, 3959, 3999, 4039],
      [3733, 3774, 3816, 3857, 3899, 3941, 3982, 4024, 4066, 4109, 4151],
      [3828, 3871, 3914, 3957, 4000, 4044, 4087, 4131, 4175, 4218, 4262],
      [3924, 3969, 4014, 4059, 4104, 4149, 4194, 4240, 4286, 4332, 4378],
      [4021, 4067, 4114, 4161, 4208, 4255, 4303, 4350, 4398, 4446, 4494],
      [4120, 4169, 4218, 4266, 4315, 4364, 4414, 4463, 4513, 4563, 4612],
      [4220, 4270, 4321, 4372, 4422, 4473, 4525, 4576, 4628, 4679, 4731],
      [4313, 4366, 4418, 4470, 4523, 4576, 4629, 4682, 4735, 4789, 4843],
    ] },
  },
  corr: {
    6: { tailwindPerKt: 70, apprPer5kt: 170 },
    5: { tailwindPerKt: 90, apprPer5kt: 300 },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// JAC Runway 01/19 (A319 only) — touchdown in first 1000 ft, LDA 6300 ft.
// RCC 6/5 use MED autobrake (max manual permitted); RCC 3 is max manual only.
// Distinctive: this is the one station that publishes a HEADWIND credit, forbids
// tailwind on the MEDIUM table outright, and forbids no-reverse operation.
// ─────────────────────────────────────────────────────────────────────────────

const JAC_A319 = {
  weights: W_A319,
  byRcc: {
    6: { kind: "flat", vals: [5186, 5244, 5302, 5358, 5415, 5472, 5530, 5589, 5644, 5700, 5728, 5748] },
    5: { kind: "flat", vals: [5358, 5430, 5503, 5575, 5647, 5722, 5797, 5874, 5949, 6025, 6063, 6090] },
    3: { kind: "oat", cols: OAT_JAC, grid: [
      [5882, 5916, 5950, 5984, 6018, 6052, 6086, 6120, 6154, 6187, 6221],
      [5949, 5984, 6018, 6052, 6087, 6121, 6155, 6190, 6224, 6259, 6293],
      [6016, 6051, 6086, 6121, 6156, 6191, 6226, 6260, 6295, 6330, 6365],
      [6082, 6118, 6153, 6189, 6224, 6259, 6295, 6330, 6365, 6401, 6436],
      [6149, 6185, 6221, 6257, 6292, 6328, 6364, 6400, 6436, 6471, 6507],
      [6216, 6252, 6289, 6325, 6361, 6397, 6434, 6470, 6506, 6543, 6579],
      [6283, 6319, 6356, 6393, 6430, 6467, 6504, 6541, 6578, 6615, 6651],
      [6351, 6388, 6425, 6463, 6500, 6538, 6575, 6612, 6650, 6687, 6725],
      [6417, 6455, 6493, 6531, 6569, 6607, 6644, 6682, 6720, 6758, 6796],
      [6484, 6522, 6560, 6599, 6637, 6675, 6714, 6752, 6791, 6829, 6867],
      [6517, 6555, 6594, 6633, 6671, 6710, 6749, 6787, 6826, 6864, 6903],
      [6540, 6579, 6618, 6657, 6695, 6734, 6773, 6812, 6850, 6889, 6928],
    ] },
  },
  corr: {
    // headwindPerKt is a credit (negative ft per knot of headwind).
    6: { headwindPerKt: -20, tailwindPerKt: 100, apprPer5kt: 325 },
    5: { headwindPerKt: -25, tailwindPerKt: 100, apprPer5kt: 325 },
    // The chart splits the headwind credit across the temperature band, -32 over
    // the colder columns and -33 over the warmer ones. -32 is the conservative
    // (smaller) credit, so it is applied throughout.
    3: { headwindPerKt: -32, tailwindPerKt: null, apprPer5kt: 325 },
  },
  noReverseAuthorized: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// PEI (SKPE) Runway 08/26 (A319 only) — touchdown in first 1000 ft.
// Split into two station entries because the runway-end adder differs and is
// large (up to +649 ft); folding both ends into one entry would either be unsafe
// for 26 or needlessly penalise 08.
// RCC 6/5 tables are gridded against TAILWIND directly, so no separate tailwind
// correction applies to them.
// ─────────────────────────────────────────────────────────────────────────────

const PEI_BASE = {
  weights: W_A319,
  byRcc: {
    6: { kind: "tailwind", cols: TW_PEI, grid: [
      [4561, 4825, 5001, 5177, 5353, 5529, 5705, 5881],
      [4612, 4876, 5052, 5228, 5404, 5580, 5756, 5932],
      [4663, 4927, 5103, 5279, 5455, 5631, 5807, 5983],
      [4713, 4977, 5153, 5329, 5505, 5681, 5857, 6033],
      [4763, 5027, 5203, 5379, 5555, 5731, 5907, 6083],
      [4813, 5077, 5253, 5429, 5605, 5781, 5957, 6133],
      [4864, 5128, 5304, 5480, 5656, 5832, 6008, 6184],
      [4915, 5179, 5355, 5531, 5707, 5883, 6059, 6235],
      [4965, 5229, 5405, 5581, 5757, 5933, 6109, 6285],
      [5014, 5278, 5454, 5630, 5806, 5982, 6158, 6334],
      [5039, 5303, 5479, 5655, 5831, 6007, 6183, 6359],
      [5057, 5321, 5497, 5673, 5849, 6025, 6201, 6377],
    ] },
    5: { kind: "tailwind", cols: TW_PEI, grid: [
      [4604, 4967, 5209, 5451, 5693, 5935, 6177, 6419],
      [4658, 5021, 5263, 5505, 5747, 5989, 6231, 6473],
      [4711, 5074, 5316, 5558, 5800, 6042, 6284, 6526],
      [4764, 5127, 5369, 5611, 5853, 6095, 6337, 6579],
      [4817, 5180, 5422, 5664, 5906, 6148, 6390, 6632],
      [4871, 5234, 5476, 5718, 5960, 6202, 6444, 6686],
      [4925, 5288, 5530, 5772, 6014, 6256, 6498, 6740],
      [4981, 5344, 5586, 5828, 6070, 6312, 6554, 6796],
      [5035, 5398, 5640, 5882, 6124, 6366, 6608, 6850],
      [5090, 5453, 5695, 5937, 6179, 6421, 6663, 6905],
      [5118, 5481, 5723, 5965, 6207, 6449, 6691, 6933],
      [5137, 5500, 5742, 5984, 6226, 6468, 6710, 6952],
    ] },
    3: { kind: "oat", cols: OAT_PEI, grid: [
      [5269, 5296, 5324, 5351, 5378, 5405, 5432, 5460, 5488, 5516, 5545],
      [5329, 5357, 5384, 5412, 5440, 5467, 5495, 5523, 5551, 5580, 5609],
      [5389, 5417, 5446, 5474, 5502, 5530, 5558, 5586, 5615, 5644, 5673],
      [5449, 5477, 5506, 5534, 5563, 5591, 5620, 5648, 5677, 5707, 5737],
      [5509, 5538, 5566, 5595, 5624, 5653, 5682, 5711, 5741, 5771, 5801],
      [5569, 5598, 5627, 5657, 5686, 5715, 5744, 5774, 5804, 5835, 5865],
      [5629, 5659, 5689, 5718, 5748, 5778, 5807, 5837, 5868, 5899, 5930],
      [5690, 5720, 5750, 5780, 5810, 5841, 5871, 5901, 5932, 5963, 5995],
      [5750, 5780, 5811, 5841, 5872, 5902, 5933, 5963, 5995, 6027, 6059],
      [5809, 5840, 5871, 5902, 5933, 5964, 5995, 6026, 6058, 6090, 6122],
      [5839, 5870, 5901, 5933, 5964, 5995, 6026, 6057, 6089, 6122, 6154],
      [5860, 5891, 5923, 5954, 5985, 6016, 6048, 6079, 6111, 6144, 6177],
    ] },
  },
  corr: {
    6: { apprPer5kt: 350 },
    5: { apprPer5kt: 350 },
    3: { tailwindPerKt: 139, apprPer5kt: 350 },
  },
};

const PEI_08 = PEI_BASE;
const PEI_26 = { ...PEI_BASE, rwyAdd: { 6: 74, 5: 265, 3: 649 } };

// ─────────────────────────────────────────────────────────────────────────────
// EYW Runway 09/27 (A319 only) — touchdown in first 1000 ft, LDA 4801 ft.
// (LDA read off the shading boundary: 4788 ft unshaded, 4811 ft shaded.)
// Both brake modes are published, each gridded against tailwind.
// Not authorised overweight or below RCC 5.
// ─────────────────────────────────────────────────────────────────────────────

const EYW_MED = {
  weights: W_A319,
  byRcc: {
    6: { kind: "tailwind", cols: TW_EYW, grid: [
      [4198, 4390, 4518, 4646],
      [4243, 4435, 4563, 4691],
      [4288, 4480, 4608, 4736],
      [4331, 4523, 4651, 4779],
      // VERIFY: the +5 kt cell in this row renders as 4595 in the PDF, which
      // breaks the otherwise exact +192/+320/+448 spacing every other row holds.
      // Read as 4695; revisit against a clean copy of the chart.
      [4375, 4567, 4695, 4823],
      [4419, 4611, 4739, 4867],
      [4464, 4656, 4784, 4912],
      [4509, 4701, 4829, 4957],
      [4553, 4745, 4873, 5001],
      [4597, 4789, 4917, 5045],
      [4618, 4810, 4938, 5066],
      [4634, 4826, 4954, 5082],
    ] },
    5: { kind: "tailwind", cols: TW_EYW, grid: [
      [4237, 4483, 4647, 4811],
      [4284, 4530, 4694, 4858],
      [4332, 4578, 4742, 4906],
      [4378, 4624, 4788, 4952],
      [4426, 4672, 4836, 5000],
      [4473, 4719, 4883, 5047],
      [4521, 4767, 4931, 5095],
      [4570, 4816, 4980, 5144],
      [4617, 4863, 5027, 5191],
      [4665, 4911, 5075, 5239],
      [4689, 4935, 5099, 5263],
      [4706, 4952, 5116, 5280],
    ] },
  },
  corr: { 6: { apprPer5kt: 250 }, 5: { apprPer5kt: 250 } },
};

const EYW_MAN = {
  weights: W_A319,
  byRcc: {
    6: { kind: "tailwind", cols: TW_EYW, grid: [
      [3183, 3315, 3403, 3491],
      [3210, 3342, 3430, 3518],
      [3237, 3369, 3457, 3545],
      [3264, 3396, 3484, 3572],
      [3290, 3422, 3510, 3598],
      [3317, 3449, 3537, 3625],
      [3345, 3477, 3565, 3653],
      [3372, 3504, 3592, 3680],
      [3399, 3531, 3619, 3707],
      [3426, 3558, 3646, 3734],
      [3439, 3571, 3659, 3747],
      [3449, 3581, 3669, 3757],
    ] },
    5: { kind: "tailwind", cols: TW_EYW, grid: [
      [4036, 4297, 4471, 4645],
      [4087, 4348, 4522, 4696],
      [4138, 4399, 4573, 4747],
      [4188, 4449, 4623, 4797],
      [4239, 4500, 4674, 4848],
      [4291, 4552, 4726, 4900],
      [4343, 4604, 4778, 4952],
      [4396, 4657, 4831, 5005],
      [4447, 4708, 4882, 5056],
      [4499, 4760, 4934, 5108],
      [4525, 4786, 4960, 5134],
      [4544, 4805, 4979, 5153],
    ] },
  },
  corr: { 6: { apprPer5kt: 250 }, 5: { apprPer5kt: 250 } },
};

// ─────────────────────────────────────────────────────────────────────────────
// SBP Runway 11/29 (A319 only) — touchdown in first 1250 ft, LDA 5300 ft.
// (LDA read off the shading boundary: 5289 ft unshaded, 5305 ft shaded.)
// RCC 6 permits either brake mode; RCC 5 is max manual only.
// ─────────────────────────────────────────────────────────────────────────────

const SBP_MED = {
  weights: W_A319,
  byRcc: {
    6: { kind: "flat", vals: [4837, 4885, 4933, 4980, 5028, 5075, 5123, 5172, 5218, 5265, 5289, 5305] },
  },
  corr: { 6: { tailwindPerKt: 65, apprPer5kt: 260 } },
};

const SBP_MAN = {
  weights: W_A319,
  byRcc: {
    6: { kind: "flat", vals: [3729, 3758, 3788, 3816, 3845, 3874, 3903, 3933, 3962, 3991, 4006, 4016] },
    5: { kind: "oat", cols: OAT_SBP, grid: [
      [4138, 4253, 4369, 4486, 4603, 4627, 4650, 4674, 4698, 4721, 4745, 4771],
      [4183, 4300, 4419, 4537, 4657, 4681, 4705, 4729, 4754, 4778, 4802, 4828],
      [4229, 4348, 4469, 4590, 4712, 4736, 4761, 4785, 4810, 4835, 4859, 4886],
      [4274, 4396, 4518, 4642, 4766, 4791, 4816, 4841, 4866, 4891, 4916, 4943],
      [4320, 4444, 4569, 4694, 4821, 4846, 4871, 4897, 4923, 4948, 4974, 5001],
      [4366, 4492, 4619, 4747, 4876, 4902, 4928, 4954, 4980, 5006, 5032, 5060],
      [4413, 4541, 4670, 4801, 4932, 4958, 4985, 5011, 5038, 5064, 5091, 5119],
      [4460, 4591, 4722, 4855, 4988, 5015, 5042, 5069, 5096, 5123, 5150, 5179],
      [4506, 4639, 4773, 4908, 5044, 5071, 5099, 5126, 5153, 5181, 5209, 5238],
      [4553, 4688, 4824, 4961, 5100, 5128, 5155, 5183, 5211, 5239, 5267, 5297],
      [4576, 4712, 4850, 4988, 5128, 5156, 5184, 5212, 5240, 5269, 5297, 5327],
      [4593, 4730, 4868, 5007, 5148, 5176, 5204, 5232, 5261, 5289, 5318, 5348],
    ] },
  },
  corr: {
    6: { tailwindPerKt: 45, apprPer5kt: 160 },
    5: { tailwindPerKt: 90, apprPer5kt: 260 },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Station registry
//
// rccMap maps the crew's selected RwyCC onto the table the AOM directs be used.
// Anything below minRcc is "runway too short for landing"; anything the map
// doesn't cover above the station's range means the normal inflight data applies
// and no special result is produced.
// ─────────────────────────────────────────────────────────────────────────────

const STATIONS = {
  "bos-lga-dca": {
    label: "BOS 27 / LGA / DCA 01-19",
    touchdownFt: 1200, ldaFt: null, minRcc: 3,
    rccMap: { 4: 3, 3: 3 },
    // The AOM basis is MED autobrake with max manual permitted, so both brake
    // selections read the same table.
    byType: {
      a319: { MED: BOS_A319, MAX_MAN: BOS_A319 },
      a320: { MED: BOS_A320, MAX_MAN: BOS_A320 },
      a321: { MED: BOS_A321, MAX_MAN: BOS_A321 },
      "a321-leap": { MED: BOS_LEAP, MAX_MAN: BOS_LEAP },
    },
  },
  "dca-15-33": {
    label: "DCA 15/33",
    touchdownFt: 1000, ldaFt: 5204, minRcc: 5,
    rccMap: { 6: 6, 5: 5 },
    // Max manual braking only.
    byType: {
      a319: { MAX_MAN: DCA_A319 },
      a320: { MAX_MAN: DCA_A320 },
      a321: { MAX_MAN: DCA_A321 },
      "a321-leap": { MAX_MAN: DCA_LEAP },
    },
  },
  "jac-01-19": {
    label: "JAC 01/19",
    touchdownFt: 1000, ldaFt: 6300, minRcc: 3,
    rccMap: { 6: 6, 5: 5, 4: 3, 3: 3 },
    byType: { a319: { MED: JAC_A319, MAX_MAN: JAC_A319 } },
  },
  "pei-08": {
    label: "PEI 08",
    touchdownFt: 1000, ldaFt: null, minRcc: 3,
    rccMap: { 6: 6, 5: 5, 4: 3, 3: 3 },
    byType: { a319: { MED: PEI_08, MAX_MAN: PEI_08 } },
  },
  "pei-26": {
    label: "PEI 26",
    touchdownFt: 1000, ldaFt: null, minRcc: 3,
    rccMap: { 6: 6, 5: 5, 4: 3, 3: 3 },
    byType: { a319: { MED: PEI_26, MAX_MAN: PEI_26 } },
  },
  "eyw-09-27": {
    label: "EYW 09/27",
    touchdownFt: 1000, ldaFt: 4801, minRcc: 5,
    rccMap: { 6: 6, 5: 5 },
    byType: { a319: { MED: EYW_MED, MAX_MAN: EYW_MAN } },
  },
  "sbp-11-29": {
    label: "SBP 11/29",
    touchdownFt: 1250, ldaFt: 5300, minRcc: 5,
    rccMap: { 6: 6, 5: 5 },
    // RCC 5 is max manual only — the MED entry carries no RCC 5 table, which the
    // engine reports as "no data for this combination".
    byType: { a319: { MED: SBP_MED, MAX_MAN: SBP_MAN } },
  },
};

// ── engine ───────────────────────────────────────────────────────────────────

function lookupBase(entry, tbl, weightKlbs, oatC, tailwindKt) {
  if (tbl.kind === "flat") return interp1(entry.weights, tbl.vals, weightKlbs);
  if (tbl.kind === "oat")  return interp2(entry.weights, tbl.cols, tbl.grid, weightKlbs, oatC);
  return interp2(entry.weights, tbl.cols, tbl.grid, weightKlbs, tailwindKt);
}

/**
 * Required runway landing length for a special inflight landing station.
 *
 * Returns null when the station has no special data at all (caller falls back to
 * the normal tables), or one of:
 *   { tooShort: true }                     runway too short at this RwyCC
 *   { notAuthorized: true, reason }        configuration the AOM forbids
 *   { noData: true }                       station exists but not this combination
 *   { requiredFt, exceedsLDA, ldaFt, ... } a usable answer
 */
export function calcSpecial({
  station, typeKey, brakeMode, weightLbs, oatC, headwind,
  vappAdditive, brakingAction, reversers,
}) {
  if (!station || station === "none") return null;

  // SNA keeps its own module; dispatch and normalise the shape.
  if (station.startsWith("sna-")) {
    return calcSNA({
      station, typeKey, brakeMode, weightLbs, oatC, headwind,
      vappAdditive, brakingAction,
    });
  }

  const def = STATIONS[station];
  if (!def) return null;

  const byMode = def.byType[typeKey];
  if (!byMode) return null;

  if (brakingAction < def.minRcc) {
    return { tooShort: true, ldaFt: def.ldaFt, touchdownFt: def.touchdownFt };
  }
  const tableRcc = def.rccMap[brakingAction];
  // Above the station's range the normal inflight data governs; produce nothing.
  if (tableRcc == null) return null;

  const entry = byMode[brakeMode];
  if (!entry) return { noData: true, ldaFt: def.ldaFt };

  const tbl = entry.byRcc[tableRcc];
  if (!tbl) return { noData: true, ldaFt: def.ldaFt };

  const corr = entry.corr[tableRcc] ?? {};

  if (entry.noReverseAuthorized === false && reversers === "None") {
    return { notAuthorized: true, reason: "No reverse not authorized", ldaFt: def.ldaFt };
  }

  const tailwindKt = headwind < 0 ? -headwind : 0;
  const headwindKt = headwind > 0 ? headwind : 0;

  let ft = lookupBase(entry, tbl, weightLbs / 1000, oatC, tailwindKt);

  // Tables gridded against tailwind already carry the wind effect.
  if (tbl.kind !== "tailwind" && tailwindKt > 0) {
    if (corr.tailwindPerKt == null) {
      return { notAuthorized: true, reason: "Tailwind not authorized", ldaFt: def.ldaFt };
    }
    ft += tailwindKt * corr.tailwindPerKt;
  }
  if (headwindKt > 0 && corr.headwindPerKt) {
    ft += headwindKt * corr.headwindPerKt;
  }

  // Every chart publishes its approach-speed penalty per 5 kt above VLS+5.
  if (corr.apprPer5kt) {
    ft += ((vappAdditive - 5) / 5) * corr.apprPer5kt;
  }

  if (entry.rwyAdd && entry.rwyAdd[tableRcc]) ft += entry.rwyAdd[tableRcc];

  const requiredFt = Math.round(ft);
  return {
    requiredFt,
    ldaFt: def.ldaFt,
    exceedsLDA: def.ldaFt != null && requiredFt > def.ldaFt,
    touchdownFt: def.touchdownFt,
    basisRcc: tableRcc,
  };
}

/** True when the app holds real table data for a station id. */
export function hasSpecialData(station) {
  if (!station || station === "none") return false;
  if (station.startsWith("sna-")) return hasSNAData(station);
  return Boolean(STATIONS[station]);
}

/** Station ids that carry data for a given aircraft type key. */
export function stationsForType(typeKey) {
  return Object.entries(STATIONS)
    .filter(([, def]) => Boolean(def.byType[typeKey]))
    .map(([value, def]) => ({ value, label: def.label }));
}
