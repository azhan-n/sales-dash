// =============================================
// TransactionForm.jsx — Add/Edit transaction modal with validation
// =============================================
import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

export function TransactionForm({
  th,        // theme object: { c, isBrut, isCirc, isGlass, isLG, isTerm, isMobile, isCompact, headingFont, bwh, bwm, bws, bwx, r, rSm }
  txForm,
  setTxForm,
  editingTxId,
  setEditingTxId,
  showTxForm,
  setShowTxForm,
  submitting,
  cardTypes,
  onSubmit,  // async (formData) => void — called with validated form
}) {
  const { c, isBrut, isCirc, isGlass, isLG, isTerm, isMobile, isCompact, headingFont, bwh, bwm, bws, bwx, r, rSm } = th;
  const [errors, setErrors] = useState({});
  const firstInputRef = useRef(null);

  // Close on Escape; focus first field on open
  useEffect(() => {
    if (!showTxForm) return;
    firstInputRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") resetForm(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showTxForm]);

  const resetForm = () => {
    setErrors({});
    setShowTxForm(false);
    setEditingTxId(null);
    setTxForm({ cardType: "VISA DEBIT", cardNumber: "", owner: "", buyRate: "", buyAmount: "", sellRate: "", sellAmount: "" });
  };

  const validate = () => {
    const e = {};
    if (!txForm.owner.trim()) e.owner = "Owner is required";
    if (!txForm.cardNumber.trim()) e.cardNumber = "Card number is required";
    if (!txForm.buyRate || isNaN(parseFloat(txForm.buyRate)) || parseFloat(txForm.buyRate) <= 0)
      e.buyRate = "Enter a valid buy rate";
    if (!txForm.buyAmount || isNaN(parseFloat(txForm.buyAmount)) || parseFloat(txForm.buyAmount) <= 0)
      e.buyAmount = "Enter a valid buy amount";
    if (!txForm.sellRate || isNaN(parseFloat(txForm.sellRate)) || parseFloat(txForm.sellRate) <= 0)
      e.sellRate = "Enter a valid sell rate";
    if (!txForm.sellAmount || isNaN(parseFloat(txForm.sellAmount)) || parseFloat(txForm.sellAmount) <= 0)
      e.sellAmount = "Enter a valid sell amount";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    onSubmit();
  };

  if (!showTxForm) return null;

  const fInput = (field) => ({
    padding: isCompact ? "0.5rem" : "0.625rem 0.75rem",
    border: `1px solid ${errors[field] ? "#ef4444" : c.inputBorder}`,
    borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.375rem"),
    fontSize: isCompact ? "0.8125rem" : "0.875rem",
    width: "100%",
    backgroundColor: c.inputBg,
    color: c.text,
    outline: "none",
    boxShadow: errors[field] ? "0 0 0 2px rgba(239,68,68,0.15)" : "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  });

  const fLabel = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: bws,
    marginBottom: "0.375rem",
    color: c.textSec,
  };

  const errMsg = (field) =>
    errors[field] ? (
      <div style={{ fontSize: "0.6875rem", color: "#ef4444", marginTop: "0.25rem", fontWeight: "500" }}>
        {errors[field]}
      </div>
    ) : null;

  const br = parseFloat(txForm.buyRate) || 0;
  const ba = parseFloat(txForm.buyAmount) || 0;
  const sr = parseFloat(txForm.sellRate) || 0;
  const sa = parseFloat(txForm.sellAmount) || 0;
  const cost = br * ba;
  const gross = sr * sa;
  const net = gross - cost;

  const compStyle = {
    padding: isCompact ? "0.5rem" : "0.625rem 0.75rem",
    borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.375rem"),
    fontSize: isCompact ? "0.8125rem" : "0.875rem",
    width: "100%",
    backgroundColor: c.surfaceAlt,
    color: c.textStrong,
    fontWeight: bwx,
    border: `1px solid ${c.border}`,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-form-title"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isLG ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 200, animation: "fadeIn 0.2s cubic-bezier(.16,1,.3,1) both" }}
      onClick={resetForm}
    >
      <div
        style={{ backgroundColor: isGlass ? "rgba(20,14,48,0.95)" : (isLG ? "rgba(255,255,255,0.65)" : c.surface), borderRadius: isBrut ? "0" : (isCirc ? "2.5rem" : (isMobile ? "0.75rem" : "1rem")), padding: isMobile ? "1.25rem" : "2rem", maxWidth: isMobile ? "100%" : "520px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: c.modalShadow, animation: "slideUp 0.3s cubic-bezier(.16,1,.3,1) both", border: isBrut ? `3px solid ${c.border}` : `1px solid ${c.border}`, margin: isMobile ? "0.5rem" : "0" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: `1px solid ${c.border}` }}>
          <h2 id="tx-form-title" style={{ fontSize: "1.25rem", fontFamily: headingFont, fontWeight: bwh, color: c.textStrong, margin: 0 }}>
            {editingTxId ? "Edit Transaction" : "Add Transaction"}
          </h2>
          <button onClick={resetForm} aria-label="Close dialog" style={{ padding: "0.375rem", border: "none", background: "none", cursor: "pointer", color: c.textSec }}>
            <X size={20} />
          </button>
        </div>

        {/* Fields */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label style={fLabel}>Card Type</label>
            <select value={txForm.cardType} onChange={(e) => setTxForm({ ...txForm, cardType: e.target.value })} style={fInput("cardType")}>
              {cardTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={fLabel}>Card Number *</label>
            <input ref={firstInputRef} type="text" value={txForm.cardNumber} onChange={(e) => { setTxForm({ ...txForm, cardNumber: e.target.value }); if (errors.cardNumber) setErrors((p) => ({ ...p, cardNumber: null })); }} placeholder="e.g. 2581" style={fInput("cardNumber")} />
            {errMsg("cardNumber")}
          </div>
          <div>
            <label style={fLabel}>Owner *</label>
            <input type="text" value={txForm.owner} onChange={(e) => { setTxForm({ ...txForm, owner: e.target.value }); if (errors.owner) setErrors((p) => ({ ...p, owner: null })); }} placeholder="Name" style={fInput("owner")} />
            {errMsg("owner")}
          </div>
          <div>
            <label style={fLabel}>Buy Rate *</label>
            <input type="number" step="0.01" min="0" value={txForm.buyRate} onChange={(e) => { setTxForm({ ...txForm, buyRate: e.target.value }); if (errors.buyRate) setErrors((p) => ({ ...p, buyRate: null })); }} style={fInput("buyRate")} />
            {errMsg("buyRate")}
          </div>
          <div>
            <label style={fLabel}>Buy Amount ($) *</label>
            <input type="number" step="0.01" min="0" value={txForm.buyAmount} onChange={(e) => { setTxForm({ ...txForm, buyAmount: e.target.value }); if (errors.buyAmount) setErrors((p) => ({ ...p, buyAmount: null })); }} style={fInput("buyAmount")} />
            {errMsg("buyAmount")}
          </div>
          <div>
            <label style={fLabel}>Sell Rate *</label>
            <input type="number" step="0.01" min="0" value={txForm.sellRate} onChange={(e) => { setTxForm({ ...txForm, sellRate: e.target.value }); if (errors.sellRate) setErrors((p) => ({ ...p, sellRate: null })); }} style={fInput("sellRate")} />
            {errMsg("sellRate")}
          </div>
          <div>
            <label style={fLabel}>Sell Amount ($) *</label>
            <input type="number" step="0.01" min="0" value={txForm.sellAmount} onChange={(e) => { setTxForm({ ...txForm, sellAmount: e.target.value }); if (errors.sellAmount) setErrors((p) => ({ ...p, sellAmount: null })); }} style={fInput("sellAmount")} />
            {errMsg("sellAmount")}
          </div>
        </div>

        {/* Auto-computed */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
          <div><label style={fLabel}>Cost</label><div style={compStyle}>ރ.{cost.toFixed(2)}</div></div>
          <div><label style={fLabel}>Gross Profit</label><div style={{ ...compStyle, color: isTerm ? c.text : "#f97316" }}>ރ.{gross.toFixed(2)}</div></div>
          <div><label style={fLabel}>Net Profit</label><div style={{ ...compStyle, color: isTerm ? c.text : (net >= 0 ? "#16a34a" : "#ef4444") }}>ރ.{net.toFixed(2)}</div></div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
          <button onClick={resetForm} style={{ padding: "0.5rem 1.25rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: `1px solid ${c.border}`, backgroundColor: "transparent", color: c.text, cursor: "pointer", fontSize: "0.875rem", fontWeight: bwm }}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} style={{ padding: "0.5rem 1.5rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: "none", background: c.btnGrad, color: "#fff", cursor: submitting ? "not-allowed" : "pointer", fontSize: "0.875rem", fontWeight: bwm, opacity: submitting ? 0.7 : 1, boxShadow: `0 2px 8px ${c.btnGlow}` }}>
            {submitting ? "Saving..." : (editingTxId ? "Update" : "Save")}
          </button>
        </div>
      </div>
    </div>
  );
}
