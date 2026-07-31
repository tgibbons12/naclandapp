import fs from 'fs';
const F=JSON.parse(fs.readFileSync('/tmp/nn_failures.json','utf8'));
const byVar={};
for(const x of F){ if(x.baseKlb==null) continue; (byVar[x.variant] ??= {})[x.baseKlb]=(byVar[x.variant][x.baseKlb]||0)+1; }
const BASE={}; for(const [v,c] of Object.entries(byVar))
  BASE[v]=+Object.entries(c).sort((a,b)=>b[1]-a[1])[0][0];
const odd=F.filter(x=>x.baseKlb!=null && x.baseKlb!==BASE[x.variant]);
console.log('reference weights (klb):',BASE);
console.log('blocks disagreeing with variant majority:',odd.length);
const VKEY={'A319 (CFM)':'a319-cfm','A319 (IAE)':'a319-iae','A320 (CFM)':'a320-cfm',
 'A320 (IAE)':'a320-iae','A321 (CFM-56)':'a321-cfm','A321 (IAE)':'a321-iae','A321 (LEAP-1A)':'a321-leap'};
const data={}, meta={}; let cells=0;
for(const x of F){
  if(!x.failure.trim()) continue;
  const v=VKEY[x.variant]; if(!v) continue;
  const d=(((data[v] ??= {})[x.system] ??= {})[x.failure] ??= {});
  const r=(d[x.rcc] ??= {});
  for(const row of x.rows){
    r[row.flap]= row.noGo ? 'NOGO'
      : [row.refDist,row.perKlb,row.perSpd,row.perAlt,row.perTW,row.perTemp,row.perSlope,row.perRev,row.perOVW];
    if(!row.noGo) cells+=9;
  }
  const m=((meta[v] ??= {})[x.system] ??= {});
  m[x.rcc]={baseNoFailure:x.baseNoFailure, autolandFt:x.autolandFt,
            baseKlb:BASE[x.variant], belowPerKlb:x.belowPerKlb ?? 10};
}
const out=`// GENERATED — do not edit by hand. Regenerate with docs/nonnormal-gendata.mjs.
// Source: A32F AOM ch.16 "Non-Normal Inflight Landing Performance".
// Shape: DATA[variant][system][failure][rwyCC][flap] =
//   [refDist, perKlb, perSpd, perAlt, perTW, perTemp, perSlope, perRev, perOVW]
//   perSpd null = "N/A"; perRev null = "INOP"; "NOGO" = greater than 18,000 ft.
export const REF_WEIGHT_KLB = ${JSON.stringify(Object.fromEntries(Object.entries(BASE).map(([k,v])=>[VKEY[k],v])))};
export const META = ${JSON.stringify(meta)};
export const DATA = ${JSON.stringify(data)};
`;
fs.writeFileSync('/sessions/sleepy-affectionate-newton/mnt/naclandapp-main/src/fleets/a32f/nonnormal-data.js',out);
console.log('variants:',Object.keys(data).length,'| numeric cells:',cells,'| KB:',Math.round(out.length/1024));
