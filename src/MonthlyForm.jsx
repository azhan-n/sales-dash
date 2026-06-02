// =============================================
// MonthlyForm.jsx — Add monthly record modal with validation
// =============================================
import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

export function MonthlyForm({
  th,
  monthlyForm,
  setMonthlyForm,
  showMonthlyForm,
  setShowMonthlyForm,
  submitting,
  onSubmit,
  editingMonthlyId,
}) {
  const { c, isBrut, isCirc, isGlass, isLG, isMobile, isCompact, headingFont, bwh, bwm, bws } = th;
  const [errors, setErrors] = useState({});
  const firstInputRef = useRef(null);

  // Close on Escape; focus month field on open
  useEffect(() => {
    if (!showMonthlyForm) return;
    firstInputRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") resetForm(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showMonthlyForm]);

  const resetForm = () => {
    setErrors({});
    setShowMonthlyForm(false);
    setMonthlyForm({ month: "", profit: "" });
  };

  const validate = () => {
    const e = {};
    if (!(monthlyForm.month || "").trim()) {
      e.month = "Month is required (e.g. March 2026)";
    }
    const profit = parseFloat(monthlyForm.profit);
    if (monthlyForm.profit === "" || isNaN(profit)) {
      e.profit = "Enter a valid profit amount";
    }
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    onSubmit();
  };

  if (!showMonthlyForm) return null;

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="monthly-form-title"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isLG ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 200, animation: "fadeIn 0.2s cubic-bezier(.16,1,.3,1) both" }}
      onClick={resetForm}
    >
      <div
        style={{ backgroundColor: isGlass ? "rgba(20,14,48,0.95)" : (isLG ? "rgba(255,255,255,0.65)" : c.surface), borderRadius: isBrut ? "0" : (isCirc ? "2.5rem" : (isMobile ? "0.75rem" : "1rem")), padding: isMobile ? "1.25rem" : "2rem", maxWidth: "400px", width: "100%", boxShadow: c.modalShadow, animation: "slideUp 0.3s cubic-bezier(.16,1,.3,1) both", border: isBrut ? `3px solid ${c.border}` : `1px solid ${c.border}`, margin: isMobile ? "0.5rem" : "0" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: `1px solid ${c.border}` }}>
          <h2 id="monthly-form-title" style={{ fontSize: "1.25rem", fontFamily: headingFont, fontWeight: bwh, color: c.textStrong, margin: 0 }}>
            {editingMonthlyId ? "Edit Monthly Record" : "Add Monthly Record"}
          </h2>
          <button onClick={resetForm} aria-label="Close dialog" style={{ padding: "0.375rem", border: "none", background: "none", cursor: "pointer", color: c.textSec }}>
            <X size={20} />
          </button>
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div>
            <label style={fLabel}>Month *</label>
            <input
              ref={firstInputRef}
              type="text"
              value={monthlyForm.month}
              onChange={(e) => { setMonthlyForm({ ...monthlyForm, month: e.target.value }); if (errors.month) setErrors((p) => ({ ...p, month: null })); }}
              placeholder="e.g. March 2026"
              style={fInput("month")}
            />
            {errMsg("month")}
          </div>
          <div>
            <label style={fLabel}>Profit ($) *</label>
            <input
              type="number"
              step="0.01"
              value={monthlyForm.profit}
              onChange={(e) => { setMonthlyForm({ ...monthlyForm, profit: e.target.value }); if (errors.profit) setErrors((p) => ({ ...p, profit: null })); }}
              placeholder="e.g. 5500"
              style={fInput("profit")}
            />
            {errMsg("profit")}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
          <button onClick={resetForm} style={{ padding: "0.5rem 1.25rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: `1px solid ${c.border}`, backgroundColor: "transparent", color: c.text, cursor: "pointer", fontSize: "0.875rem", fontWeight: bwm }}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} style={{ padding: "0.5rem 1.5rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: "none", background: c.btnGrad, color: "#fff", cursor: submitting ? "not-allowed" : "pointer", fontSize: "0.875rem", fontWeight: bwm, opacity: submitting ? 0.7 : 1, boxShadow: `0 2px 8px ${c.btnGlow}` }}>
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
