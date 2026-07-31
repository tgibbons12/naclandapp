// ═══════════════════════════════════════════════════════════════════════════════
// SPECIAL INFLIGHT LANDING — John Wayne / Orange County (SNA)
//
// Source: A32F AOM 12p.5.8, rev 31 OCT 24 (runway 02L) / 31 JUL 25 (runway 20R).
//
// This is a SEPARATE model from the normal inflight tables, not a correction to
// them. The AOM directs the special data be used "in lieu of the normal inflight
// landing data". Differences that matter:
//
//   • Output is a REQUIRED RUNWAY LANDING LENGTH, compared against LDA — not a
//     landing distance to read off.
//   • Axes are gross weight × airport OAT. Pressure altitude does not appear;
//     SNA field elevation is fixed.
//   • Only RCC 6 (Dry) and RCC 5 (Good) are tabulated. RCC 4 or less is a hard
//     "runway too short for landing" — there is no number to give.
//   • Dry (6) is generalised across all temperatures; Good (5) is per-OAT.
//   • Brake mode is limited to max manual or MED autobrake.
//   • Tailwind and approach-speed corrections differ between the Dry and Good
//     bands of the SAME table.
//
// Table assumptions (both runways): VAPP = VLS + 5, 2 engine reverse thrust,
// additional 15% margin. Touchdown within the first 1450 ft on 02L, 1200 ft on
// 20R — the tables are void if you land longer than that.
// ═══════════════════════════════════════════════════════════════════════════════

// Crew-supplied LDA. The AOM marks cells exceeding published LDA with red-on-grey
// shading but never prints the LDA itself; the shading boundary across all eight
// tables brackets it to between 5697 and 5723 ft, which this value sits inside.
const SNA_LDA_FT = 5700;

const OATS = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44];
const W_CEO = [120, 130, 140, 150, 160, 170, 171.5];
const W_NEO = [120, 130, 140, 150, 160, 170, 174.6];

// Each table: dry = one row across all temperatures; good = one row per OAT.
// corr.dry / corr.good = { tailwindPerKt, apprPer5kt }.

const SNA_02L_CEO_MAX_MAN = {
  weights: W_CEO,
  dry: [3849, 3995, 4140, 4286, 4431, 4590, 4622],
  good: [
    [4086,4301,4521,4745,4972,5199,5233],
    [4125,4344,4568,4797,5028,5259,5294],
    [4164,4387,4615,4848,5083,5318,5354],
    [4203,4430,4662,4899,5139,5379,5415],
    [4242,4473,4709,4951,5195,5439,5476],
    [4281,4516,4757,5002,5251,5500,5538],
    [4321,4560,4804,5054,5307,5560,5599],
    [4360,4603,4852,5106,5364,5621,5661],
    [4402,4650,4903,5162,5425,5687,5727],
    [4448,4700,4958,5222,5490,5757,5798],
    [4492,4749,5012,5281,5554,5826,5868],
    [4537,4799,5066,5341,5619,5896,5938],
  ],
  corr: { dry: { tailwindPerKt: 90, apprPer5kt: 250 }, good: { tailwindPerKt: 130, apprPer5kt: 340 } },
};

const SNA_02L_CEO_MED = {
  weights: W_CEO,
  dry: [4798, 5020, 5241, 5462, 5683, 5903, 5936],
  good: [
    [4407,4603,4801,5002,5206,5414,5446],
    [4444,4643,4844,5049,5256,5469,5502],
    [4480,4683,4887,5096,5307,5524,5558],
    [4517,4723,4931,5142,5357,5580,5614],
    [4554,4763,4974,5189,5407,5636,5671],
    [4591,4802,5017,5236,5458,5693,5729],
    [4627,4842,5061,5283,5510,5750,5787],
    [4664,4882,5104,5330,5562,5807,5845],
    [4701,4923,5149,5378,5617,5869,5908],
    [4739,4964,5194,5427,5675,5935,5975],
    [4776,5006,5239,5479,5733,6000,6042],
    [4814,5048,5285,5531,5793,6068,6110],
  ],
  corr: { dry: { tailwindPerKt: 90, apprPer5kt: 340 }, good: { tailwindPerKt: 120, apprPer5kt: 350 } },
};

