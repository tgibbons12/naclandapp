import re, json, collections
lines = open('/tmp/nn.txt').read().splitlines()

# Only parse from 16p.9 onward — everything before is index/method text whose
# stray capitals were contaminating the failure-name buffer.
start = next(i for i,l in enumerate(lines) if l.strip().startswith('16p.9 '))
lines = lines[start:]

# Banners appear with either hyphen or en-dash and in mixed case, e.g.
# "6 - DRY", "4 – GOOD TO MEDIUM". Match loosely and normalise.
RCC_RE = re.compile(r'^([1-6])\s*[-–]\s*(DRY|GOOD TO MEDIUM|GOOD|MEDIUM TO POOR|MEDIUM|POOR)\b',
                    re.IGNORECASE)
NUM = r'[+\-_]?\s*\d+(?:\s?\d{3})?'
BOILER = re.compile(r'A32F Aircraft Operating Manual|Non-Normals Performance|^Home$|16p-\d+|'
                    r'^\d\d [A-Z]{3} \d\d$|^16p\.|Landing Distance with Failures Data|'
                    r'Corrections on Landing Distance|Reference Distance|FLAPS|LEVER|FAILURE|'
                    r'REF|DIST|Per|above|WGT|SPD|ALT|WIND|TEMP|SLOPE|REV|OVW|for LDG|klb|'
                    r'Automatic Landing correction|Weight correction|^\(\d\)|^\d\)|VREF|VAPP|'
                    r'^TW\b|\bISA\b|\bSlope\b|Operative|applied|\bDown\b|Thrust|Reverser|'
                    r'\bPROC\b|1klb|5kt|1000ft|10°|N/A only|^A$')

# ── segment into table blocks: each starts at an RwyCC banner ────────────────
blocks=[]; cur=None; variant=system=None
for ln in lines:
    s=ln.strip()
    if not s: continue
    m=re.search(r'Landing Distance with Failures Data (A3\d\d \([A-Z0-9\-]+\))', s)
    if m: variant=m.group(1)
    m=re.match(r'(A3\d\d \([A-Z0-9\-]+\))\s*[–-]\s*(.+?)\s*$', s)
    if m and 'SYSTEM' in m.group(2).upper():
        variant, system = m.group(1), m.group(2).strip()
    mr=RCC_RE.match(s)
    if mr:
        cur=dict(variant=variant, system=system, rcc=int(mr.group(1)), lines=[])
        blocks.append(cur); continue
    if cur is not None: cur['lines'].append(s)

blocks=[b for b in blocks if b['system'] and 'example' not in b['system'].lower()]

# ── parse rows inside each block ────────────────────────────────────────────
ROW = re.compile(rf'^(?:(.*?)\s+)?(FULL|3|1)\s+({NUM}(?:\s*/\s*\d+\s?kt)?)\s+'
                 rf'({NUM})\s+({NUM})\s+({NUM}|N/A)\s+({NUM})\s+({NUM})\s+({NUM})\s+({NUM})\s+'
                 rf'({NUM}|INOP)\s+({NUM})\s*$')
NOGO = re.compile(rf'^(?:(.*?)\s+)?(FULL|3|1)\s+({NUM}(?:\s*/\s*\d+\s?kt)?)\s+Landing Distance (?:is )?greater')
clean=lambda t:int(t.replace('_','-').replace(' ','').replace(',',''))

failures=[]; unparsed=[]
for b in blocks:
    base=None
    for s in b['lines']:
        m=re.match(r'REF DIST without failure.*?=\s*([\d ,]+)\s*ft', s)
        if m: base=clean(m.group(1))
    # Group by failure: a FULL row after an already-populated group starts a new
    # failure. Text fragments keep accumulating into the current group, so labels
    # that wrap *around* the data rows (e.g. "ALTN L(R) / RELEASED (if / NORM BRK /
    # FAULT)") reassemble in reading order.
    groups=[]; g=None
    def newgroup():
        return dict(frags=[], rows=[])
    for s in b['lines']:
        if re.match(r'REF DIST without failure', s): continue
        m=ROW.match(s); mg=NOGO.match(s) if not m else None
        if m or mg:
            mm = m or mg
            # Within one failure the flap rows descend (FULL → 3 → 1). A row whose
            # flap ranks at or above the previous row's starts a new failure.
            RANK={'FULL':3,'3':2,'1':1}
            if g and g['rows'] and RANK[mm.group(2)] >= RANK[g['rows'][-1]['flap']]:
                groups.append(g); g=newgroup()
            if g is None: g=newgroup()
            if mm.group(1): g['frags'].append(mm.group(1).strip())
            if m:
                g['rows'].append(dict(flap=m.group(2), dvref=m.group(3).strip(),
                    refDist=clean(m.group(4)), perKlb=clean(m.group(5)),
                    perSpd=None if m.group(6)=='N/A' else clean(m.group(6)),
                    perAlt=clean(m.group(7)), perTW=clean(m.group(8)),
                    perTemp=clean(m.group(9)), perSlope=clean(m.group(10)),
                    perRev=None if m.group(11)=='INOP' else clean(m.group(11)),
                    perOVW=clean(m.group(12))))
            else:
                g['rows'].append(dict(flap=mg.group(2), dvref=mg.group(3).strip(), noGo=True))
            continue
        if BOILER.search(s): continue
        if re.match(r"^[A-Z0-9][A-Za-z0-9 /()+\.'&,\u2013-]{1,45}$", s) and not re.search(r'\d{3}', s):
            if g is None: g=newgroup()
            g['frags'].append(s)
    if g and g['rows']: groups.append(g)
    for gr in groups:
        failures.append(dict(variant=b['variant'], system=b['system'], rcc=b['rcc'],
            failure=' '.join(gr['frags']).strip(), baseNoFailure=base, rows=gr['rows']))


print(f'blocks: {len(blocks)}   failure entries: {len(failures)}')
print(f'total data rows: {sum(len(f["rows"]) for f in failures)}')
print(f'entries missing base REF DIST: {sum(1 for f in failures if f["baseNoFailure"] is None)}')
c=collections.Counter(f['variant'] for f in failures)
for k,v in sorted(c.items()): print(f'   {k:18s} {v}')
json.dump(failures, open('/tmp/nn_failures.json','w'))
