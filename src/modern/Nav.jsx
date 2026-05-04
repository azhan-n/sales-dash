// Modern view navigation — Sidebar (with off-canvas drawer on mobile), TopBar, BottomTabs
import React from "react";
import { I, Btn } from "./ui";

export function Sidebar({ theme, navItems, route, setRoute, onAdd, isMobile, open, onClose }) {
  const t = theme;

  const inner = (
    <aside style={{
      width: 240,
      flexShrink: 0,
      background: t.sidebarBg || t.surface,
      borderRight: `1px solid ${t.border}`,
      padding: "max(20px, env(safe-area-inset-top)) 14px 20px",
      display: "flex", flexDirection: "column",
      position: isMobile ? "fixed" : "sticky",
      top: 0, left: 0,
      height: "100dvh",
      zIndex: isMobile ? 50 : 1,
      transform: isMobile ? (open ? "translateX(0)" : "translateX(-100%)") : "none",
      transition: "transform 0.22s ease",
      backdropFilter: t.glass ? "blur(20px)" : undefined,
      WebkitBackdropFilter: t.glass ? "blur(20px)" : undefined,
      boxShadow: isMobile && open ? "0 8px 32px rgba(0,0,0,0.18)" : undefined,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px", marginBottom: 24 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: `linear-gradient(135deg, ${t.accent}, ${t.chartB})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: "-0.02em",
        }}>₳</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em", color: t.text }}>Tether Line</div>
          <div style={{ fontSize: 11, color: t.textMuted }}>Personal P&L</div>
        </div>
        {isMobile && (
          <button onClick={onClose} aria-label="Close menu" style={{
            background: "transparent", border: "none", color: t.textMuted,
            cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 6,
          }}>{I.x(16)}</button>
        )}
      </div>

      <Btn theme={t} variant="primary" onClick={() => { onAdd(); if (isMobile) onClose?.(); }} style={{ justifyContent: "center", marginBottom: 20 }}>
        {I.plus(14)} New transaction
      </Btn>

      <div style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 8px", marginBottom: 6 }}>Workspace</div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map((n) => (
          <button key={n.key} onClick={() => { setRoute(n.key); if (isMobile) onClose?.(); }} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 10px",
            background: route === n.key ? t.accentSoft : "transparent",
            color: route === n.key ? t.accent : t.textSec,
            border: "none", cursor: "pointer",
            borderRadius: 8,
            fontSize: 13, fontWeight: 500,
            fontFamily: "inherit",
            textAlign: "left",
            transition: "background .15s",
          }}
            onMouseEnter={(e) => { if (route !== n.key) e.currentTarget.style.background = t.surfaceAlt; }}
            onMouseLeave={(e) => { if (route !== n.key) e.currentTarget.style.background = "transparent"; }}>
            <span style={{ display: "flex", color: "inherit" }}>{n.icon(16)}</span>
            {n.label}
          </button>
        ))}
      </nav>

      <div style={{ marginTop: "auto", padding: "12px 10px", borderTop: `1px solid ${t.border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: t.surfaceDeep, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: t.textSec }}>AN</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Azhan N.</div>
          <div style={{ fontSize: 10, color: t.textMuted }}>Owner</div>
        </div>
      </div>
    </aside>
  );

  if (!isMobile) return inner;

  return (
    <>
      {open && (
        <div onClick={onClose} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          zIndex: 49, backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)",
        }} />
      )}
      {inner}
    </>
  );
}

export function TopBar({ theme, route, navItems, isMobile, onMenuClick, onAdd }) {
  const t = theme;
  const current = navItems.find((n) => n.key === route);
  return (
    <header style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: isMobile
        ? `calc(12px + env(safe-area-inset-top)) 16px 12px`
        : "14px clamp(16px, 3vw, 40px)",
      borderBottom: `1px solid ${t.border}`,
      background: t.glass ? "transparent" : t.surface,
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      position: "sticky", top: 0, zIndex: 20,
    }}>
      {isMobile && (
        <button onClick={onMenuClick} aria-label="Open menu" style={{
          background: "transparent", border: `1px solid ${t.border}`, color: t.text,
          cursor: "pointer", padding: 6, display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 6, flexShrink: 0,
        }}>{I.menu(16)}</button>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0, overflow: "hidden" }}>
        <div style={{ fontSize: 13, color: t.textMuted, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {!isMobile && (<>
            <span>Tether Line</span>
            <span style={{ color: t.border }}>/</span>
          </>)}
          <span style={{ color: t.text, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{current?.label}</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {!isMobile && (
          <div style={{
            position: "relative", display: "flex", alignItems: "center",
            background: t.surfaceAlt, border: `1px solid ${t.border}`,
            borderRadius: 8,
            padding: "0 10px", height: 32, gap: 6,
          }}>
            <span style={{ color: t.textMuted, display: "flex" }}>{I.search(13)}</span>
            <input placeholder="Search transactions…" style={{
              border: "none", background: "transparent", outline: "none",
              fontSize: 12, color: t.text, width: 180,
              fontFamily: "inherit",
            }} />
            <span style={{ fontSize: 10, color: t.textMuted, padding: "2px 5px", border: `1px solid ${t.border}`, borderRadius: 4 }}>⌘K</span>
          </div>
        )}
        <Btn theme={t} size="sm" variant="primary" onClick={onAdd}>{I.plus(13)}{!isMobile && " Add"}</Btn>
      </div>
    </header>
  );
}

export function BottomTabs({ theme, navItems, route, setRoute }) {
  const t = theme;
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 15,
      background: t.surface, borderTop: `1px solid ${t.border}`,
      display: "flex",
      paddingTop: 8, paddingLeft: 4, paddingRight: 4,
      paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
    }}>
      {navItems.map((n) => (
        <button key={n.key} onClick={() => setRoute(n.key)} style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          padding: "6px 4px",
          background: "transparent", border: "none", cursor: "pointer",
          color: route === n.key ? t.accent : t.textMuted,
          fontFamily: "inherit", fontSize: 10, fontWeight: 500,
        }}>
          {n.icon(18)}
          <span>{n.label}</span>
        </button>
      ))}
    </nav>
  );
}
