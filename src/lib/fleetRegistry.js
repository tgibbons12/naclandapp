import { ejetConfig } from "../fleets/ejet/config.js";
import { a319Config } from "../fleets/a32f/config-a319.js";
import { a320Config } from "../fleets/a32f/config-a320.js";
import { a321Config } from "../fleets/a32f/config-a321.js";
import { a321LeapConfig } from "../fleets/a32f/config-a321-leap.js";
import { erjConfig } from "../fleets/erj/config.js";
import { b737800Config, b737max8Config } from "../fleets/737/config-b737.js";

// A32F aircraft types match the real Land App: A319, A320, the A321 IAE/CFM
// combination, and the A321 LEAP-1A. See AOM 16p.16.
export const FAMILIES = [
  { id:"ejet", label:"E-Jet", variants:[ejetConfig] },
  { id:"a32f", label:"A32F",  variants:[a319Config, a320Config, a321Config, a321LeapConfig] },
  { id:"erj",  label:"ERJ",   variants:[erjConfig] },
  { id:"b737", label:"737",   variants:[b737800Config, b737max8Config] },
];

export const FLEETS = Object.fromEntries(
  FAMILIES.flatMap(f => f.variants.map(v => [v.id, v]))
);
export const FAMILY_LIST = FAMILIES;