const SNA_02L_NEO_MAX_MAN = {
  weights: W_NEO,
  dry: [3665, 3755, 3885, 4020, 4157, 4284, 4345],
  good: [
    [3939,4073,4271,4470,4667,4859,4948],
    [3975,4112,4312,4515,4716,4911,5002],
    [4010,4151,4354,4560,4765,4964,5057],
    [4046,4190,4396,4605,4815,5017,5111],
    [4081,4229,4438,4651,4864,5070,5166],
    [4117,4268,4480,4696,4913,5123,5221],
    [4152,4307,4522,4742,4963,5176,5276],
    [4188,4345,4564,4788,5013,5230,5331],
    [4224,4384,4606,4834,5063,5283,5387],
    [4260,4423,4648,4880,5113,5337,5443],
    [4297,4462,4691,4927,5163,5391,5498],
    [4334,4501,4733,4973,5214,5446,5554],
  ],
  corr: { dry: { tailwindPerKt: 60, apprPer5kt: 170 }, good: { tailwindPerKt: 100, apprPer5kt: 310 } },
};

const SNA_02L_NEO_MED = {
  weights: W_NEO,
  dry: [4701, 4841, 5047, 5252, 5451, 5641, 5728],
  good: [
    [4322,4453,4649,4848,5045,5234,5322],
    [4358,4491,4690,4893,5093,5286,5374],
    [4393,4529,4732,4938,5142,5337,5427],
    [4429,4568,4774,4984,5190,5388,5479],
    [4464,4607,4816,5029,5238,5439,5532],
    [4500,4646,4859,5075,5286,5490,5586],
    [4536,4685,4901,5120,5335,5541,5639],
    [4572,4723,4943,5165,5383,5593,5692],
    [4608,4762,4985,5211,5431,5645,5746],
    [4644,4801,5027,5255,5479,5697,5799],
    [4680,4840,5070,5301,5527,5749,5853],
    [4717,4879,5112,5346,5575,5801,5906],
  ],
  corr: { dry: { tailwindPerKt: 70, apprPer5kt: 280 }, good: { tailwindPerKt: 90, apprPer5kt: 290 } },
};

const SNA_20R_CEO_MAX_MAN = {
  weights: W_CEO,
  dry: [3538, 3682, 3827, 3971, 4115, 4271, 4302],
  good: [
    [3765,3976,4192,4413,4635,4858,4892],
    [3803,4018,4238,4463,4690,4916,4951],
    [3842,4060,4284,4513,4744,4975,5010],
    [3880,4102,4331,4563,4799,5034,5070],
    [3918,4145,4377,4614,4854,5093,5130],
    [3957,4188,4424,4665,4909,5153,5190],
    [3996,4230,4470,4716,4964,5212,5250],
    [4034,4273,4517,4767,5020,5272,5311],
    [4076,4319,4568,4822,5079,5337,5376],
    [4120,4368,4621,4881,5143,5405,5445],
    [4164,4416,4674,4938,5206,5473,5513],
    [4208,4465,4727,4997,5269,5541,5582],
  ],
  corr: { dry: { tailwindPerKt: 80, apprPer5kt: 250 }, good: { tailwindPerKt: 120, apprPer5kt: 340 } },
};

const SNA_20R_CEO_MED = {
  weights: W_CEO,
  dry: [4496, 4716, 4937, 5157, 5377, 5598, 5631],
  good: [
    [4104,4299,4495,4693,4894,5099,5130],
    [4141,4338,4538,4739,4944,5152,5183],
    [4177,4378,4580,4785,4993,5205,5237],
    [4214,4417,4623,4831,5043,5258,5291],
    [4250,4457,4665,4877,5092,5312,5345],
    [4286,4496,4708,4924,5142,5366,5401],
    [4323,4536,4751,4970,5192,5421,5456],
    [4359,4576,4794,5016,5242,5476,5512],
    [4396,4616,4838,5064,5293,5534,5572],
    [4433,4656,4883,5112,5348,5596,5635],
    [4470,4697,4927,5161,5403,5659,5698],
    [4508,4738,4972,5209,5459,5723,5763],
  ],
  corr: { dry: { tailwindPerKt: 90, apprPer5kt: 340 }, good: { tailwindPerKt: 120, apprPer5kt: 340 } },
};

const SNA_20R_NEO_MAX_MAN = {
  weights: W_NEO,
  dry: [3355, 3439, 3568, 3703, 3840, 3968, 4029],
  good: [
    [3622,3754,3942,4137,4330,4517,4605],
    [3657,3791,3983,4181,4378,4569,4658],
    [3692,3827,4024,4226,4426,4621,4712],
    [3727,3864,4065,4270,4475,4672,4765],
    [3762,3902,4106,4315,4523,4724,4819],
    [3797,3940,4147,4359,4572,4777,4873],
    [3832,3977,4188,4404,4620,4829,4927],
    [3867,4015,4230,4449,4669,4881,4981],
    [3903,4053,4271,4494,4718,4934,5035],
    [3938,4092,4313,4540,4767,4987,5090],
    [3973,4130,4354,4585,4816,5040,5144],
    [4010,4168,4396,4631,4866,5093,5199],
  ],
  corr: { dry: { tailwindPerKt: 60, apprPer5kt: 170 }, good: { tailwindPerKt: 90, apprPer5kt: 310 } },
};

