import { ejetConfig } from "../fleets/ejet/config.js";
import { a319Config } from "../fleets/a32f/config-a319.js";
import { a321IaeSLConfig } from "../fleets/a32f/config-iae-sl.js";
import { a321IaeConfig, a321CfmConfig } from "../fleets/a32f/config-variants.js";
import { erjConfig } from "../fleets/erj/config.js";

export const FAMILIES = [
  { id:"ejet", label:"E-Jet", variants:[ejetConfig] },
  { id:"a32f", label:"A32F",  variants:[a319Config, a321IaeSLConfig, a321IaeConfig, a321CfmConfig] },
  { id:"erj",  label:"ERJ",   variants:[erjConfig] },
];

export const FLEETS = Object.fromEntries(
  FAMILIES.flatMap(f => f.variants.map(v => [v.id, v]))
);

export const FAMILY_LIST = FAMILIES;
