# Non-Normal Inflight Landing Performance — build status

Source: A32F AOM ch.16 (`16p.9` – `16p.15`), *Landing Distance with Failures Data*.

**Wired into the Non-Normal tab, but incomplete — see "Incomplete" below.**
Not suitable for operational use: the LEAP-1A section is largely absent and no
approach speed is computed.

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
- Reference-condition sweep: 2,877 cells return their own REF DIST, 0 mismatches.
  Note this is a weak check: it compares a cell against itself and cannot detect
  a value attached to the wrong failure. It passed throughout the bug below.
- Cross-table coverage: within a system, all six RwyCC tables must list the same
  failures. 275 failure entries complete; **56 have a missing RwyCC table**, each
  traceable to a label that wrapped differently on that page.
- Monotonicity across RwyCC — 9 flags, each checked against the source and found
  to be **genuine AOM values** (e.g. A321 IAE `G+B` really reads 9270 → 9070 from
  RwyCC 5 to 4; A321 IAE brakes `ANTISKID FAULT` reads 7270 → 7250).
- Batch 1 of the scanned pages was checked cell-by-cell against an independent
  read of 16p-312, including per-RwyCC metadata: 0 mismatches.

## Bug found by wiring the UI

The variant and system labels were originally matched on the same source line.
The AOM spells variants inconsistently — table titles read `A320 (IAE A5)` with a
space inside the parentheses, and `A321 (CFM)` where the section header says
`A321 (CFM-56)` — so when the variant failed to match, the system label silently
froze at its previous value.

**646 entries across two variants were filed under a single wrong system.** Every
automated check passed, because they all compared the data against itself. It only
surfaced when the failure picker was rendered and showed one system instead of
nine.

Fixed by taking the variant from the running page header and the system from the
table title, independently. This also resolved what had looked like two separate
label-grouping defects and 14 reference-weight anomalies — all the same cause.

Lesson worth keeping: self-consistency checks cannot detect systematically
mis-filed data. Render it, or compare it against something external.

## Second bug: 220 dropped rows

ΔVREF prints as `0 / 140kt` split across three lines on the EMER CONFIG rows,
leaving the data row one field short of what the row pattern required. Those rows
were silently discarded — 220 of them, about 6% of the chapter, including **every
DC/ELEC EMER CONFIG failure across all six variants**. Fixed by accepting rows
with no inline ΔVREF (it does not feed the distance calculation).

Found by questioning why a flap-1 row appeared on a failure that should not have
had one. Like the first bug, no automated check caught it.

## Outstanding label defects

The numbers are verified; the *names* are not clean. Roughly a third of the 76
extracted names are wrong in one of four ways:

1. **Two failures merged** under one label (6 entries), e.g.
   `DC EMER CONFIG ELEC EMER CONFIG` — no flap-ordering boundary between them.
2. **Missing RwyCC tables** (56 entries) — the failure exists but some of its six
   tables are filed under a variant spelling of the name.
3. **Near-duplicates from punctuation**, e.g. `ELAC 1+2 FAULT / L+R ELEV FAULT`
   vs `ELAC 1+2 FAULT/ L+R ELEV FAULT`.
4. **Fragments and captions captured as failures**, e.g. `FAULT`, `with SPOILER`,
   `SLATS > 3 Refer to the applicable Landing Distance table ...`.

True distinct failure count is probably nearer 45–50, not 76. `docs/nonnormal-failures.md`
is the full inventory.

## Not yet matching AOM 16p.16

The published input list for the Land App's non-normal page includes four controls
the panel does not yet have: **Additional Failure**, **Autothrust**, **Ice
Accretion**, and **Use of FMGC VREF**. The page also owes a **VAPP** readout
alongside the distance. The shared right panel still shows Short Runways and the
crosswind limit, which belong to the normal page only.

Note that slope is deliberately absent: the charts publish a per-1% slope
correction but the real Land App never asks for it, so it defaults to 0.

## Incomplete

- **A321 (LEAP-1A)** is largely missing: 39 of its pages are scans. Currently
  covers ANTI ICE, NAVIGATION, and BLEED (RwyCC 6–3 only). Remaining: 16p-314
  through 16p-350.
- **A319 (CFM)** is missing ANTI ICE and BLEED — those pages are scans too.
- VAPP determination with failure (16p.9.1) is not implemented, so the non-normal
  page shows a distance but no approach speed.
- Additional Failure, Autothrust, FMGC VREF and slope inputs from 16p.16 are not
  yet on the panel; slope is supported by the engine but defaults to 0.

## Files

| File | Role |
|---|---|
| `src/fleets/a32f/calc-nonnormal.js` | correction engine |
| `src/fleets/a32f/nonnormal-data.js` | generated dataset — do not hand-edit |
| `docs/nonnormal-parser.py` | text-layer parser |
| `docs/nonnormal-canonicalise.py` | cross-table label canonicalisation |
| `docs/nonnormal-merge.py` | merges scanned-page batches; idempotent |
| `docs/nonnormal-gendata.mjs` | regenerates `nonnormal-data.js` from the parsed JSON |
| `src/fleets/a32f/nonnormal-fleet.js` | page defaults + calculate hook for the UI |
| `docs/nonnormal-parsed.json` | intermediate, regenerates `nonnormal-data.js` |