const SNA_20R_NEO_MED = {
  weights: W_NEO,
  dry: [4400, 4537, 4742, 4946, 5145, 5335, 5422],
  good: [
    [4021,4148,4336,4532,4725,4912,4999],
    [4056,4185,4377,4576,4774,4963,5051],
    [4091,4222,4418,4621,4821,5014,5102],
    [4126,4259,4459,4666,4869,5064,5154],
    [4161,4297,4501,4710,4916,5114,5206],
    [4197,4334,4542,4755,4964,5165,5258],
    [4232,4372,4584,4800,5012,5216,5310],
    [4267,4411,4625,4845,5060,5266,5362],
    [4303,4449,4667,4890,5108,5317,5414],
    [4338,4487,4709,4934,5155,5368,5466],
    [4374,4525,4751,4978,5203,5418,5518],
    [4409,4564,4792,5023,5251,5468,5570],
  ],
  corr: { dry: { tailwindPerKt: 70, apprPer5kt: 280 }, good: { tailwindPerKt: 90, apprPer5kt: 310 } },
};

const TABLES = {
  "sna-02l": {
    touchdownFt: 1450,
    papiFt: 1450,
    a321:        { MAX_MAN: SNA_02L_CEO_MAX_MAN, MED: SNA_02L_CEO_MED },
    "a321-leap": { MAX_MAN: SNA_02L_NEO_MAX_MAN, MED: SNA_02L_NEO_MED },
  },
  "sna-20r": {
    touchdownFt: 1200,
    papiFt: 1207,
    a321:        { MAX_MAN: SNA_20R_CEO_MAX_MAN, MED: SNA_20R_CEO_MED },
    "a321-leap": { MAX_MAN: SNA_20R_NEO_MAX_MAN, MED: SNA_20R_NEO_MED },
  },
};

function lerpIndex(axis, v) {
  const x = Math.max(axis[0], Math.min(axis[axis.length - 1], v));
  for (let i = 0; i < axis.length - 1; i++) {
    if (x >= axis[i] && x <= axis[i + 1]) {
      const t = axis[i] === axis[i + 1] ? 0 : (x - axis[i]) / (axis[i + 1] - axis[i]);
      return { i0: i, i1: i + 1, t };
    }
  }
  return { i0: axis.length - 1, i1: axis.length - 1, t: 0 };
}

/**
 * Required runway landing length at a special SNA runway.
 *
 * @returns null when the station/type/brake combination has no table, or
 *   { tooShort: true } for RCC 4 or less, or
 *   { requiredFt, exceedsLDA, ldaFt, band, touchdownFt, papiFt }.
 */
export function calcSNA({ station, typeKey, brakeMode, weightLbs, oatC, headwind, vappAdditive, brakingAction }) {
  const runway = TABLES[station];
  const table  = runway?.[typeKey]?.[brakeMode];
  if (!table) return null;

  // RCC 4 or less: the AOM gives no data and calls the runway too short.
  if (brakingAction <= 4) return { tooShort: true, ldaFt: SNA_LDA_FT };

  const band = brakingAction >= 6 ? "dry" : "good";
  const w = lerpIndex(table.weights, weightLbs / 1000);

  let d;
  if (band === "dry") {
    // Generalised across all temperatures — weight only.
    d = table.dry[w.i0] + w.t * (table.dry[w.i1] - table.dry[w.i0]);
  } else {
    const o = lerpIndex(OATS, oatC);
    const r0 = table.good[o.i0], r1 = table.good[o.i1];
    const a = r0[w.i0] + w.t * (r0[w.i1] - r0[w.i0]);
    const b = r1[w.i0] + w.t * (r1[w.i1] - r1[w.i0]);
    d = a + o.t * (b - a);
  }

  const corr = table.corr[band];
  if (headwind < 0) d += corr.tailwindPerKt * Math.abs(headwind);
  if (vappAdditive > 5) d += corr.apprPer5kt * ((vappAdditive - 5) / 5);

  const requiredFt = Math.round(d);
  return {
    requiredFt,
    exceedsLDA: requiredFt > SNA_LDA_FT,
    ldaFt: SNA_LDA_FT,
    band,
    touchdownFt: runway.touchdownFt,
    papiFt: runway.papiFt,
  };
}

export function hasSpecialData(station) {
  return Object.prototype.hasOwnProperty.call(TABLES, station);
}
