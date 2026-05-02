// Modern view chart primitives — pure SVG, theme-aware
import React from "react";
import { fmtCompact } from "./ui";

export function TrendChart({ data, theme, mode = "area", height = 220, yFormat = (v) => fmtCompact(v) }) {
  const t = theme;
  const w = 800;
  const pad = { l: 48, r: 16, t: 12, b: 28 };
  const innerW = w - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value), 0) * 1.1 || 1;
  const min = Math.min(0, ...data.map((d) => d.value));
  const x = (i) => pad.l + (i / (data.length - 1 || 1)) * innerW;
  const y = (v) => pad.t + innerH - ((v - min) / (max - min || 1)) * innerH;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.value)}`).join(" ");
  const areaPath = linePath + ` L ${x(data.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`;

  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => min + (max - min) * (i / ticks));
  const gradId = "modAreaGrad-" + (t.key || "default");

  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: "100%", height, display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t.accent} stopOpacity="0.25" />
          <stop offset="100%" stopColor={t.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {tickVals.map((tv, i) => (
        <g key={i}>
          <line x1={pad.l} x2={w - pad.r} y1={y(tv)} y2={y(tv)} stroke={t.border} strokeDasharray="2 3" />
          <text x={pad.l - 8} y={y(tv) + 4} textAnchor="end" fontSize="10" fill={t.textMuted}>{yFormat(tv)}</text>
        </g>
      ))}
      {mode === "bars" && data.map((d, i) => {
        const bw = innerW / data.length * 0.65;
        const bx = x(i) - bw / 2;
        const by = y(Math.max(d.value, 0));
        const bh = Math.abs(y(d.value) - y(0));
        return <rect key={i} x={bx} y={by} width={bw} height={bh} rx="2" fill={t.accent} opacity="0.85" />;
      })}
      {mode === "area" && <path d={areaPath} fill={`url(#${gradId})`} />}
      {(mode === "area" || mode === "line") && <path d={linePath} fill="none" stroke={t.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
      {(mode === "area" || mode === "line") && data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.value)} r="3" fill={t.surface} stroke={t.accent} strokeWidth="1.5" />
      ))}
      {data.map((d, i) => (
        <text key={i} x={x(i)} y={height - 8} textAnchor="middle" fontSize="10" fill={t.textMuted}>{d.label}</text>
      ))}
    </svg>
  );
}

