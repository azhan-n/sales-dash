import React, { useState, useEffect } from "react";
import {
TrendingUp,
DollarSign,
Filter,
User,
RefreshCw,
LayoutGrid,
List,
Settings,
X,
Calendar,
Timer,
} from "lucide-react";
const GOOGLE_SHEETS_URL =
"https://script.google.com/macros/s/AKfycbxVwc0buJoICP6sIzK6GxmZNtdvdYA4lw7MhmMxxYjI2weRxDR
const FONTS = [
{ name: "Inter", value: "Inter" },
{ name: "Poppins", value: "Poppins" },
{ name: "League Spartan", value: "League Spartan" },
{ name: "Open Sans", value: "Open Sans" },
];
const THEME_OPTIONS = [
{ key: "auto", label: "Auto", preview: ["#94a3b8", "#667eea", "#84fab0", "#64748b"] },
{ key: "sunset", label: "Sunset", preview: ["#fff7ed", "#f97316", "#e11d48", "#fbbf24"] },
{ key: "glass", label: "Glass", preview: ["#1a1a2e", "#e0e7ff", "#818cf8", "#312e81"] },
{ key: "terminal", label: "Terminal", preview: ["#0a0a0a", "#00ff41", "#003b00", "#1a1a1a"]
{ key: "brutalist", label: "Brutalist", preview: ["#f5f5f0", "#000000", "#ff3333", "#ffffff
{ key: "midnight", label: "Midnight", preview: ["#0f0720", "#7c3aed", "#c084fc", "#1e1b4b"]
{ key: "liquid_glass", label: "Liquid Glass", preview: ["#f0f2f5", "#e8ecf4", "#ffffff80",
{ key: "circular", label: "Circular", preview: ["#faf5ff", "#8b5cf6", "#c084fc", "#ede9fe"]
];
// --- Layout descriptors per theme ---
const themeLayouts = {
default: {
statCardDir: "column", // stat card flex direction
statIconSize: 32, // dashboard stat icon size
statIconSizeSm: 20, // compact
statIconBg: false, // wrap icon in a bg circle
statIconBgStyle: null,
statGridMin: "280px", statGridMinSm: "180px",
ownerLayout: "grid", cardTypeLayout: "grid", tableStyle: "default", extraCss: "",
// min-width for stat grid items
// "grid" | "horizontal"
// "grid" | "list"
// "default" | "terminal" | "brutalist"
},
glass: {
statCardDir: "row", // horizontal: icon left, text right
statIconSize: 36,
statIconSizeSm: 24,
statIconBg: true,
statIconBgStyle: (isDark) => ({
width: "52px", height: "52px", borderRadius: "50%",
background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
}),
statGridMin: "320px",
statGridMinSm: "240px",
ownerLayout: "grid",
cardTypeLayout: "grid",
tableStyle: "default",
extraCss: `.glass-card { backdrop-filter: blur(16px) saturate(180%); -webkit-backdrop-fil
},
terminal: {
statCardDir: "row", // inline readout: icon left, data right
statIconSize: 20,
statIconSizeSm: 16,
statIconBg: true,
statIconBgStyle: () => ({
width: "32px", height: "32px", borderRadius: "2px",
border: "1px solid rgba(0,255,65,0.3)", background: "rgba(0,255,65,0.05)",
display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
}),
statGridMin: "280px",
statGridMinSm: "200px",
ownerLayout: "horizontal",
cardTypeLayout: "list",
tableStyle: "terminal",
extraCss: `
.terminal-scanline { pointer-events: none; position: fixed; top: 0; left: 0; right: 0;
background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,
.terminal-glow { text-shadow: 0 0 8px rgba(0,255,65,0.4); }
`,
},
brutalist: {
statCardDir: "column",
statIconSize: 28,
statIconSizeSm: 20,
statIconBg: true,
statIconBgStyle: () => ({
width: "44px", height: "44px", borderRadius: "0",
border: "3px solid #000000", background: "#ffffff",
display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
}),
statGridMin: "100%", // force single-column stack
statGridMinSm: "100%",
ownerLayout: "horizontal",
cardTypeLayout: "list",
tableStyle: "brutalist",
extraCss: `.brutalist-shadow { box-shadow: 6px 6px 0px #000000 !important; }`,
},
midnight: {
statCardDir: "column",
statIconSize: 40,
statIconSizeSm: 28,
statIconBg: true,
statIconBgStyle: (isDark) => ({
width: "64px", height: "64px", borderRadius: "50%",
background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(192,132,252,0.15))",
boxShadow: "0 0 20px rgba(124,58,237,0.2)",
display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
marginBottom: "0.75rem",
}),
statGridMin: "260px",
statGridMinSm: "180px",
ownerLayout: "grid",
cardTypeLayout: "grid",
tableStyle: "default",
extraCss: `.midnight-stars { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-ind
background-image: radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.3), transparen
radial-gradient(1px 1px at 30% 60%, rgba(255,255,255,0.2), transparent),
radial-gradient(1.5px 1.5px at 50% 10%, rgba(255,255,255,0.35), transparent),
radial-gradient(1px 1px at 70% 40%, rgba(255,255,255,0.15), transparent),
radial-gradient(1px 1px at 90% 80%, rgba(255,255,255,0.25), transparent),
radial-gradient(1.5px 1.5px at 20% 90%, rgba(255,255,255,0.2), transparent),
radial-gradient(1px 1px at 60% 75%, rgba(255,255,255,0.3), transparent),
radial-gradient(1px 1px at 80% 15%, rgba(255,255,255,0.15), transparent),
radial-gradient(1.5px 1.5px at 40% 45%, rgba(255,255,255,0.25), transparent),
radial-gradient(1px 1px at 15% 55%, rgba(255,255,255,0.2), transparent); }`,
},
liquid_glass: {
statCardDir: "column",
statIconSize: 32,
statIconSizeSm: 22,
statIconBg: true,
statIconBgStyle: () => ({
width: "48px", height: "48px", borderRadius: "14px",
background: "rgba(255,255,255,0.45)", backdropFilter: "blur(12px)", WebkitBackdropFilte
border: "1px solid rgba(255,255,255,0.6)",
boxShadow: "0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
}),
statGridMin: "280px",
statGridMinSm: "180px",
ownerLayout: "grid",
cardTypeLayout: "grid",
tableStyle: "default",
extraCss: `.lg-surface { backdrop-filter: blur(40px) saturate(180%); -webkit-backdrop-fil
.lg-specular { position: relative; overflow: hidden; }
.lg-specular::before { content: ''; position: absolute; top: 0; left: 0; right: 0; heig
},
circular: {
statCardDir: "column",
statIconSize: 36,
statIconSizeSm: 24,
statIconBg: true,
statIconBgStyle: () => ({
width: "56px", height: "56px", borderRadius: "50%",
background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(192,132,252,0.1))",
border: "2px solid rgba(139,92,246,0.2)",
boxShadow: "0 4px 12px rgba(139,92,246,0.1)",
display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
margin: "0 auto 0.75rem auto",
}),
statGridMin: "280px",
statGridMinSm: "180px",
ownerLayout: "grid",
cardTypeLayout: "grid",
tableStyle: "default",
extraCss: `.circ-blob { position: fixed; border-radius: 50%; pointer-events: none; z-inde
},
};
const getThemeLayout = (name) => {
const map = { auto: "default", sunset: "default",
glass: "glass", terminal: "terminal", brutalist: "brutalist", midnight: "midnight", liqui
return themeLayouts[map[name] || "default"];
};
const getThemeColors = (themeName) => {
const autoIsDark = typeof window !== 'undefined' && window.matchMedia("(prefers-color-schem
const base = {
radius: "1rem", radiusSm: "0.75rem", radiusCompact: "0.375rem", radiusCompactSm: "0.25rem
headerBorderBottom: null, bgPattern: null, cardGlow: null, cardBackdrop: null,
};
const palettes = {
sunset: {
...base, isDark: false, radius: "1.125rem", radiusSm: "0.875rem", radiusCompact: "0.5re
bg: "#fef7f0", bgAlt: "#fff5eb", surface: "#ffffff", surfaceAlt: "#fff5eb", surfaceDeep
text: "#431407", textSec: "#9a3412", textMuted: "#c2410c", textLight: "#fff7ed", textMi
border: "#fed7aa", borderAlt: "#fdba74", borderStrong: "#fb923c", borderHover: "#ea580c
accent: "#ea580c", accentBg: "#ffedd5", accentDark: "#9a3412", inputBg: "#ffffff", inpu
titleGrad: "linear-gradient(135deg, #f97316 0%, #e11d48 50%, #be123c 100%)",
btnGrad: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)", btnGlow: "rgba(249, 115,
statCards: { Green: { bg: "linear-gradient(135deg, #fbbf24 0%, #f97316 100%)", text: "#
profitGrad: "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)",
errorBg: "#fef2f2", errorBorder: "#ef4444", errorText: "#991b1b",
badgeGreen: { bg: "#fef3c7", text: "#92400e" }, badgeYellow: { bg: "#ffedd5", text: "#9
shadow: "0 2px 8px rgba(249,115,22,0.08)", shadowCompact: "0 1px 4px rgba(249,115,22,0.
shadowLg: "0 20px 40px -10px rgba(249,115,22,0.12)", shadowLgCompact: "0 2px 8px rgba(2
hoverShadow: "0 25px 50px -12px rgba(249,115,22,0.2)",
cardHoverShadow: "0 8px 24px rgba(249,115,22,0.12)", modalShadow: "0 25px 50px -12px rg
bgPattern: "radial-gradient(ellipse at 80% 80%, rgba(251,191,36,0.08) 0%, transparent 5
},
// --- ADVANCED THEMES ---
glass: {
...base, isDark: true, radius: "1.25rem", radiusSm: "1rem", radiusCompact: "0.75rem", r
bg: "#0f0f23", bgAlt: "#0f0f23", surface: "rgba(255,255,255,0.06)", surfaceAlt: "rgba(2
text: "#e0e7ff", textSec: "#a5b4fc", textMuted: "#818cf8", textLight: "#eef2ff", textMi
border: "rgba(165,180,252,0.15)", borderAlt: "rgba(165,180,252,0.1)", borderStrong: "rg
accent: "#818cf8", accentBg: "rgba(129,140,248,0.15)", accentDark: "#4338ca",
inputBg: "rgba(255,255,255,0.06)", inputBorder: "rgba(165,180,252,0.2)",
titleGrad: "linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #e879f9 100%)",
btnGrad: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", btnGlow: "rgba(129,140,24
statCards: { Green: { bg: "linear-gradient(135deg, rgba(16,185,129,0.4) 0%, rgba(6,182,
profitGrad: "linear-gradient(135deg, rgba(16,185,129,0.6) 0%, rgba(6,182,212,0.5) 100%)
errorBg: "rgba(239,68,68,0.1)", errorBorder: "rgba(239,68,68,0.3)", errorText: "#fca5a5
badgeGreen: { bg: "rgba(16,185,129,0.2)", text: "#6ee7b7" }, badgeYellow: { bg: "rgba(2
shadow: "0 4px 24px rgba(0,0,0,0.2)", shadowCompact: "0 2px 12px rgba(0,0,0,0.15)",
shadowLg: "0 8px 40px rgba(99,102,241,0.1), 0 4px 20px rgba(0,0,0,0.2)", shadowLgCompac
hoverShadow: "0 12px 48px rgba(99,102,241,0.2), 0 8px 24px rgba(0,0,0,0.3)",
cardHoverShadow: "0 8px 32px rgba(99,102,241,0.15)", modalShadow: "0 25px 80px rgba(0,0
headerBorderBottom: "1px solid rgba(165,180,252,0.1)",
bgPattern: "radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.08) 0%, transparent 5
cardBackdrop: "blur(16px) saturate(180%)", cardGlow: "0 0 0 1px rgba(165,180,252,0.08)"
},
terminal: {
...base, isDark: true, radius: "0", radiusSm: "0", radiusCompact: "0", radiusCompactSm:
bg: "#0a0a0a", bgAlt: "#0a0a0a", surface: "#111111", surfaceAlt: "#0a0a0a", surfaceDeep
text: "#00ff41", textSec: "#00cc33", textMuted: "#009926", textLight: "#33ff66", textMi
border: "rgba(0,255,65,0.2)", borderAlt: "rgba(0,255,65,0.15)", borderStrong: "rgba(0,2
accent: "#00ff41", accentBg: "rgba(0,255,65,0.1)", accentDark: "#003b00",
inputBg: "#0d0d0d", inputBorder: "rgba(0,255,65,0.25)",
titleGrad: "linear-gradient(90deg, #00ff41 0%, #00cc33 100%)",
btnGrad: "linear-gradient(90deg, #00cc33 0%, #009926 100%)", btnGlow: "rgba(0,255,65,0.
statCards: { Green: { bg: "rgba(0,255,65,0.08)", border: "1px dashed rgba(0,255,65,0.3)
profitGrad: "rgba(0,255,65,0.12)",
errorBg: "rgba(255,0,0,0.1)", errorBorder: "rgba(255,0,0,0.4)", errorText: "#ff4444",
badgeGreen: { bg: "rgba(0,255,65,0.15)", text: "#00ff41" }, badgeYellow: { bg: "rgba(25
shadow: "none", shadowCompact: "none",
shadowLg: "0 0 15px rgba(0,255,65,0.05)", shadowLgCompact: "none",
hoverShadow: "0 0 20px rgba(0,255,65,0.1)",
cardHoverShadow: "0 0 15px rgba(0,255,65,0.08)", modalShadow: "0 0 40px rgba(0,255,65,0
headerBorderBottom: "1px dashed rgba(0,255,65,0.3)", bgPattern: null,
},
brutalist: {
...base, isDark: false, radius: "0", radiusSm: "0", radiusCompact: "0", radiusCompactSm
bg: "#f5f5f0", bgAlt: "#f5f5f0", surface: "#ffffff", surfaceAlt: "#eeeeea", surfaceDeep
text: "#000000", textSec: "#333333", textMuted: "#666666", textLight: "#ffffff", textMi
border: "#000000", borderAlt: "#000000", borderStrong: "#000000", borderHover: "#ff3333
accent: "#ff3333", accentBg: "#ffe5e5", accentDark: "#cc0000",
inputBg: "#ffffff", inputBorder: "#000000",
titleGrad: "linear-gradient(90deg, #000000 0%, #333333 100%)",
btnGrad: "#000000", btnGlow: "rgba(0,0,0,0.2)",
statCards: { Green: { bg: "#000000", text: "#ffffff" }, Teal: { bg: "#ff3333", text: "#
profitGrad: "#000000",
errorBg: "#ffffff", errorBorder: "#ff3333", errorText: "#ff0000",
badgeGreen: { bg: "#000000", text: "#ffffff" }, badgeYellow: { bg: "#ff3333", text: "#f
shadow: "4px 4px 0px #000000", shadowCompact: "3px 3px 0px #000000",
shadowLg: "6px 6px 0px #000000", shadowLgCompact: "4px 4px 0px #000000",
hoverShadow: "8px 8px 0px #000000",
cardHoverShadow: "8px 8px 0px #ff3333", modalShadow: "8px 8px 0px #000000", toggleBg: "
headerBorderBottom: "4px solid #000000", bgPattern: null,
},
midnight: {
...base, isDark: true, radius: "1.5rem", radiusSm: "1.25rem", radiusCompact: "0.75rem",
bg: "#0a0520", bgAlt: "#0a0520", surface: "#140e30", surfaceAlt: "#0f0825", surfaceDeep
text: "#e9d5ff", textSec: "#c084fc", textMuted: "#a855f7", textLight: "#f5f3ff", textMi
border: "rgba(139,92,246,0.2)", borderAlt: "rgba(139,92,246,0.15)", borderStrong: "rgba
accent: "#a855f7", accentBg: "rgba(139,92,246,0.15)", accentDark: "#6d28d9",
inputBg: "rgba(139,92,246,0.08)", inputBorder: "rgba(139,92,246,0.25)",
titleGrad: "linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f43e5c 100%)",
btnGrad: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)", btnGlow: "rgba(139,92,246
Teal:
statCards: { Green: { bg: "linear-gradient(135deg, #059669 0%, #7c3aed 100%)" }, profitGrad: "linear-gradient(135deg, #7c3aed 0%, #059669 100%)",
errorBg: "rgba(239,68,68,0.1)", errorBorder: "rgba(239,68,68,0.3)", errorText: "#fca5a5
badgeGreen: { bg: "rgba(16,185,129,0.2)", text: "#6ee7b7" }, badgeYellow: { bg: "rgba(2
shadow: "0 4px 20px rgba(139,92,246,0.08)", shadowCompact: "0 2px 12px rgba(139,92,246,
shadowLg: "0 12px 40px rgba(139,92,246,0.12), 0 4px 16px rgba(0,0,0,0.2)", shadowLgComp
hoverShadow: "0 16px 48px rgba(139,92,246,0.2), 0 0 20px rgba(168,85,247,0.15)",
cardHoverShadow: "0 8px 32px rgba(139,92,246,0.15)", modalShadow: "0 25px 80px rgba(0,0
headerBorderBottom: "1px solid rgba(168,85,247,0.2)",
bgPattern: "radial-gradient(ellipse at 30% 20%, rgba(124,58,237,0.08) 0%, transparent 5
cardGlow: "0 0 0 1px rgba(139,92,246,0.1)",
},
textMi
liquid_glass: {
...base, isDark: false, radius: "1.5rem", radiusSm: "1.25rem", radiusCompact: "1rem", r
bg: "#eef0f5", bgAlt: "#eef0f5",
surface: "rgba(255,255,255,0.55)", surfaceAlt: "rgba(255,255,255,0.35)", surfaceDeep: "
text: "#1c1c1e", textSec: "#636366", textMuted: "#8e8e93", textLight: "#ffffff", border: "rgba(255,255,255,0.6)", borderAlt: "rgba(255,255,255,0.4)", borderStrong: "rgb
accent: "#007aff", accentBg: "rgba(0,122,255,0.12)", accentDark: "#0056b3",
inputBg: "rgba(255,255,255,0.5)", inputBorder: "rgba(0,0,0,0.06)",
titleGrad: "linear-gradient(135deg, #1c1c1e 0%, #3a3a3c 100%)",
btnGrad: "linear-gradient(135deg, rgba(0,122,255,0.85) 0%, rgba(0,100,220,0.9) 100%)",
statCards: {
Green: { bg: "rgba(52,199,89,0.18)", text: "#1c7a36", border: "1px solid rgba(52,199,
Teal: { bg: "rgba(0,122,255,0.15)", text: "#0055cc", border: "1px solid rgba(0,122,25
Orange: { bg: "rgba(255,149,0,0.15)", text: "#995c00", border: "1px solid rgba(255,14
Blue: { bg: "rgba(88,86,214,0.15)", text: "#3634a3", border: "1px solid rgba(88,86,21
Pink: { bg: "rgba(255,45,85,0.12)", text: "#cc0033", border: "1px solid rgba(255,45,8
Purple: { bg: "rgba(175,82,222,0.12)", text: "#7b3a9e", border: "1px solid rgba(175,8
},
profitGrad: "rgba(52,199,89,0.2)",
errorBg: "rgba(255,59,48,0.1)", errorBorder: "rgba(255,59,48,0.3)", errorText: "#ff3b30
badgeGreen: { bg: "rgba(52,199,89,0.15)", text: "#248a3d" },
badgeYellow: { bg: "rgba(255,204,0,0.18)", text: "#997a00" },
badgeRed: { bg: "rgba(255,59,48,0.12)", text: "#d70015" },
shadow: "0 2px 16px rgba(0,0,0,0.06)", shadowCompact: "0 1px 8px rgba(0,0,0,0.04)",
shadowLg: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)", shadowLgCompact: "
hoverShadow: "0 12px 40px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.06)",
cardHoverShadow: "0 8px 28px rgba(0,0,0,0.08)", modalShadow: "0 25px 60px rgba(0,0,0,0.
toggleBg: "rgba(0,0,0,0.08)",
headerBorderBottom: "1px solid rgba(0,0,0,0.04)",
bgPattern: "radial-gradient(ellipse at 25% 0%, rgba(174,198,255,0.35) 0%, transparent 5
cardBackdrop: "blur(40px) saturate(180%)",
cardGlow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 0 rgba(0,0,0,0.04)",
},
circular: {
...base, isDark: false, radius: "999px", radiusSm: "2rem", radiusCompact: "999px", radi
textMi
bg: "#faf5ff", bgAlt: "#faf5ff", surface: "#ffffff", surfaceAlt: "#f5f0ff", surfaceDeep
text: "#1e1b4b", textSec: "#6d28d9", textMuted: "#8b5cf6", textLight: "#f5f3ff", border: "#ddd6fe", borderAlt: "#c4b5fd", borderStrong: "#a78bfa", borderHover: "#7c3aed
accent: "#7c3aed", accentBg: "#ede9fe", accentDark: "#5b21b6",
inputBg: "#ffffff", inputBorder: "#ddd6fe",
titleGrad: "linear-gradient(135deg, #7c3aed 0%, #c084fc 50%, #e879f9 100%)",
btnGrad: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)", btnGlow: "rgba(124,58,237
statCards: {
Green: { bg: "linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%)", text: "#065f46" },
Teal: { bg: "linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%)", text: "#1e1b4b" },
Orange: { bg: "linear-gradient(135deg, #fde68a 0%, #fbbf24 100%)", text: "#78350f" },
Blue: { bg: "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)" },
Pink: { bg: "linear-gradient(135deg, #fbcfe8 0%, #f472b6 100%)", text: "#831843" },
Purple: { bg: "linear-gradient(135deg, #e9d5ff 0%, #c084fc 100%)", text: "#581c87" },
},
profitGrad: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
errorBg: "#fef2f2", errorBorder: "#ef4444", errorText: "#991b1b",
badgeGreen: { bg: "#d1fae5", text: "#065f46" }, badgeYellow: { bg: "#fef3c7", text: "#9
shadow: "0 4px 20px rgba(124,58,237,0.08)", shadowCompact: "0 2px 12px rgba(124,58,237,
shadowLg: "0 12px 40px rgba(124,58,237,0.1)", shadowLgCompact: "0 4px 16px rgba(124,58,
hoverShadow: "0 16px 48px rgba(124,58,237,0.15)",
cardHoverShadow: "0 8px 28px rgba(124,58,237,0.12)", modalShadow: "0 25px 60px rgba(124
toggleBg: "#ddd6fe",
headerBorderBottom: "none",
bgPattern: "radial-gradient(circle at 15% 15%, rgba(139,92,246,0.08) 0%, transparent 40
},
};
if (themeName === "auto") return palettes[autoIsDark ? "midnight" : "sunset"];
return palettes[themeName] || palettes.sunset;
};
if (typeof document !== 'undefined') {
const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family
link.rel = 'stylesheet';
document.head.appendChild(link);
}
const normalizeCardType = (type) => { if (!type) return "UNKNOWN"; const n = type.toString().
const cardTypeColors = { "VISA DEBIT": "#3b82f6", "VISA CREDIT": "#10b981", AMEX: "#8b5cf6",
const getCardTypeColor = (type) => cardTypeColors[normalizeCardType(type)] || cardTypeColors[
// -- Simple Pie Chart (pure CSS/SVG) --
const SimplePieChart = ({ data, colors, size = 200, c }) => {
const total = data.reduce((s, d) => s + d.value, 0);
if (total === 0) return null;
let cumAngle = 0;
const slices = data.map((d, i) => {
const angle = (d.value / total) * 360;
const startAngle = cumAngle;
cumAngle += angle;
const startRad = (startAngle - 90) * Math.PI / 180;
const endRad = (startAngle + angle - 90) * Math.PI / 180;
const largeArc = angle > 180 ? 1 : 0;
const r = size / 2 - 4;
const cx = size / 2, cy = size / 2;
const x1 = cx + r * Math.cos(startRad), y1 = cy + r * Math.sin(startRad);
const x2 = cx + r * Math.cos(endRad), y2 = cy + r * Math.sin(endRad);
const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
return { ...d, path, color: colors[i % colors.length], pct: ((d.value / total) * 100).toF
});
return (
<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
{slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke={c.surface} stro
</svg>
<div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: {slices.map((s, i) => (
<div key={i} style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontS
<div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor
<span>{s.label}: {s.pct}%</span>
</div>
"1rem"
"cente
))}
</div>
</div>
);
};
// -- Chart toggle button pair --
const ChartToggle = ({ mode, setMode, opt1, opt2, c, isBrut, isCompact }) => (
<div style={{ display: "flex", gap: "0.375rem" }}>
{[opt1, opt2].map(({ key, label }) => (
<button key={key} onClick={() => setMode(key)} style={{
padding: isCompact ? "0.25rem 0.5rem" : "0.375rem 0.75rem",
borderRadius: isBrut ? "0" : "999px", border: `1px solid ${mode === key ? c.accent :
backgroundColor: mode === key ? c.accentBg : "transparent",
color: mode === key ? c.accent : c.textSec, cursor: "pointer",
fontSize: isCompact ? "0.625rem" : "0.75rem", fontWeight: "600",
}}>{label}</button>
))}
</div>
);
// -- Icon wrapper component --
const StatIcon = ({ Icon, size, layout, c }) => {
if (layout.statIconBg && layout.statIconBgStyle) {
const bgStyle = layout.statIconBgStyle(c.isDark);
return <div style={bgStyle}><Icon size={size} style={{ opacity: 0.9, color: "inherit" }}
}
return <Icon size={size} style={{ opacity: 0.7 }} />;
};
function App() {
const [activeTab, setActiveTab] = useState("dashboard");
const [transactions, setTransactions] = useState([]);
const [monthly, setMonthly] = useState([]);
const [owners, setOwners] = useState([]);
const [cards, setCards] = useState([]);
const [stats, setStats] = useState({});
const [filterCardType, setFilterCardType] = useState("all");
const [filterOwner, setFilterOwner] = useState("all");
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [lastSync, setLastSync] = useState(null);
const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "sunset");
const [viewMode, setViewMode] = useState("table");
const [viewStyle, setViewStyle] = useState(() => localStorage.getItem("viewStyle") || "norm
const [hoveredCard, setHoveredCard] = useState(null);
const [hoveredStat, setHoveredStat] = useState(null);
const [showSettings, setShowSettings] = useState(false);
const [selectedFont, setSelectedFont] = useState(() => localStorage.getItem("font") || "Pop
const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem("fontSize")) |
const [boldText, setBoldText] = useState(() => localStorage.getItem("boldText") === "true")
// Sort
const [sortCol, setSortCol] = useState(null);
const [sortDir, setSortDir] = useState("asc");
// Auto-refresh
const [autoRefresh, setAutoRefresh] = useState(() => parseInt(localStorage.getItem("autoRef
const [hoveredBar, setHoveredBar] = useState(null);
const c = getThemeColors(theme);
const L = getThemeLayout(theme);
const isCompact = viewStyle === "compact";
const headingFont = `"${selectedFont}", sans-serif`;
const bw = boldText ? "600" : "400";
const bwm = boldText ? "700" : "500";
const bws = boldText ? "800" : "600";
const r = isCompact ? c.radiusCompact : c.radius;
const rSm = isCompact ? c.radiusCompactSm : c.radiusSm;
const isBrut = theme === "brutalist";
const isTerm = theme === "terminal";
const isGlass = theme === "glass";
const isMid = theme === "midnight";
const isLG = theme === "liquid_glass";
const isCirc = theme === "circular";
// Responsive breakpoints
const [winW, setWinW] = useState(() => typeof window !== 'undefined' ? window.innerWidth :
useEffect(() => {
const onResize = () => setWinW(window.innerWidth);
window.addEventListener("resize", onResize);
return () => window.removeEventListener("resize", onResize);
}, []);
const isMobile = winW < 640;
const isTablet = winW >= 640 && winW < 1024;
// Card number filter
const [filterCardNumber, setFilterCardNumber] = useState("all");
// Chart toggles
const [profitChartMode, setProfitChartMode] = useState("bar");
const [ownerChartMode, setOwnerChartMode] = useState("stats");
const [cardTypeChartMode, setCardTypeChartMode] = useState("stats");
const font = selectedFont;
useEffect(() => { localStorage.setItem("theme", theme); }, [theme]);
useEffect(() => { localStorage.setItem("font", selectedFont); }, [selectedFont]);
useEffect(() => { localStorage.setItem("fontSize", fontSize.toString()); }, [fontSize]);
useEffect(() => { localStorage.setItem("viewStyle", viewStyle); }, [viewStyle]);
useEffect(() => { localStorage.setItem("boldText", boldText.toString()); }, [boldText]);
useEffect(() => { localStorage.setItem("autoRefresh", autoRefresh.toString()); }, [autoRefr
// Auto-refresh timer
useEffect(() => {
if (autoRefresh > 0) {
const interval = setInterval(() => fetchFromGoogleSheets(), autoRefresh * 1000);
return () => clearInterval(interval);
}
}, [autoRefresh]);
const getProfitMarginBadge = (margin) => {
const mkBadge = (bg, text) => ({ style: { display: "inline-flex", alignItems: "center", p
if (margin >= 20) return mkBadge(c.badgeGreen.bg, c.badgeGreen.text);
if (margin >= 10) return mkBadge(c.badgeYellow.bg, c.badgeYellow.text);
return mkBadge(c.badgeRed.bg, c.badgeRed.text);
};
const fetchFromGoogleSheets = async () => {
setLoading(true); setError(null);
try {
const response = await fetch(GOOGLE_SHEETS_URL);
if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
const data = await response.json();
if (data.error) throw new Error(data.error);
if (!data || (!data.transactions && !data.monthly)) { setTransactions([]); setMonthly([
else {
setLastSync(new Date());
if (data.transactions?.length > 0) processTransactions(data.transactions);
if (data.monthly?.length > 0) setMonthly(data.monthly);
}
} catch (err) { setError("Failed to load data. Please check your connection and try again
finally { setLoading(false); }
};
useEffect(() => { fetchFromGoogleSheets(); }, []);
useEffect(() => { if (theme === "auto") { const mq = window.matchMedia("(prefers-color-sche
const processTransactions = (data) => {
const today = new Date().toISOString().split("T")[0];
const nd = data.map((t, i) => ({ ...t, cardType: normalizeCardType(t.cardType), date: t.d
const uo = [...new Set(nd.map((t) => t.owner))].map((name, i) => ({ id: i + 1, name }));
const uc = []; const cm = new Map();
nd.forEach((t) => { const k = `${t.cardType}-${t.cardNumber}`; if (!cm.has(k)) { cm.set(k
const pt = nd.map((t) => { const cd = uc.find((x) => x.type === t.cardType && x.number ==
setOwners(uo); setCards(uc); setTransactions(pt); calcStats(pt, uo, uc);
};
const calcStats = (txns, ownrs, crds) => {
const tc = txns.reduce((s, t) => s + t.cost, 0); const tgp = txns.reduce((s, t) => s + t.
const tus = txns.reduce((s, t) => s + (parseFloat(t.sellAmount) || 0), 0); const tdu = tx
const os = {}; ownrs.forEach((o) => { const ot = txns.filter((t) => t.ownerId === o.id);
const cts = {}; crds.forEach((x) => { if (!cts[x.type]) cts[x.type] = { count: 0, netProf
setStats({ totalCost: tc, totalGrossProfit: tgp, totalNetProfit: tnp, totalUsdtSold: tus,
};
const getCardById = (id) => cards.find((x) => x.id === id);
const getOwnerById = (id) => owners.find((o) => o.id === id);
// Reset card number filter when owner changes
useEffect(() => { setFilterCardNumber("all"); }, [filterOwner]);
// Available card numbers based on selected owner
const availableCardNumbers = filterOwner === "all"
? [...new Set(transactions.map((t) => getCardById(t.cardId)?.number).filter(Boolean))]
: [...new Set(transactions.filter((t) => t.ownerId === parseInt(filterOwner)).map((t) =>
// Filter
const filteredTransactions = transactions.filter((t) => {
const cd = getCardById(t.cardId);
if (filterCardType !== "all" && cd?.type !== filterCardType) return false;
if (filterOwner !== "all" && t.ownerId !== parseInt(filterOwner)) return false;
if (filterCardNumber !== "all" && cd?.number !== filterCardNumber) return false;
return true;
});
// Sort
const sortedTransactions = [...filteredTransactions].sort((a, b) => {
if (!sortCol) return 0;
let va, vb;
const colMap = { date: (t) => t.date || "", cardType: (t) => getCardById(t.cardId)?.type
buyRate: (t) => parseFloat(t.buyRate) || 0, buyAmount: (t) => parseFloat(t.buyAmount) |
cost: (t) => t.cost, grossProfit: (t) => t.grossProfit, netProfit: (t) => t.netProfit,
const fn = colMap[sortCol];
if (!fn) return 0;
va = fn(a); vb = fn(b);
if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCo
return sortDir === "asc" ? va - vb : vb - va;
});
const handleSort = (col) => {
if (sortCol === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
else { setSortCol(col); setSortDir("asc"); }
};
const cardTypes = ["VISA DEBIT", "VISA CREDIT", "AMEX", "SELLER", "MASTERCARD"];
// -- Shared styles --
const cardBase = { backgroundColor: c.surface, borderRadius: isCirc ? "2rem" : r, padding:
const thStyle = { padding: isCompact ? "0.5rem 0.625rem" : "0.75rem 1rem", textAlign: "left
const tdStyle = { padding: isCompact ? "0.375rem 0.625rem" : "0.75rem 1rem", fontSize: isCo
const sectionTitleStyle = { fontSize: isMobile ? "1rem" : (isCompact ? "1.125rem" : "1.5rem
// Compute even grid columns for card type stats
const ctCount = Object.keys(stats.cardTypeStats || {}).length;
const ctCols = isMobile ? "1fr" : (isCompact || isTablet ? `repeat(${Math.min(ctCount || 2,
if (loading && transactions.length === 0) {
return (
<div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeigh
<RefreshCw size={48} style={{ animation: "spin 1s linear infinite" }} />
<div className={isTerm ? "terminal-glow" : ""}>Loading dashboard...</div>
<style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(3
</div>
);
}
return (
<div style={{ minHeight: "100vh", backgroundColor: c.bg, backgroundImage: c.bgPattern ||
{isTerm && <div className="terminal-scanline"></div>}
{isMid && <div className="midnight-stars"></div>}
{isCirc && <>
<div className="circ-blob" style={{ width: "400px", height: "400px", background: "#8b
<div className="circ-blob" style={{ width: "300px", height: "300px", background: "#e8
<div className="circ-blob" style={{ width: "250px", height: "250px", background: "#63
</>}
{/* HEADER */}
<div style={{ backgroundColor: (isGlass || isLG) ? (isLG ? "rgba(255,255,255,0.45)" : "
<div style={{ maxWidth: "80rem", margin: "0 auto", display: "flex", flexDirection: is
<div>
<h1 key={theme} style={{ fontSize: isBrut ? "3rem" : (isMobile ? "1.5rem" : (isCo
<p style={{ fontSize: isCompact ? "0.75rem" : "0.875rem", color: c.textSec, margi
{isTerm ? "> " : ""}{lastSync ? `Last updated: ${lastSync.toLocaleTimeString()}
{autoRefresh > 0 && <span style={{ display: "inline-flex", alignItems: "center"
<button onClick={() => setShowSettings(true)} style={{ padding: "0.5rem", borde
</p>
</div>
<button onClick={fetchFromGoogleSheets} style={{ padding: isCompact ? "0.5rem 0.875
<RefreshCw size={isMobile ? 16 : (isCompact ? 14 : 18)} style={loading ? { animat
{isMobile ? "" : (loading ? "Refreshing..." : "Refresh")}
</button>
</div>
</div>
{/* TABS */}
<div style={{ backgroundColor: (isGlass || isLG) ? (isLG ? "rgba(255,255,255,0.35)" : "
<div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1rem" }}>
<nav style={{ display: "flex", gap: isBrut ? "0" : (isMobile ? "1rem" : "2rem") }}>
{["dashboard", "transactions", "monthly"].map((tab) => (
<button key={tab} onClick={() => setActiveTab(tab)} style={{
padding: isBrut ? "1rem 1.5rem" : (isCompact ? "0.625rem 0.25rem" : "1rem 0.2
borderBottom: activeTab === tab ? (isBrut ? `4px solid ${c.accent}` : `2px so
backgroundColor: isBrut && activeTab === tab ? c.accentBg : "transparent",
fontSize: isCompact ? "0.8125rem" : "0.875rem", fontWeight: bwm, cursor: "poi
textTransform: isBrut ? "uppercase" : "none", letterSpacing: isBrut ? "0.1em"
transform: activeTab === tab && !isBrut ? "translateY(-2px)" : "none",
}} className={isTerm && activeTab === tab ? "terminal-glow" : ""}>
{isTerm ? `[${tab.toUpperCase()}]` : tab.charAt(0).toUpperCase() + tab.slice(
</button>
))}
</nav>
</div>
</div>
{/* MAIN CONTENT */}
<div style={{ maxWidth: "80rem", margin: "0 auto", padding: isMobile ? "0.75rem 0.5rem"
{error && <div style={{ padding: isCompact ? "0.625rem" : "1rem", backgroundColor: c.
{/* ===== DASHBOARD TAB ===== */}
{activeTab === "dashboard" && (
<div>
{/* STAT CARDS */}
<div style={{ display: "grid", gridTemplateColumns: isBrut ? "1fr" : (isMobile ?
{[
{ label: "Net Profit", value: stats.totalNetProfit, icon: TrendingUp, color:
{ label: "Total USDT Sold", value: stats.totalUsdtSold, icon: DollarSign, col
{ label: "Gross Profit", value: stats.totalGrossProfit, icon: TrendingUp, col
{ label: "Total Cost", value: stats.totalCost, icon: DollarSign, color: "Blue
{ label: "Dollar Used", value: stats.totalDollarUsed, icon: DollarSign, color
{ label: "Average Profit", value: stats.avgNetProfit, icon: TrendingUp, color
{ label: "Avg Buy Rate", value: stats.avgBuyRate, icon: DollarSign, color: "T
{ label: "Avg Sell Rate", value: stats.avgSellRate, icon: DollarSign, color:
].map((stat, idx) => {
const sc = c.statCards[stat.color] || {};
const txtColor = sc.text || null;
const iconSz = isCompact ? L.statIconSizeSm : L.statIconSize;
const isRow = L.statCardDir === "row";
return (
<div key={idx} className={isLG ? "lg-specular" : ""} style={{
padding: isMobile ? "1rem" : (isCompact ? "0.875rem" : (isBrut ? "1.5rem"
borderRadius: isBrut ? "0" : r, color: txtColor || (isLG ? c.text : "#fff
background: sc.bg, border: sc.border || (isBrut ? "3px solid #000" : (isL
boxShadow: isBrut ? "4px 4px 0 #000" : (isLG ? "0 4px 24px rgba(0,0,0,0.0
...((isGlass || isLG) ? { backdropFilter: isLG ? "blur(40px) saturate(180
cursor: "pointer", animation: "slideUp 0.5s ease-out", animationDelay: `$
display: isRow ? "flex" : "block", alignItems: isRow ? "center" : undefin
transform: hoveredStat === idx ? (isBrut ? "translate(-2px,-2px)" : "tran
transition: "transform 0.3s ease, box-shadow 0.3s ease",
...(isBrut && hoveredStat === idx ? { boxShadow: "8px 8px 0 #000" } : {})
...(isBrut ? { marginBottom: "0.5rem" } : {}),
}}
onMouseEnter={() => setHoveredStat(idx)} onMouseLeave={() => setHoveredSt
{isRow ? (
<>
<StatIcon Icon={stat.icon} size={iconSz} layout={L} c={c} />
<div style={{ flex: 1 }}>
<div style={{ fontSize: isCompact ? "0.75rem" : "0.875rem", opacity
<div style={{ fontSize: isCompact ? "1.5rem" : "2rem", fontWeight:
<div style={{ fontSize: "0.75rem", opacity: 0.7, color: txtColor ||
</div>
</>
) : (
<>
{(isMid || isCirc) && L.statIconBg && <div style={{ display: "flex",
<div style={{ display: isCirc ? "block" : "flex", justifyContent: "sp
<div style={{ fontSize: isCompact ? "0.75rem" : "1rem", opacity: 0.
{!isMid && !isCirc && <StatIcon Icon={stat.icon} size={iconSz} layo
</div>
<div style={{ fontSize: isMobile ? "1.75rem" : (isCompact ? "1.5rem"
<div style={{ fontSize: isCompact ? "0.6875rem" : "0.875rem", opacity
</>
)}
</div>
);
})}
</div>
{/* PROFIT TREND CHART */}
{!loading && monthly.length > 0 && (() => {
const maxProfit = Math.max(...monthly.map((m) => m.profit), 1);
const chartH = isMobile ? 180 : (isCompact ? 220 : 300);
const chartW = 100; // percentage
return (
<div style={cardBase}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems:
<h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}><TrendingUp size={i
<ChartToggle mode={profitChartMode} setMode={setProfitChartMode} opt1={{
</div>
<div style={{ position: "relative", height: `${chartH}px`, display: "flex",
{[0, 0.25, 0.5, 0.75, 1].map((pct) => (
<div key={pct} style={{ position: "absolute", left: 0, bottom: `${2 + p
))}
{[0, 0.25, 0.5, 0.75, 1].map((pct) => (
<div key={`g${pct}`} style={{ position: "absolute", left: "3rem", right
))}
{profitChartMode === "bar" ? (
monthly.map((m, i) => {
const barH = (m.profit / maxProfit) * (chartH - 32);
return (
<div key={i} style={{ flex: 1, display: "flex", flexDirection: "col
onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHove
{hoveredBar === i && (
<div style={{ position: "absolute", bottom: `${barH + 8}px`, ba
{m.month}: ${m.profit.toFixed(2)}
</div>
)}
<div style={{
width: "100%", maxWidth: isMobile ? "28px" : "48px", height: `$
background: c.accent, borderRadius: isCirc ? "999px" : (isBrut
transition: "height 0.6s ease, opacity 0.2s ease",
opacity: hoveredBar === null || hoveredBar === i ? 1 : 0.5,
transform: hoveredBar === i ? "scaleY(1.03)" : "scaleY(1)", tra
}}></div>
<div style={{ fontSize: isMobile ? "0.5rem" : (isCompact ? {isMobile ? m.month.slice(0, 3) : m.month}
</div>
</div>
"0.562
);
})
) : (
/* LINE CHART */
<svg style={{ position: "absolute", left: "3rem", right: 0, top: 0, bot
<polyline fill="none" stroke={c.accent} strokeWidth="3" strokeLinecap
points={monthly.map((m, i) => `${i * 100 / (monthly.length - 1 || 1
<polyline fill={`${c.accent}20`} stroke="none"
points={`0,${chartH - 32} ${monthly.map((m, i) => `${i * 100 {monthly.map((m, i) => {
const x = i * 100 / (monthly.length - 1 || 1) * (monthly.length * 1
const y = (chartH - 32) - (m.profit / maxProfit) * (chartH - return <circle key={i} cx={x} cy={y} r={hoveredBar === i ? 7 onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHove
/ (mon
32);
: 5} f
})}
</svg>
)}
{profitChartMode === "line" && (
<div style={{ position: "absolute", left: "3rem", right: 0, bottom: 0,
{monthly.map((m, i) => (
<div key={i} style={{ fontSize: isMobile ? "0.5rem" : (isCompact ?
onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHove
{isMobile ? m.month.slice(0, 3) : m.month}
</div>
))}
</div>
)}
{profitChartMode === "line" && hoveredBar !== null && monthly[hoveredBar]
<div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", bac
{monthly[hoveredBar].month}: ${monthly[hoveredBar].profit.toFixed(2)}
</div>
)}
</div>
</div>
);
})()}
{/* OWNER PERFORMANCE */}
{!loading && (
<>
? "fle
totalG
<div style={cardBase}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems:
<h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}><User size={isCompa
<ChartToggle mode={ownerChartMode} setMode={setOwnerChartMode} opt1={{ ke
</div>
{ownerChartMode === "pie" ? (
<SimplePieChart data={owners.map((o) => ({ label: o.name, value: stats.ow
) : (
<div style={{ display: (L.ownerLayout === "horizontal" && !isMobile) {owners.map((o) => {
const os = stats.ownerStats?.[o.id] || { count: 0, totalCost: 0, return (
<div key={o.id} style={{ padding: isCompact ? "1rem" : "1.5rem", back
<div style={{ display: "flex", flexWrap: "wrap", justifyContent: "s
<span style={{ fontFamily: headingFont, fontWeight: "800", fontSi
<span style={{ fontSize: isCompact ? "0.75rem" : "0.875rem", colo
</div>
<div style={{ display: (L.ownerLayout === "horizontal" && !isMobile
{[{ label: "COST", value: os.totalCost, color: "#3b82f6" }, { lab
<div key={s.label} style={{ textAlign: "center", padding: isCom
<div style={{ fontSize: isCompact ? "0.6875rem" : "0.75rem",
<div style={{ fontSize: isCompact ? "1.125rem" : "1.5rem", fo
</div>
))}
</div>
</div>
);
})}
</div>
)}
</div>
{/* CARD TYPE STATS */}
<div style={cardBase}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems:
<h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Card Type Statistic
<ChartToggle mode={cardTypeChartMode} setMode={setCardTypeChartMode} opt1
</div>
{cardTypeChartMode === "pie" ? (
<SimplePieChart data={Object.entries(stats.cardTypeStats || {}).map(([typ
=> (
) : (
<div style={{ display: L.cardTypeLayout === "list" ? "flex" : "grid", flexD
{Object.entries(stats.cardTypeStats || {}).map(([type, data], idx) <div key={type} style={{
padding: L.cardTypeLayout === "list" ? "1rem" : (isCompact ? "1rem" :
border: isBrut ? `2px solid ${c.border}` : `${isCompact ? "1px" : "2p
borderRadius: rSm, backgroundColor: c.surfaceAlt, cursor: "pointer",
display: L.cardTypeLayout === "list" ? "flex" : "block", alignItems:
...(isBrut ? { boxShadow: "3px 3px 0 #000" } : {}),
...(hoveredCard === idx ? { borderColor: c.accent, transform: L.cardT
transition: "all 0.3s ease, transform 0.2s ease",
}} onMouseEnter={() => setHoveredCard(idx)} onMouseLeave={() => setHove
<div style={{ display: "flex", alignItems: "center", gap: "0.75rem",
<div style={{ width: isBrut ? "16px" : "14px", height: isBrut ? "16
<span style={{ fontFamily: headingFont, fontWeight: "800", fontSize
{L.cardTypeLayout === "list" && <span style={{ fontSize: "0.8125rem
</div>
{L.cardTypeLayout !== "list" && <div style={{ fontSize: isCompact ? "
<div style={{ fontSize: L.cardTypeLayout === "list" ? "1.25rem" : (is
</div>
))}
</div>
)}
</div>
</>
)}
</div>
)}
{/* ===== TRANSACTIONS TAB ===== */}
{activeTab === "transactions" && (
<div>
<div style={{ ...cardBase, marginBottom: isCompact ? "0.625rem" : "1rem" }}>
<div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", flex
<div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", fl
<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><Filt
{[{ val: filterCardType, set: setFilterCardType, opts: [{ v: "all", l: "All
<select key={i} style={{ padding: isCompact ? "0.375rem 0.5rem" : "0.5rem
{f.opts.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
</select>
))}
</div>
<div style={{ display: "flex", gap: "0.5rem", width: isMobile ? "100%" : "aut
{[{ m: "table", icon: List, label: "Table" }, { m: "cards", icon: LayoutGri
<button key={m} onClick={() => setViewMode(m)} style={{ padding: isCompac
))}
</div>
</div>
</div>
"colla
{viewMode === "table" ? (
<div style={cardBase}>
<div style={{ overflowX: "auto" }}>
<table style={{ width: "100%", borderCollapse: isBrut ? "separate" : <thead><tr>
{[{ label: "Date", col: "date" }, { label: "Card Type", col: "cardType"
<th key={col} style={{ ...thStyle, cursor: "pointer", userSelect: "no
<div style={{ display: "inline-flex", alignItems: "center", gap: "0
</th>
))}
"point
{[{ label: "Buy Rate", col: "buyRate" }, { label: "Buy Amount", col: "b
<th key={col} style={{ ...thStyle, textAlign: "right", cursor: <div style={{ display: "inline-flex", alignItems: "center", gap: "0
</th>
))}
</tr></thead>
<tbody>
{sortedTransactions.map((t) => {
const cd = getCardById(t.cardId); const ow = getOwnerById(t.ownerId);
return (
<tr key={t.id}>
<td style={{ ...tdStyle, fontSize: isCompact ? "0.6875rem" : "0.8
<td style={tdStyle}><div style={{ display: "flex", alignItems: "c
<td style={tdStyle}>{cd?.number || "-"}</td>
<td style={{ ...tdStyle, fontWeight: bwm }}>{ow?.name}</td>
<td style={{ ...tdStyle, textAlign: "right" }}>{parseFloat(t.buyR
<td style={{ ...tdStyle, textAlign: "right" }}>${parseFloat(t.buy
<td style={{ ...tdStyle, textAlign: "right" }}>{parseFloat(t.sell
<td style={{ ...tdStyle, textAlign: "right" }}>${parseFloat(t.sel
<td style={{ ...tdStyle, textAlign: "right" }}>${t.cost.toFixed(2
<td style={{ ...tdStyle, textAlign: "right", color: isTerm ? c.te
<td style={{ ...tdStyle, textAlign: "right", color: isTerm ? c.te
<td style={{ ...tdStyle, textAlign: "right" }}><span style={mb.st
</tr>
);
})}
</tbody>
<tfoot>
<tr style={{ backgroundColor: c.surfaceAlt, fontWeight: "700", borderTo
<td colSpan="3" style={{ ...tdStyle, fontWeight: "700", fontSize: isC
<td colSpan="2" style={{ ...tdStyle, textAlign: "center", fontSize: i
<td style={{ ...tdStyle, textAlign: "center", fontSize: isCompact ? "
<td style={{ ...tdStyle, textAlign: "center", fontSize: isCompact ? "
<td style={{ ...tdStyle, textAlign: "center", fontSize: isCompact ? "
? "1fr
<td style={tdStyle}></td>
<td style={{ ...tdStyle, textAlign: "center", fontSize: isCompact ? "
<td style={{ ...tdStyle, textAlign: "center", fontSize: isCompact ? "
<td style={tdStyle}></td>
</tr>
</tfoot>
</table>
</div>
</div>
) : (
<div style={{ display: "grid", gridTemplateColumns: (isBrut || isMobile) {sortedTransactions.map((t, idx) => {
const cd = getCardById(t.cardId); const ow = getOwnerById(t.ownerId); const
return (
<div key={t.id} className={isLG ? "lg-specular" : ""} style={{ background
onMouseEnter={() => setHoveredCard(`tx-${idx}`)} onMouseLeave={() => se
<div style={{ display: "flex", justifyContent: "space-between", alignIt
<div style={{ display: "flex", alignItems: "center", gap: isCompact ?
<div style={{ width: isCompact ? "12px" : "16px", height: isCompact
<div><div style={{ fontWeight: "700", fontSize: isCompact ? "0.9375
</div>
<span style={mb.style}>{t.profitMargin.toFixed(1)}%</span>
</div>
<div style={{ display: "flex", justifyContent: "space-between", alignIt
<div><div style={{ fontSize: isCompact ? "0.6875rem" : "0.875rem", co
<div style={{ textAlign: "right" }}><div style={{ fontSize: isCompact
</div>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: isC
<div><div style={{ fontSize: isCompact ? "0.625rem" : "0.75rem", colo
<div><div style={{ fontSize: isCompact ? "0.625rem" : "0.75rem", colo
</div>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap:
{[{ l: "Cost", v: t.cost, cl: "#3b82f6" }, { l: "Gross", v: t.grossPr
<div key={x.l}><div style={{ fontSize: isCompact ? "0.625rem" : "0.
))}
</div>
</div>
);
})}
</div>
)}
</div>
)}
{/* ===== MONTHLY TAB ===== */}
{activeTab === "monthly" && (
<div>
{monthly.length > 0 && (
<div style={{ marginBottom: isCompact ? "1rem" : "2rem" }}>
<div className={isLG ? "lg-specular" : ""} style={{ padding: isMobile ? "1.25
<div style={{ fontSize: isMobile ? "0.8125rem" : (isCompact ? "0.9375rem" :
<div style={{ fontSize: isMobile ? "2rem" : (isCompact ? "2.5rem" : "3.5rem
<div style={{ fontSize: isMobile ? "0.6875rem" : (isCompact ? "0.8125rem" :
</div>
</div>
)}
<div style={cardBase}>
<h2 style={sectionTitleStyle}><Calendar size={isCompact ? 20 : 24} /> Monthly B
{monthly.length === 0 ? (
<div style={{ textAlign: "center", padding: "3rem", color: c.textSec }}><p st
) : (
<div style={{ overflowX: "auto" }}>
<table style={{ width: "100%", borderCollapse: isBrut ? "separate" : "colla
<thead><tr><th style={thStyle}>Month</th><th style={{ ...thStyle, textAli
<tbody>
{monthly.map((m, idx) => (
<tr key={m.id} style={{ backgroundColor: idx % 2 === 0 ? c.surface :
<td style={{ ...tdStyle, fontWeight: bws, fontSize: isCompact ? "0.
<td style={{ ...tdStyle, textAlign: "right", color: isTerm ? c.text
</tr>
))}
</tbody>
<tfoot><tr style={{ backgroundColor: c.surfaceAlt, fontWeight: "700", bor
<td style={{ ...tdStyle, fontWeight: "700", fontSize: isCompact ? "0.81
<td style={{ ...tdStyle, textAlign: "right", fontWeight: "700", color:
</tr></tfoot>
</table>
</div>
)}
</div>
</div>
)}
</div>
{/* ===== SETTINGS MODAL ===== */}
{showSettings && (
<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColo
<div style={{ backgroundColor: isGlass ? "rgba(20,14,48,0.95)" : (isLG ? "rgba(255,
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "cent
<h2 style={{ fontSize: "1.5rem", fontFamily: headingFont, fontWeight: "800", co
<button onClick={() => setShowSettings(false)} style={{ padding: "0.5rem", bord
</div>
{/* Theme */}
margin
<div style={{ marginBottom: "2rem" }}>
<label style={{ display: "block", fontSize: "0.875rem", fontWeight: bws, <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, 1fr)"
{THEME_OPTIONS.map((opt) => (
<div key={opt.key} onClick={() => setTheme(opt.key)} style={{ padding: "0.5
<div style={{ display: "flex", height: "24px", borderRadius: isBrut ? "0"
{opt.preview.map((color, i) => <div key={i} style={{ flex: 1, backgroun
</div>
<div style={{ fontSize: "0.6875rem", fontWeight: "600", color: theme ===
</div>
))}
</div>
</div>
margin
{/* View Style */}
<div style={{ marginBottom: "2rem" }}>
<label style={{ display: "block", fontSize: "0.875rem", fontWeight: bws, <div style={{ display: "flex", gap: "0.75rem" }}>
{[{ k: "normal", i: LayoutGrid, l: "Normal", d: "Large cards" }, { k: "compac
<div key={o.k} onClick={() => setViewStyle(o.k)} style={{ flex: 1, padding:
<o.i size={24} /><span>{o.l}</span><div style={{ fontSize: "0.6875rem", o
</div>
))}
</div>
</div>
{/* Font */}
<div style={{ marginBottom: "2rem" }}>
<label style={{ display: "block", fontSize: "0.875rem", fontWeight: bws, margin
<select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)}
{FONTS.map((f) => <option key={f.value} value={f.value}>{f.name}</option>)}
</select>
</div>
{/* Font Size */}
<div style={{ marginBottom: "2rem" }}>
<label style={{ display: "block", fontSize: "0.875rem", fontWeight: bws, margin
<input type="range" min="12" max="20" value={fontSize} onChange={(e) => setFont
<div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5
<span>Small (12px)</span><span style={{ fontSize: "1.125rem", fontWeight: "70
</div>
</div>
{/* Bold Text */}
<div style={{ marginBottom: "2rem" }}>
<label style={{ display: "block", fontSize: "0.875rem", fontWeight: bws, margin
<div onClick={() => setBoldText(!boldText)} style={{ display: "flex", alignItem
<div>
<div style={{ fontWeight: boldText ? "700" : "600", fontSize: "0.9375rem",
<div style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "0.25rem", colo
</div>
<div style={{ width: "44px", height: "24px", borderRadius: "12px", background
<div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroun
</div>
</div>
</div>
{/* Auto-Refresh */}
<div style={{ marginBottom: "2rem" }}>
<label style={{ display: "block", fontSize: "0.875rem", fontWeight: bws, margin
<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5
{[{ v: 0, l: "Off" }, { v: 30, l: "30s" }, { v: 60, l: "1m" }, { v: 300, l: "
<button key={opt.v} onClick={() => setAutoRefresh(opt.v)} style={{ padding:
{opt.l}
</button>
))}
</div>
</div>
{autoRefresh > 0 && <div style={{ display: "flex", alignItems: "center", gap: "
</div>
</div>
)}
<style>{`
*, *::before, *::after { font-family: inherit; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity:
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes shake { 0%, 100% { transform: translateX(0); } 25%, 75% { transform: trans
${L.extraCss}
`}</style>
</div>
);
}
export default App;