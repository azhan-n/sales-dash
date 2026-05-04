// Themed modal scaffold for the Modern (Tether Line) view.
// Backdrop-blur scrim + centered card with theme tokens.
import React, { useEffect } from "react";
import { useIcons } from "./ui";

export function Modal({ open, onClose, title, children, theme, maxWidth = 520, footer, zIndex = 200 }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const t = theme;
  const I = useIcons();
  const isMobileWidth = typeof window !== "undefined" && window.innerWidth < 760;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: t.isDark ? "rgba(0,0,0,0.6)" : "rgba(10,30,51,0.45)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        display: "flex",
        alignItems: isMobileWidth ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobileWidth ? 0 : "1rem",
        zIndex,
        animation: "fadeIn 0.18s cubic-bezier(.16,1,.3,1) both",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: t.surface,
          color: t.text,
          border: `1px solid ${t.border}`,
          borderRadius: isMobileWidth ? "16px 16px 0 0" : t.radius,
          boxShadow: t.shadowHover || t.shadow,
          width: "100%",
          maxWidth,
          maxHeight: isMobileWidth ? "92vh" : "90vh",
          overflowY: "auto",
          backdropFilter: t.glass ? "blur(20px) saturate(150%)" : undefined,
          WebkitBackdropFilter: t.glass ? "blur(20px) saturate(150%)" : undefined,
          animation: "slideUp 0.25s cubic-bezier(.16,1,.3,1) both",
          fontFamily: "inherit",
        }}
      >
        {title && (
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "16px 20px", borderBottom: `1px solid ${t.border}`,
          }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: t.text, letterSpacing: "-0.01em" }}>
              {title}
            </h2>
            {onClose && (
              <button onClick={onClose} aria-label="Close dialog" style={{
                background: "transparent", border: "none", color: t.textMuted,
                cursor: "pointer", padding: 4, display: "flex", borderRadius: 6,
              }}>{I.x(18)}</button>
            )}
          </div>
        )}
        <div style={{ padding: "20px" }}>{children}</div>
        {footer && (
          <div style={{
            padding: "12px 20px", borderTop: `1px solid ${t.border}`,
            background: t.surfaceAlt,
            display: "flex", gap: 8, justifyContent: "flex-end",
            borderRadius: isMobileWidth ? 0 : `0 0 ${t.radius} ${t.radius}`,
          }}>{footer}</div>
        )}
      </div>
    </div>
  );
}
