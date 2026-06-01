// Modern view UI primitives — icons, Btn, Badge, Card, formatters
import React from "react";
import { parseDate } from "../utils";

export const I = {
  home: (p = 16) => <svg width={p} height={p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11L12 4l9 7" /><path d="M5 10v10h14V10" /></svg>,
  list: (p = 16) => <svg width={p} height={p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>,
  calendar: (p = 16) => <svg width={p} height={p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>,
  settings: (p = 16) => <svg width={p} height={p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  plus: (p = 16) => <svg width={p} height={p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>,
  search: (p = 16) => <svg width={p} height={p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>,
  download: (p = 16) => <svg width={p} height={p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>,
  edit: (p = 16) => <svg width={p} height={p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>,
  trash: (p = 16) => <svg width={p} height={p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>,
  x: (p = 16) => <svg width={p} height={p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>,
  arrowUp: (p = 14) => <svg width={p} height={p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>,
  arrowDown: (p = 14) => <svg width={p} height={p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>,
  filter: (p = 16) => <svg width={p} height={p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>,
  chevron: (p = 14) => <svg width={p} height={p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>,
  menu: (p = 16) => <svg width={p} height={p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>,
};

export const IconContext = React.createContext(null);
export function useIcons() { return React.useContext(IconContext) || I; }

// Eases a numeric value from its previous render value toward `target` over
// `duration` ms. On first mount it counts up from 0. Respects reduced motion.
export function useCountUp(target, duration = 800) {
  const reduced = typeof window !== "undefined"
    && window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const safeTarget = Number(target) || 0;
  const [value, setValue] = React.useState(reduced ? safeTarget : 0);
  React.useEffect(() => {
    if (reduced) { setValue(safeTarget); return; }
    let raf;
    let start;
    const from = value;
    const to = safeTarget;
    if (Math.abs(from - to) < 0.5) { setValue(to); return; }
    const tick = (t) => {
      if (start == null) start = t;
      const k = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setValue(from + (to - from) * eased);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeTarget, duration, reduced]);
  return value;
}

export function Btn({ children, variant = "secondary", size = "md", onClick, theme, style, ...rest }) {
  const t = theme;
  const isPri = variant === "primary";
  const isGhost = variant === "ghost";
  const pad = size === "sm" ? "6px 10px" : size === "xs" ? "4px 8px" : "8px 14px";
  const fs = t.fz ? t.fz(size === "sm" ? 12 : size === "xs" ? 11 : 13) : (size === "sm" ? 12 : size === "xs" ? 11 : 13);
  const bg = isPri ? t.accent : isGhost ? "transparent" : t.surface;
  const fg = isPri ? (t.isDark ? "#0a0a0f" : "#fff") : t.text;
  return (
    <button onClick={onClick} style={{
      padding: pad, fontSize: fs, fontWeight: 500,
      background: bg, color: fg,
      border: `1px solid ${isPri ? t.accent : isGhost ? "transparent" : t.border}`,
      borderRadius: t.radius,
      cursor: "pointer",
      display: "inline-flex", alignItems: "center", gap: 6,
      whiteSpace: "nowrap",
      transition: "background .15s ease, border-color .15s ease, color .15s ease, transform .12s ease, box-shadow .15s ease",
      fontFamily: "inherit",
      ...style,
    }}
      onMouseEnter={(e) => { if (!isPri && !isGhost) e.currentTarget.style.background = t.surfaceAlt; if (isGhost) e.currentTarget.style.background = t.accentSoft; }}
      onMouseLeave={(e) => { if (!isPri && !isGhost) e.currentTarget.style.background = t.surface; if (isGhost) e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = ""; }}
      onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = ""; }}
      {...rest}>{children}</button>
  );
}

export function Badge({ children, color, theme, style }) {
  const t = theme;
  const bg = color ? color + "22" : t.surfaceDeep;
  const fg = color || t.textSec;
  return <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "2px 8px", fontSize: t?.fz ? t.fz(11) : 11, fontWeight: 500,
    background: bg, color: fg,
    borderRadius: t.brutal ? 0 : 999,
    border: t.brutal ? `1.5px solid ${fg}` : "none",
    fontVariantNumeric: "tabular-nums",
    ...style,
  }}>{children}</span>;
}

export function Card({ children, theme, style, pad = 16, hoverable = true, onClick, ...rest }) {
  const t = theme;
  const baseShadow = (style && style.boxShadow) || t.shadow;
  const lift = hoverable && !t.brutal;
  return <div
    onClick={onClick}
    style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: t.radius,
      padding: pad,
      boxShadow: baseShadow,
      backdropFilter: t.glass ? "blur(20px) saturate(150%)" : undefined,
      WebkitBackdropFilter: t.glass ? "blur(20px) saturate(150%)" : undefined,
      transition: lift ? "transform .2s cubic-bezier(.4,0,.2,1), box-shadow .2s cubic-bezier(.4,0,.2,1), border-color .2s ease" : undefined,
      ...style,
    }}
    onMouseEnter={lift ? (e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      if (t.shadowHover) e.currentTarget.style.boxShadow = t.shadowHover;
    } : undefined}
    onMouseLeave={lift ? (e) => {
      e.currentTarget.style.transform = "";
      e.currentTarget.style.boxShadow = baseShadow;
    } : undefined}
    {...rest}
  >{children}</div>;
}

export const cardColors = {
  "VISA DEBIT": "#2563eb",
  "VISA CREDIT": "#059669",
  "AMEX": "#7c3aed",
  "MASTERCARD": "#f59e0b",
  "SELLER": "#64748b",
};

export function CardTypeBadge({ type, theme }) {
  return <Badge color={cardColors[type] || theme.textMuted} theme={theme}>{type || "—"}</Badge>;
}

// ── Semantic value badges ──────────────────────────────────────────────────
const pill = (color, bg, t, size = "md") => {
  const dims = size === "lg"
    ? { padding: "3px 12px", fontSize: t.fz ? t.fz(20) : 20, fontWeight: 700, letterSpacing: "-0.01em" }
    : { padding: "2px 8px",  fontSize: t.fz ? t.fz(12) : 12, fontWeight: 600 };
  return {
    display: "inline-flex", alignItems: "center",
    borderRadius: t.brutal ? 0 : 999,
    background: bg, color,
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
    ...dims,
  };
};

export function NetBadge({ value, theme: t, size = "md" }) {
  const v = Number(value) || 0;
  const pos = v >= 0;
  const color = pos ? t.positive : t.negative;
  return <span style={pill(color, color + "22", t, size)}>{pos ? "+" : "−"}{fmtFull(Math.abs(v))}</span>;
}
export function GrossBadge({ value, theme: t, size = "md" }) {
  const color = t.isDark ? "#fdba74" : "#ea580c";
  const bg    = t.isDark ? "rgba(253,186,116,0.18)" : "#fff7ed";
  return <span style={pill(color, bg, t, size)}>{fmtFull(Number(value) || 0)}</span>;
}
export function CostBadge({ value, theme: t, size = "md" }) {
  const color = t.isDark ? "#93c5fd" : "#2563eb";
  const bg    = t.isDark ? "rgba(147,197,253,0.18)" : "#eff6ff";
  return <span style={pill(color, bg, t, size)}>{fmtFull(Number(value) || 0)}</span>;
}
export function UsdBadge({ value, theme: t, size = "md" }) {
  const color = t.isDark ? "#c4b5fd" : "#7c3aed";
  const bg    = t.isDark ? "rgba(196,181,253,0.18)" : "#f5f3ff";
  return <span style={pill(color, bg, t, size)}>{fmtUSD(value)}</span>;
}
export function RateBadge({ value, theme: t, decimals = 2, size = "md" }) {
  const color = t.isDark ? "#5eead4" : "#0f766e";
  const bg    = t.isDark ? "rgba(94,234,212,0.18)" : "#f0fdfa";
  return <span style={pill(color, bg, t, size)}>{(Number(value) || 0).toFixed(decimals)}</span>;
}
export function MarginBadge({ value, theme: t, size = "md" }) {
  const v = Number(value) || 0;
  let color, bg;
  if (v >= 15)     { color = t.positive;  bg = t.positive + "22"; }
  else if (v >= 5) { color = t.isDark ? "#fcd34d" : "#d97706"; bg = t.isDark ? "rgba(252,211,77,0.18)" : "#fffbeb"; }
  else             { color = t.negative;  bg = t.negative + "22"; }
  return <span style={pill(color, bg, t, size)}>{v.toFixed(1)}%</span>;
}
export function CountBadge({ value, theme: t, label = "", size = "md" }) {
  return <span style={pill(t.accent, t.accentSoft, t, size)}>{Number(value).toLocaleString()}{label && ` ${label}`}</span>;
}
export function CardNumBadge({ value, theme: t }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 7px", borderRadius: t.brutal ? 0 : 6,
      background: t.surfaceDeep, color: t.textSec,
      fontFamily: "ui-monospace, monospace", fontSize: t.fz ? t.fz(11) : 11, fontWeight: 500,
      letterSpacing: "0.04em", whiteSpace: "nowrap",
    }}>••{value}</span>
  );
}

// ── Owner color system ─────────────────────────────────────────────────────
const OWNER_PALETTE = [
  { color: "#7c3aed", bg: "rgba(124,58,237,0.14)" },   // violet
  { color: "#0891b2", bg: "rgba(8,145,178,0.14)" },    // cyan
  { color: "#d97706", bg: "rgba(217,119,6,0.14)" },    // amber
  { color: "#db2777", bg: "rgba(219,39,119,0.14)" },   // pink
  { color: "#059669", bg: "rgba(5,150,105,0.14)" },    // emerald
  { color: "#dc2626", bg: "rgba(220,38,38,0.14)" },    // red
  { color: "#2563eb", bg: "rgba(37,99,235,0.14)" },    // blue
  { color: "#ea580c", bg: "rgba(234,88,12,0.14)" },    // orange
  { color: "#6d28d9", bg: "rgba(109,40,217,0.14)" },   // purple
  { color: "#0f766e", bg: "rgba(15,118,110,0.14)" },   // teal
];

export function ownerColor(idOrName) {
  const s = String(idOrName ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff;
  return OWNER_PALETTE[h % OWNER_PALETTE.length];
}

export function OwnerBadge({ id, name, theme: t }) {
  const key = id ?? name ?? "";
  const { color, bg } = ownerColor(key);
  const initials = String(name || "?").trim().split(/\s+/).map((p) => p[0] ?? "").join("").slice(0, 2).toUpperCase() || "?";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "2px 8px 2px 2px", borderRadius: t.brutal ? 0 : 999,
      background: bg, color, fontWeight: 600, fontSize: t.fz ? t.fz(12) : 12,
      whiteSpace: "nowrap", maxWidth: 160, overflow: "hidden",
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: "50%",
        background: color, color: "#fff", flexShrink: 0,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: t.fz ? t.fz(9) : 9, fontWeight: 700,
      }}>{initials}</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{name || "—"}</span>
    </span>
  );
}

export function fmtMVR(v, digits = 2) {
  if (v == null || isNaN(v)) return "—";
  const sign = v < 0 ? "−" : "";
  return sign + "MVR " + Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
export function fmtUSD(v) {
  if (v == null || isNaN(v)) return "—";
  return "$" + Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function fmtCompact(v) {
  if (v == null || isNaN(v)) return "—";
  const abs = Math.abs(v);
  if (abs >= 1e6) return (v / 1e6).toFixed(2) + "M";
  if (abs >= 1e3) return (v / 1e3).toFixed(1) + "K";
  return Number(v).toFixed(0);
}
export function fmtFull(v, digits = 2) {
  if (v == null || isNaN(v)) return "—";
  const sign = v < 0 ? "−" : "";
  return sign + Math.abs(Number(v)).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
export function fmtInt(v) {
  if (v == null || isNaN(v)) return "—";
  return Number(v).toLocaleString();
}
export function fmtDate(d) {
  const dt = parseDate(d);
  if (!dt) return "—";
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
}

export function SelectChip({ theme: t, value, options, onChange }) {
  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{
        appearance: "none", WebkitAppearance: "none",
        padding: "6px 28px 6px 10px", fontSize: 12,
        background: t.surfaceAlt, border: `1px solid ${t.border}`,
        borderRadius: t.radius,
        color: t.text, cursor: "pointer", fontFamily: "inherit",
      }}>
        {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
      <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: t.textMuted, display: "flex" }}>{I.chevron(12)}</span>
    </div>
  );
}
