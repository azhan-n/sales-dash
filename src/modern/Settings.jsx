// Modern Settings — theme picker, font, chart style, icon pack, bold text, layout
import React from "react";
import { Card, Btn } from "./ui";
import { THEME_OPTIONS, FONTS } from "../themes";
import { ICON_PACKS, ICON_PACK_KEYS } from "../iconPacks";

export function ModernSettings({
  theme, currentTheme, setTheme, font, setFont,
  chartStyle, setChartStyle, onSwitchToClassic, isMobile,
  fontScale = 1.0, setFontScale,
  textScale = 1.0, setTextScale,
  iconPack = "lucide", setIconPack,
  boldText = false, setBoldText,
}) {
  const t = theme;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: t.fz(11), fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Settings</div>
        <h1 style={{ margin: 0, fontSize: t.fz(26), fontWeight: 600, letterSpacing: "-0.02em", color: t.text }}>Appearance</h1>
        <div style={{ fontSize: t.fz(13), color: t.textSec, marginTop: 4 }}>Tweak the look and feel of your workspace.</div>
      </div>

      <Card theme={t} pad={20}>
        <div style={{ fontSize: t.fz(13), fontWeight: 600, color: t.text, marginBottom: 4 }}>Theme</div>
        <div style={{ fontSize: t.fz(11), color: t.textMuted, marginBottom: 12 }}>All 10 themes work in Modern view.</div>
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
              <div style={{ fontSize: t.fz(11), fontWeight: 500, color: currentTheme === opt.key ? t.accent : t.text }}>{opt.label}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card theme={t} pad={20}>
        <div style={{ fontSize: t.fz(13), fontWeight: 600, color: t.text, marginBottom: 4 }}>Font</div>
        <div style={{ fontSize: t.fz(11), color: t.textMuted, marginBottom: 12 }}>Applies across the whole app.</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(140px, 1fr))", gap: 6 }}>
          {FONTS.map((f) => (
            <button key={f.value} onClick={() => setFont(f.value)} style={{
              padding: "8px 10px", border: font === f.value ? `2px solid ${t.accent}` : `1px solid ${t.border}`,
              borderRadius: t.radius, background: font === f.value ? t.accentSoft : t.surface,
              cursor: "pointer", textAlign: "left", fontFamily: `"${f.value}", sans-serif`,
              fontSize: t.fz(13), color: font === f.value ? t.accent : t.text,
            }}>{f.name}</button>
          ))}
        </div>
      </Card>

      <Card theme={t} pad={20}>
        <div style={{ fontSize: t.fz(13), fontWeight: 600, color: t.text, marginBottom: 4 }}>UI Scale</div>
        <div style={{ fontSize: t.fz(11), color: t.textMuted, marginBottom: 16 }}>
          Scales all UI elements &amp; spacing. Current: {Math.round(fontScale * 100)}%
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: t.fz(11), color: t.textMuted, minWidth: 28 }}>80%</span>
          <input
            type="range" min={0.8} max={1.3} step={0.05} value={fontScale}
            onChange={(e) => setFontScale(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: t.accent, cursor: "pointer" }}
          />
          <span style={{ fontSize: t.fz(11), color: t.textMuted, minWidth: 32 }}>130%</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <button onClick={() => setFontScale(1.0)} style={{
            fontSize: t.fz(11), color: t.accent, background: t.accentSoft,
            border: `1px solid ${t.accent}40`, borderRadius: t.radius,
            padding: "4px 12px", cursor: "pointer", fontFamily: "inherit",
          }}>Reset to 100%</button>
        </div>
      </Card>

      <Card theme={t} pad={20}>
        <div style={{ fontSize: t.fz(13), fontWeight: 600, color: t.text, marginBottom: 4 }}>Font size</div>
        <div style={{ fontSize: t.fz(11), color: t.textMuted, marginBottom: 16 }}>
          Scales text only — layout stays fixed. Current: {Math.round(textScale * 100)}%
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: t.fz(11), color: t.textMuted, minWidth: 28 }}>80%</span>
          <input
            type="range" min={0.8} max={1.4} step={0.05} value={textScale}
            onChange={(e) => setTextScale(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: t.accent, cursor: "pointer" }}
          />
          <span style={{ fontSize: t.fz(11), color: t.textMuted, minWidth: 32 }}>140%</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <button onClick={() => setTextScale(1.0)} style={{
            fontSize: t.fz(11), color: t.accent, background: t.accentSoft,
            border: `1px solid ${t.accent}40`, borderRadius: t.radius,
            padding: "4px 12px", cursor: "pointer", fontFamily: "inherit",
          }}>Reset to 100%</button>
        </div>
      </Card>

      <Card theme={t} pad={20}>
        <div style={{ fontSize: t.fz(13), fontWeight: 600, color: t.text, marginBottom: 4 }}>Chart style</div>
        <div style={{ fontSize: t.fz(11), color: t.textMuted, marginBottom: 12 }}>Used on Overview and Monthly trend charts.</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ k: "area", l: "Area" }, { k: "line", l: "Line" }, { k: "bars", l: "Bars" }].map((o) => (
            <button key={o.k} onClick={() => setChartStyle(o.k)} style={{
              flex: 1, padding: "10px", border: chartStyle === o.k ? `2px solid ${t.accent}` : `1px solid ${t.border}`,
              borderRadius: t.radius, background: chartStyle === o.k ? t.accentSoft : t.surface,
              color: chartStyle === o.k ? t.accent : t.text, cursor: "pointer",
              fontFamily: "inherit", fontSize: t.fz(13), fontWeight: 500,
            }}>{o.l}</button>
          ))}
        </div>
      </Card>

      <Card theme={t} pad={20}>
        <div style={{ fontSize: t.fz(13), fontWeight: 600, color: t.text, marginBottom: 4 }}>Icon pack</div>
        <div style={{ fontSize: t.fz(11), color: t.textMuted, marginBottom: 12 }}>Synced with Classic view.</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: 8 }}>
          {ICON_PACK_KEYS.map((key) => {
            const pack = ICON_PACKS[key];
            const isSelected = iconPack === key;
            const PreviewA = pack.Settings;
            const PreviewB = pack.Download;
            const PreviewC = pack.User;
            return (
              <button key={key} onClick={() => setIconPack(key)} style={{
                padding: "8px", border: isSelected ? `2px solid ${t.accent}` : `1px solid ${t.border}`,
                borderRadius: t.radius, background: isSelected ? t.accentSoft : t.surface,
                cursor: "pointer", textAlign: "center", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 6, fontFamily: "inherit",
                color: isSelected ? t.accent : t.textSec, transition: "all .15s",
              }}>
                <div style={{ display: "flex", gap: 4, color: "inherit" }}>
                  <PreviewA size={13} /> <PreviewB size={13} /> <PreviewC size={13} />
                </div>
                <div style={{ fontSize: t.fz(11), fontWeight: 500, color: isSelected ? t.accent : t.text }}>{pack.label}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card theme={t} pad={20}>
        <div
          onClick={() => setBoldText?.(!boldText)}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: 12 }}
        >
          <div>
            <div style={{ fontSize: t.fz(13), fontWeight: 600, color: t.text }}>Bold text</div>
            <div style={{ fontSize: t.fz(11), color: t.textMuted, marginTop: 2 }}>Increase font weight across the UI</div>
          </div>
          <div style={{
            width: 40, height: 22, borderRadius: 11,
            background: boldText ? t.accent : t.border,
            position: "relative", flexShrink: 0, transition: "background .2s",
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%", background: "#fff",
              position: "absolute", top: 2, left: boldText ? 20 : 2,
              transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }} />
          </div>
        </div>
      </Card>

      <Card theme={t} pad={20}>
        <div style={{ fontSize: t.fz(13), fontWeight: 600, color: t.text, marginBottom: 4 }}>Layout</div>
        <div style={{ fontSize: t.fz(11), color: t.textMuted, marginBottom: 12 }}>You're using the Modern (Tether Line) layout.</div>
        <Btn theme={t} onClick={onSwitchToClassic}>Switch to Classic layout</Btn>
      </Card>
    </div>
  );
}
