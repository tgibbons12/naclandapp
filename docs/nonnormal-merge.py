import json, glob, sys, collections
F=json.load(open('/tmp/nn_failures.json'))
VKEY={'A321 (LEAP-1A)':'A321 (LEAP-1A)'}   # batches use the same variant labels
existing={(x['variant'],x['system'],x['rcc'],x['failure']) for x in F}
added=dupes=0; pages=0
for fn in sorted(glob.glob('/sessions/sleepy-affectionate-newton/mnt/naclandapp-main/aom_*batch*.json')):
    for p in json.load(open(fn)):
        pages+=1
        for e in p['entries']:
            key=(p['variant'],p['system'],p['rcc'],e['failure'])
            if key in existing: dupes+=1; continue
            rows=[]
            for r in e['rows']:
                if r.get('noGo'): rows.append(dict(flap=r['flap'],dvref=r.get('dvref'),noGo=True))
                else: rows.append({k:r[k] for k in
                    ['flap','dvref','refDist','perKlb','perSpd','perAlt','perTW','perTemp','perSlope','perRev','perOVW']})
            F.append(dict(variant=p['variant'], system=p['system'], rcc=p['rcc'],
                failure=e['failure'], baseNoFailure=p.get('baseNoFailure'),
                autolandFt=p.get('autolandFt'), baseKlb=p.get('baseKlb'),
                belowPerKlb=p.get('belowPerKlb'), rows=rows, source='scan'))
            existing.add(key); added+=1
print(f'batch pages merged: {pages}   new entries: {added}   duplicates skipped: {dupes}')
leap=[x for x in F if x['variant']=='A321 (LEAP-1A)']
print(f'A321 LEAP-1A total entries now: {len(leap)}')
print('  systems:', sorted(set(x['system'] for x in leap)))
json.dump(F, open('/tmp/nn_failures.json','w'))
