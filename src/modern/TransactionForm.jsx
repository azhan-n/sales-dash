// Themed transaction form (replaces Classic TransactionForm in Modern view).
// Uses the same txForm state shape so the existing submitTransaction handler works unchanged.
import React, { useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";
import { Btn, fmtFull } from "./ui";

// dd/mm/yyyy ↔ yyyy-mm-dd (for input[type=date]). Tolerates legacy dd/mm/yy on read.
const toInputDate = (s) => {
  if (!s) return "";
  const [dd, mm, yy] = s.split("/");
  if (!dd || !mm || !yy) return "";
  const yyyy = yy.length === 2 ? `20${yy}` : yy;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
};
const fromInputDate = (yyyymmdd) => {
  if (!yyyymmdd) return "";
  const [yyyy, mm, dd] = yyyymmdd.split("-");
  return dd && mm && yyyy ? `${dd}/${mm}/${yyyy}` : "";
};

export function TransactionForm({
  theme,
  txForm,
  setTxForm,
  editingTxId,
  setEditingTxId,
  showTxForm,
  setShowTxForm,
  submitting,
  cardTypes = [],
  ownerInfoMap = {},
  recentRates = [],
  onSubmit,
}) {
  const t = theme;
  const [errors, setErrors] = useState({});
  const firstRef = useRef(null);

  useEffect(() => {
    if (!showTxForm) return;
    firstRef.current?.focus();
  }, [showTxForm]);

  const ownerList = Object.keys(ownerInfoMap || {}).sort();
  const ownerKey = (txForm.owner || "").toUpperCase();
  const ownerCards = (ownerInfoMap || {})[ownerKey] || [];
  const cardIsLocked = ownerCards.length === 1;
  const cardIsDropdown = ownerCards.length > 1;

  const reset = () => {
    setErrors({});
    setShowTxForm(false);
    setEditingTxId(null);
    setTxForm({ cardType: "VISA DEBIT", cardNumber: "", owner: "", buyRate: "15.42", buyAmount: "", sellRate: "", sellAmount: "", date: fromInputDate(new Date().toISOString().split("T")[0]) });
  };

  const handleOwnerChange = (name) => {
    const key = name.toUpperCase();
    const cs = (ownerInfoMap || {})[key] || [];
    if (cs.length === 1) {
      setTxForm((f) => ({ ...f, owner: name, cardNumber: cs[0].cardNumber, cardType: cs[0].type }));
    } else {
      setTxForm((f) => ({ ...f, owner: name, cardNumber: "", cardType: "VISA DEBIT" }));
    }
    if (errors.owner) setErrors((p) => ({ ...p, owner: null }));
    if (errors.cardNumber) setErrors((p) => ({ ...p, cardNumber: null }));
  };

  const handleCardSelect = (cardNumber) => {
    const match = ownerCards.find((c) => c.cardNumber === cardNumber);
    setTxForm((f) => ({ ...f, cardNumber, cardType: match ? match.type : f.cardType }));
    if (errors.cardNumber) setErrors((p) => ({ ...p, cardNumber: null }));
  };

  const validate = () => {
    const e = {};
    if (!(txForm.owner || "").trim()) e.owner = "Owner is required";
    if (!(txForm.cardNumber || "").trim()) e.cardNumber = "Card number is required";
    if (!txForm.buyRate || isNaN(parseFloat(txForm.buyRate)) || parseFloat(txForm.buyRate) <= 0) e.buyRate = "Enter a valid buy rate";
    if (!txForm.buyAmount || isNaN(parseFloat(txForm.buyAmount)) || parseFloat(txForm.buyAmount) <= 0) e.buyAmount = "Enter a valid buy amount";
    if (!txForm.sellRate || isNaN(parseFloat(txForm.sellRate)) || parseFloat(txForm.sellRate) <= 0) e.sellRate = "Enter a valid sell rate";
    if (!txForm.sellAmount || isNaN(parseFloat(txForm.sellAmount)) || parseFloat(txForm.sellAmount) <= 0) e.sellAmount = "Enter a valid sell amount";
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    onSubmit();
  };

  const ratesArr = Array.isArray(recentRates) ? recentRates.filter((x) => x > 0) : [];
  const rateAvg = ratesArr.length ? ratesArr.reduce((s, v) => s + v, 0) / ratesArr.length : 0;
  const currentSellRate = parseFloat(txForm.sellRate) || 0;
  const rateDevPct = rateAvg > 0 && currentSellRate > 0 ? Math.abs((currentSellRate - rateAvg) / rateAvg) * 100 : 0;
  const rateDevDir = currentSellRate > rateAvg ? "above" : "below";
  const showRateWarning = rateDevPct > 5 && ratesArr.length > 0 && currentSellRate > 0;

  const br = parseFloat(txForm.buyRate) || 0;
  const ba = parseFloat(txForm.buyAmount) || 0;
  const sr = parseFloat(txForm.sellRate) || 0;
  const sa = parseFloat(txForm.sellAmount) || 0;
  const cost = br * ba;
  const gross = sr * sa;
  const net = gross - cost;
  const margin = cost > 0 ? (net / cost) * 100 : 0;

  const labelStyle = { display: "block", fontSize: t.fz(11), fontWeight: 500, marginBottom: 6, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" };
  const inputStyle = (field) => ({
    padding: "8px 10px", fontSize: t.fz(13),
    border: `1px solid ${errors[field] ? "#ef4444" : t.border}`,
    borderRadius: t.radius,
    width: "100%",
    background: t.surfaceAlt,
    color: t.text,
    outline: "none",
    fontFamily: "inherit",
    fontVariantNumeric: "tabular-nums",
    boxShadow: errors[field] ? "0 0 0 2px rgba(239,68,68,0.12)" : "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  });
  const errMsg = (f) => errors[f] && (
    <div style={{ fontSize: t.fz(11), color: "#ef4444", marginTop: 4 }}>{errors[f]}</div>
  );

  return (
    <Modal
      open={showTxForm}
      onClose={reset}
      theme={theme}
      maxWidth={560}
      title={editingTxId ? "Edit transaction" : "New transaction"}
      footer={
        <>
          <Btn theme={t} onClick={reset}>Cancel</Btn>
          <button onClick={submit} disabled={submitting} style={{
            padding: "8px 14px", fontSize: t.fz(13), fontWeight: 500,
            background: t.accent, color: t.isDark ? "#0a0a0f" : "#fff",
            border: `1px solid ${t.accent}`, borderRadius: t.radius,
            cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1,
            fontFamily: "inherit",
          }}>{submitting ? "Saving…" : (editingTxId ? "Update" : "Save")}</button>
        </>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <div>
          <label style={labelStyle}>Owner *</label>
          {ownerList.length > 0 ? (
            <select ref={firstRef} value={txForm.owner} onChange={(e) => handleOwnerChange(e.target.value)} style={inputStyle("owner")}>
              <option value="">Select owner…</option>
              {ownerList.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          ) : (
            <input ref={firstRef} type="text" value={txForm.owner} onChange={(e) => { setTxForm({ ...txForm, owner: e.target.value }); if (errors.owner) setErrors((p) => ({ ...p, owner: null })); }} placeholder="Name" style={inputStyle("owner")} />
          )}
          {errMsg("owner")}
        </div>
        <div>
          <label style={labelStyle}>Card number *</label>
          {cardIsDropdown ? (
            <select value={txForm.cardNumber} onChange={(e) => handleCardSelect(e.target.value)} style={inputStyle("cardNumber")}>
              <option value="">Select card…</option>
              {ownerCards.map((c) => <option key={c.cardNumber} value={c.cardNumber}>{c.cardNumber} ({c.type})</option>)}
            </select>
          ) : (
            <input type="text" value={txForm.cardNumber} onChange={(e) => { if (!cardIsLocked) { setTxForm({ ...txForm, cardNumber: e.target.value }); if (errors.cardNumber) setErrors((p) => ({ ...p, cardNumber: null })); } }} placeholder="e.g. 2581" readOnly={cardIsLocked} style={{ ...inputStyle("cardNumber"), background: cardIsLocked ? t.surfaceDeep : t.surfaceAlt, cursor: cardIsLocked ? "default" : "text" }} />
          )}
          {errMsg("cardNumber")}
        </div>
        <div>
          <label style={labelStyle}>Card type</label>
          <select value={txForm.cardType} onChange={(e) => setTxForm({ ...txForm, cardType: e.target.value })} style={{ ...inputStyle("cardType"), background: (cardIsLocked || cardIsDropdown) ? t.surfaceDeep : t.surfaceAlt }} disabled={cardIsLocked || cardIsDropdown}>
            {cardTypes.map((ct) => <option key={ct} value={ct}>{ct}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Date</label>
          <input type="date" value={toInputDate(txForm.date)} onChange={(e) => setTxForm({ ...txForm, date: fromInputDate(e.target.value) })} style={{ ...inputStyle("date"), colorScheme: t.isDark ? "dark" : "auto" }} />
        </div>
        <div>
          <label style={labelStyle}>Buy rate *</label>
          <input type="number" step="0.01" min="0" value={txForm.buyRate} onChange={(e) => { setTxForm({ ...txForm, buyRate: e.target.value }); if (errors.buyRate) setErrors((p) => ({ ...p, buyRate: null })); }} style={inputStyle("buyRate")} />
          {errMsg("buyRate")}
        </div>
        <div>
          <label style={labelStyle}>Buy amount ($) *</label>
          <input type="number" step="0.01" min="0" value={txForm.buyAmount} onChange={(e) => { setTxForm({ ...txForm, buyAmount: e.target.value }); if (errors.buyAmount) setErrors((p) => ({ ...p, buyAmount: null })); }} style={inputStyle("buyAmount")} />
          {errMsg("buyAmount")}
        </div>
        <div>
          <label style={labelStyle}>Sell rate *</label>
          <input type="number" step="0.01" min="0" value={txForm.sellRate} onChange={(e) => { setTxForm({ ...txForm, sellRate: e.target.value }); if (errors.sellRate) setErrors((p) => ({ ...p, sellRate: null })); }} style={inputStyle("sellRate")} />
          {errMsg("sellRate")}
          {showRateWarning && (
            <div style={{ marginTop: 6, padding: "6px 8px", background: "rgba(217,119,6,0.10)", border: "1px solid rgba(217,119,6,0.25)", borderRadius: t.radiusSm, fontSize: t.fz(11), color: t.textSec }}>
              Rate {currentSellRate.toFixed(2)} is {rateDevPct.toFixed(1)}% {rateDevDir} the recent average ({rateAvg.toFixed(2)})
            </div>
          )}
        </div>
        <div>
          <label style={labelStyle}>Sell amount ($) *</label>
          <input type="number" step="0.01" min="0" value={txForm.sellAmount} onChange={(e) => { setTxForm({ ...txForm, sellAmount: e.target.value }); if (errors.sellAmount) setErrors((p) => ({ ...p, sellAmount: null })); }} style={inputStyle("sellAmount")} />
          {errMsg("sellAmount")}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginTop: 16, paddingTop: 12, borderTop: `1px dashed ${t.border}` }}>
        <Computed label="Cost" value={cost} t={t} />
        <Computed label="Gross" value={gross} t={t} color={t.textSec} />
        <Computed label="Net" value={net} t={t} color={net >= 0 ? t.positive : t.negative} />
        <Computed label="Margin" value={margin} t={t} suffix="%" color={margin >= 0 ? t.positive : t.negative} />
      </div>
    </Modal>
  );
}

function Computed({ label, value, t, suffix = "MVR", color }) {
  return (
    <div>
      <div style={{ fontSize: t.fz(10), fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: t.fz(16), fontWeight: 600, color: color || t.text, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
        {suffix === "%" ? `${value.toFixed(1)}%` : fmtFull(value)}
        {suffix !== "%" && <span style={{ fontSize: t.fz(10), color: t.textMuted, fontWeight: 500, marginLeft: 4 }}>{suffix}</span>}
      </div>
    </div>
  );
}
