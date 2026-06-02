// Themed monthly record form (replaces Classic MonthlyForm in Modern view).
import React, { useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";
import { Btn } from "./ui";

export function MonthlyForm({ theme, monthlyForm, setMonthlyForm, showMonthlyForm, setShowMonthlyForm, submitting, onSubmit, editingMonthlyId, setEditingMonthlyId }) {
  const t = theme;
  const [errors, setErrors] = useState({});
  const firstRef = useRef(null);

  useEffect(() => {
    if (!showMonthlyForm) return;
    firstRef.current?.focus();
  }, [showMonthlyForm]);

  const reset = () => {
    setErrors({});
    setShowMonthlyForm(false);
    setEditingMonthlyId?.(null);
    setMonthlyForm({ month: "", profit: "" });
  };

  const validate = () => {
    const e = {};
    if (!(monthlyForm.month || "").trim()) e.month = "Month is required (e.g. March 2026)";
    const p = parseFloat(monthlyForm.profit);
    if (monthlyForm.profit === "" || isNaN(p)) e.profit = "Enter a valid profit amount";
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    onSubmit();
  };

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
    boxShadow: errors[field] ? "0 0 0 2px rgba(239,68,68,0.12)" : "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  });
  const errMsg = (f) => errors[f] && (
    <div style={{ fontSize: t.fz(11), color: "#ef4444", marginTop: 4 }}>{errors[f]}</div>
  );

  return (
    <Modal
      open={showMonthlyForm}
      onClose={reset}
      theme={theme}
      maxWidth={420}
      title={editingMonthlyId ? "Edit monthly record" : "Add monthly record"}
      footer={
        <>
          <Btn theme={t} onClick={reset}>Cancel</Btn>
          <button onClick={submit} disabled={submitting} style={{
            padding: "8px 14px", fontSize: t.fz(13), fontWeight: 500,
            background: t.accent, color: t.isDark ? "#0a0a0f" : "#fff",
            border: `1px solid ${t.accent}`, borderRadius: t.radius,
            cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1,
            fontFamily: "inherit",
          }}>{submitting ? "Saving…" : "Save"}</button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Month *</label>
          <input
            ref={firstRef}
            type="text"
            value={monthlyForm.month}
            onChange={(e) => { setMonthlyForm({ ...monthlyForm, month: e.target.value }); if (errors.month) setErrors((p) => ({ ...p, month: null })); }}
            placeholder="e.g. March 2026"
            style={inputStyle("month")}
          />
          {errMsg("month")}
        </div>
        <div>
          <label style={labelStyle}>Profit ($) *</label>
          <input
            type="number"
            step="0.01"
            value={monthlyForm.profit}
            onChange={(e) => { setMonthlyForm({ ...monthlyForm, profit: e.target.value }); if (errors.profit) setErrors((p) => ({ ...p, profit: null })); }}
            placeholder="e.g. 5500"
            style={inputStyle("profit")}
          />
          {errMsg("profit")}
        </div>
      </div>
    </Modal>
  );
}
