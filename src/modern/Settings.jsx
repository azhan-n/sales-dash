// Modern Settings — theme picker, font, chart style, layout switch back to Classic
import React from "react";
import { Card, Btn } from "./ui";
import { THEME_OPTIONS, FONTS } from "../themes";

export function ModernSettings({ theme, currentTheme, setTheme, font, setFont, chartStyle, setChartStyle, onSwitchToClassic, isMobile, fontScale = 1.0, setFontScale }) {
  const t = theme;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Settings</div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", color: t.text }}>Appearance</h1>
        <div style={{ fontSize: 13, color: t.textSec, marginTop: 4 }}>Tweak the look and feel of your workspace.</div>
      </div>

      <Card theme={t} pad={20}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 4 }}>Theme</div>
        <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 12 }}>All 10 themes work in Modern view.</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
          {THEME_OPTIONS.map((opt) => (
            <button key={opt.key} onClick={() => setTheme(opt.key)} style={{
              padding: "8px", border: currentTheme === opt.key ? `2px solid ${t.accent}` : `1px solid ${t.border}`,
              borderRadius: t.radius,
              background: currentTheme === opt.key ? t.accentSoft : t.surface,
              cursor: "pointer", textAlign: "center",
              fontFamily: "inherit",
              transition: "all .15s",
            }}>
              <div style={{ display: "flex", height: 22, borderRadius: 4, overflow: "hidden", marginBottom: 6, border: `1px solid ${t.border}` }}>
                {opt.preview.map((color, i) => <div key={i} style={{ flex: 1, background: color }}></div>)}
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, color: currentTheme === opt.key ? t.accent : t.text }}>{opt.label}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card theme={t} pad={20}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 4 }}>Font</div>
        <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 12 }}>Applies across the whole app.</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(140px, 1fr))", gap: 6 }}>
          {FONTS.map((f) => (
            <button key={f.value} onClick={() => setFont(f.value)} style={{
              padding: "8px 10px", border: font === f.value ? `2px solid ${t.accent}` : `1px solid ${t.border}`,
              borderRadius: t.radius, background: font === f.value ? t.accentSoft : t.surface,
              cursor: "pointer", textAlign: "left", fontFamily: `"${f.value}", sans-serif`,
              fontSize: 13, color: font === f.value ? t.accent : t.text,
            }}>{f.name}</button>
          ))}
        </div>
      </Card>

      <Card theme={t} pad={20}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 4 }}>Font size</div>
        <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 16 }}>
          Scales all UI elements. Current: {Math.round(fontScale * 100)}%
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: t.textMuted, minWidth: 28 }}>80%</span>
          <input
            type="range"
            min={0.8}
            max={1.3}
            step={0.05}
            value={fontScale}
            onChange={(e) => setFontScale(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: t.accent, cursor: "pointer" }}
          />
          <span style={{ fontSize: 11, color: t.textMuted, minWidth: 32 }}>130%</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <button
            onClick={() => setFontScale(1.0)}
            style={{
              fontSize: 11, color: t.accent, background: t.accentSoft,
              border: `1px solid ${t.accent}40`, borderRadius: t.radius,
              padding: "4px 12px", cursor: "pointer", fontFamily: "inherit",
            }}
          >Reset to 100%</button>
        </div>
      </Card>

      <Card theme={t} pad={20}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 4 }}>Chart style</div>
        <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 12 }}>Used on Overview and Monthly trend charts.</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ k: "area", l: "Area" }, { k: "line", l: "Line" }, { k: "bars", l: "Bars" }].map((o) => (
            <button key={o.k} onClick={() => setChartStyle(o.k)} style={{
              flex: 1, padding: "10px", border: chartStyle === o.k ? `2px solid ${t.accent}` : `1px solid ${t.border}`,
              borderRadius: t.radius, background: chartStyle === o.k ? t.accentSoft : t.surface,
              color: chartStyle === o.k ? t.accent : t.text, cursor: "pointer",
              fontFamily: "inherit", fontSize: 13, fontWeight: 500,
            }}>{o.l}</button>
          ))}
        </div>
      </Card>

      <Card theme={t} pad={20}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 4 }}>Layout</div>
        <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 12 }}>You're using the Modern (Tether Line) layout.</div>
        <Btn theme={t} onClick={onSwitchToClassic}>Switch to Classic layout</Btn>
      </Card>
    </div>
  );
}
