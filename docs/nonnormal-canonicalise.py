import json, collections
F=json.load(open('/tmp/nn_failures.json'))

# Within a variant+system the AOM repeats the same failures in the same order in
# each of the six RwyCC tables. Where the tables agree on count, that lets the
# names be canonicalised positionally — the best-quality label for each slot wins,
# which repairs rows whose label was split awkwardly in one table but clean in
# another. Tables whose count disagrees are left alone and reported.
bysys=collections.defaultdict(lambda: collections.defaultdict(list))
for x in F: bysys[(x['variant'],x['system'])][x['rcc']].append(x)

flagged=[]; renamed=0
for key, byrcc in bysys.items():
    counts=collections.Counter(len(v) for v in byrcc.values())
    modal,_=counts.most_common(1)[0]
    good={r:v for r,v in byrcc.items() if len(v)==modal}
    bad =[r for r,v in byrcc.items() if len(v)!=modal]
    if bad: flagged.append((key,bad,{r:len(v) for r,v in byrcc.items()}))
    for i in range(modal):
        # prefer the longest label that isn't obviously a fragment
        cands=[byrcc[r][i]['failure'].strip() for r in good]
        cands=[c for c in cands if c and not c[0].islower()]
        if not cands: continue
        best=max(cands, key=len)
        for r in good:
            if byrcc[r][i]['failure']!=best:
                byrcc[r][i]['failure']=best; renamed+=1

print(f'labels canonicalised: {renamed}')
print(f'systems left flagged: {len(flagged)}')
for k,b,c in flagged: print(f'   {k[0]:12s} {k[1]:24s} bad RCC={b}  counts={dict(sorted(c.items()))}')
json.dump(F, open('/tmp/nn_failures.json','w'))
