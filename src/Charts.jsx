// =============================================
// Charts.jsx — Reusable chart & UI components
// =============================================
import React, { memo } from "react";

// --- Simple Pie Chart (pure SVG) ---
export const SimplePieChart = memo(({ data, colors, size = 200, c }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  let cumAngle = 0;
  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((startAngle + angle - 90) * Math.PI) / 180;
    const largeArc = angle > 180 ? 1 : 0;
    const r = size / 2 - 4;
    const cx = size / 2, cy = size / 2;
    const x1 = cx + r * Math.cos(startRad), y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad), y2 = cy + r * Math.sin(endRad);
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { ...d, path, color: colors[i % colors.length], pct: ((d.value / total) * 100).toFixed(1) };
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke={c.surface} strokeWidth="2" />
        ))}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: c.text }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: s.color, flexShrink: 0 }}></div>
            <span>{s.label}: {s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
});

// --- Chart Toggle Button Pair ---
export const ChartToggle = memo(({ mode, setMode, opt1, opt2, c, isBrut, isCompact, bws }) => (
  <div style={{ display: "flex", gap: "0.375rem" }}>
    {[opt1, opt2].map(({ key, label }) => (
      <button
        key={key}
        onClick={() => setMode(key)}
        style={{
          padding: isCompact ? "0.25rem 0.5rem" : "0.375rem 0.75rem",
          borderRadius: isBrut ? "0" : "999px",
          border: `1px solid ${mode === key ? c.accent : c.border}`,
          backgroundColor: mode === key ? c.accentBg : "transparent",
          color: mode === key ? c.accent : c.textSec,
          cursor: "pointer",
          fontSize: isCompact ? "0.625rem" : "0.75rem",
          fontWeight: bws || "600",
        }}
      >
        {label}
      </button>
    ))}
  </div>
));

// --- Stat Card Icon Wrapper ---
export const StatIcon = memo(({ Icon, size, layout, c, variant }) => {
  if (layout.statIconBg && layout.statIconBgStyle) {
    const bgStyle = layout.statIconBgStyle(variant || c.isDark);
    return (
      <div style={bgStyle}>
        <Icon size={size} style={{ opacity: 0.9, color: "inherit" }} />
      </div>
    );
  }
  return <Icon size={size} style={{ opacity: 0.7 }} />;
});