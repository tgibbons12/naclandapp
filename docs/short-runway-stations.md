# Special Inflight Landing (Short Runway) Stations — A32F

Inventory of every special inflight landing station in the A32F AOM chapter 12p,
with the assumption set behind each table. Source: "AOM A32F bookmarked.pdf",
sections 12p.5.3 (A319), 12p.5.5 (A320), 12p.5.8 (A321).

## Why this can't be a boolean toggle

The normal inflight tables (12p.5.2/.4/.6/.7) are keyed **pressure altitude ×
gross weight × six RwyCC columns**, with additive corrections layered on top.
Runway identity never enters the model.

Every special table replaces that model rather than correcting it:

- The RwyCC dimension collapses into *which table you may use at all*.
- Pressure altitude drops out; airport OAT replaces it (station elevation is fixed).
- Touchdown assumption varies by station — 1000, 1200, 1250, or 1450 ft.
- Brake mode is fixed by the table, not chosen.
- A flat 15% margin is applied.
- Corrections invert: some stations give headwind *credits*; some prohibit
  tailwind and reverser-out entirely.
- Output is a **required runway landing length** compared against LDA, with a
  hard "runway is too short for landing" verdict below an RCC threshold — not a
  distance to compare by eye.

The AOM wording is explicit: use the special data *"in lieu of the normal
inflight landing data."*

Implication for the app: `shortRwyStation` needs to be a per-runway-end selector
driving a separate calc module with its own input schema and its own output
shape, not a flag that adds feet. It should also **narrow** the input space —
clamp RCC options, disable tailwind/reverser-out where unauthorized, fix brake
mode.

## A319 — 6 station groups

| Station | Runways | RCC basis | Touchdown | Brake mode | Table axes | Notes |
|---|---|---|---|---|---|---|
| BOS / LGA / DCA | BOS 27, LGA all, DCA 01/19 | RCC 3 | 1200 ft | MED autobrake | weight × OAT (−8…40) | Use when braking action expected < Good (5). RCC 2 or less → too short |
| Washington DCA | 15/33 | RCC 6 or 5 | 1000 ft | Max manual | Dry = all-temps column; Good = OAT (0…40) | All assessments must use this table. RCC 4 or less → too short |
| Jackson Hole JAC | 01/19 | RCC 6, 5, 3 | 1000 ft | RCC 6/5 = MED or max manual; RCC 3 = max manual | weight × OAT | **Headwind credits** (−20 to −33 ft/kt). Tailwind Not Authorized. No Reverse Not Authorized |
| Pereira SKPE/PEI | 08/26 | RCC 6, 5, 3 | 1000 ft | RCC 6/5 = MED or max manual; RCC 3 = max manual | weight × **tailwind knots** (0…15) | Separate table per RCC band. **"Rwy 26" additive**: +74 ft (Dry), +265 ft (Good), +649 ft (Medium) |
| Key West EYW | 09/27 | RCC 6 or 5 | 1000 ft | MED autobrake *and* max manual side by side | weight × tailwind knots (0/3/5/7) | Not authorized overweight or below Wet/Good (5). Table uses conservative data for all A319 aircraft |
| San Luis Obispo SBP | 11/29 | RCC 6 or 5 | 1250 ft | RCC 6 = MED or max manual; RCC 5 = **max manual only** | Dry = all-temps single value per brake mode; Good = OAT (−10…44), max manual only | Asymmetric — the Good band has no MED autobrake column |

## A320 — 2 station groups

| Station | Runways | RCC basis | Touchdown | Brake mode | Table axes |
|---|---|---|---|---|---|
| BOS / LGA / DCA | BOS 27, LGA all, DCA 01/19 | RCC 3 | 1200 ft | MED autobrake | weight × OAT (−8…40) |
| Washington DCA | 15/33 | RCC 6 or 5 | 1000 ft | Max manual | Dry = all-temps column; Good = OAT (0…40) |

## A321 — 4 station groups, split by engine

A321 special tables are published per engine variant. The ceo tables are titled
"A321 IAE/CFM-56"; the neo tables are titled **"A321NA/A321NX"** in the SNA
sections but **"A321 LEAP-1A"** in the BOS/LGA/DCA and DCA 15/33 sections —
same aircraft, two naming conventions, MLW 174,600 lb in both.

| Station | Runways | RCC basis | Touchdown | Brake mode | Tables |
|---|---|---|---|---|---|
| BOS / LGA / DCA | BOS 27, LGA all, DCA 01/19 | RCC 3 | 1200 ft | MED autobrake (max manual may be used) | IAE/CFM-56; LEAP-1A |
| Washington DCA | 15/33 | RCC 6 or 5 | 1000 ft | Max manual | IAE/CFM-56; LEAP-1A |
| John Wayne SNA | 02L | RCC 6 or 5 | **1450 ft** | MED autobrake *or* max manual | IAE max manual; IAE MED; NA/NX max manual; NA/NX MED |
| John Wayne SNA | 20R | RCC 6 or 5 | 1200 ft | MED autobrake *or* max manual | IAE max manual; IAE MED; NA/NX max manual; NA/NX MED |

The SNA tables transpose the axes relative to every other station: **OAT rows ×
weight columns**, with Dry (6) as a single "All Temperatures" row above the Good
(5) OAT block. Corrections are per-RCC-band footnotes (tailwind ft/kt and
approach-speed +5 kt), and they differ between the Dry and Good bands within the
same table.

## Shared conventions

- All tables assume V_APP = V_LS + 5 and 2-engine reverse thrust unless stated.
- All include an additional 15% margin.
- Red figures on grey shading mean the value **exceeds published LDA** — this is
  the go/no-go gate, and it varies cell by cell rather than by a single weight or
  temperature limit. Any implementation needs the LDA per runway end to
  reproduce it, or needs to carry the shading as data.
- PAPI distance from threshold is given per runway end as a touchdown reference.

## Rough scale

About 30 distinct tables across the three types, in at least five different
layouts. The layout variation — not the data volume — is the hard part.
