// =============================================
// ConfirmDialog.jsx — Reusable confirm modal
// =============================================
import React, { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", onConfirm, onCancel, danger = false, th }) {
  const confirmBtnRef = useRef(null);

  // Focus confirm button on open; close on Escape
  useEffect(() => {
    if (!open) return;
    confirmBtnRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const { c, isBrut, isCirc, isGlass, isLG, isMobile, headingFont, bwh, bwm, bws } = th;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isLG ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 300, animation: "fadeIn 0.15s ease both" }}
      onClick={onCancel}
    >
      <div
        style={{ backgroundColor: isGlass ? "rgba(20,14,48,0.97)" : (isLG ? "rgba(255,255,255,0.75)" : c.surface), borderRadius: isBrut ? "0" : (isCirc ? "2rem" : "0.875rem"), padding: "1.75rem", maxWidth: "420px", width: "100%", boxShadow: c.modalShadow, animation: "slideUp 0.25s cubic-bezier(.16,1,.3,1) both", border: isBrut ? `3px solid ${c.border}` : `1px solid ${c.border}`, margin: isMobile ? "0.5rem" : "0" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon + title */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
          <div style={{ flexShrink: 0, width: "40px", height: "40px", borderRadius: isBrut ? "0" : "50%", backgroundColor: danger ? "rgba(239,68,68,0.12)" : "rgba(234,179,8,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertTriangle size={20} style={{ color: danger ? "#ef4444" : "#ca8a04" }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 id="confirm-title" style={{ margin: 0, fontSize: "1.0625rem", fontFamily: headingFont, fontWeight: bwh, color: c.textStrong }}>{title}</h2>
            {message && <p style={{ margin: "0.375rem 0 0", fontSize: "0.875rem", color: c.textSec, lineHeight: "1.5" }}>{message}</p>}
          </div>
          <button onClick={onCancel} aria-label="Close" style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: c.textSec, padding: "0.25rem", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.625rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
          <button onClick={onCancel} style={{ padding: "0.5rem 1.125rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: `1px solid ${c.border}`, backgroundColor: "transparent", color: c.text, cursor: "pointer", fontSize: "0.875rem", fontWeight: bwm }}>
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            style={{ padding: "0.5rem 1.25rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: "none", backgroundColor: danger ? "#ef4444" : c.accent, color: "#fff", cursor: "pointer", fontSize: "0.875rem", fontWeight: bws, boxShadow: danger ? "0 2px 8px rgba(239,68,68,0.35)" : `0 2px 8px ${c.btnGlow}` }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
