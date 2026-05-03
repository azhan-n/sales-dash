// Themed confirm dialog for the Modern (Tether Line) view.
import React, { useEffect, useRef } from "react";
import { Modal } from "./Modal";
import { Btn } from "./ui";

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, onConfirm, onCancel, theme }) {
  const confirmRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
  }, [open]);

  if (!open) return null;
  const t = theme;
  const dangerColor = t.negative || "#e11d48";
  const bg = danger ? `${dangerColor}1f` : `${t.accent}1f`;
  const fg = danger ? dangerColor : t.accent;

  return (
    <Modal open={open} onClose={onCancel} theme={theme} maxWidth={420} zIndex={300}
      title={null}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: bg, color: fg,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 4, lineHeight: 1.35 }}>{title}</div>
          {message && <div style={{ fontSize: 13, color: t.textSec, lineHeight: 1.5 }}>{message}</div>}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
        <Btn theme={t} onClick={onCancel}>{cancelLabel}</Btn>
        <button
          ref={confirmRef}
          onClick={onConfirm}
          style={{
            padding: "8px 14px", fontSize: 13, fontWeight: 500,
            background: danger ? dangerColor : t.accent,
            color: "#fff",
            border: `1px solid ${danger ? dangerColor : t.accent}`,
            borderRadius: t.radius,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >{confirmLabel}</button>
      </div>
    </Modal>
  );
}