export function Donut({ data, theme, size = 180, thickness = 28 }) {
  const t = theme;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <div style={{ fontSize: 12, color: t.textMuted, padding: 12 }}>No data.</div>;
  const colors = [t.chartA, t.chartB, t.chartC, t.chartD, t.chartE];
  const cx = size / 2, cy = size / 2;
  const r = size / 2 - thickness / 2 - 2;
  let cum = 0;
  const segs = data.map((d, i) => {
    const frac = d.value / total;
    const startA = cum * 2 * Math.PI - Math.PI / 2;
    cum += frac;
    const endA = cum * 2 * Math.PI - Math.PI / 2;
    const large = frac > 0.5 ? 1 : 0;
    const x1 = cx + r * Math.cos(startA), y1 = cy + r * Math.sin(startA);
    const x2 = cx + r * Math.cos(endA), y2 = cy + r * Math.sin(endA);
    return { ...d, path: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`, color: colors[i % colors.length], pct: frac };
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={t.surfaceDeep} strokeWidth={thickness} />
        {segs.map((s, i) => (
          <path key={i} d={s.path} fill="none" stroke={s.color} strokeWidth={thickness} strokeLinecap="butt" />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fill={t.textMuted}>Total</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="16" fontWeight="600" fill={t.text}>{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</text>
      </svg>
      <div style={{ display: "grid", gap: 8, minWidth: 140 }}>
        {segs.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ color: t.text, flex: 1 }}>{s.label}</span>
            <span style={{ color: t.textMuted, fontVariantNumeric: "tabular-nums" }}>{(s.pct * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Scatter({ data, theme, height = 220, xLabel = "Buy rate", yLabel = "Sell rate" }) {
  const t = theme;
  const w = 800;
  const pad = { l: 48, r: 16, t: 12, b: 36 };
  const iw = w - pad.l - pad.r, ih = height - pad.t - pad.b;
  if (!data.length) return null;
  const xs = data.map((d) => d.x), ys = data.map((d) => d.y);
  const xmin = Math.min(...xs), xmax = Math.max(...xs);
  const ymin = Math.min(...ys), ymax = Math.max(...ys);
  const px = (v) => pad.l + ((v - xmin) / (xmax - xmin || 1)) * iw;
  const py = (v) => pad.t + ih - ((v - ymin) / (ymax - ymin || 1)) * ih;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: "100%", height, display: "block" }}>
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
        const gy = pad.t + ih * f;
        const v = ymax - (ymax - ymin) * f;
        return (
          <g key={i}>
            <line x1={pad.l} x2={w - pad.r} y1={gy} y2={gy} stroke={t.border} strokeDasharray="2 3" />
            <text x={pad.l - 8} y={gy + 4} textAnchor="end" fontSize="10" fill={t.textMuted}>{v.toFixed(2)}</text>
          </g>
        );
      })}
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
        const gx = pad.l + iw * f;
        const v = xmin + (xmax - xmin) * f;
        return <text key={i} x={gx} y={height - 16} textAnchor="middle" fontSize="10" fill={t.textMuted}>{v.toFixed(2)}</text>;
      })}
      <text x={pad.l} y={height - 2} fontSize="10" fill={t.textMuted}>{xLabel} →</text>
      <text x={pad.l + 4} y={pad.t + 10} fontSize="10" fill={t.textMuted}>↑ {yLabel}</text>
      {data.map((d, i) => (
        <circle key={i} cx={px(d.x)} cy={py(d.y)} r="4" fill={d.color || t.accent} opacity="0.75" />
      ))}
    </svg>
  );
}

export function Histogram({ data, theme, height = 180, bins = 10 }) {
  const t = theme;
  if (!data.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const binW = (max - min) / bins || 1;
  const counts = Array(bins).fill(0);
  data.forEach((v) => {
    const i = Math.min(bins - 1, Math.max(0, Math.floor((v - min) / binW)));
    counts[i]++;
  });
  const cmax = Math.max(...counts) || 1;
  const w = 800;
  const pad = { l: 36, r: 12, t: 10, b: 26 };
  const iw = w - pad.l - pad.r, ih = height - pad.t - pad.b;
  const bw = iw / bins;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: "100%", height, display: "block" }}>
      {[0, 0.5, 1].map((f, i) => {
        const gy = pad.t + ih * (1 - f);
        return (
          <g key={i}>
            <line x1={pad.l} x2={w - pad.r} y1={gy} y2={gy} stroke={t.border} strokeDasharray="2 3" />
            <text x={pad.l - 6} y={gy + 4} textAnchor="end" fontSize="10" fill={t.textMuted}>{Math.round(cmax * f)}</text>
          </g>
        );
      })}
      {counts.map((c, i) => {
        const h = (c / cmax) * ih;
        const x = pad.l + i * bw;
        const y = pad.t + ih - h;
        const binStart = min + i * binW;
        return (
          <g key={i}>
            <rect x={x + 2} y={y} width={bw - 4} height={h} fill={t.accent} opacity="0.85" rx="2" />
            {i % 2 === 0 && <text x={x + bw / 2} y={height - 8} textAnchor="middle" fontSize="9" fill={t.textMuted}>{binStart.toFixed(0)}%</text>}
          </g>
        );
      })}
    </svg>
  );
}

export function Sparkline({ values, theme, w = 70, h = 30, positive }) {
  if (!values || values.length === 0) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const x = (i) => (i / (values.length - 1 || 1)) * w;
  const y = (v) => h - ((v - min) / (max - min || 1)) * h;
  const path = values.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
  const color = positive ? theme.positive : theme.negative;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StackedBars({ data, theme, height = 200 }) {
  const t = theme;
  const w = 800;
  const pad = { l: 44, r: 12, t: 12, b: 28 };
  const iw = w - pad.l - pad.r, ih = height - pad.t - pad.b;
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.gross), 1) * 1.1;
  const bw = iw / data.length;
  const y = (v) => pad.t + ih - (v / max) * ih;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: "100%", height, display: "block" }}>
      {[0, 0.5, 1].map((f, i) => {
        const gy = pad.t + ih * (1 - f);
        return <g key={i}>
          <line x1={pad.l} x2={w - pad.r} y1={gy} y2={gy} stroke={t.border} strokeDasharray="2 3" />
          <text x={pad.l - 6} y={gy + 4} textAnchor="end" fontSize="10" fill={t.textMuted}>{fmtCompact(max * f)}</text>
        </g>;
      })}
      {data.map((d, i) => {
        const gh = (d.gross / max) * ih;
        const ch = (d.cost / max) * ih;
        const x = pad.l + i * bw + bw * 0.2;
        const bwi = bw * 0.6;
        return <g key={i}>
          <rect x={x} y={y(d.gross)} width={bwi} height={gh} fill={t.accent} opacity="0.2" rx="2" />
          <rect x={x + bwi * 0.15} y={y(d.cost)} width={bwi * 0.7} height={ch} fill={t.textMuted} opacity="0.35" rx="2" />
          <rect x={x} y={y(d.net + d.cost) - 2} width={bwi} height={3} fill={t.positive} />
          {i % 2 === 0 && <text x={x + bwi / 2} y={height - 8} textAnchor="middle" fontSize="10" fill={t.textMuted}>{d.label}</text>}
        </g>;
      })}
    </svg>
  );
}
