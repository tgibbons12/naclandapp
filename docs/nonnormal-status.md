# Non-Normal Inflight Landing Performance — build status

Source: A32F AOM ch.16 (`16p.9` – `16p.15`), *Landing Distance with Failures Data*.

**This data is not yet wired into the app.** `calc-nonnormal.js` is imported by
nothing; the Non-Normal tab is still a stub. Two known defects below must be
cleared before it drives anything a crew would read.

## Model

Non-normal data is *not* a gridded lookup like the normal inflight tables. Each
failure publishes a REFERENCE DISTANCE plus linear per-unit corrections:

```
dist = REF DIST
     + weight correction      (chart's per-klb above the reference weight;
                               the footnote's flat credit below it — asymmetric)
     + (spdIncrement / 5kt)   × perSpd
     + (pressureAlt / 1000ft) × perAlt
     + (tailwind / 5kt)       × perTW
     + (ISA deviation / 10°C) × perTemp
     + downslope %            × perSlope
     + reversers operative    × perRev      (a credit; perRev is negative)
     + overweight procedure   ? perOVW : 0
     + autoland               ? autolandFt : 0
```

REF DIST assumes sea level, ISA, no wind, no slope, no reverse thrust, manual
landing, maximum manual braking, and VAPP = VREF + ΔVREF without APPR COR.

Three states are *not* numbers and must never be rendered as one:

| Chart | Meaning | Encoded as |
|---|---|---|
| `N/A` in SPD | no approach-speed increment permitted | `perSpd: null` |
| `INOP` in REV | reverse thrust unavailable, no credit | `perRev: null` |
| "greater than 18,000 ft for all conditions" | no-go | `"NOGO"` |

## Provenance

| Source | Pages | Method |
|---|---|---|
| Text layer | 259 | `pdftotext -layout` → `nonnormal-parser.py`, no OCR |
| Scans | 51 | dual transcription (direct read + OCR), disagreements adjudicated |

51 pages of the chapter are scanned images at ~109 ppi with no text layer. Raw
OCR on them is unreliable — it confuses 1 and 7 on these scans specifically — so
they are transcribed twice by independent means and only agreeing cells accepted.

## Verification performed

- Every coefficient checked against 16p-68 individually (weight, speed, altitude,
  wind, temperature, slope, reversers, overweight, autoland) — all exact.
- Reference-condition sweep: 2,710 cells return their own REF DIST, 0 mismatches.
  Note this is a weak check: it compares a cell against itself and cannot detect
  a value attached to the wrong failure.
- Cross-table coverage: within a system, all six RwyCC tables must list the same
  failures. 34 of 36 systems agree; 82 labels were canonicalised from this.
- Monotonicity across RwyCC. 25 flags raised; 20 fall inside the two broken
  tables below, and all 5 others were verified against the source as **genuine
  AOM values** (e.g. A321 IAE `G+B` really reads 9270 → 9070 from RwyCC 5 to 4).

## Known defects

1. **A319 (IAE) FLIGHT CONTROLS, RwyCC 4** — label grouping over-splits (29 groups
   against 15 in the other five tables), so distances are attached to the wrong
   failures. Verified example: `THREE SPLR FAULT` should read 6070 ft, currently 7200.
2. **A321 (CFM-56) SLATS AND FLAPS, RwyCC 2** — under-splits (43 against 57).

## Incomplete

- **A321 (LEAP-1A)** is largely missing: 39 of its pages are scans. Currently
  covers ANTI ICE, NAVIGATION, and BLEED (RwyCC 6–3 only). Remaining: 16p-314
  through 16p-350.
- 14 blocks reported a reference weight disagreeing with their variant's majority;
  the majority is used and the outliers are unresolved.
- VAPP determination with failure (16p.9.1) is not implemented.

## Files

| File | Role |
|---|---|
| `src/fleets/a32f/calc-nonnormal.js` | correction engine |
| `src/fleets/a32f/nonnormal-data.js` | generated dataset — do not hand-edit |
| `docs/nonnormal-parser.py` | text-layer parser |
| `docs/nonnormal-canonicalise.py` | cross-table label canonicalisation |
| `docs/nonnormal-merge.py` | merges scanned-page batches; idempotent |
| `docs/nonnormal-parsed.json` | intermediate, regenerates `nonnormal-data.js` |
