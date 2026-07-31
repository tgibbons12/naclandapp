import { useState, useCallback } from "react";
import { FLEETS, FAMILY_LIST } from "./lib/fleetRegistry.js";
import { hasSpecialData } from "./fleets/a32f/calc-short-runway.js";
import { landingCrosswindLimit } from "./fleets/a32f/limits.js";

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
    padding: 4px 10px 6px;
  }
  .card {
    background: #8A8A8A;
    border: 1px solid #757575;
    border-radius: 12px;
    overflow: hidden;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    box-shadow: 0 1px 8px rgba(0,0,0,0.18);
  }
  /* Inset rounded pill inside the grey card, not a flush edge-to-edge strip. */
  .title-bar {
    background: #E4E3EA;
    display: flex; align-items: center; justify-content: center;
    padding: 6px 13px 6px; flex-shrink: 0; position: relative;
    margin: 4px 4px 0; border-radius: 8px;
  }
  .title-bar h1 { font-size: 17px; font-weight: 400; color: #578E48; letter-spacing: 0; text-align: center; }
  .title-settings-btn {
    background: none; border: none; color: #007aff; font-size: 20px;
    cursor: pointer; padding: 0 4px; line-height: 1; font-family: inherit;
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  }
  .title-settings-btn:active { opacity: 0.5; }
  /* ── TOP BAR ── */
  .top-bar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 6px 5px; flex-shrink: 0;
  }
  .icon-btn {
    background: none; border: none; color: #007aff; font-size: 22px;
    cursor: pointer; padding: 0 6px; line-height: 1; font-family: inherit;
    display: inline-flex; align-items: center;
  }
  .icon-btn:active { opacity: 0.5; }
  .mode-seg { display: inline-flex; background: rgba(118,118,128,0.12); border-radius: 10px; padding: 3px; }
  .mode-btn {
    background: transparent; border: none; border-radius: 8px;
    font-size: 16px; color: #3c3c43; padding: 5px 20px;
    cursor: pointer; font-family: inherit; white-space: nowrap;
  }
  .mode-btn.active { background: #ffffff; color: #007aff; box-shadow: 0 1px 3px rgba(0,0,0,0.18); }
  /* Wide grey bezel around and between the panels, as in the real app. */
  .panels {
    display: grid; grid-template-columns: 1fr 1fr;
    flex: 1; min-height: 0;
    /* padding-bottom lifts the panels clear of the bottom bar so the grey card
       shows through beneath them, as in the real app. */
    padding: 14px 14px 56px; gap: 38px;
  }
  @media (max-width: 600px) { .panels { grid-template-columns: 1fr; } }
  .panel {
    background: #ffffff;
    padding: 6px 14px 8px;
    display: flex; flex-direction: column; gap: 0;
    border: 1px solid #d0d0d5; border-radius: 10px;
    overflow-y: auto; min-height: 0;
  }
  /* No row dividers — the real app's panels are clean white with spacing only. */
  .srow { display: flex; flex-direction: column; align-items: center; padding: 4px 0 3px; gap: 3px; }
  .lbl { font-size: 13px; font-weight: 400; color: #000; text-align: center; line-height: 1.3; }
  /* Real app renders the tailwind hint at label size and weight, not as fine print. */
  .sublbl { font-size: 13px; color: #000; text-align: center; line-height: 1.3; margin-top: -2px; }
  .val { font-size: 15px; color: #007aff; text-align: center; }
  .seg { display: inline-flex; background: rgba(118,118,128,0.12); border-radius: 9px; padding: 2px; gap: 0; position: relative; }
  .seg-btn {
    position: relative; background: transparent; border: none; border-radius: 7px;
    font-size: 13px; font-weight: 400; color: #3c3c43; padding: 5px 14px;
    cursor: pointer; font-family: inherit; transition: color 0.15s;
    min-width: 48px; text-align: center; z-index: 1; white-space: nowrap;
  }
  /* Hairline between adjacent inactive segments, as iOS draws it — suppressed on
     either side of the raised active pill. */
  .seg-btn::before {
    content: ''; position: absolute; left: 0; top: 6px; bottom: 6px;
    width: 1px; background: rgba(60,60,67,0.22);
  }
  .seg-btn:first-child::before, .seg-btn.active::before, .seg-btn.active + .seg-btn::before { display: none; }
  .seg-btn.active { background: #ffffff; color: #000; font-weight: 500; box-shadow: 0 1px 3px rgba(0,0,0,0.18), 0 1px 1px rgba(0,0,0,0.06); }
  .seg-btn:not(.active):active { background: rgba(0,0,0,0.05); }
  /* Light-grey pill split by a hairline, matching the real app's −/+ control. */
  .stepper { display: inline-flex; align-items: stretch; border-radius: 8px; overflow: hidden; background: #EFEFF0; }
  .step-btn {
    background: transparent; border: none; color: #3c3c43; font-size: 19px; font-weight: 300;
    width: 44px; height: 30px; cursor: pointer; display: flex; align-items: center;
    justify-content: center; font-family: inherit; line-height: 1;
    user-select: none; -webkit-user-select: none; transition: background 0.1s;
  }
  .step-divider { width: 1px; background: rgba(0,0,0,0.10); flex-shrink: 0; margin: 5px 0; }
  .step-btn:active { background: rgba(0,0,0,0.08); }
  .toggle-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; padding: 4px 0 2px; width: 100%; }
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
  .short-warn { font-size: 10.5px; color: #c0392b; text-align: center; line-height: 1.35; max-width: 260px; margin-top: 2px; }
  /* ── TAP INPUT ── */
  /* Values in the real app are plain blue text with no underline or chrome. */
  .tap-val {
    font-size: 15px; color: #007aff; text-align: center;
    cursor: pointer; position: relative; display: inline-block;
    padding-bottom: 1px;
  }
  .tap-val:active { opacity: 0.5; }
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
    border: 1px solid #d0d0d5;
    margin: 0 14px 14px;
    border-radius: 10px;
    padding: 12px 20px 14px;
    /* Three tracks with equal 1fr outers, so the middle block sits at true
       centre whether or not the speeds column has content. */
    display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
    gap: 8px; flex-shrink: 0;
  }
  .speeds { display: flex; gap: 20px; align-items: flex-end; justify-self: start; min-width: 0; }
  .spd { display: flex; flex-direction: column; align-items: flex-start; }
  .spd-num { font-size: clamp(26px, 4vw, 36px); font-weight: 300; line-height: 1; }
  .spd-lbl { font-size: 10px; color: #8e8e93; margin-top: 2px; letter-spacing: 0.2px; text-transform: uppercase; }
  .bottom-mid { justify-self: center; display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 0; }
  .bot-actions { display: flex; gap: 56px; align-items: center; }
  .bot-btn { background: none; border: none; color: #007aff; font-size: 14px; font-family: inherit; cursor: pointer; }
  .bot-btn:active { opacity: 0.5; }
  .bot-type { font-size: 16px; font-weight: 700; color: #578E48; }
  .bot-note { font-size: 11px; color: #578E48; text-align: center; font-weight: 400; }
  .bot-sub { font-size: 10px; color: #8e8e93; text-align: center; }
  .dist-block { display: flex; flex-direction: column; align-items: flex-end; justify-self: end; }
  /* Green by default; red only when the figure exceeds LDA at a short runway
     station, or on the non-normal page. */
  .dist-num { font-size: clamp(28px, 4.5vw, 40px); font-weight: 400; color: #578E48; line-height: 1; white-space: nowrap; }
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
      {/* Options may be numeric (weights, OAT) or string ids (variant, acType).
          Round-trip through the matching option so the original type survives. */}
      <select
        value={value}
        onChange={e => {
          const raw = e.target.value;
          const match = opts.find(o => String(o.value) === raw);
          onChange(match ? match.value : Number(raw));
        }}
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
// MACG MODAL  (737 only)
// ─────────────────────────────────────────────────────────────────────────────
function MACGModal({ onClose, fleet, s }) {
  const [macgInput, setMacgInput] = useState("200");
  const [unit, setUnit] = useState("ftNm");
  const macg = fleet.macg;
  if (!macg) return null;
  const raw = parseFloat(macgInput);
  const valid = !isNaN(raw) && raw > 0;
  const reqFtNm = valid ? (unit === "pct" ? macg.pctToFtNm(raw) : Math.round(raw)) : null;
  const actualGrad    = macg.gradient(s.landingWeight, s.pressureAlt, s.oatC, false);
  const actualGradPct = macg.ftNmToPct(actualGrad);
  const limitWt    = reqFtNm != null ? macg.maxWeight(reqFtNm, s.pressureAlt, s.oatC, false) : null;
  const overLimit  = limitWt != null && s.landingWeight > limitWt;
  const underLimit = limitWt != null && s.landingWeight <= limitWt;
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
          <div className="macg-row">
            <span className="macg-lbl">Input units</span>
            <Seg options={[{value:"ftNm",label:"ft/NM"},{value:"pct",label:"%"}]} value={unit} onChange={setUnit} />
          </div>
          <div className="macg-row">
            <span className="macg-lbl">Required MACG</span>
            <div className="macg-input-wrap">
              <input className="macg-input" type="number" inputMode="decimal" value={macgInput} min={1} onChange={e => setMacgInput(e.target.value)} />
              <span className="macg-unit">{unit === "pct" ? "%" : "ft/NM"}</span>
            </div>
          </div>
          {valid && (
            <div style={{textAlign:"right", fontSize:11, color:"#8e8e93", marginTop:-8}}>
              {unit === "pct" ? `= ${reqFtNmDisplay} ft/NM` : `= ${reqPct}%`}
            </div>
          )}
          <div className="macg-divider" />
          <div className="macg-result">
            <div className="macg-result-row">
              <span className="macg-result-lbl">Actual gradient @ {s.landingWeight.toLocaleString()} lbs</span>
              <span className="macg-result-val">{actualGrad} ft/NM ({actualGradPct}%)</span>
            </div>
            {valid && (<>
              <div className="macg-divider" />
              <div className="macg-result-row">
                <span className="macg-result-lbl">Max weight @ MACG {unit === "pct" ? `${raw}%` : `${reqFtNm} ft/NM`}</span>
                <span className={`macg-result-val${overLimit ? " warn" : " ok"}`}>{fmtWt(limitWt)}</span>
              </div>
              {overLimit && <div style={{fontSize:12, color:"#c0392b", fontWeight:500}}>⚠ Landing weight exceeds MACG limit by {(s.landingWeight - limitWt).toLocaleString()} lbs</div>}
              {underLimit && limitWt != null && <div style={{fontSize:12, color:"#578E48"}}>✓ Within limit by {(limitWt - s.landingWeight).toLocaleString()} lbs</div>}
              {limitWt === null && valid && <div style={{fontSize:12, color:"#c0392b", fontWeight:500}}>⚠ Required gradient exceeds capability at all table weights</div>}
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
  antiIce:       "Anti-ice ON",
  catII:         "CAT II",
  stallProtIce:  <span>Stall Prot<br/>Ice Speeds</span>,
  iceAccretion:  "Ice Accretion",
  engineAntiIce: <span>Engine<br/>Anti-ice</span>,
  wingAntiIce:   <span>Wing<br/>Anti-ice</span>,
  autothrust:    "Autothrust",
  autoland:      "Autoland",
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
          <TapInput
            value={s.acType}
            onChange={set("acType")}
            options={fleet.acTypeOptions}
          />
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
// ERJ PANEL
// ─────────────────────────────────────────────────────────────────────────────
function ERJLeftPanel({ s, set, fleet }) {
  // Weight limits vary by acType — use weightLimitsByType if available
  const wLimits = fleet.weightLimitsByType?.[s.acType] ?? fleet.weightLimits;
  return (
    <div className="panel">
      <div className="srow">
        <div className="lbl">Aircraft Type</div>
        <Seg options={fleet.acTypeOptions} value={s.acType} onChange={set("acType")} />
      </div>
      <div className="srow">
        <div className="lbl">Flap Setting</div>
        <Seg options={fleet.flapOptions} value={s.flap} onChange={set("flap")} />
      </div>
      <div className="srow">
        <div className="lbl">Runway Surface</div>
        <Seg options={fleet.surfaceOptions} value={s.surface} onChange={set("surface")} />
      </div>
      <div className="srow">
        <div className="val">VTGT = VREF+{s.vappAdditive}</div>
        <Stepper value={s.vappAdditive} onChange={set("vappAdditive")} step={1} min={0} max={20} />
      </div>
      <div className="srow">
        <div className="lbl">Landing Weight</div>
        <TapInput
          value={s.landingWeight}
          onChange={set("landingWeight")}
          step={wLimits.step}
          min={wLimits.min}
          max={wLimits.max}
          display={s.landingWeight.toLocaleString()}
        />
        <Stepper value={s.landingWeight} onChange={set("landingWeight")} step={wLimits.step} min={wLimits.min} max={wLimits.max} />
      </div>
      {fleet.toggles?.length > 0 && (
        <div className="toggle-grid">
          {fleet.toggles.map(key => (
            <div key={key} className="toggle-cell">
              <div className="toggle-lbl">{TOGGLE_LABELS[key]}</div>
              <Toggle checked={!!s[key]} onChange={set(key)} />
            </div>
          ))}
        </div>
      )}
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
        <TapInput
          options={variants.map(v => ({ value: v.id, label: v.label }))}
          value={currentVariantId}
          onChange={onVariantChange}
        />
      </div>
      <div className="srow">
        <div className="lbl">Flap Lever Position</div>
        <Seg options={fleet.flapOptions} value={s.flap} onChange={set("flap")} />
      </div>
      <div className="srow">
        <div className="lbl">Thrust Reversers</div>
        <Seg options={fleet.reverserOptions} value={s.reversers} onChange={set("reversers")} />
      </div>
      <div className="srow">
        <div className="lbl">Brakes</div>
        <Seg options={fleet.brakeModeOptions} value={s.brakeMode} onChange={set("brakeMode")} />
      </div>
      {/* VAPP is a three-way choice, not a stepper — the tables only publish
          corrections at VLS+10 and VLS+15. */}
      <div className="srow">
        <div className="lbl">VAPP</div>
        <Seg options={fleet.vappOptions} value={s.vappAdditive} onChange={set("vappAdditive")} />
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
// B737 NORMAL LEFT PANEL
// ─────────────────────────────────────────────────────────────────────────────
function B737LeftPanel({ s, set, fleet, variants, currentVariantId, onVariantChange }) {
  return (
    <div className="panel">
      <div className="srow">
        <div className="lbl">Aircraft Type</div>
        <TapInput
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
          <TapInput value={s.vrefAdditive} onChange={set("vrefAdditive")} step={1} min={0} max={30} />
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
// ─────────────────────────────────────────────────────────────────────────────
function B737NonNormalLeftPanel({ s, set, fleet, variants, currentVariantId, onVariantChange }) {
  return (
    <div className="panel">
      <div className="srow">
        <div className="lbl">Aircraft Type</div>
        <TapInput
          options={variants.map(v => ({ value: v.id, label: v.label }))}
          value={currentVariantId}
          onChange={onVariantChange}
        />
      </div>
      <div className="srow">
        <div className="lbl">Failure / Configuration</div>
        <select className="failure-select" value={s.failure} onChange={e => set("failure")(e.target.value)}>
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
          <TapInput value={s.vrefAdditive} onChange={set("vrefAdditive")} step={1} min={0} max={30} />
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
// RIGHT PANEL  (shared — braking action row hidden for ERJ)
// ─────────────────────────────────────────────────────────────────────────────
function RightPanel({ s, set, fleet, brakingLbl, onCalculate, onShowRCAM, onShowMACG }) {
  const isERJ = fleet.id === "erj";
  // Stations carrying special inflight landing data for this type. See
  // docs/short-runway-stations.md for the assumptions behind each one.
  const stations = fleet.shortRunwayStations ?? [];
  return (
    <div className="panel">
      <div className="srow">
        <div className="lbl">Pressure Altitude</div>
        <TapInput
          value={s.pressureAlt}
          onChange={set("pressureAlt")}
          step={100} min={-2000} max={14000}
          display={s.pressureAlt.toLocaleString()}
        />
        <Stepper value={s.pressureAlt} onChange={set("pressureAlt")} step={100} min={-2000} max={14000} />
      </div>
      <div className="srow">
        <div className="lbl">OAT° C</div>
        <TapInput value={s.oatC} onChange={set("oatC")} step={1} min={-60} max={55} />
        <Stepper value={s.oatC} onChange={set("oatC")} step={1} min={-60} max={55} />
      </div>
      <div className="srow">
        <div className="lbl">Headwind</div>
        <div className="sublbl">(negative for tailwind)</div>
        <TapInput value={s.headwind} onChange={set("headwind")} step={5} min={-50} max={50} />
        <div className="hw-row">
          <Stepper value={s.headwind} onChange={set("headwind")} step={5} min={-50} max={50} />
          <button className="calc-btn" onClick={onCalculate}>Calculate</button>
        </div>
      </div>
      {!isERJ && (
        <div className="srow">
          <div className="lbl">Braking Action</div>
          <TapInput
            value={s.brakingAction}
            onChange={set("brakingAction")}
            options={fleet.brakingOptions}
          />
          <Stepper value={s.brakingAction} onChange={set("brakingAction")} step={1} min={1} max={6} />
        </div>
      )}
      {!isERJ && fleet.showCrosswindLimit && (
        <div className="srow">
          <div className="lbl">
            Rwy Cond Code Max X-wind:{" "}
            <span style={{fontWeight: 500}}>{landingCrosswindLimit(s.brakingAction) ?? "—"}</span>
          </div>
        </div>
      )}
      {!isERJ && (
        <div className="srow">
          <button className="rcam-btn" onClick={onShowRCAM}>Runway Condition Assessment Matrix</button>
        </div>
      )}
      {fleet.melOptions && (
        <div className="srow">
          <div className="lbl">MEL Landing Penalty Factor</div>
          <TapInput
            value={s.melPenaltyFt ?? 0}
            onChange={set("melPenaltyFt")}
            options={fleet.melOptions}
          />
        </div>
      )}
      {fleet.macg && (
        <div className="srow">
          <button className="rcam-btn" onClick={onShowMACG}>MACG</button>
        </div>
      )}
      {fleet.showShortRunway && (
        <div className="srow">
          <div className="lbl">{fleet.shortRunwayLabel ?? "Short Runway Station"}</div>
          {/* A32F presents this as a plain value list with "None" as the first
              entry; the Embraer fleets front it with a toggle. */}
          {fleet.shortRunwayAsList ? (
            <TapInput
              value={s.shortRwyId ?? "none"}
              onChange={set("shortRwyId")}
              options={[{ value: "none", label: "None" }, ...stations]}
            />
          ) : (
            <div className="short-row">
              <Toggle checked={!!s.shortRwyStation} onChange={set("shortRwyStation")} />
              {s.shortRwyStation && stations.length > 0 ? (
                <TapInput
                  value={s.shortRwyId ?? stations[0].value}
                  onChange={set("shortRwyId")}
                  options={stations}
                />
              ) : (
                <span className="short-none">None</span>
              )}
            </div>
          )}
          {(s.shortRwyId && s.shortRwyId !== "none") && !hasSpecialData(s.shortRwyId) && (
            <div className="short-warn">
              Special table data not loaded for this station. Normal in-flight data
              is not valid here — refer to the AOM or the iPad Land App.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM BAR
// ─────────────────────────────────────────────────────────────────────────────
function BottomBar({ fleet, result, s, onReset, acLabel, isNonNormal }) {
  const baseDist = result ? (result.primaryDist ?? result.distances?.MAX_MAN) : null;
  // An MEL/CDL usable-landing-length penalty adds directly to the required length.
  const primaryDist = baseDist != null ? baseDist + (s.melPenaltyFt ?? 0) : null;
  const climbNote = result && !isNonNormal
    ? result.climbLimitedKlbs != null
      ? `${Math.round(result.climbLimitedKlbs * 1000).toLocaleString()}`
      : result.climbLimited != null
        ? `${result.climbLimited.toLocaleString()} (${result.structural?.toLocaleString()} structural)`
        : null
    : null;
  // The real Land App only presents approach speeds on the Embraer fleets.
  // Opt in per fleet with `showSpeeds: true`; everything else hides the block.
  // Speed lookups stay wired up in each config so this is display-only.
  const showSpeeds = fleet.showSpeeds ?? false;
  // When a special-station table is in play it replaces the normal result, and the
  // readout switches from "landing distance" to "required runway length vs LDA".
  const special = result?.special ?? null;
  const speedSlots = (() => {
    if (fleet.id?.startsWith("b737")) {
      let vrefKey, vrefLabel;
      if (isNonNormal && result?.vrefLabel) {
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
      {/* Always rendered, empty when hidden, so the grid keeps three tracks and
          the middle block stays centred on fleets without speeds. */}
      <div className="speeds">
        {showSpeeds && speedSlots.map(slot => (
          <div key={slot.key} className="spd">
            <div className="spd-num" style={{color: slot.color}}>
              {result ? (result.speeds[slot.key] ?? "—") : "—"}
            </div>
            <div className="spd-lbl">{slot.label}</div>
          </div>
        ))}
      </div>
      <div className="bottom-mid">
        <div className="bot-type">{acLabel}</div>
        <div className="bot-actions">
          <button className="bot-btn" onClick={onReset}>Reset</button>
          <button className="bot-btn">Audit</button>
        </div>
        {climbNote && fleet.showClimbLimited !== false && (
          <>
            <div className="bot-note">{climbNote}</div>
            <div className="bot-sub">Climb Limited Max Landing Weight (for Dispatch Purposes Only)</div>
          </>
        )}
      </div>
      <div className="dist-block">
        <div className={`dist-num${isNonNormal || special?.tooShort || special?.exceedsLDA ? " nn" : ""}`}>
          {special?.tooShort
            ? "TOO SHORT"
            : primaryDist != null ? `${primaryDist} feet` : "— feet"}
        </div>
        <div className="dist-lbl">
          {special
            ? (special.tooShort
                ? "Runway too short for landing"
                : special.exceedsLDA
                  ? `Required — exceeds LDA ${special.ldaFt.toLocaleString()} ft`
                  : `Required Runway Landing Length (LDA ${special.ldaFt.toLocaleString()} ft)`)
            : "Landing Distance"}
        </div>
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
  // ── FIX: erj entry added so fleetId resolves correctly ──
  const [variantIds,  setVariantIds]  = useState({ ejet: "ejet", a32f: "a319", b737: "b737-800", erj: "erj" });
  const [states,      setStates]      = useState(() =>
    Object.fromEntries(FAMILY_LIST.flatMap(f => f.variants.map(v => [v.id, { ...v.defaults }])))
  );
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

  // ── FIX: guard brakingOptions for ERJ (uses surfaceOptions instead) ──
  const brkOpt     = fleet.brakingOptions?.find(b => b.value === s.brakingAction) ?? fleet.brakingOptions?.[0] ?? null;
  const brakingLbl = brkOpt?.label ?? (fleet.surfaceOptions?.find(o => o.value === s.surface)?.label ?? "");

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

  const titleText = isNonNormal
    ? fleet.title.replace("Normal", "Non-Normal")
    : fleet.title;

  // ── FIX: acLabel for ERJ shows acType from state ──
  // Fleets may carry a longer formal designation for the bottom bar than the
  // short name used in the Aircraft Type picker (e.g. A321NA/NX → A321 LEAP-1A).
  const acLabel = familyId === "ejet" || familyId === "erj"
    ? s.acType
    : (fleet.bottomLabel ?? fleet.label);

  return (
    <>
      <style>{css}</style>
      <div className="shell">
        {/* Top chrome: info button, Normal/Non-Normal segmented pill, page icon. */}
        <div className="top-bar">
          <button className="icon-btn" aria-label="Info">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="13" cy="13" r="10.5" />
              <circle cx="13" cy="8.2" r="0.9" fill="currentColor" stroke="none" />
              <path d="M13 11.4v7.2" strokeLinecap="round" />
            </svg>
          </button>
          <div className="mode-seg">
            <button
              className={`mode-btn${activeTab === "normal" ? " active" : ""}`}
              onClick={() => setActiveTab("normal")}
            >Normal</button>
            <button
              className={`mode-btn${activeTab === "nonnormal" ? " active" : ""}`}
              onClick={() => setActiveTab("nonnormal")}
            >Non-Normal</button>
          </div>
          {/* Real app uses a document/pages glyph here, not a hamburger. */}
          <button className="icon-btn" aria-label="Pages" onClick={() => setShowFleet(true)}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.4">
              <rect x="4.5" y="3" width="17" height="20" rx="2.6" />
              <path d="M8.2 8.2h9.6M8.2 12h9.6M8.2 15.8h6.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="card">
          <div className="title-bar">
            <h1>{titleText}</h1>
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
            ) : familyId === "erj" ? (
              // ── FIX: ERJ gets its own panel ──
              <ERJLeftPanel s={s} set={setS} fleet={fleet} />
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
            acLabel={acLabel}
            isNonNormal={isNonNormal}
          />
        </div>

      </div>

      {showRCAM  && <RCAMModal onClose={() => setShowRCAM(false)} />}
      {showMACG  && <MACGModal onClose={() => setShowMACG(false)} fleet={fleet} s={s} />}
      {showFleet && <FleetPicker currentFamilyId={familyId} onSelect={handleFamilyChange} onClose={() => setShowFleet(false)} />}
    </>
  );
}
