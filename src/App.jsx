import { useState, useCallback } from "react";
import { FLEETS, FAMILY_LIST } from "./lib/fleetRegistry.js";

// ─────────────────────────────────────────────────────────────────────────────
// RCAM DATA
// ─────────────────────────────────────────────────────────────────────────────
const RCAM_ROWS = [
  { code: 6, color: "#000", bg: "#fff",    desc: "Dry",                                     braking: "—",                          pilot: "—"       },
  { code: 5, color: "#000", bg: "#fff",    desc: "Frost / Wet (≤⅛\") / Slush ≤⅛\" / Dry or Wet Snow ≤⅛\"", braking: "Normal deceleration AND normal directional control", pilot: "Good" },
  { code: 4, color: "#000", bg: "#fff",    desc: "Compacted Snow (≤−15°C)",                 braking: "Between Good and Medium",    pilot: "Good to Medium" },
  { code: 3, color: "#000", bg: "#fff",    desc: "Slippery When Wet / Dry or Wet Snow over Compacted Snow / Compacted Snow (>−15°C) / Dry or Wet Snow >⅛\"", braking: "Noticeably reduced deceleration OR directional control", pilot: "Medium" },
  { code: 2, color: "#000", bg: "#fff",    desc: "Water >⅛\" / Slush >⅛\"",               braking: "Between Medium and Poor",    pilot: "Medium to Poor" },
  { code: 1, color: "#fff", bg: "#c0392b", desc: "Ice",                                     braking: "Significantly reduced deceleration OR directional control", pilot: "Poor" },
  { code: 0, color: "#fff", bg: "#7b0000", desc: "Wet Ice / Slush over Ice / Water over Compacted Snow / Snow over Ice", braking: "Minimal to non-existent deceleration OR directional control uncertain", pilot: "Nil" },
];

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; width: 100%; max-width: 100% !important; padding: 0 !important; overflow: hidden; text-align: left; }

  body {
    background: #E4E3EA;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
    color: #000;
    -webkit-font-smoothing: antialiased;
  }

  .shell {
    height: 100dvh; width: 100%;
    display: flex; flex-direction: column;
    background: #E4E3EA;
    padding: 16px 16px 0;
  }

  .card {
    background: #9B9B9B;
    border: 1px solid #888888;
    border-radius: 12px;
    overflow: hidden;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    box-shadow: 0 1px 8px rgba(0,0,0,0.18);
  }

  .title-bar {
    background: #E4E3EA;
    display: flex; align-items: center; justify-content: center;
    padding: 7px 16px 6px; flex-shrink: 0; position: relative;
  }
  .title-bar h1 { font-size: 14px; font-weight: 400; color: #578E48; letter-spacing: 0; text-align: center; }
  .title-settings-btn {
    background: none; border: none; color: #007aff; font-size: 20px;
    cursor: pointer; padding: 0 4px; line-height: 1; font-family: inherit;
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  }
  .title-settings-btn:active { opacity: 0.5; }

  .panels {
    display: grid; grid-template-columns: 1fr 1fr;
    flex: 1; min-height: 0;
    padding: 8px 8px 0; gap: 16px;
  }
  @media (max-width: 600px) { .panels { grid-template-columns: 1fr; } }

  .panel {
    background: #ffffff;
    padding: 10px 18px 14px;
    display: flex; flex-direction: column; gap: 0;
    border: 1px solid #d0d0d5; border-radius: 10px;
    overflow-y: auto; min-height: 0;
  }

  .srow { display: flex; flex-direction: column; align-items: center; padding: 7px 0 6px; gap: 5px; }
  .srow + .srow { border-top: 1px solid #e5e5ea; }
  .lbl { font-size: 13px; font-weight: 400; color: #000; text-align: center; line-height: 1.3; }
  .sublbl { font-size: 11px; color: #8e8e93; text-align: center; margin-top: -2px; }
  .val { font-size: 15px; color: #007aff; text-align: center; }

  .seg { display: inline-flex; background: rgba(118,118,128,0.12); border-radius: 9px; padding: 2px; gap: 0; position: relative; }
  .seg-btn {
    position: relative; background: transparent; border: none; border-radius: 7px;
    font-size: 13px; font-weight: 400; color: #3c3c43; padding: 5px 14px;
    cursor: pointer; font-family: inherit; transition: color 0.15s;
    min-width: 48px; text-align: center; z-index: 1; white-space: nowrap;
  }
  .seg-btn.active { background: #ffffff; color: #000; font-weight: 500; box-shadow: 0 1px 3px rgba(0,0,0,0.18), 0 1px 1px rgba(0,0,0,0.06); }
  .seg-btn:not(.active):active { background: rgba(0,0,0,0.05); }

  .stepper { display: inline-flex; align-items: stretch; border-radius: 9px; overflow: hidden; border: 1px solid rgba(0,0,0,0.15); background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
  .step-btn {
    background: #fff; border: none; color: #007aff; font-size: 20px; font-weight: 300;
    width: 42px; height: 30px; cursor: pointer; display: flex; align-items: center;
    justify-content: center; font-family: inherit; line-height: 1;
    user-select: none; -webkit-user-select: none; transition: background 0.1s;
  }
  .step-divider { width: 1px; background: rgba(0,0,0,0.15); flex-shrink: 0; }
  .step-btn:active { background: #E4E3EA; }

  .toggle-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; padding: 6px 0 4px; width: 100%; }
  .toggle-cell { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .toggle-lbl { font-size: 12px; color: #000; text-align: center; line-height: 1.2; }
  .ios-toggle { position: relative; width: 44px; height: 26px; display: block; }
  .ios-toggle input { position: absolute; opacity: 0; width: 0; height: 0; }
  .ios-track { position: absolute; inset: 0; background: #e5e5ea; border-radius: 26px; cursor: pointer; transition: background 0.22s; }
  .ios-track::before {
    content: ''; position: absolute; width: 22px; height: 22px; left: 2px; top: 2px;
    background: #fff; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.28); transition: transform 0.22s;
  }
  .ios-toggle input:checked ~ .ios-track { background: #578E48; }
  .ios-toggle input:checked ~ .ios-track::before { transform: translateX(18px); }

  .rcam-btn { background: none; border: none; color: #007aff; font-size: 13.5px; font-family: inherit; cursor: pointer; padding: 2px 0; text-align: center; }
  .rcam-btn:active { opacity: 0.5; }
  .calc-btn { background: none; border: none; color: #007aff; font-size: 15px; font-family: inherit; cursor: pointer; padding: 4px 6px; white-space: nowrap; flex-shrink: 0; }
  .calc-btn:active { opacity: 0.5; }
  .hw-row { display: flex; align-items: center; gap: 10px; }
  .short-row { display: flex; align-items: center; gap: 10px; justify-content: center; }
  .short-none { font-size: 14px; color: #8e8e93; }

  /* ── TAP INPUT ── */
  .tap-val {
    font-size: 15px; color: #007aff; text-align: center;
    cursor: pointer; position: relative; display: inline-block;
    border-bottom: 1px dashed rgba(0,122,255,0.35);
    padding-bottom: 1px;
  }
  /* Select overlays the label fully transparent — iOS shows drum-roll picker on tap */
  .tap-val select {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    opacity: 0; cursor: pointer;
    font-size: 16px; /* prevents iOS auto-zoom */
    -webkit-appearance: menulist-button;
  }

  /* ── FAILURE PICKER ── */
  .failure-select {
    width: 100%; font-size: 13px; font-family: inherit;
    padding: 7px 10px; border-radius: 9px;
    border: 1px solid rgba(0,0,0,0.15);
    background: #fff; color: #000;
    -webkit-appearance: none; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23007aff' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    padding-right: 28px;
    cursor: pointer;
  }
  .failure-select:focus { outline: 2px solid #007aff; outline-offset: 1px; }

  /* ── BOTTOM BAR ── */
  .bottom-bar {
    background: #ffffff;
    border-top: 1px solid #c6c6c8;
    margin: 0 8px 8px;
    border-radius: 0 0 8px 8px;
    padding: 8px 16px 10px;
    display: flex; align-items: center;
    gap: 8px; flex-shrink: 0; flex-wrap: nowrap;
  }
  .speeds { display: flex; gap: 20px; align-items: flex-end; flex-shrink: 0; }
  .spd { display: flex; flex-direction: column; align-items: flex-start; }
  .spd-num { font-size: clamp(26px, 4vw, 36px); font-weight: 300; line-height: 1; }
  .spd-lbl { font-size: 10px; color: #8e8e93; margin-top: 2px; letter-spacing: 0.2px; text-transform: uppercase; }
  .bottom-mid { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 0; }
  .bot-actions { display: flex; gap: 20px; align-items: center; }
  .bot-btn { background: none; border: none; color: #007aff; font-size: 14px; font-family: inherit; cursor: pointer; }
  .bot-btn:active { opacity: 0.5; }
  .bot-type { font-size: 16px; font-weight: 700; color: #578E48; }
  .bot-note { font-size: 11px; color: #578E48; text-align: center; font-weight: 400; }
  .bot-sub { font-size: 10px; color: #8e8e93; text-align: center; }
  .dist-block { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
  .dist-num { font-size: clamp(28px, 4.5vw, 40px); font-weight: 400; color: #000; line-height: 1; white-space: nowrap; }
  .dist-lbl { font-size: 11px; color: #8e8e93; text-align: right; margin-top: 2px; }
  .dist-num.nn { color: #c0392b; }

  /* ── TAB BAR ── */
  .tab-bar {
    background: transparent;
    display: flex; flex-shrink: 0;
    padding: 4px 0 env(safe-area-inset-bottom, 8px);
  }
  .tab { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 6px 10px 4px; cursor: pointer; gap: 3px; background: none; border: none; font-family: inherit; }
  .tab-plane { display: block; color: #8e8e93; }
  .tab:has(.tab-lbl.on) .tab-plane { color: #007aff; }
  .tab-lbl { font-size: 11px; color: #8e8e93; }
  .tab-lbl.on { color: #007aff; }
  .tab-bar-indicator { width: 36px; height: 4px; background: #000; border-radius: 2px; margin: 3px auto 0; }

  /* ── MODAL BASE ── */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
  .modal { background: #fff; border-radius: 14px; width: 100%; max-width: 680px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.35); }
  .modal-header { padding: 16px 20px 12px; border-bottom: 1px solid #e5e5ea; display: flex; align-items: center; justify-content: space-between; }
  .modal-title { font-size: 15px; font-weight: 600; color: #000; line-height: 1.2; }
  .modal-subtitle { font-size: 11px; color: #8e8e93; margin-top: 2px; }
  .modal-close { background: #e5e5ea; border: none; border-radius: 50%; width: 28px; height: 28px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #3c3c43; flex-shrink: 0; font-family: inherit; }
  .modal-body { overflow-y: auto; padding: 0; }
  .modal-footer { padding: 10px 16px; border-top: 1px solid #e5e5ea; font-size: 10px; color: #8e8e93; line-height: 1.5; }

  .rcam-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .rcam-table th { background: #E4E3EA; padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 600; color: #3c3c43; border-bottom: 1px solid #e5e5ea; position: sticky; top: 0; }
  .rcam-table td { padding: 9px 12px; border-bottom: 1px solid #E4E3EA; vertical-align: top; line-height: 1.35; }
  .rcam-table tr:last-child td { border-bottom: none; }
  .rcc-badge { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; font-size: 15px; font-weight: 700; }

  .fleet-picker { background: #fff; border-radius: 14px; width: 100%; max-width: 380px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.35); }
  .fleet-list { padding: 8px 0; }
  .fleet-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px; cursor: pointer; border: none; background: none;
    width: 100%; font-family: inherit; text-align: left;
    border-bottom: 1px solid #E4E3EA;
  }
  .fleet-item:last-child { border-bottom: none; }
  .fleet-item:active { background: #E4E3EA; }
  .fleet-item-label { font-size: 16px; color: #000; }
  .fleet-item-check { color: #007aff; font-size: 18px; }

  /* ── MACG MODAL ── */
  .macg-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
  .macg-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .macg-lbl { font-size: 13px; color: #3c3c43; flex-shrink: 0; }
  .macg-input-wrap { display: flex; align-items: center; gap: 8px; }
  .macg-input {
    width: 90px; font-size: 17px; font-family: inherit; text-align: center;
    padding: 6px 10px; border-radius: 9px;
    border: 1px solid rgba(0,0,0,0.2); background: #f9f9f9; color: #000;
  }
  .macg-input:focus { outline: 2px solid #007aff; outline-offset: 1px; background: #fff; }
  .macg-unit { font-size: 12px; color: #8e8e93; }
  .macg-result { background: #f2f2f7; border-radius: 10px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
  .macg-result-row { display: flex; justify-content: space-between; align-items: baseline; }
  .macg-result-lbl { font-size: 12px; color: #8e8e93; }
  .macg-result-val { font-size: 17px; font-weight: 500; color: #000; }
  .macg-result-val.warn { color: #c0392b; }
  .macg-result-val.ok   { color: #578E48; }
  .macg-divider { height: 1px; background: #e5e5ea; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// SUBCOMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function Seg({ options, value, onChange }) {
  return (
    <div className="seg">
      {options.map(o => (
        <button key={o.value ?? o} className={`seg-btn${value === (o.value ?? o) ? " active" : ""}`} onClick={() => onChange(o.value ?? o)}>
          {o.label ?? o}
        </button>
      ))}
    </div>
  );
}

function Stepper({ value, onChange, step = 1, min = -9999, max = 99999 }) {
  return (
    <div className="stepper">
      <button className="step-btn" onClick={() => onChange(Math.max(min, value - step))}>−</button>
      <div className="step-divider" />
      <button className="step-btn" onClick={() => onChange(Math.min(max, value + step))}>+</button>
    </div>
  );
}

// TapInput — tapping the label opens the native iOS drum-roll picker.
// A transparent <select> overlays the visible label. iOS Safari always renders
// selects as the native scroll-wheel picker.
// Props:
//   options — optional [{value, label}] for labeled picks (e.g. braking action)
//   display — optional override for the visible label text
//   step/min/max — used to auto-generate numeric options when options not provided
function TapInput({ value, onChange, step = 1, min = -9999, max = 99999, display, options: optsProp }) {
  const opts = optsProp ?? (() => {
    const arr = [];
    for (let v = min; v <= max; v += step) arr.push({ value: v, label: String(v) });
    if (arr.length === 0 || arr[arr.length - 1].value !== max)
      arr.push({ value: max, label: String(max) });
    return arr;
  })();

  const visibleLabel = display
    ?? (optsProp ? (optsProp.find(o => o.value === value)?.label ?? String(value)) : String(value));

  return (
    <span className="tap-val">
      {visibleLabel}
      <select
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      >
        {opts.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </span>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <label className="ios-toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="ios-track" />
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MACG MODAL  (737 only — requires fleet.macg helper)
// ─────────────────────────────────────────────────────────────────────────────
function MACGModal({ onClose, fleet, s }) {
  const [macgInput, setMacgInput] = useState("200");
  const [unit, setUnit] = useState("ftNm"); // "ftNm" | "pct"

  const macg = fleet.macg;
  if (!macg) return null;

  // Parse input
  const raw = parseFloat(macgInput);
  const valid = !isNaN(raw) && raw > 0;

  // Convert to ft/NM for calculations
  const reqFtNm = valid
    ? (unit === "pct" ? macg.pctToFtNm(raw) : Math.round(raw))
    : null;

  // Forward: actual gradient at current landing weight & conditions
  const actualGrad   = macg.gradient(s.landingWeight, s.pressureAlt, s.oatC, false);
  const actualGradPct = macg.ftNmToPct(actualGrad);

  // Reverse: max weight meeting required MACG
  const limitWt    = reqFtNm != null ? macg.maxWeight(reqFtNm, s.pressureAlt, s.oatC, false) : null;
  const overLimit  = limitWt != null && s.landingWeight > limitWt;
  const underLimit = limitWt != null && s.landingWeight <= limitWt;

  // Display helpers
  const fmtWt = (lbs) => lbs != null ? lbs.toLocaleString() + " lbs" : "—";
  const reqPct  = reqFtNm != null ? macg.ftNmToPct(reqFtNm) : null;
  const reqFtNmDisplay = reqFtNm != null ? reqFtNm : "—";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth: 400}} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">MACG — Climb Gradient</div>
            <div className="modal-subtitle">737-800 / MAX 8 · PA {s.pressureAlt.toLocaleString()} ft · OAT {s.oatC}°C</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="macg-body">

          {/* Unit toggle */}
          <div className="macg-row">
            <span className="macg-lbl">Input units</span>
            <Seg
              options={[{value:"ftNm",label:"ft/NM"},{value:"pct",label:"%"}]}
              value={unit}
              onChange={setUnit}
            />
          </div>

          {/* MACG entry */}
          <div className="macg-row">
            <span className="macg-lbl">Required MACG</span>
            <div className="macg-input-wrap">
              <input
                className="macg-input"
                type="number"
                inputMode="decimal"
                value={macgInput}
                min={1}
                onChange={e => setMacgInput(e.target.value)}
              />
              <span className="macg-unit">{unit === "pct" ? "%" : "ft/NM"}</span>
            </div>
          </div>

          {/* Show converted equivalent */}
          {valid && (
            <div style={{textAlign:"right", fontSize:11, color:"#8e8e93", marginTop:-8}}>
              {unit === "pct"
                ? `= ${reqFtNmDisplay} ft/NM`
                : `= ${reqPct}%`}
            </div>
          )}

          <div className="macg-divider" />

          {/* Results */}
          <div className="macg-result">
            <div className="macg-result-row">
              <span className="macg-result-lbl">Actual gradient @ {s.landingWeight.toLocaleString()} lbs</span>
              <span className="macg-result-val">{actualGrad} ft/NM ({actualGradPct}%)</span>
            </div>

            {valid && (<>
              <div className="macg-divider" />
              <div className="macg-result-row">
                <span className="macg-result-lbl">Max weight @ MACG {unit === "pct" ? `${raw}%` : `${reqFtNm} ft/NM`}</span>
                <span className={`macg-result-val${overLimit ? " warn" : " ok"}`}>
                  {fmtWt(limitWt)}
                </span>
              </div>
              {overLimit && (
                <div style={{fontSize:12, color:"#c0392b", fontWeight:500}}>
                  ⚠ Landing weight exceeds MACG limit by {(s.landingWeight - limitWt).toLocaleString()} lbs
                </div>
              )}
              {underLimit && limitWt != null && (
                <div style={{fontSize:12, color:"#578E48"}}>
                  ✓ Within limit by {(limitWt - s.landingWeight).toLocaleString()} lbs
                </div>
              )}
              {limitWt === null && valid && (
                <div style={{fontSize:12, color:"#c0392b", fontWeight:500}}>
                  ⚠ Required gradient exceeds capability at all table weights
                </div>
              )}
            </>)}
          </div>
        </div>
        <div className="modal-footer">
          Gradient data: 737-800 Maximum Climb Gradient Capability table. Results in 500 lb increments. Anti-ice correction not applied.
        </div>
      </div>
    </div>
  );
}

function RCAMModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Runway Condition Assessment Matrix</div>
            <div className="modal-subtitle">AC 91-79A CHG 1 — Operational RCAM (Pilot)</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <table className="rcam-table">
            <thead>
              <tr>
                <th style={{width:48}}>RwyCC</th>
                <th>Runway Condition Description</th>
                <th>Control / Braking Observation</th>
                <th>Pilot Braking Action</th>
              </tr>
            </thead>
            <tbody>
              {RCAM_ROWS.map(row => (
                <tr key={row.code}>
                  <td><span className="rcc-badge" style={{background: row.bg, color: row.color, border: row.bg === "#fff" ? "1px solid #c6c6c8" : "none"}}>{row.code}</span></td>
                  <td>{row.desc}</td>
                  <td style={{color:"#3c3c43"}}>{row.braking}</td>
                  <td><strong>{row.pilot}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="modal-footer">
          Runway condition codes (e.g. 4/3/3) represent conditions for each third of the landing surface as reported by the airport operator.
        </div>
      </div>
    </div>
  );
}

function FleetPicker({ currentFamilyId, onSelect, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="fleet-picker" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Select Fleet</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="fleet-list">
          {FAMILY_LIST.map(family => (
            <button key={family.id} className="fleet-item" onClick={() => { onSelect(family.id); onClose(); }}>
              <span className="fleet-item-label">{family.label}</span>
              {family.id === currentFamilyId && <span className="fleet-item-check">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE LABELS
// ─────────────────────────────────────────────────────────────────────────────
const TOGGLE_LABELS = {
  antiIce:      "Anti-ice ON",
  catII:        "CAT II",
  stallProtIce: <span>Stall Prot<br/>Ice Speeds</span>,
  iceAccretion: "Ice Accretion",
  engineAntiIce: <span>Engine<br/>Anti-ice</span>,
  wingAntiIce:   <span>Wing<br/>Anti-ice</span>,
};

// ─────────────────────────────────────────────────────────────────────────────
// EJET PANEL
// ─────────────────────────────────────────────────────────────────────────────
function EjetLeftPanel({ s, set, fleet }) {
  return (
    <div className="panel">
      {fleet.acTypeOptions && (
        <div className="srow">
          <div className="lbl">Aircraft Type</div>
          <div className="val">{s.acType}</div>
          <Seg options={fleet.acTypeOptions} value={s.acType} onChange={set("acType")} />
        </div>
      )}
      <div className="srow">
        <div className="lbl">Flap Lever Position</div>
        <Seg options={fleet.flapOptions} value={s.flap} onChange={set("flap")} />
      </div>
      <div className="srow">
        <div className="lbl">Thrust Reversers</div>
        <Seg options={fleet.reverserOptions} value={s.reversers} onChange={set("reversers")} />
      </div>
      <div className="srow">
        <div className="val">VAPP = VREF+{s.vappAdd}</div>
        <Stepper value={s.vappAdd} onChange={set("vappAdd")} step={5} min={0} max={30} />
      </div>
      <div className="srow">
        <div className="lbl">Landing Weight</div>
        <div className="val">{s.landingWeight.toLocaleString()}</div>
        <Stepper value={s.landingWeight} onChange={set("landingWeight")} step={fleet.weightLimits.step} min={fleet.weightLimits.min} max={fleet.weightLimits.max} />
      </div>
      <div className="toggle-grid">
        {fleet.toggles.map(key => (
          <div key={key} className="toggle-cell">
            <div className="toggle-lbl">{TOGGLE_LABELS[key]}</div>
            <Toggle checked={!!s[key]} onChange={set(key)} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// A32F PANEL
// ─────────────────────────────────────────────────────────────────────────────
function A32FLeftPanel({ s, set, fleet, variants, currentVariantId, onVariantChange }) {
  return (
    <div className="panel">
      <div className="srow">
        <div className="lbl">Aircraft Type</div>
        <Seg
          options={variants.map(v => ({ value: v.id, label: v.label.replace("A321 ","321 ").replace("A319","319") }))}
          value={currentVariantId}
          onChange={onVariantChange}
        />
      </div>
      <div className="srow">
        <div className="lbl">Configuration</div>
        <Seg options={fleet.flapOptions} value={s.flap} onChange={set("flap")} />
      </div>
      <div className="srow">
        <div className="lbl">Brake Mode</div>
        <Seg options={fleet.brakeModeOptions} value={s.brakeMode} onChange={set("brakeMode")} />
      </div>
      <div className="srow">
        <div className="lbl">Thrust Reversers</div>
        <Seg options={fleet.reverserOptions} value={s.reversers} onChange={set("reversers")} />
      </div>
      <div className="srow">
        <div className="val">VAPP = VLS+{s.vappAdditive}</div>
        <Stepper value={s.vappAdditive} onChange={set("vappAdditive")} step={5} min={5} max={30} />
      </div>
      <div className="srow">
        <div className="lbl">Landing Weight</div>
        <div className="val">{s.landingWeight.toLocaleString()}</div>
        <Stepper value={s.landingWeight} onChange={set("landingWeight")} step={fleet.weightLimits.step} min={fleet.weightLimits.min} max={fleet.weightLimits.max} />
      </div>
      <div className="toggle-grid">
        {fleet.toggles.map(key => (
          <div key={key} className="toggle-cell">
            <div className="toggle-lbl">{TOGGLE_LABELS[key]}</div>
            <Toggle checked={!!s[key]} onChange={set(key)} />
          </div>
        ))}
      </div>
      {fleet.showShortRunway && (
        <div className="srow">
          <div className="lbl">Short Runway Station</div>
          <div className="short-row">
            <Toggle checked={!!s.shortRwyStation} onChange={set("shortRwyStation")} />
            <span className="short-none">None</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// B737 NORMAL LEFT PANEL
// ─────────────────────────────────────────────────────────────────────────────
function B737LeftPanel({ s, set, fleet, variants, currentVariantId, onVariantChange }) {
  return (
    <div className="panel">
      <div className="srow">
        <div className="lbl">Aircraft Type</div>
        <Seg
          options={variants.map(v => ({ value: v.id, label: v.label }))}
          value={currentVariantId}
          onChange={onVariantChange}
        />
      </div>
      <div className="srow">
        <div className="lbl">Flap Setting</div>
        <Seg options={fleet.flapOptions} value={s.flap} onChange={set("flap")} />
      </div>
      <div className="srow">
        <div className="lbl">Autobrake</div>
        <Seg options={fleet.brakeModeOptions} value={s.brakeMode} onChange={set("brakeMode")} />
      </div>
      <div className="srow">
        <div className="lbl">Thrust Reversers</div>
        <Seg options={fleet.reverserOptions} value={s.reversers} onChange={set("reversers")} />
      </div>
      <div className="srow">
        <div className="val">
          VAPP = VREF+
          <TapInput
            value={s.vrefAdditive}
            onChange={set("vrefAdditive")}
            step={1} min={0} max={30}
          />
        </div>
        <Stepper value={s.vrefAdditive} onChange={set("vrefAdditive")} step={1} min={0} max={30} />
      </div>
      <div className="srow">
        <div className="lbl">Landing Weight</div>
        <TapInput
          value={s.landingWeight}
          onChange={set("landingWeight")}
          step={fleet.weightLimits.step}
          min={fleet.weightLimits.min}
          max={fleet.weightLimits.max}
          display={s.landingWeight.toLocaleString()}
        />
        <Stepper value={s.landingWeight} onChange={set("landingWeight")} step={fleet.weightLimits.step} min={fleet.weightLimits.min} max={fleet.weightLimits.max} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// B737 NON-NORMAL LEFT PANEL
// Failure selector replaces flap setting. No autobrake — always max manual.
// ─────────────────────────────────────────────────────────────────────────────
function B737NonNormalLeftPanel({ s, set, fleet, variants, currentVariantId, onVariantChange }) {
  return (
    <div className="panel">
      <div className="srow">
        <div className="lbl">Aircraft Type</div>
        <Seg
          options={variants.map(v => ({ value: v.id, label: v.label }))}
          value={currentVariantId}
          onChange={onVariantChange}
        />
      </div>
      <div className="srow">
        <div className="lbl">Failure / Configuration</div>
        <select
          className="failure-select"
          value={s.failure}
          onChange={e => set("failure")(e.target.value)}
        >
          {fleet.failureOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="srow">
        <div className="lbl">Thrust Reversers</div>
        <Seg options={fleet.reverserOptions} value={s.reversers} onChange={set("reversers")} />
      </div>
      <div className="srow">
        <div className="val">
          VAPP = VREF+
          <TapInput
            value={s.vrefAdditive}
            onChange={set("vrefAdditive")}
            step={1} min={0} max={30}
          />
        </div>
        <Stepper value={s.vrefAdditive} onChange={set("vrefAdditive")} step={1} min={0} max={30} />
      </div>
      <div className="srow">
        <div className="lbl">Landing Weight</div>
        <TapInput
          value={s.landingWeight}
          onChange={set("landingWeight")}
          step={fleet.weightLimits.step}
          min={fleet.weightLimits.min}
          max={fleet.weightLimits.max}
          display={s.landingWeight.toLocaleString()}
        />
        <Stepper value={s.landingWeight} onChange={set("landingWeight")} step={fleet.weightLimits.step} min={fleet.weightLimits.min} max={fleet.weightLimits.max} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RIGHT PANEL  (shared normal + non-normal)
// ─────────────────────────────────────────────────────────────────────────────
function RightPanel({ s, set, fleet, brakingLbl, onCalculate, onShowRCAM, onShowMACG }) {
  return (
    <div className="panel">
      <div className="srow">
        <div className="lbl">Pressure Altitude</div>
        <TapInput
          value={s.pressureAlt}
          onChange={set("pressureAlt")}
          step={500} min={-2000} max={14000}
          display={s.pressureAlt.toLocaleString()}
        />
        <Stepper value={s.pressureAlt} onChange={set("pressureAlt")} step={500} min={-2000} max={14000} />
      </div>
      <div className="srow">
        <div className="lbl">OAT° C</div>
        <TapInput
          value={s.oatC}
          onChange={set("oatC")}
          step={1} min={-60} max={55}
        />
        <Stepper value={s.oatC} onChange={set("oatC")} step={1} min={-60} max={55} />
      </div>
      <div className="srow">
        <div className="lbl">Headwind</div>
        <div className="sublbl">(negative for tailwind)</div>
        <TapInput
          value={s.headwind}
          onChange={set("headwind")}
          step={5} min={-50} max={50}
        />
        <div className="hw-row">
          <Stepper value={s.headwind} onChange={set("headwind")} step={5} min={-50} max={50} />
          <button className="calc-btn" onClick={onCalculate}>Calculate</button>
        </div>
      </div>
      <div className="srow">
        <div className="lbl">Braking Action</div>
        <TapInput
          value={s.brakingAction}
          onChange={set("brakingAction")}
          options={fleet.brakingOptions}
        />
        <Stepper value={s.brakingAction} onChange={set("brakingAction")} step={1} min={1} max={6} />
      </div>
      <div className="srow">
        <button className="rcam-btn" onClick={onShowRCAM}>Runway Condition Assessment Matrix</button>
      </div>
      {fleet.macg && (
        <div className="srow">
          <button className="rcam-btn" onClick={onShowMACG}>MACG</button>
        </div>
      )}
      {fleet.showShortRunway && (
        <div className="srow">
          <div className="lbl">Short Runway Station</div>
          <div className="short-row">
            <Toggle checked={!!s.shortRwyStation} onChange={set("shortRwyStation")} />
            <span className="short-none">None</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM BAR
// ─────────────────────────────────────────────────────────────────────────────
function BottomBar({ fleet, result, s, onReset, acLabel, isNonNormal }) {
  const primaryDist = result ? (result.primaryDist ?? result.distances?.MAX_MAN) : null;

  // Climb limit: works for both 737 (climbLimitedKlbs) and E-Jet (climbLimited/structural)
  const climbNote = result && !isNonNormal
    ? result.climbLimitedKlbs != null
      ? `${Math.round(result.climbLimitedKlbs * 1000).toLocaleString()}`
      : result.climbLimited != null
        ? `${result.climbLimited.toLocaleString()} (${result.structural.toLocaleString()} structural)`
        : null
    : null;

  // For non-normal, show the QRH-specified VREF label (e.g. "VREF 40+55")
  const vrefDisplayLabel = isNonNormal && result?.vrefLabel
    ? result.vrefLabel
    : (fleet.speedSlots?.[0]?.label ?? "VREF");

  // For 737: only show the VREF matching the scenario/flap, plus VAPP
  const speedSlots = (() => {
    if (fleet.id?.startsWith("b737")) {
      let vrefKey, vrefLabel;
      if (isNonNormal && result?.vrefLabel) {
        // Use vrefNN which has the QRH additive already baked in (e.g. vref40 + 30)
        vrefKey   = "vrefNN";
        vrefLabel = result.vrefLabel;
      } else {
        const flap = s.flap ?? "FLAPS 30";
        vrefKey   = flap === "FLAPS 40" ? "vref40" : flap === "FLAPS 15" ? "vref15" : "vref30";
        vrefLabel = flap === "FLAPS 40" ? "VREF 40" : flap === "FLAPS 15" ? "VREF 15" : "VREF 30";
      }
      return [
        { key: vrefKey, label: vrefLabel, color: "#ff3b30" },
        { key: "vapp",  label: "VAPP",    color: "#34c759" },
      ];
    }
    return fleet.speedSlots;
  })();

  return (
    <div className="bottom-bar">
      <div className="speeds">
        {speedSlots.map((slot, i) => (
          <div key={slot.key} className="spd">
            <div className="spd-num" style={{color: slot.color}}>
              {result ? (result.speeds[slot.key] ?? "—") : "—"}
            </div>
            <div className="spd-lbl">
              {slot.label}
            </div>
          </div>
        ))}
      </div>

      <div className="bottom-mid">
        <div className="bot-actions">
          <button className="bot-btn" onClick={onReset}>Reset</button>
          <div className="bot-type">{acLabel}</div>
          <button className="bot-btn">Audit</button>
        </div>
        {climbNote && (
          <>
            <div className="bot-note">{climbNote}</div>
            <div className="bot-sub">Climb Limited Max Landing Weight (for Dispatch Purposes Only)</div>
          </>
        )}
      </div>

      <div className="dist-block">
        <div className={`dist-num${isNonNormal ? " nn" : ""}`}>
          {primaryDist != null ? `${primaryDist.toLocaleString()} feet` : "— feet"}
        </div>
        <div className="dist-lbl">Required Landing Distance</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab,   setActiveTab]   = useState("normal");
  const [familyId,    setFamilyId]    = useState("ejet");
  const [variantIds,  setVariantIds]  = useState({ ejet: "ejet", a32f: "a319", b737: "b737-800" });
  const [states,      setStates]      = useState(() =>
    Object.fromEntries(FAMILY_LIST.flatMap(f => f.variants.map(v => [v.id, { ...v.defaults }])))
  );
  // Separate state store for non-normal inputs, keyed by fleetId
  const [nnStates,    setNnStates]    = useState(() =>
    Object.fromEntries(FAMILY_LIST.flatMap(f => f.variants.map(v => [v.id, { ...(v.nnDefaults ?? v.defaults) }])))
  );
  const [results,     setResults]     = useState({});
  const [nnResults,   setNnResults]   = useState({});
  const [showRCAM,    setShowRCAM]    = useState(false);
  const [showFleet,   setShowFleet]   = useState(false);
  const [showMACG,    setShowMACG]    = useState(false);

  const isNonNormal = activeTab === "nonnormal";

  const family   = FAMILY_LIST.find(f => f.id === familyId);
  const fleetId  = variantIds[familyId] ?? family?.variants[0]?.id;
  const fleet    = FLEETS[fleetId];

  const s    = isNonNormal ? nnStates[fleetId] : states[fleetId];
  const setS = isNonNormal
    ? key => val => setNnStates(prev => ({ ...prev, [fleetId]: { ...prev[fleetId], [key]: val } }))
    : key => val => setStates(prev =>   ({ ...prev, [fleetId]: { ...prev[fleetId], [key]: val } }));

  const brkOpt     = fleet.brakingOptions.find(b => b.value === s.brakingAction) || fleet.brakingOptions[0];
  const brakingLbl = brkOpt.label;

  const calculate = useCallback(() => {
    if (isNonNormal && fleet.calculateNonNormal) {
      const result = fleet.calculateNonNormal(s);
      setNnResults(prev => ({ ...prev, [fleetId]: result }));
    } else {
      const result = fleet.calculate(s);
      setResults(prev => ({ ...prev, [fleetId]: result }));
    }
  }, [s, fleet, fleetId, isNonNormal]);

  const handleReset = () => {
    if (isNonNormal) {
      setNnStates(prev => ({ ...prev, [fleetId]: { ...(fleet.nnDefaults ?? fleet.defaults) } }));
      setNnResults(prev => ({ ...prev, [fleetId]: null }));
    } else {
      setStates(prev => ({ ...prev, [fleetId]: { ...fleet.defaults } }));
      setResults(prev => ({ ...prev, [fleetId]: null }));
    }
  };

  const handleFamilyChange  = id => setFamilyId(id);
  const handleVariantChange = id => setVariantIds(prev => ({ ...prev, [familyId]: id }));

  const result = isNonNormal ? (nnResults[fleetId] || null) : (results[fleetId] || null);

  // Title reflects tab
  const titleText = isNonNormal
    ? fleet.title.replace("Normal", "Non-Normal")
    : fleet.title;

  return (
    <>
      <style>{css}</style>
      <div className="shell">

        <div className="card">
          <div className="title-bar">
            <h1>{titleText}</h1>
            <button className="title-settings-btn" onClick={() => setShowFleet(true)}>⚙︎</button>
          </div>

          <div className="panels">
            {familyId === "a32f" ? (
              <A32FLeftPanel
                s={s} set={setS} fleet={fleet}
                variants={family.variants}
                currentVariantId={fleetId}
                onVariantChange={handleVariantChange}
              />
            ) : familyId === "b737" ? (
              isNonNormal ? (
                <B737NonNormalLeftPanel
                  s={s} set={setS} fleet={fleet}
                  variants={family.variants}
                  currentVariantId={fleetId}
                  onVariantChange={handleVariantChange}
                />
              ) : (
                <B737LeftPanel
                  s={s} set={setS} fleet={fleet}
                  variants={family.variants}
                  currentVariantId={fleetId}
                  onVariantChange={handleVariantChange}
                />
              )
            ) : (
              <EjetLeftPanel s={s} set={setS} fleet={fleet} />
            )}
            <RightPanel
              s={s} set={setS} fleet={fleet}
              brakingLbl={brakingLbl}
              onCalculate={calculate}
              onShowRCAM={() => setShowRCAM(true)}
              onShowMACG={() => setShowMACG(true)}
            />
          </div>

          <BottomBar
            fleet={fleet} result={result} s={s}
            onReset={handleReset}
            acLabel={familyId === "ejet" ? s.acType : fleet.label}
            isNonNormal={isNonNormal}
          />
        </div>

        <div className="tab-bar">
          <button className="tab" onClick={() => setActiveTab("normal")}>
            <svg className="tab-plane" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
            <span className={`tab-lbl${activeTab === "normal" ? " on" : ""}`}>Normal</span>
            {activeTab === "normal" && <div className="tab-bar-indicator" />}
          </button>
          <button className="tab" onClick={() => setActiveTab("nonnormal")}>
            <svg className="tab-plane" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" style={{opacity: activeTab === "nonnormal" ? 1 : 0.35}}><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
            <span className={`tab-lbl${activeTab === "nonnormal" ? " on" : ""}`}>Non-Normal</span>
            {activeTab === "nonnormal" && <div className="tab-bar-indicator" />}
          </button>
        </div>

      </div>

      {showRCAM  && <RCAMModal onClose={() => setShowRCAM(false)} />
      }{showMACG   && <MACGModal onClose={() => setShowMACG(false)} fleet={fleet} s={s} />}
      {showFleet && <FleetPicker currentFamilyId={familyId} onSelect={handleFamilyChange} onClose={() => setShowFleet(false)} />}
    </>
  );
}
