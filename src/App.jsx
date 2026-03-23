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
  Plus,
} from "lucide-react";

const GOOGLE_SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbyAgrF3WEgwtSzTr7xqh_Z3DUigMBTuXz1MWvEUMx-LxCnljJet4E08oeQazTM430VuyQ/exec";

const FONTS = [
  { name: "Inter", value: "Inter" },
  { name: "Poppins", value: "Poppins" },
  { name: "League Spartan", value: "League Spartan" },
  { name: "Open Sans", value: "Open Sans" },
  { name: "Lexend", value: "Lexend" },
  { name: "Public Sans", value: "Public Sans" },
  { name: "Rethink Sans", value: "Rethink Sans" },
  { name: "Noto Sans", value: "Noto Sans" },
  { name: "Noto Serif", value: "Noto Serif" },
  { name: "Quicksand", value: "Quicksand" },
  { name: "Winky Sans", value: "Winky Sans" },
];

const THEME_OPTIONS = [
  { key: "auto", label: "Auto", preview: ["#94a3b8", "#667eea", "#84fab0", "#64748b"] },
  { key: "sunset", label: "Sunset", preview: ["#fff7ed", "#f97316", "#e11d48", "#fbbf24"] },
  { key: "glass", label: "Glass", preview: ["#1a1a2e", "#e0e7ff", "#818cf8", "#312e81"] },
  { key: "terminal", label: "Terminal", preview: ["#0a0a0a", "#00ff41", "#003b00", "#1a1a1a"] },
  { key: "brutalist", label: "Brutalist", preview: ["#f5f5f0", "#000000", "#ff3333", "#ffffff"] },
  { key: "midnight", label: "Midnight", preview: ["#0f0720", "#7c3aed", "#c084fc", "#1e1b4b"] },
  { key: "liquid_glass", label: "Liquid Glass", preview: ["#f0f2f5", "#e8ecf4", "#ffffff80", "#d0d5e0"] },
  { key: "circular", label: "Circular", preview: ["#faf5ff", "#8b5cf6", "#c084fc", "#ede9fe"] },
];

// --- Layout descriptors per theme ---
const themeLayouts = {
  default: {
    statCardDir: "column",        // stat card flex direction
    statIconSize: 32,             // dashboard stat icon size
    statIconSizeSm: 20,           // compact
    statIconBg: false,            // wrap icon in a bg circle
    statIconBgStyle: null,
    statGridMin: "280px",         // min-width for stat grid items
    statGridMinSm: "180px",
    ownerLayout: "grid",          // "grid" | "horizontal"
    cardTypeLayout: "grid",       // "grid" | "list"
    tableStyle: "default",        // "default" | "terminal" | "brutalist"
    extraCss: "",
  },
  glass: {
    statCardDir: "row",           // horizontal: icon left, text right
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
    extraCss: `.glass-card { backdrop-filter: blur(16px) saturate(180%); -webkit-backdrop-filter: blur(16px) saturate(180%); }`,
  },
  terminal: {
    statCardDir: "row",           // inline readout: icon left, data right
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
      .terminal-scanline { pointer-events: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 50;
        background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.015) 2px, rgba(0,255,65,0.015) 4px); }
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
    statGridMin: "100%",          // force single-column stack
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
    extraCss: `.midnight-stars { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 0; pointer-events: none;
      background-image: radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.3), transparent),
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
      background: "rgba(255,255,255,0.45)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.6)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }),
    statGridMin: "280px",
    statGridMinSm: "180px",
    ownerLayout: "grid",
    cardTypeLayout: "grid",
    tableStyle: "default",
    extraCss: `.lg-surface { backdrop-filter: blur(16px) saturate(150%); -webkit-backdrop-filter: blur(16px) saturate(150%); }
      .lg-specular { position: relative; overflow: hidden; }
      .lg-specular::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 50%; background: linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%); border-radius: inherit; pointer-events: none; z-index: 1; }`,
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
    extraCss: `.circ-blob { position: fixed; border-radius: 50%; pointer-events: none; z-index: 0; filter: blur(80px); opacity: 0.12; }`,
  },
};

const getThemeLayout = (name) => {
  const map = { auto: "default", sunset: "default",
    glass: "glass", terminal: "terminal", brutalist: "brutalist", midnight: "midnight", liquid_glass: "liquid_glass", circular: "circular" };
  return themeLayouts[map[name] || "default"];
};

const getThemeColors = (themeName) => {
  const autoIsDark = typeof window !== 'undefined' && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const base = {
    radius: "1rem", radiusSm: "0.75rem", radiusCompact: "0.375rem", radiusCompactSm: "0.25rem",
    headerBorderBottom: null, bgPattern: null, cardGlow: null, cardBackdrop: null,
  };

  const palettes = {
    sunset: {
      ...base, isDark: false, radius: "1.125rem", radiusSm: "0.875rem", radiusCompact: "0.5rem",
      bg: "#fef7f0", bgAlt: "#fff5eb", surface: "#ffffff", surfaceAlt: "#fff5eb", surfaceDeep: "#fff1e6",
      text: "#431407", textSec: "#9a3412", textMuted: "#c2410c", textLight: "#fff7ed", textMid: "#ea580c", textStrong: "#7c2d12",
      border: "#fed7aa", borderAlt: "#fdba74", borderStrong: "#fb923c", borderHover: "#ea580c",
      accent: "#ea580c", accentBg: "#ffedd5", accentDark: "#9a3412", inputBg: "#ffffff", inputBorder: "#fed7aa",
      titleGrad: "linear-gradient(135deg, #f97316 0%, #e11d48 50%, #be123c 100%)",
      btnGrad: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)", btnGlow: "rgba(249, 115, 22, 0.4)",
      statCards: { Green: { bg: "linear-gradient(135deg, #fbbf24 0%, #f97316 100%)", text: "#451a03" }, Teal: { bg: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)" }, Orange: { bg: "linear-gradient(135deg, #fde68a 0%, #fbbf24 100%)", text: "#78350f" }, Blue: { bg: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)" }, Pink: { bg: "linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)" }, Purple: { bg: "linear-gradient(135deg, #fecdd3 0%, #fda4af 100%)", text: "#9f1239" } },
      profitGrad: "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)",
      errorBg: "#fef2f2", errorBorder: "#ef4444", errorText: "#991b1b",
      badgeGreen: { bg: "#fef3c7", text: "#92400e" }, badgeYellow: { bg: "#ffedd5", text: "#9a3412" }, badgeRed: { bg: "#fee2e2", text: "#991b1b" },
      shadow: "0 2px 8px rgba(249,115,22,0.08)", shadowCompact: "0 1px 4px rgba(249,115,22,0.06)",
      shadowLg: "0 20px 40px -10px rgba(249,115,22,0.12)", shadowLgCompact: "0 2px 8px rgba(249,115,22,0.06)",
      hoverShadow: "0 25px 50px -12px rgba(249,115,22,0.2)",
      cardHoverShadow: "0 8px 24px rgba(249,115,22,0.12)", modalShadow: "0 25px 50px -12px rgba(249,115,22,0.15)", toggleBg: "#fed7aa",
      bgPattern: "radial-gradient(ellipse at 80% 80%, rgba(251,191,36,0.08) 0%, transparent 50%)",
    },
    // --- ADVANCED THEMES ---
    glass: {
      ...base, isDark: true, radius: "1.25rem", radiusSm: "1rem", radiusCompact: "0.75rem", radiusCompactSm: "0.5rem",
      bg: "#0f0f23", bgAlt: "#0f0f23", surface: "rgba(255,255,255,0.06)", surfaceAlt: "rgba(255,255,255,0.03)", surfaceDeep: "rgba(255,255,255,0.02)",
      text: "#e0e7ff", textSec: "#a5b4fc", textMuted: "#818cf8", textLight: "#eef2ff", textMid: "#c7d2fe", textStrong: "#eef2ff",
      border: "rgba(165,180,252,0.15)", borderAlt: "rgba(165,180,252,0.1)", borderStrong: "rgba(165,180,252,0.25)", borderHover: "#818cf8",
      accent: "#818cf8", accentBg: "rgba(129,140,248,0.15)", accentDark: "#4338ca",
      inputBg: "rgba(255,255,255,0.06)", inputBorder: "rgba(165,180,252,0.2)",
      titleGrad: "linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #e879f9 100%)",
      btnGrad: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", btnGlow: "rgba(129,140,248,0.4)",
      statCards: { Green: { bg: "linear-gradient(135deg, rgba(16,185,129,0.4) 0%, rgba(6,182,212,0.3) 100%)" }, Teal: { bg: "linear-gradient(135deg, rgba(99,102,241,0.4) 0%, rgba(59,130,246,0.3) 100%)" }, Orange: { bg: "linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(249,115,22,0.15) 100%)", text: "#fde68a" }, Blue: { bg: "linear-gradient(135deg, rgba(129,140,248,0.4) 0%, rgba(168,85,247,0.3) 100%)" }, Pink: { bg: "linear-gradient(135deg, rgba(236,72,153,0.4) 0%, rgba(244,63,94,0.3) 100%)" }, Purple: { bg: "linear-gradient(135deg, rgba(192,132,252,0.3) 0%, rgba(232,121,249,0.2) 100%)", text: "#e9d5ff" } },
      profitGrad: "linear-gradient(135deg, rgba(16,185,129,0.6) 0%, rgba(6,182,212,0.5) 100%)",
      errorBg: "rgba(239,68,68,0.1)", errorBorder: "rgba(239,68,68,0.3)", errorText: "#fca5a5",
      badgeGreen: { bg: "rgba(16,185,129,0.2)", text: "#6ee7b7" }, badgeYellow: { bg: "rgba(251,191,36,0.2)", text: "#fde68a" }, badgeRed: { bg: "rgba(239,68,68,0.2)", text: "#fca5a5" },
      shadow: "0 4px 24px rgba(0,0,0,0.2)", shadowCompact: "0 2px 12px rgba(0,0,0,0.15)",
      shadowLg: "0 8px 40px rgba(99,102,241,0.1), 0 4px 20px rgba(0,0,0,0.2)", shadowLgCompact: "0 4px 20px rgba(0,0,0,0.15)",
      hoverShadow: "0 12px 48px rgba(99,102,241,0.2), 0 8px 24px rgba(0,0,0,0.3)",
      cardHoverShadow: "0 8px 32px rgba(99,102,241,0.15)", modalShadow: "0 25px 80px rgba(0,0,0,0.6)", toggleBg: "rgba(255,255,255,0.1)",
      headerBorderBottom: "1px solid rgba(165,180,252,0.1)",
      bgPattern: "radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.06) 0%, transparent 50%)",
      cardBackdrop: "blur(16px) saturate(180%)", cardGlow: "0 0 0 1px rgba(165,180,252,0.08)",
    },
    terminal: {
      ...base, isDark: true, radius: "0", radiusSm: "0", radiusCompact: "0", radiusCompactSm: "0",
      bg: "#0a0a0a", bgAlt: "#0a0a0a", surface: "#111111", surfaceAlt: "#0a0a0a", surfaceDeep: "#050505",
      text: "#00ff41", textSec: "#00cc33", textMuted: "#009926", textLight: "#33ff66", textMid: "#00e639", textStrong: "#00ff41",
      border: "rgba(0,255,65,0.2)", borderAlt: "rgba(0,255,65,0.15)", borderStrong: "rgba(0,255,65,0.35)", borderHover: "#00ff41",
      accent: "#00ff41", accentBg: "rgba(0,255,65,0.1)", accentDark: "#003b00",
      inputBg: "#0d0d0d", inputBorder: "rgba(0,255,65,0.25)",
      titleGrad: "linear-gradient(90deg, #00ff41 0%, #00cc33 100%)",
      btnGrad: "linear-gradient(90deg, #00cc33 0%, #009926 100%)", btnGlow: "rgba(0,255,65,0.3)",
      statCards: { Green: { bg: "rgba(0,255,65,0.08)", border: "1px dashed rgba(0,255,65,0.3)", text: "#00ff41" }, Teal: { bg: "rgba(0,255,65,0.06)", border: "1px dashed rgba(0,255,65,0.3)", text: "#00ff41" }, Orange: { bg: "rgba(0,255,65,0.04)", border: "1px dashed rgba(0,255,65,0.3)", text: "#00ff41" }, Blue: { bg: "rgba(0,255,65,0.08)", border: "1px dashed rgba(0,255,65,0.3)", text: "#00ff41" }, Pink: { bg: "rgba(0,255,65,0.06)", border: "1px dashed rgba(0,255,65,0.3)", text: "#00ff41" }, Purple: { bg: "rgba(0,255,65,0.04)", border: "1px dashed rgba(0,255,65,0.3)", text: "#00ff41" } },
      profitGrad: "rgba(0,255,65,0.12)",
      errorBg: "rgba(255,0,0,0.1)", errorBorder: "rgba(255,0,0,0.4)", errorText: "#ff4444",
      badgeGreen: { bg: "rgba(0,255,65,0.15)", text: "#00ff41" }, badgeYellow: { bg: "rgba(255,255,0,0.15)", text: "#ffff00" }, badgeRed: { bg: "rgba(255,0,0,0.15)", text: "#ff4444" },
      shadow: "none", shadowCompact: "none",
      shadowLg: "0 0 15px rgba(0,255,65,0.05)", shadowLgCompact: "none",
      hoverShadow: "0 0 20px rgba(0,255,65,0.1)",
      cardHoverShadow: "0 0 15px rgba(0,255,65,0.08)", modalShadow: "0 0 40px rgba(0,255,65,0.1)", toggleBg: "rgba(0,255,65,0.15)",
      headerBorderBottom: "1px dashed rgba(0,255,65,0.3)", bgPattern: null,
    },
    brutalist: {
      ...base, isDark: false, radius: "0", radiusSm: "0", radiusCompact: "0", radiusCompactSm: "0",
      bg: "#f5f5f0", bgAlt: "#f5f5f0", surface: "#ffffff", surfaceAlt: "#eeeeea", surfaceDeep: "#e5e5e0",
      text: "#000000", textSec: "#333333", textMuted: "#666666", textLight: "#ffffff", textMid: "#444444", textStrong: "#000000",
      border: "#000000", borderAlt: "#000000", borderStrong: "#000000", borderHover: "#ff3333",
      accent: "#ff3333", accentBg: "#ffe5e5", accentDark: "#cc0000",
      inputBg: "#ffffff", inputBorder: "#000000",
      titleGrad: "linear-gradient(90deg, #000000 0%, #333333 100%)",
      btnGrad: "#000000", btnGlow: "rgba(0,0,0,0.2)",
      statCards: { Green: { bg: "#000000", text: "#ffffff" }, Teal: { bg: "#ff3333", text: "#ffffff" }, Orange: { bg: "#ffffff", text: "#000000", border: "3px solid #000000" }, Blue: { bg: "#000000", text: "#ffffff" }, Pink: { bg: "#ff3333", text: "#ffffff" }, Purple: { bg: "#ffffff", text: "#000000", border: "3px solid #000000" } },
      profitGrad: "#000000",
      errorBg: "#ffffff", errorBorder: "#ff3333", errorText: "#ff0000",
      badgeGreen: { bg: "#000000", text: "#ffffff" }, badgeYellow: { bg: "#ff3333", text: "#ffffff" }, badgeRed: { bg: "#ffffff", text: "#ff0000" },
      shadow: "4px 4px 0px #000000", shadowCompact: "3px 3px 0px #000000",
      shadowLg: "6px 6px 0px #000000", shadowLgCompact: "4px 4px 0px #000000",
      hoverShadow: "8px 8px 0px #000000",
      cardHoverShadow: "8px 8px 0px #ff3333", modalShadow: "8px 8px 0px #000000", toggleBg: "#cccccc",
      headerBorderBottom: "4px solid #000000", bgPattern: null,
    },
    midnight: {
      ...base, isDark: true, radius: "1.5rem", radiusSm: "1.25rem", radiusCompact: "0.75rem", radiusCompactSm: "0.5rem",
      bg: "#0a0520", bgAlt: "#0a0520", surface: "#140e30", surfaceAlt: "#0f0825", surfaceDeep: "#0a0520",
      text: "#e9d5ff", textSec: "#c084fc", textMuted: "#a855f7", textLight: "#f5f3ff", textMid: "#d8b4fe", textStrong: "#f5f3ff",
      border: "rgba(139,92,246,0.2)", borderAlt: "rgba(139,92,246,0.15)", borderStrong: "rgba(139,92,246,0.35)", borderHover: "#a855f7",
      accent: "#a855f7", accentBg: "rgba(139,92,246,0.15)", accentDark: "#6d28d9",
      inputBg: "rgba(139,92,246,0.08)", inputBorder: "rgba(139,92,246,0.25)",
      titleGrad: "linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f43e5c 100%)",
      btnGrad: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)", btnGlow: "rgba(139,92,246,0.4)",
      statCards: { Green: { bg: "linear-gradient(135deg, #059669 0%, #7c3aed 100%)" }, Teal: { bg: "linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)" }, Orange: { bg: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", text: "#fde68a" }, Blue: { bg: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)" }, Pink: { bg: "linear-gradient(135deg, #be185d 0%, #9333ea 100%)" }, Purple: { bg: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", text: "#c4b5fd" } },
      profitGrad: "linear-gradient(135deg, #7c3aed 0%, #059669 100%)",
      errorBg: "rgba(239,68,68,0.1)", errorBorder: "rgba(239,68,68,0.3)", errorText: "#fca5a5",
      badgeGreen: { bg: "rgba(16,185,129,0.2)", text: "#6ee7b7" }, badgeYellow: { bg: "rgba(251,191,36,0.2)", text: "#fde68a" }, badgeRed: { bg: "rgba(239,68,68,0.2)", text: "#fca5a5" },
      shadow: "0 4px 20px rgba(139,92,246,0.08)", shadowCompact: "0 2px 12px rgba(139,92,246,0.06)",
      shadowLg: "0 12px 40px rgba(139,92,246,0.12), 0 4px 16px rgba(0,0,0,0.2)", shadowLgCompact: "0 4px 20px rgba(139,92,246,0.06)",
      hoverShadow: "0 16px 48px rgba(139,92,246,0.2), 0 0 20px rgba(168,85,247,0.15)",
      cardHoverShadow: "0 8px 32px rgba(139,92,246,0.15)", modalShadow: "0 25px 80px rgba(0,0,0,0.5), 0 0 40px rgba(139,92,246,0.1)", toggleBg: "rgba(139,92,246,0.2)",
      headerBorderBottom: "1px solid rgba(168,85,247,0.2)",
      bgPattern: "radial-gradient(ellipse at 30% 20%, rgba(124,58,237,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(236,72,153,0.05) 0%, transparent 50%)",
      cardGlow: "0 0 0 1px rgba(139,92,246,0.1)",
    },
    liquid_glass: {
      ...base, isDark: false, radius: "1.5rem", radiusSm: "1.25rem", radiusCompact: "1rem", radiusCompactSm: "0.75rem",
      bg: "#eef0f5", bgAlt: "#eef0f5",
      surface: "rgba(255,255,255,0.55)", surfaceAlt: "rgba(255,255,255,0.35)", surfaceDeep: "rgba(255,255,255,0.25)",
      text: "#1c1c1e", textSec: "#636366", textMuted: "#8e8e93", textLight: "#ffffff", textMid: "#48484a", textStrong: "#000000",
      border: "rgba(255,255,255,0.6)", borderAlt: "rgba(255,255,255,0.4)", borderStrong: "rgba(0,0,0,0.08)", borderHover: "rgba(0,0,0,0.15)",
      accent: "#007aff", accentBg: "rgba(0,122,255,0.12)", accentDark: "#0056b3",
      inputBg: "rgba(255,255,255,0.5)", inputBorder: "rgba(0,0,0,0.06)",
      titleGrad: "linear-gradient(135deg, #1c1c1e 0%, #3a3a3c 100%)",
      btnGrad: "linear-gradient(135deg, rgba(0,122,255,0.85) 0%, rgba(0,100,220,0.9) 100%)", btnGlow: "rgba(0,122,255,0.25)",
      statCards: {
        Green: { bg: "rgba(52,199,89,0.18)", text: "#1c7a36", border: "1px solid rgba(52,199,89,0.25)" },
        Teal: { bg: "rgba(0,122,255,0.15)", text: "#0055cc", border: "1px solid rgba(0,122,255,0.2)" },
        Orange: { bg: "rgba(255,149,0,0.15)", text: "#995c00", border: "1px solid rgba(255,149,0,0.2)" },
        Blue: { bg: "rgba(88,86,214,0.15)", text: "#3634a3", border: "1px solid rgba(88,86,214,0.2)" },
        Pink: { bg: "rgba(255,45,85,0.12)", text: "#cc0033", border: "1px solid rgba(255,45,85,0.18)" },
        Purple: { bg: "rgba(175,82,222,0.12)", text: "#7b3a9e", border: "1px solid rgba(175,82,222,0.18)" },
      },
      profitGrad: "rgba(52,199,89,0.2)",
      errorBg: "rgba(255,59,48,0.1)", errorBorder: "rgba(255,59,48,0.3)", errorText: "#ff3b30",
      badgeGreen: { bg: "rgba(52,199,89,0.15)", text: "#248a3d" },
      badgeYellow: { bg: "rgba(255,204,0,0.18)", text: "#997a00" },
      badgeRed: { bg: "rgba(255,59,48,0.12)", text: "#d70015" },
      shadow: "0 2px 16px rgba(0,0,0,0.06)", shadowCompact: "0 1px 8px rgba(0,0,0,0.04)",
      shadowLg: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)", shadowLgCompact: "0 4px 16px rgba(0,0,0,0.05)",
      hoverShadow: "0 12px 40px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.06)",
      cardHoverShadow: "0 8px 28px rgba(0,0,0,0.08)", modalShadow: "0 25px 60px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.08)",
      toggleBg: "rgba(0,0,0,0.08)",
      headerBorderBottom: "1px solid rgba(0,0,0,0.04)",
      bgPattern: "radial-gradient(ellipse at 25% 0%, rgba(174,198,255,0.35) 0%, transparent 50%), radial-gradient(ellipse at 75% 100%, rgba(255,200,220,0.2) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(200,210,255,0.15) 0%, transparent 60%)",
      cardBackdrop: "blur(16px) saturate(150%)",
      cardGlow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 0 rgba(0,0,0,0.04)",
    },
    circular: {
      ...base, isDark: false, radius: "999px", radiusSm: "2rem", radiusCompact: "999px", radiusCompactSm: "1.5rem",
      bg: "#faf5ff", bgAlt: "#faf5ff", surface: "#ffffff", surfaceAlt: "#f5f0ff", surfaceDeep: "#ede9fe",
      text: "#1e1b4b", textSec: "#6d28d9", textMuted: "#8b5cf6", textLight: "#f5f3ff", textMid: "#7c3aed", textStrong: "#1e1b4b",
      border: "#ddd6fe", borderAlt: "#c4b5fd", borderStrong: "#a78bfa", borderHover: "#7c3aed",
      accent: "#7c3aed", accentBg: "#ede9fe", accentDark: "#5b21b6",
      inputBg: "#ffffff", inputBorder: "#ddd6fe",
      titleGrad: "linear-gradient(135deg, #7c3aed 0%, #c084fc 50%, #e879f9 100%)",
      btnGrad: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)", btnGlow: "rgba(124,58,237,0.3)",
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
      badgeGreen: { bg: "#d1fae5", text: "#065f46" }, badgeYellow: { bg: "#fef3c7", text: "#92400e" }, badgeRed: { bg: "#fee2e2", text: "#991b1b" },
      shadow: "0 4px 20px rgba(124,58,237,0.08)", shadowCompact: "0 2px 12px rgba(124,58,237,0.06)",
      shadowLg: "0 12px 40px rgba(124,58,237,0.1)", shadowLgCompact: "0 4px 16px rgba(124,58,237,0.06)",
      hoverShadow: "0 16px 48px rgba(124,58,237,0.15)",
      cardHoverShadow: "0 8px 28px rgba(124,58,237,0.12)", modalShadow: "0 25px 60px rgba(124,58,237,0.15)",
      toggleBg: "#ddd6fe",
      headerBorderBottom: "none",
      bgPattern: "radial-gradient(circle at 15% 15%, rgba(139,92,246,0.08) 0%, transparent 40%), radial-gradient(circle at 85% 85%, rgba(232,121,249,0.06) 0%, transparent 40%), radial-gradient(circle at 50% 50%, rgba(167,139,250,0.04) 0%, transparent 50%)",
    },
  };

  if (themeName === "auto") return palettes[autoIsDark ? "midnight" : "sunset"];
  return palettes[themeName] || palettes.sunset;
};

if (typeof document !== 'undefined') {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&family=League+Spartan:wght@300;400;500;600;700;800;900&family=Open+Sans:wght@300;400;500;600;700;800&family=Lexend:wght@300;400;500;600;700;800;900&family=Public+Sans:wght@300;400;500;600;700;800;900&family=Rethink+Sans:wght@400;500;600;700;800&family=Noto+Sans:wght@300;400;500;600;700;800;900&family=Noto+Serif:wght@300;400;500;600;700;800;900&family=Quicksand:wght@300;400;500;600;700&family=Winky+Sans:wght@300;400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

const normalizeCardType = (type) => { if (!type) return "UNKNOWN"; const n = type.toString().trim().toUpperCase(); if (n.includes("VISA") && n.includes("DEBIT")) return "VISA DEBIT"; if (n.includes("VISA") && n.includes("CREDIT")) return "VISA CREDIT"; if (n.includes("AMEX")) return "AMEX"; if (n.includes("SELLER")) return "SELLER"; if (n.includes("MASTERCARD")) return "MASTERCARD"; return n; };
const cardTypeColors = { "VISA DEBIT": "#3b82f6", "VISA CREDIT": "#10b981", AMEX: "#8b5cf6", SELLER: "#64748b", MASTERCARD: "#f59e0b", UNKNOWN: "#94a3b8" };
const getCardTypeColor = (type) => cardTypeColors[normalizeCardType(type)] || cardTypeColors["UNKNOWN"];

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
    return { ...d, path, color: colors[i % colors.length], pct: ((d.value / total) * 100).toFixed(1) };
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke={c.surface} strokeWidth="2" />)}
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
};

// -- Chart toggle button pair --
const ChartToggle = ({ mode, setMode, opt1, opt2, c, isBrut, isCompact, bws }) => (
  <div style={{ display: "flex", gap: "0.375rem" }}>
    {[opt1, opt2].map(({ key, label }) => (
      <button key={key} onClick={() => setMode(key)} style={{
        padding: isCompact ? "0.25rem 0.5rem" : "0.375rem 0.75rem",
        borderRadius: isBrut ? "0" : "999px", border: `1px solid ${mode === key ? c.accent : c.border}`,
        backgroundColor: mode === key ? c.accentBg : "transparent",
        color: mode === key ? c.accent : c.textSec, cursor: "pointer",
        fontSize: isCompact ? "0.625rem" : "0.75rem", fontWeight: bws || "600",
      }}>{label}</button>
    ))}
  </div>
);

// -- Icon wrapper component --
const StatIcon = ({ Icon, size, layout, c }) => {
  if (layout.statIconBg && layout.statIconBgStyle) {
    const bgStyle = layout.statIconBgStyle(c.isDark);
    return <div style={bgStyle}><Icon size={size} style={{ opacity: 0.9, color: "inherit" }} /></div>;
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
  const [viewStyle, setViewStyle] = useState(() => localStorage.getItem("viewStyle") || "normal");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredStat, setHoveredStat] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFont, setSelectedFont] = useState(() => localStorage.getItem("font") || "Poppins");
  const [titleFont, setTitleFont] = useState(() => localStorage.getItem("titleFont") || "Poppins");
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem("fontSize")) || 20);
  const [boldText, setBoldText] = useState(() => localStorage.getItem("boldText") === "true");

  // Sort
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(() => parseInt(localStorage.getItem("autoRefresh")) || 0);
  const [hoveredBar, setHoveredBar] = useState(null);

  // Add form states
  const [showTxForm, setShowTxForm] = useState(false);
  const [showMonthlyForm, setShowMonthlyForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [txForm, setTxForm] = useState({ cardType: "VISA DEBIT", cardNumber: "", owner: "", buyRate: "", buyAmount: "", sellRate: "", sellAmount: "", cost: "", grossProfit: "", netProfit: "" });
  const [monthlyForm, setMonthlyForm] = useState({ month: "", profit: "" });

  const submitTransaction = async () => {
    if (!txForm.owner || !txForm.cardNumber) return;
    setSubmitting(true);
    try {
      await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: JSON.stringify({ action: "addTransaction", data: txForm }), headers: { "Content-Type": "text/plain" } });
      setTxForm({ cardType: "VISA DEBIT", cardNumber: "", owner: "", buyRate: "", buyAmount: "", sellRate: "", sellAmount: "", cost: "", grossProfit: "", netProfit: "" });
      setShowTxForm(false);
      fetchFromGoogleSheets();
    } catch (err) { setError("Failed to add transaction"); }
    finally { setSubmitting(false); }
  };

  const submitMonthly = async () => {
    if (!monthlyForm.month || !monthlyForm.profit) return;
    setSubmitting(true);
    try {
      await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: JSON.stringify({ action: "addMonthly", data: monthlyForm }), headers: { "Content-Type": "text/plain" } });
      setMonthlyForm({ month: "", profit: "" });
      setShowMonthlyForm(false);
      fetchFromGoogleSheets();
    } catch (err) { setError("Failed to add monthly record"); }
    finally { setSubmitting(false); }
  };

  const c = getThemeColors(theme);
  const L = getThemeLayout(theme);
  const isCompact = viewStyle === "compact";
  const headingFont = `"${selectedFont}", sans-serif`;
  const titleFontFamily = `"${titleFont}", sans-serif`;
  const bw = boldText ? "600" : "400";
  const bwm = boldText ? "700" : "500";
  const bws = boldText ? "800" : "600";
  const bwx = boldText ? "900" : "700";
  const bwh = boldText ? "900" : "800";
  const r = isCompact ? c.radiusCompact : c.radius;
  const rSm = isCompact ? c.radiusCompactSm : c.radiusSm;

  const isBrut = theme === "brutalist";
  const isTerm = theme === "terminal";
  const isGlass = theme === "glass";
  const isMid = theme === "midnight";
  const isLG = theme === "liquid_glass";
  const isCirc = theme === "circular";

  // Responsive breakpoints
  const [winW, setWinW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1200);
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
  useEffect(() => { localStorage.setItem("titleFont", titleFont); }, [titleFont]);
  useEffect(() => { localStorage.setItem("fontSize", fontSize.toString()); }, [fontSize]);

  // Apply font size to root HTML element so all rem units scale
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    return () => { document.documentElement.style.fontSize = ""; };
  }, [fontSize]);

  // Sync iOS status bar & body background with theme
  useEffect(() => {
    document.body.style.backgroundColor = c.bg;
    document.body.style.margin = "0";
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "theme-color"; document.head.appendChild(meta); }
    meta.content = c.bg;
    // Ensure viewport-fit=cover for iOS safe area
    const vp = document.querySelector('meta[name="viewport"]');
    if (vp && !vp.content.includes("viewport-fit")) vp.content += ", viewport-fit=cover";
    return () => { document.body.style.backgroundColor = ""; };
  }, [c.bg]);
  useEffect(() => { localStorage.setItem("viewStyle", viewStyle); }, [viewStyle]);
  useEffect(() => { localStorage.setItem("boldText", boldText.toString()); }, [boldText]);
  useEffect(() => { localStorage.setItem("autoRefresh", autoRefresh.toString()); }, [autoRefresh]);

  // Auto-refresh timer
  useEffect(() => {
    if (autoRefresh > 0) {
      const interval = setInterval(() => fetchFromGoogleSheets(), autoRefresh * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getProfitMarginBadge = (margin) => {
    const mkBadge = (bg, text) => ({ style: { display: "inline-flex", alignItems: "center", padding: isBrut ? "0.25rem 0.5rem" : "0.25rem 0.625rem", borderRadius: isBrut ? "0" : "9999px", fontSize: "0.75rem", fontWeight: bws, backgroundColor: bg, color: text, border: isBrut ? "2px solid #000" : "none" } });
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
      if (!data || (!data.transactions && !data.monthly)) { setTransactions([]); setMonthly([]); setOwners([]); setCards([]); setStats({}); }
      else {
        setLastSync(new Date());
        if (data.transactions?.length > 0) processTransactions(data.transactions);
        if (data.monthly?.length > 0) setMonthly(data.monthly);
      }
    } catch (err) { setError("Failed to load data. Please check your connection and try again."); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchFromGoogleSheets(); }, []);
  useEffect(() => { if (theme === "auto") { const mq = window.matchMedia("(prefers-color-scheme: dark)"); const h = () => setTheme("auto"); mq.addEventListener("change", h); return () => mq.removeEventListener("change", h); } }, [theme]);

  const processTransactions = (data) => {
    const today = new Date().toISOString().split("T")[0];
    const nd = data.map((t, i) => ({ ...t, cardType: normalizeCardType(t.cardType), date: t.date || today, _idx: i }));
    const uo = [...new Set(nd.map((t) => t.owner))].map((name, i) => ({ id: i + 1, name }));
    const uc = []; const cm = new Map();
    nd.forEach((t) => { const k = `${t.cardType}-${t.cardNumber}`; if (!cm.has(k)) { cm.set(k, { id: uc.length + 1, type: t.cardType, number: t.cardNumber }); uc.push(cm.get(k)); } });
    const pt = nd.map((t) => { const cd = uc.find((x) => x.type === t.cardType && x.number === t.cardNumber); const ow = uo.find((o) => o.name === t.owner); const cost = parseFloat(t.cost) || 0; const gp = parseFloat(t.grossProfit) || 0; let np = parseFloat(t.netProfit) || 0; if (np === 0 && (cost > 0 || gp > 0)) np = gp - cost; return { ...t, cost, grossProfit: gp, netProfit: np, cardId: cd.id, ownerId: ow.id, profitMargin: cost > 0 ? (np / cost) * 100 : 0 }; });
    setOwners(uo); setCards(uc); setTransactions(pt); calcStats(pt, uo, uc);
  };
  const calcStats = (txns, ownrs, crds) => {
    const tc = txns.reduce((s, t) => s + t.cost, 0); const tgp = txns.reduce((s, t) => s + t.grossProfit, 0); const tnp = txns.reduce((s, t) => s + t.netProfit, 0);
    const tus = txns.reduce((s, t) => s + (parseFloat(t.sellAmount) || 0), 0); const tdu = txns.reduce((s, t) => s + (parseFloat(t.buyAmount) || 0), 0);
    const os = {}; ownrs.forEach((o) => { const ot = txns.filter((t) => t.ownerId === o.id); os[o.id] = { count: ot.length, totalCost: ot.reduce((s, t) => s + t.cost, 0), totalGrossProfit: ot.reduce((s, t) => s + t.grossProfit, 0), totalNetProfit: ot.reduce((s, t) => s + t.netProfit, 0) }; });
    const cts = {}; crds.forEach((x) => { if (!cts[x.type]) cts[x.type] = { count: 0, netProfit: 0 }; const ct = txns.filter((t) => t.cardId === x.id); cts[x.type].count += ct.length; cts[x.type].netProfit += ct.reduce((s, t) => s + t.netProfit, 0); });
    setStats({ totalCost: tc, totalGrossProfit: tgp, totalNetProfit: tnp, totalUsdtSold: tus, totalDollarUsed: tdu, avgNetProfit: txns.length > 0 ? tnp / txns.length : 0, avgBuyRate: tus > 0 ? tc / tus : 0, avgSellRate: txns.length > 0 ? txns.reduce((s, t) => s + (parseFloat(t.sellRate) || 0), 0) / txns.length : 0, ownerStats: os, cardTypeStats: cts });
  };
  const getCardById = (id) => cards.find((x) => x.id === id);
  const getOwnerById = (id) => owners.find((o) => o.id === id);

  // Reset card number filter when owner changes
  useEffect(() => { setFilterCardNumber("all"); }, [filterOwner]);

  // Available card numbers based on selected owner
  const availableCardNumbers = filterOwner === "all"
    ? [...new Set(transactions.map((t) => getCardById(t.cardId)?.number).filter(Boolean))]
    : [...new Set(transactions.filter((t) => t.ownerId === parseInt(filterOwner)).map((t) => getCardById(t.cardId)?.number).filter(Boolean))];

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
    const colMap = { cardType: (t) => getCardById(t.cardId)?.type || "", cardNumber: (t) => getCardById(t.cardId)?.number || "", owner: (t) => getOwnerById(t.ownerId)?.name || "",
      buyRate: (t) => parseFloat(t.buyRate) || 0, buyAmount: (t) => parseFloat(t.buyAmount) || 0, sellRate: (t) => parseFloat(t.sellRate) || 0, sellAmount: (t) => parseFloat(t.sellAmount) || 0,
      cost: (t) => t.cost, grossProfit: (t) => t.grossProfit, netProfit: (t) => t.netProfit, profitMargin: (t) => t.profitMargin };
    const fn = colMap[sortCol];
    if (!fn) return 0;
    va = fn(a); vb = fn(b);
    if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortDir === "asc" ? va - vb : vb - va;
  });

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };
  const cardTypes = ["VISA DEBIT", "VISA CREDIT", "AMEX", "SELLER", "MASTERCARD"];

  // -- Shared styles --
  const cardBase = { backgroundColor: c.surface, borderRadius: isCirc ? "2rem" : r, padding: isCompact ? "1rem" : "2rem", boxShadow: c.cardGlow ? `${c.shadow}, ${c.cardGlow}` : c.shadow, marginBottom: isCompact ? "1rem" : "2rem", border: isBrut ? `3px solid ${c.border}` : `1px solid ${c.border}`, ...(c.cardBackdrop ? { backdropFilter: c.cardBackdrop, WebkitBackdropFilter: c.cardBackdrop } : {}), animation: "fadeIn 0.35s cubic-bezier(.16,1,.3,1) both" };
  const thStyle = { padding: isCompact ? "0.5rem 0.625rem" : "0.75rem 1rem", textAlign: "left", fontSize: isCompact ? "0.6875rem" : "0.75rem", fontWeight: bws, color: c.textSec, backgroundColor: c.surfaceAlt, borderBottom: isBrut ? `3px solid ${c.border}` : `1px solid ${c.border}`, textTransform: isBrut ? "uppercase" : "none", letterSpacing: isBrut ? "0.1em" : "normal" };
  const tdStyle = { padding: isCompact ? "0.375rem 0.625rem" : "0.75rem 1rem", fontSize: isCompact ? "0.75rem" : "0.875rem", borderBottom: isBrut ? `2px solid ${c.border}` : isTerm ? `1px dashed ${c.border}` : `1px solid ${c.border}`, color: c.text, backgroundColor: c.surface };
  const sectionTitleStyle = { fontSize: isMobile ? "1rem" : (isCompact ? "1.125rem" : "1.5rem"), fontFamily: headingFont, fontWeight: bwh, marginBottom: isCompact ? "1rem" : "1.5rem", display: "flex", alignItems: "center", gap: isCompact ? "0.5rem" : "0.75rem", color: c.textStrong, textTransform: isBrut ? "uppercase" : "none", letterSpacing: isBrut ? "0.05em" : "normal" };

  // Compute even grid columns for card type stats
  const ctCount = Object.keys(stats.cardTypeStats || {}).length;
  const ctCols = isMobile ? "1fr" : (isCompact || isTablet ? `repeat(${Math.min(ctCount || 2, 3)}, 1fr)` : `repeat(${Math.min(ctCount || 3, 5)}, 1fr)`);

  if (loading && transactions.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontSize: "1.125rem", color: c.textSec, flexDirection: "column", gap: "1rem", backgroundColor: c.bg, fontFamily: `"${font}", sans-serif` }}>
        <RefreshCw size={48} style={{ animation: "spin 1s linear infinite" }} />
        <div className={isTerm ? "terminal-glow" : ""}>Loading dashboard...</div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: c.bg, backgroundImage: c.bgPattern || "none", fontFamily: `"${font}", sans-serif`, fontWeight: bw, position: "relative", overflowX: "hidden", paddingTop: "env(safe-area-inset-top)" }}>

      {isTerm && <div className="terminal-scanline"></div>}
      {isMid && <div className="midnight-stars"></div>}
      {isCirc && <>
        <div className="circ-blob" style={{ width: "400px", height: "400px", background: "#8b5cf6", top: "-100px", left: "-100px" }}></div>
        <div className="circ-blob" style={{ width: "300px", height: "300px", background: "#e879f9", bottom: "10%", right: "-80px" }}></div>
        <div className="circ-blob" style={{ width: "250px", height: "250px", background: "#6366f1", top: "40%", left: "30%" }}></div>
      </>}

      {/* HEADER */}
      <div style={{ backgroundColor: (isGlass || isLG) ? (isLG ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.04)") : c.surface, boxShadow: isLG ? "0 1px 0 rgba(0,0,0,0.04)" : c.shadow, borderBottom: c.headerBorderBottom || `1px solid ${c.border}`, padding: isMobile ? "0.75rem 0.625rem" : (isCompact ? "0.875rem 1rem" : "1.5rem 1rem"), ...((isGlass || isLG) ? { backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)" } : {}), position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? "0.75rem" : "0" }}>
          <div>
            <h1 key={theme} style={{ fontSize: isBrut ? "3rem" : (isMobile ? "1.5rem" : (isCompact ? "1.75rem" : "2.5rem")), fontFamily: titleFontFamily, fontWeight: isBrut ? "900" : bwh, background: c.titleGrad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", color: "transparent", display: "inline-block", width: "fit-content", margin: 0, textTransform: isBrut ? "uppercase" : "none", letterSpacing: isBrut ? "0.05em" : "normal" }}>Sales Dashboard</h1>
            <p style={{ fontSize: isCompact ? "0.75rem" : "0.875rem", color: c.textSec, marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }} className={isTerm ? "terminal-glow" : ""}>
              {isTerm ? "> " : ""}{lastSync ? `Last updated: ${lastSync.toLocaleTimeString()}` : "Real-time data from Google Sheets"}
              {autoRefresh > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.6875rem", color: c.accent, backgroundColor: c.accentBg, padding: "0.125rem 0.5rem", borderRadius: "999px" }}><Timer size={10} />{autoRefresh}s</span>}
              <button onClick={() => setShowSettings(true)} style={{ padding: "0.5rem", borderRadius: isBrut ? "0" : (isCirc || isLG ? "50%" : "0.5rem"), border: isBrut ? `2px solid ${c.border}` : `1px solid ${c.border}`, backgroundColor: c.inputBg, color: c.text, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", marginLeft: "0.5rem" }} title="Settings"><Settings size={16} /></button>
            </p>
          </div>
          <button onClick={fetchFromGoogleSheets} style={{ padding: isCompact ? "0.5rem 0.875rem" : "0.625rem 1.25rem", borderRadius: isBrut ? "0" : ((isLG || isCirc) ? "999px" : "0.5rem"), border: isBrut ? "3px solid #000" : (isLG ? "1px solid rgba(255,255,255,0.5)" : "none"), cursor: loading ? "not-allowed" : "pointer", fontSize: isCompact ? "0.75rem" : "0.875rem", fontWeight: bws, display: "inline-flex", alignItems: "center", gap: "0.5rem", background: c.btnGrad, color: isBrut ? "#fff" : "#ffffff", opacity: loading ? 0.7 : 1, boxShadow: isBrut ? "4px 4px 0 #000" : `0 4px 15px ${c.btnGlow}` }} disabled={loading}>
            <RefreshCw size={isMobile ? 16 : (isCompact ? 14 : 18)} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
            {isMobile ? "" : (loading ? "Refreshing..." : "Refresh")}
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ backgroundColor: (isGlass || isLG) ? (isLG ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.02)") : c.surface, borderBottom: isBrut ? `3px solid ${c.border}` : `1px solid ${c.border}`, ...((isGlass || isLG) ? { backdropFilter: "blur(16px) saturate(150%)", WebkitBackdropFilter: "blur(16px) saturate(150%)" } : {}), position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1rem" }}>
          <nav style={{ display: "flex", gap: isBrut ? "0" : (isMobile ? "1rem" : "2rem") }}>
            {["dashboard", "transactions", "monthly"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: isBrut ? "1rem 1.5rem" : (isCompact ? "0.625rem 0.25rem" : "1rem 0.25rem"), border: "none",
                borderBottom: activeTab === tab ? (isBrut ? `4px solid ${c.accent}` : `2px solid ${c.accent}`) : (isBrut ? "4px solid transparent" : "2px solid transparent"),
                backgroundColor: isBrut && activeTab === tab ? c.accentBg : "transparent",
                fontSize: isCompact ? "0.8125rem" : "0.875rem", fontWeight: bwm, cursor: "pointer", color: activeTab === tab ? c.accent : c.textSec,
                textTransform: isBrut ? "uppercase" : "none", letterSpacing: isBrut ? "0.1em" : "normal",
                transform: activeTab === tab && !isBrut ? "translateY(-2px)" : "none",
                transition: "color 0.15s cubic-bezier(.4,0,.2,1), border-color 0.15s cubic-bezier(.4,0,.2,1), transform 0.15s cubic-bezier(.4,0,.2,1)",
              }} className={isTerm && activeTab === tab ? "terminal-glow" : ""}>
                {isTerm ? `[${tab.toUpperCase()}]` : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: "80rem", margin: "0 auto", padding: isMobile ? "0.75rem 0.5rem" : (isCompact ? "1rem" : "2rem 1rem"), position: "relative", zIndex: 5, animation: "fadeIn 0.3s cubic-bezier(.16,1,.3,1) both" }}>
        {error && <div style={{ padding: isCompact ? "0.625rem" : "1rem", backgroundColor: c.errorBg, border: `1px solid ${c.errorBorder}`, borderRadius: r, color: c.errorText, marginBottom: isCompact ? "1rem" : "2rem", textAlign: "center", fontSize: isCompact ? "0.8125rem" : "inherit", animation: "shake 0.5s ease-in-out" }}><strong>Error:</strong> {error}</div>}

        {/* ===== DASHBOARD TAB ===== */}
        {activeTab === "dashboard" && (
          <div>
            {/* STAT CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: isBrut ? "1fr" : (isMobile ? "1fr" : (isCompact || isTablet ? "repeat(2, 1fr)" : (L.statCardDir === "row" ? "repeat(2, 1fr)" : "repeat(4, 1fr)"))), gap: isMobile ? "0.625rem" : (isCompact ? "0.75rem" : (isBrut ? "0.5rem" : "1.5rem")), marginBottom: isCompact ? "1rem" : "2rem" }}>
              {[
                { label: "Net Profit", value: stats.totalNetProfit, icon: TrendingUp, color: "Green", sub: "After costs" },
                { label: "Total USDT Sold", value: stats.totalUsdtSold, icon: DollarSign, color: "Teal", sub: "Total sell amount" },
                { label: "Gross Profit", value: stats.totalGrossProfit, icon: TrendingUp, color: "Orange", sub: "Total revenue" },
                { label: "Total Cost", value: stats.totalCost, icon: DollarSign, color: "Blue", count: transactions.length },
                { label: "Dollar Used", value: stats.totalDollarUsed, icon: DollarSign, color: "Pink", sub: "Total buy amount" },
                { label: "Average Profit", value: stats.avgNetProfit, icon: TrendingUp, color: "Purple", sub: "Per transaction" },
                { label: "Avg Buy Rate", value: stats.avgBuyRate, icon: DollarSign, color: "Teal", sub: "Average buy rate", noPrefix: true },
                { label: "Avg Sell Rate", value: stats.avgSellRate, icon: DollarSign, color: "Green", sub: "Average sell rate", noPrefix: true },
              ].map((stat, idx) => {
                const sc = c.statCards[stat.color] || {};
                const txtColor = sc.text || null;
                const iconSz = isCompact ? L.statIconSizeSm : L.statIconSize;
                const isRow = L.statCardDir === "row";
                return (
                  <div key={idx} className={isLG ? "lg-specular" : ""} style={{
                    padding: isMobile ? "1rem" : (isCompact ? "0.875rem" : (isBrut ? "1.5rem" : "2rem")),
                    borderRadius: isBrut ? "0" : r, color: txtColor || (isLG ? c.text : "#ffffff"),
                    background: sc.bg, border: sc.border || (isBrut ? "3px solid #000" : (isLG ? "1px solid rgba(255,255,255,0.6)" : (isCirc ? `2px solid ${c.border}` : "none"))),
                    boxShadow: isBrut ? "4px 4px 0 #000" : (isLG ? "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)" : (isCompact ? c.shadowLgCompact : c.shadowLg)),
                    ...((isGlass || isLG) ? { backdropFilter: "blur(16px) saturate(150%)", WebkitBackdropFilter: "blur(16px) saturate(150%)" } : {}),
                    cursor: "pointer", willChange: "transform, box-shadow, opacity",
                    display: isRow ? "flex" : "block", alignItems: isRow ? "center" : undefined, gap: isRow ? "1.25rem" : undefined,
                    transform: hoveredStat === idx ? (isBrut ? "translate(-2px,-2px)" : "translateY(-6px)") : "translateY(0)",
                    transition: "transform 0.2s cubic-bezier(.4,0,.2,1), box-shadow 0.2s cubic-bezier(.4,0,.2,1)",
                    animation: `slideUp 0.4s cubic-bezier(.16,1,.3,1) ${idx * 0.06}s both`,
                    ...(isBrut && hoveredStat === idx ? { boxShadow: "8px 8px 0 #000" } : {}),
                    ...(isBrut ? { marginBottom: "0.5rem" } : {}),
                  }}
                    onMouseEnter={() => setHoveredStat(idx)} onMouseLeave={() => setHoveredStat(null)}>
                    {isRow ? (
                      <>
                        <StatIcon Icon={stat.icon} size={iconSz} layout={L} c={c} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: isCompact ? "0.75rem" : "0.875rem", opacity: 0.9, fontWeight: bws, color: txtColor || undefined, marginBottom: "0.25rem" }}>{isTerm ? `> ${stat.label}` : stat.label}</div>
                          <div style={{ fontSize: isCompact ? "1.5rem" : "2rem", fontWeight: bwx, color: txtColor || undefined }} className={isTerm ? "terminal-glow" : ""}>{stat.noPrefix ? "" : "$"}{stat.value?.toFixed(2) || 0}</div>
                          <div style={{ fontSize: "0.75rem", opacity: 0.7, color: txtColor || undefined }}>{stat.count ? `${stat.count} transactions` : stat.sub}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        {(isMid || isCirc) && L.statIconBg && <div style={{ display: "flex", justifyContent: "center" }}><StatIcon Icon={stat.icon} size={iconSz} layout={L} c={c} /></div>}
                        <div style={{ display: isCirc ? "block" : "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isCompact ? "0.5rem" : "1rem", textAlign: isCirc ? "center" : undefined }}>
                          <div style={{ fontSize: isCompact ? "0.75rem" : "1rem", opacity: 0.9, fontWeight: bws, color: txtColor || undefined, textTransform: isBrut ? "uppercase" : "none", letterSpacing: isBrut ? "0.05em" : "normal" }}>{stat.label}</div>
                          {!isMid && !isCirc && <StatIcon Icon={stat.icon} size={iconSz} layout={L} c={c} />}
                        </div>
                        <div style={{ fontSize: isMobile ? "1.75rem" : (isCompact ? "1.5rem" : "2.7rem"), fontWeight: bwx, color: txtColor || undefined, textAlign: (isMid || isCirc) ? "center" : undefined }} className={isTerm ? "terminal-glow" : ""}>{stat.noPrefix ? "" : "$"}{stat.value?.toFixed(2) || 0}</div>
                        <div style={{ fontSize: isCompact ? "0.6875rem" : "0.875rem", opacity: 0.8, marginTop: "0.5rem", color: txtColor || undefined, textAlign: (isMid || isCirc) ? "center" : undefined }}>{stat.count ? `${stat.count} transactions` : stat.sub}</div>
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isCompact ? "1rem" : "1.5rem" }}>
                    <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}><TrendingUp size={isCompact ? 18 : 22} /> Profit Trend</h2>
                    <ChartToggle mode={profitChartMode} setMode={setProfitChartMode} opt1={{ key: "bar", label: "Bar" }} opt2={{ key: "line", label: "Line" }} c={c} isBrut={isBrut} isCompact={isCompact} bws={bws} />
                  </div>
                  <div style={{ position: "relative", height: `${chartH}px`, display: "flex", alignItems: "flex-end", gap: isMobile ? "4px" : "8px", paddingBottom: "2rem", paddingLeft: "3rem" }}>
                    {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
                      <div key={pct} style={{ position: "absolute", left: 0, bottom: `${2 + pct * (chartH - 32) / chartH * 100}%`, fontSize: isCompact ? "0.5625rem" : "0.625rem", color: c.textMuted, width: "2.75rem", textAlign: "right", paddingRight: "0.5rem", transform: "translateY(50%)" }}>${Math.round(maxProfit * pct)}</div>
                    ))}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
                      <div key={`g${pct}`} style={{ position: "absolute", left: "3rem", right: 0, bottom: `${2 + pct * (chartH - 32) / chartH * 100}%`, height: "1px", backgroundColor: c.border, opacity: 0.5 }}></div>
                    ))}
                    {profitChartMode === "bar" ? (
                      monthly.map((m, i) => {
                        const barH = (m.profit / maxProfit) * (chartH - 32);
                        return (
                          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 2 }}
                            onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHoveredBar(null)}>
                            {hoveredBar === i && (
                              <div style={{ position: "absolute", bottom: `${barH + 8}px`, backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: isCirc ? "999px" : rSm, padding: "0.375rem 0.625rem", fontSize: isCompact ? "0.625rem" : "0.75rem", color: c.text, fontWeight: bws, whiteSpace: "nowrap", boxShadow: c.shadow, zIndex: 10 }}>
                                {m.month}: ${m.profit.toFixed(2)}
                              </div>
                            )}
                            <div style={{
                              width: "100%", maxWidth: isMobile ? "28px" : "48px", height: `${barH}px`, minHeight: "4px",
                              background: c.accent, borderRadius: isCirc ? "999px" : (isBrut ? "0" : "4px 4px 0 0"),
                              transition: "height 0.5s cubic-bezier(.16,1,.3,1), opacity 0.15s cubic-bezier(.4,0,.2,1), transform 0.15s cubic-bezier(.4,0,.2,1)",
                              opacity: hoveredBar === null || hoveredBar === i ? 1 : 0.5,
                              transform: hoveredBar === i ? "scaleY(1.03)" : "scaleY(1)", transformOrigin: "bottom",
                            }}></div>
                            <div style={{ fontSize: isMobile ? "0.5rem" : (isCompact ? "0.5625rem" : "0.6875rem"), color: c.textMuted, marginTop: "0.375rem", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                              {isMobile ? m.month.slice(0, 3) : m.month}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      /* LINE CHART */
                      <svg style={{ position: "absolute", left: "3rem", right: 0, top: 0, bottom: "2rem", width: "calc(100% - 3rem)", height: `${chartH - 32}px`, zIndex: 2 }} viewBox={`0 0 ${monthly.length * 100} ${chartH - 32}`} preserveAspectRatio="none">
                        <polyline fill="none" stroke={c.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                          points={monthly.map((m, i) => `${i * 100 / (monthly.length - 1 || 1) * (monthly.length * 100 / 100)},${(chartH - 32) - (m.profit / maxProfit) * (chartH - 32)}`).join(" ")} />
                        <polyline fill={`${c.accent}20`} stroke="none"
                          points={`0,${chartH - 32} ${monthly.map((m, i) => `${i * 100 / (monthly.length - 1 || 1) * (monthly.length * 100 / 100)},${(chartH - 32) - (m.profit / maxProfit) * (chartH - 32)}`).join(" ")} ${monthly.length * 100},${chartH - 32}`} />
                        {monthly.map((m, i) => {
                          const x = i * 100 / (monthly.length - 1 || 1) * (monthly.length * 100 / 100);
                          const y = (chartH - 32) - (m.profit / maxProfit) * (chartH - 32);
                          return <circle key={i} cx={x} cy={y} r={hoveredBar === i ? 7 : 5} fill={c.accent} stroke={c.surface} strokeWidth="2"
                            onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHoveredBar(null)} style={{ cursor: "pointer" }} />;
                        })}
                      </svg>
                    )}
                    {profitChartMode === "line" && (
                      <div style={{ position: "absolute", left: "3rem", right: 0, bottom: 0, display: "flex", justifyContent: "space-between", zIndex: 3 }}>
                        {monthly.map((m, i) => (
                          <div key={i} style={{ fontSize: isMobile ? "0.5rem" : (isCompact ? "0.5625rem" : "0.6875rem"), color: c.textMuted, textAlign: "center" }}
                            onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHoveredBar(null)}>
                            {isMobile ? m.month.slice(0, 3) : m.month}
                          </div>
                        ))}
                      </div>
                    )}
                    {profitChartMode === "line" && hoveredBar !== null && monthly[hoveredBar] && (
                      <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: isCirc ? "999px" : rSm, padding: "0.375rem 0.75rem", fontSize: isCompact ? "0.625rem" : "0.75rem", color: c.text, fontWeight: bws, boxShadow: c.shadow, zIndex: 10 }}>
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
                <div style={cardBase}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isCompact ? "1rem" : "1.5rem" }}>
                    <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}><User size={isCompact ? 20 : 24} /> Owner Performance</h2>
                    <ChartToggle mode={ownerChartMode} setMode={setOwnerChartMode} opt1={{ key: "stats", label: "Stats" }} opt2={{ key: "pie", label: "Pie" }} c={c} isBrut={isBrut} isCompact={isCompact} bws={bws} />
                  </div>
                  {ownerChartMode === "pie" ? (
                    <SimplePieChart data={owners.map((o) => ({ label: o.name, value: stats.ownerStats?.[o.id]?.totalNetProfit || 0 }))} colors={["#3b82f6", "#f97316", "#16a34a", "#8b5cf6", "#ec4899", "#06b6d4"]} size={isMobile ? 180 : 240} c={c} />
                  ) : (
                  <div style={{ display: (L.ownerLayout === "horizontal" && !isMobile) ? "flex" : "grid", flexDirection: L.ownerLayout === "horizontal" ? "column" : undefined, gap: isCompact ? "1rem" : "1.5rem" }}>
                    {owners.map((o) => {
                      const os = stats.ownerStats?.[o.id] || { count: 0, totalCost: 0, totalGrossProfit: 0, totalNetProfit: 0 };
                      return (
                        <div key={o.id} style={{ padding: isCompact ? "1rem" : "1.5rem", backgroundColor: c.surfaceAlt, borderRadius: isBrut ? "0" : (isCirc ? "1.5rem" : rSm), border: isBrut ? `2px solid ${c.border}` : `1px solid ${c.border}`, ...(isBrut ? { boxShadow: "3px 3px 0 #000" } : {}), ...((isGlass || isLG) ? { backdropFilter: "blur(16px) saturate(150%)", WebkitBackdropFilter: "blur(16px) saturate(150%)" } : {}) }}>
                          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: isCompact ? "0.625rem" : "1rem", gap: "0.5rem" }}>
                            <span style={{ fontFamily: headingFont, fontWeight: bwh, fontSize: isMobile ? "0.9375rem" : (isCompact ? "1rem" : "1.25rem"), color: c.textStrong, textTransform: isBrut ? "uppercase" : "none" }} className={isTerm ? "terminal-glow" : ""}>{isTerm ? `> ${o.name}` : o.name}</span>
                            <span style={{ fontSize: isCompact ? "0.75rem" : "0.875rem", color: c.textSec, backgroundColor: c.surface, padding: "0.25rem 0.75rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), fontWeight: bws, border: isBrut ? "1px solid #000" : "none" }}>{os.count} transactions</span>
                          </div>
                          <div style={{ display: (L.ownerLayout === "horizontal" && !isMobile) ? "flex" : "grid", flexDirection: L.ownerLayout === "horizontal" ? "column" : undefined, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isCompact ? "0.625rem" : "1rem" }}>
                            {[{ label: "COST", value: os.totalCost, color: "#3b82f6" }, { label: "GROSS", value: os.totalGrossProfit, color: "#f97316" }, { label: "NET PROFIT", value: os.totalNetProfit, color: "#16a34a" }].map((s) => (
                              <div key={s.label} style={{ textAlign: "center", padding: isCompact ? "0.625rem" : "1rem", backgroundColor: c.surface, borderRadius: isBrut ? "0" : (isCirc ? "1.5rem" : rSm), flex: L.ownerLayout === "horizontal" ? 1 : undefined, border: isBrut ? "1px solid #000" : "none" }}>
                                <div style={{ fontSize: isCompact ? "0.6875rem" : "0.75rem", color: c.textSec, marginBottom: "0.25rem", fontWeight: bws, textTransform: isBrut ? "uppercase" : "none", letterSpacing: isBrut ? "0.05em" : "normal" }}>{s.label}</div>
                                <div style={{ fontSize: isCompact ? "1.125rem" : "1.5rem", fontWeight: bwx, color: isTerm ? c.text : s.color }} className={isTerm ? "terminal-glow" : ""}>${s.value.toFixed(2)}</div>
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isCompact ? "1rem" : "1.5rem" }}>
                    <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Card Type Statistics</h2>
                    <ChartToggle mode={cardTypeChartMode} setMode={setCardTypeChartMode} opt1={{ key: "stats", label: "Stats" }} opt2={{ key: "pie", label: "Pie" }} c={c} isBrut={isBrut} isCompact={isCompact} bws={bws} />
                  </div>
                  {cardTypeChartMode === "pie" ? (
                    <SimplePieChart data={Object.entries(stats.cardTypeStats || {}).map(([type, data]) => ({ label: type, value: data.netProfit }))} colors={["#3b82f6", "#10b981", "#8b5cf6", "#64748b", "#f59e0b", "#ec4899"]} size={isMobile ? 180 : 240} c={c} />
                  ) : (
                  <div style={{ display: L.cardTypeLayout === "list" ? "flex" : "grid", flexDirection: L.cardTypeLayout === "list" ? "column" : undefined, gridTemplateColumns: L.cardTypeLayout === "list" ? undefined : ctCols, gap: L.cardTypeLayout === "list" ? "0.5rem" : (isCompact ? "0.75rem" : "1.5rem") }}>
                    {Object.entries(stats.cardTypeStats || {}).map(([type, data], idx) => (
                      <div key={type} style={{
                        padding: L.cardTypeLayout === "list" ? "1rem" : (isCompact ? "1rem" : "1.5rem"),
                        border: isBrut ? `2px solid ${c.border}` : `${isCompact ? "1px" : "2px"} solid ${c.border}`,
                        borderRadius: isBrut ? "0" : (isCirc ? "1.5rem" : rSm), backgroundColor: c.surfaceAlt, cursor: "pointer",
                        display: L.cardTypeLayout === "list" ? "flex" : "block", alignItems: "center", justifyContent: "space-between",
                        ...(isBrut ? { boxShadow: "3px 3px 0 #000" } : {}),
                        ...(hoveredCard === idx ? { borderColor: c.accent, transform: L.cardTypeLayout === "list" ? "none" : "scale(1.03)" } : {}),
                        transition: "transform 0.2s cubic-bezier(.4,0,.2,1), border-color 0.2s cubic-bezier(.4,0,.2,1)",
                      }} onMouseEnter={() => setHoveredCard(idx)} onMouseLeave={() => setHoveredCard(null)}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: L.cardTypeLayout === "list" ? "0" : (isCompact ? "0.625rem" : "1rem") }}>
                          <div style={{ width: isBrut ? "16px" : "14px", height: isBrut ? "16px" : "14px", borderRadius: isBrut ? "0" : "50%", backgroundColor: getCardTypeColor(type), flexShrink: 0, border: isBrut ? "2px solid #000" : "none" }}></div>
                          <span style={{ fontFamily: headingFont, fontWeight: bwh, fontSize: isCompact ? "0.9375rem" : "1.125rem", color: c.textStrong, textTransform: isBrut ? "uppercase" : "none" }} className={isTerm ? "terminal-glow" : ""}>{type}</span>
                          {L.cardTypeLayout === "list" && <span style={{ fontSize: "0.8125rem", color: c.textSec, marginLeft: "0.5rem" }}>({data.count})</span>}
                        </div>
                        {L.cardTypeLayout !== "list" && <div style={{ fontSize: isCompact ? "0.75rem" : "0.875rem", color: c.textSec, marginBottom: "0.5rem" }}>{data.count} transactions</div>}
                        <div style={{ fontSize: L.cardTypeLayout === "list" ? "1.25rem" : (isCompact ? "1.25rem" : "1.75rem"), fontWeight: bwx, color: isTerm ? c.text : "#16a34a" }} className={isTerm ? "terminal-glow" : ""}>${data.netProfit.toFixed(2)}</div>
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
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", flexWrap: "wrap", gap: isCompact ? "0.5rem" : "1rem", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", flexWrap: "wrap", gap: isCompact ? "0.5rem" : "1rem", alignItems: isMobile ? "stretch" : "center", flex: isMobile ? "1" : undefined }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><Filter size={isCompact ? 14 : 16} style={{ color: c.textSec }} /><span style={{ fontSize: isCompact ? "0.75rem" : "0.875rem", fontWeight: bwm, color: c.text, textTransform: isBrut ? "uppercase" : "none" }}>{isTerm ? "> Filters:" : "Filters:"}</span></div>
                  {[{ val: filterCardType, set: setFilterCardType, opts: [{ v: "all", l: "All Card Types" }, ...cardTypes.map((t) => ({ v: t, l: t }))] }, { val: filterOwner, set: setFilterOwner, opts: [{ v: "all", l: "All Owners" }, ...owners.map((o) => ({ v: o.id, l: o.name }))] }, { val: filterCardNumber, set: setFilterCardNumber, opts: [{ v: "all", l: "All Card Numbers" }, ...availableCardNumbers.map((n) => ({ v: n, l: `Card #${n}` }))] }].map((f, i) => (
                    <select key={i} style={{ padding: isCompact ? "0.375rem 0.5rem" : "0.5rem 0.75rem", border: isBrut ? `2px solid ${c.border}` : `1px solid ${c.inputBorder}`, borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.25rem"), fontSize: isCompact ? "0.75rem" : "0.875rem", minWidth: isMobile ? "0" : (isCompact ? "120px" : "150px"), width: isMobile ? "100%" : "auto", backgroundColor: c.inputBg, color: c.text }} value={f.val} onChange={(e) => f.set(e.target.value)}>
                      {f.opts.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", width: isMobile ? "100%" : "auto" }}>
                  {[{ m: "table", icon: List, label: "Table" }, { m: "cards", icon: LayoutGrid, label: "Cards" }].map(({ m, icon: Ic, label }) => (
                    <button key={m} onClick={() => setViewMode(m)} style={{ padding: isCompact ? "0.375rem 0.625rem" : "0.5rem 1rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: isBrut ? `2px solid ${c.border}` : `1px solid ${c.border}`, backgroundColor: viewMode === m ? c.accent : c.inputBg, color: viewMode === m ? "#fff" : c.text, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", fontSize: isCompact ? "0.75rem" : "0.875rem", fontWeight: bwm, flex: isMobile ? 1 : undefined, ...(isBrut && viewMode === m ? { boxShadow: "3px 3px 0 #000" } : {}) }}><Ic size={isCompact ? 14 : 16} /> {label}</button>
                  ))}
                  <button onClick={() => setShowTxForm(true)} style={{ padding: isCompact ? "0.375rem 0.625rem" : "0.5rem 1rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: "none", background: c.btnGrad, color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", fontSize: isCompact ? "0.75rem" : "0.875rem", fontWeight: bwm, flex: isMobile ? 1 : undefined, boxShadow: `0 2px 8px ${c.btnGlow}` }}><Plus size={isCompact ? 14 : 16} /> Add</button>
                </div>
              </div>
            </div>

            {viewMode === "table" ? (
              <div style={cardBase}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: isBrut ? "separate" : "collapse", borderSpacing: isBrut ? "0 2px" : "0" }}>
                    <thead><tr>
                      {[{ label: "Card Type", col: "cardType" }, { label: "Card No.", col: "cardNumber" }, { label: "Owner", col: "owner" }].map(({ label, col }) => (
                        <th key={col} style={{ ...thStyle, cursor: "pointer", userSelect: "none" }} onClick={() => handleSort(col)}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>{label} {sortCol === col && <span style={{ fontSize: "0.625rem" }}>{sortDir === "asc" ? "▲" : "▼"}</span>}</div>
                        </th>
                      ))}
                      {[{ label: "Buy Rate", col: "buyRate" }, { label: "Buy Amount", col: "buyAmount" }, { label: "Sell Rate", col: "sellRate" }, { label: "Sell Amount", col: "sellAmount" }, { label: "Cost", col: "cost" }, { label: "Gross Profit", col: "grossProfit" }, { label: "Net Profit", col: "netProfit" }, { label: "Margin", col: "profitMargin" }].map(({ label, col }) => (
                        <th key={col} style={{ ...thStyle, textAlign: "right", cursor: "pointer", userSelect: "none" }} onClick={() => handleSort(col)}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", justifyContent: "flex-end" }}>{label} {sortCol === col && <span style={{ fontSize: "0.625rem" }}>{sortDir === "asc" ? "▲" : "▼"}</span>}</div>
                        </th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {sortedTransactions.map((t) => {
                        const cd = getCardById(t.cardId); const ow = getOwnerById(t.ownerId); const cc = getCardTypeColor(cd?.type); const mb = getProfitMarginBadge(t.profitMargin);
                        return (
                          <tr key={t.id}>
                            <td style={tdStyle}><div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><div style={{ width: "10px", height: "10px", borderRadius: isBrut ? "0" : "50%", backgroundColor: cc, flexShrink: 0 }}></div><span>{cd?.type || "UNKNOWN"}</span></div></td>
                            <td style={tdStyle}>{cd?.number || "-"}</td>
                            <td style={{ ...tdStyle, fontWeight: bwm }}>{ow?.name}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>{parseFloat(t.buyRate).toFixed(2)}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>${parseFloat(t.buyAmount).toFixed(2)}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>{parseFloat(t.sellRate).toFixed(2)}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>${parseFloat(t.sellAmount).toFixed(2)}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>${t.cost.toFixed(2)}</td>
                            <td style={{ ...tdStyle, textAlign: "right", color: isTerm ? c.text : "#f97316", fontWeight: bws }}>${t.grossProfit.toFixed(2)}</td>
                            <td style={{ ...tdStyle, textAlign: "right", color: isTerm ? c.text : "#16a34a", fontWeight: bws }} className={isTerm ? "terminal-glow" : ""}>${t.netProfit.toFixed(2)}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}><span style={mb.style}>{t.profitMargin.toFixed(1)}%</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: c.surfaceAlt, fontWeight: bwx, borderTop: `2px solid ${c.borderStrong}` }}>
                        <td colSpan="2" style={{ ...tdStyle, fontWeight: bwx, fontSize: isCompact ? "0.6875rem" : "0.875rem", color: c.textStrong, textTransform: isBrut ? "uppercase" : "none" }}>TOTALS</td>
                        <td colSpan="2" style={{ ...tdStyle, textAlign: "center", fontSize: isCompact ? "0.625rem" : "0.8125rem", color: c.textMid }}><div>Sell Amt:</div><div style={{ fontWeight: bwx, fontSize: isCompact ? "0.6875rem" : "0.9375rem", color: c.textStrong }}>${filteredTransactions.reduce((s, t) => s + (parseFloat(t.sellAmount) || 0), 0).toFixed(2)}</div></td>
                        <td style={{ ...tdStyle, textAlign: "center", fontSize: isCompact ? "0.625rem" : "0.8125rem", color: c.textMid }}><div>Avg Sell:</div><div style={{ fontWeight: bwx, fontSize: isCompact ? "0.6875rem" : "0.9375rem", color: c.textStrong }}>{filteredTransactions.length > 0 ? (filteredTransactions.reduce((s, t) => s + (parseFloat(t.sellRate) || 0), 0) / filteredTransactions.length).toFixed(2) : "0.00"}</div></td>
                        <td style={{ ...tdStyle, textAlign: "center", fontSize: isCompact ? "0.625rem" : "0.8125rem", color: c.textMid }}><div>Avg Buy:</div><div style={{ fontWeight: bwx, fontSize: isCompact ? "0.6875rem" : "0.9375rem", color: c.textStrong }}>{(() => { const tc2 = filteredTransactions.reduce((s, t) => s + (parseFloat(t.cost) || 0), 0); const ts2 = filteredTransactions.reduce((s, t) => s + (parseFloat(t.sellAmount) || 0), 0); return (ts2 > 0 ? tc2 / ts2 : 0).toFixed(2); })()}</div></td>
                        <td style={{ ...tdStyle, textAlign: "center", fontSize: isCompact ? "0.625rem" : "0.8125rem", color: c.textMid }}><div>Buy Amt:</div><div style={{ fontWeight: bwx, fontSize: isCompact ? "0.6875rem" : "0.9375rem", color: c.textStrong }}>${filteredTransactions.reduce((s, t) => s + (parseFloat(t.buyAmount) || 0), 0).toFixed(2)}</div></td>
                        <td style={tdStyle}></td>
                        <td style={{ ...tdStyle, textAlign: "center", fontSize: isCompact ? "0.625rem" : "0.8125rem" }}><div>Gross:</div><div style={{ color: isTerm ? c.text : "#f97316", fontWeight: bwx, fontSize: isCompact ? "0.6875rem" : "0.9375rem" }}>${filteredTransactions.reduce((s, t) => s + t.grossProfit, 0).toFixed(2)}</div></td>
                        <td style={{ ...tdStyle, textAlign: "center", fontSize: isCompact ? "0.625rem" : "0.8125rem" }}><div>Net:</div><div style={{ color: isTerm ? c.text : "#16a34a", fontWeight: bwx, fontSize: isCompact ? "0.6875rem" : "0.9375rem" }} className={isTerm ? "terminal-glow" : ""}>${filteredTransactions.reduce((s, t) => s + t.netProfit, 0).toFixed(2)}</div></td>
                        <td style={tdStyle}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: (isBrut || isMobile) ? "1fr" : "repeat(2, 1fr)", gap: isCompact ? "0.625rem" : "1rem" }}>
                {sortedTransactions.map((t, idx) => {
                  const cd = getCardById(t.cardId); const ow = getOwnerById(t.ownerId); const cc = getCardTypeColor(cd?.type); const mb = getProfitMarginBadge(t.profitMargin);
                  return (
                    <div key={t.id} className={isLG ? "lg-specular" : ""} style={{ backgroundColor: c.surface, borderRadius: isLG ? r : (isCirc ? "2rem" : rSm), padding: isCompact ? "0.875rem" : "1.5rem", border: isBrut ? `3px solid ${c.border}` : (isLG ? "1px solid rgba(255,255,255,0.6)" : `1px solid ${c.border}`), ...((isGlass || isLG) ? { backdropFilter: "blur(16px) saturate(150%)", WebkitBackdropFilter: "blur(16px) saturate(150%)" } : {}), ...(isBrut ? { boxShadow: "4px 4px 0 #000" } : {}), cursor: "pointer", animation: `slideUp 0.35s cubic-bezier(.16,1,.3,1) ${Math.min(idx, 10) * 0.04}s both`, transform: hoveredCard === `tx-${idx}` ? "translateY(-4px)" : "translateY(0)", boxShadow: hoveredCard === `tx-${idx}` ? c.cardHoverShadow : (isLG ? "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)" : (c.cardGlow || "none")), transition: "transform 0.2s cubic-bezier(.4,0,.2,1), box-shadow 0.2s cubic-bezier(.4,0,.2,1)" }}
                      onMouseEnter={() => setHoveredCard(`tx-${idx}`)} onMouseLeave={() => setHoveredCard(null)}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: isCompact ? "0.5rem" : "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: isCompact ? "0.5rem" : "0.75rem" }}>
                          <div style={{ width: isCompact ? "12px" : "16px", height: isCompact ? "12px" : "16px", borderRadius: isBrut ? "0" : "50%", backgroundColor: cc, flexShrink: 0 }}></div>
                          <div><div style={{ fontWeight: bwx, fontSize: isCompact ? "0.9375rem" : "1.125rem", color: c.textStrong }}>{cd?.type || "UNKNOWN"}</div><div style={{ fontSize: isCompact ? "0.6875rem" : "0.875rem", color: c.textSec }}>Card #{cd?.number || "-"}</div></div>
                        </div>
                        <span style={mb.style}>{t.profitMargin.toFixed(1)}%</span>
                      </div>
                      <div style={{ marginBottom: isCompact ? "0.5rem" : "1rem" }}>
                        <div><div style={{ fontSize: isCompact ? "0.6875rem" : "0.875rem", color: c.textSec }}>Owner</div><div style={{ fontWeight: bws, fontSize: isCompact ? "0.8125rem" : "1rem", color: c.text }}>{ow?.name}</div></div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: isCompact ? "0.5rem" : "1rem", marginBottom: isCompact ? "0.5rem" : "1rem" }}>
                        <div><div style={{ fontSize: isCompact ? "0.625rem" : "0.75rem", color: c.textSec }}>Buy</div><div style={{ fontWeight: bws, fontSize: isCompact ? "0.75rem" : "inherit", color: c.text }}>{parseFloat(t.buyRate).toFixed(2)} × ${parseFloat(t.buyAmount).toFixed(0)}</div></div>
                        <div><div style={{ fontSize: isCompact ? "0.625rem" : "0.75rem", color: c.textSec }}>Sell</div><div style={{ fontWeight: bws, fontSize: isCompact ? "0.75rem" : "inherit", color: c.text }}>{parseFloat(t.sellRate).toFixed(2)} × ${parseFloat(t.sellAmount).toFixed(0)}</div></div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: isCompact ? "0.5rem" : "1rem", paddingTop: isCompact ? "0.5rem" : "1rem", borderTop: `1px solid ${c.border}` }}>
                        {[{ l: "Cost", v: t.cost, cl: "#3b82f6" }, { l: "Gross", v: t.grossProfit, cl: "#f97316" }, { l: "Net", v: t.netProfit, cl: "#16a34a" }].map((x) => (
                          <div key={x.l}><div style={{ fontSize: isCompact ? "0.625rem" : "0.75rem", color: c.textSec }}>{x.l}</div><div style={{ fontWeight: bwx, fontSize: isCompact ? "0.875rem" : "inherit", color: isTerm ? c.text : x.cl }}>${x.v.toFixed(0)}</div></div>
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
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: isCompact ? "0.625rem" : "1rem" }}>
              <button onClick={() => setShowMonthlyForm(true)} style={{ padding: isCompact ? "0.375rem 0.625rem" : "0.5rem 1rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: "none", background: c.btnGrad, color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: isCompact ? "0.75rem" : "0.875rem", fontWeight: bwm, boxShadow: `0 2px 8px ${c.btnGlow}` }}><Plus size={isCompact ? 14 : 16} /> Add Month</button>
            </div>
            {monthly.length > 0 && (
              <div style={{ marginBottom: isCompact ? "1rem" : "2rem" }}>
                <div className={isLG ? "lg-specular" : ""} style={{ padding: isMobile ? "1.25rem" : (isCompact ? "1.5rem" : "2.5rem"), borderRadius: isBrut ? "0" : (isCirc ? "2rem" : r), background: c.profitGrad, color: isLG ? "#1c7a36" : "#ffffff", maxWidth: isMobile ? "100%" : (isCompact ? "400px" : "500px"), margin: "0 auto", textAlign: "center", animation: "slideUp 0.4s cubic-bezier(.16,1,.3,1) both", border: isBrut ? "3px solid #000" : (isLG ? "1px solid rgba(52,199,89,0.25)" : (isCirc ? `2px solid ${c.border}` : "none")), boxShadow: isBrut ? "6px 6px 0 #000" : (isLG ? "0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)" : c.shadowLg), ...((isGlass || isLG) ? { backdropFilter: "blur(16px) saturate(150%)", WebkitBackdropFilter: "blur(16px) saturate(150%)" } : {}) }}>
                  <div style={{ fontSize: isMobile ? "0.8125rem" : (isCompact ? "0.9375rem" : "1.125rem"), opacity: 0.9, fontWeight: bws }} className={isTerm ? "terminal-glow" : ""}>{isTerm ? "> ALL TIME PROFIT" : "All Time Profit"}</div>
                  <div style={{ fontSize: isMobile ? "2rem" : (isCompact ? "2.5rem" : "3.5rem"), fontWeight: bwx, margin: "0.5rem 0" }} className={isTerm ? "terminal-glow" : ""}>${monthly.reduce((s, m) => s + m.profit, 0).toFixed(2)}</div>
                  <div style={{ fontSize: isMobile ? "0.6875rem" : (isCompact ? "0.8125rem" : "0.9375rem"), opacity: 0.85 }}>Total from {monthly.length} months</div>
                </div>
              </div>
            )}
            <div style={cardBase}>
              <h2 style={sectionTitleStyle}><Calendar size={isCompact ? 20 : 24} /> Monthly Breakdown</h2>
              {monthly.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: c.textSec }}><p style={{ fontSize: "1.125rem", fontWeight: bws }}>No monthly data available</p></div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: isBrut ? "separate" : "collapse", borderSpacing: isBrut ? "0 2px" : "0" }}>
                    <thead><tr><th style={thStyle}>Month</th><th style={{ ...thStyle, textAlign: "right" }}>Profit</th></tr></thead>
                    <tbody>
                      {monthly.map((m, idx) => (
                        <tr key={m.id} style={{ backgroundColor: idx % 2 === 0 ? c.surface : c.surfaceAlt }}>
                          <td style={{ ...tdStyle, fontWeight: bws, fontSize: isCompact ? "0.8125rem" : "1rem" }} className={isTerm ? "terminal-glow" : ""}>{isTerm ? `> ${m.month}` : m.month}</td>
                          <td style={{ ...tdStyle, textAlign: "right", color: isTerm ? c.text : "#16a34a", fontWeight: bwx, fontSize: isCompact ? "0.875rem" : "1.125rem" }} className={isTerm ? "terminal-glow" : ""}>${m.profit.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr style={{ backgroundColor: c.surfaceAlt, fontWeight: bwx, borderTop: `2px solid ${c.borderStrong}` }}>
                      <td style={{ ...tdStyle, fontWeight: bwx, fontSize: isCompact ? "0.8125rem" : "1rem", color: c.textStrong }}>TOTAL</td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: bwx, color: isTerm ? c.text : "#16a34a", fontSize: isCompact ? "1rem" : "1.25rem" }} className={isTerm ? "terminal-glow" : ""}>${monthly.reduce((s, m) => s + m.profit, 0).toFixed(2)}</td>
                    </tr></tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== ADD TRANSACTION FORM ===== */}
      {showTxForm && (() => {
        const fInput = { padding: isCompact ? "0.5rem" : "0.625rem 0.75rem", border: `1px solid ${c.inputBorder}`, borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.375rem"), fontSize: isCompact ? "0.8125rem" : "0.875rem", width: "100%", backgroundColor: c.inputBg, color: c.text, outline: "none" };
        const fLabel = { display: "block", fontSize: "0.75rem", fontWeight: bws, marginBottom: "0.375rem", color: c.textSec };
        return (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isLG ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 200, animation: "fadeIn 0.2s cubic-bezier(.16,1,.3,1) both" }} onClick={() => setShowTxForm(false)}>
            <div style={{ backgroundColor: isGlass ? "rgba(20,14,48,0.95)" : (isLG ? "rgba(255,255,255,0.65)" : c.surface), borderRadius: isBrut ? "0" : (isCirc ? "2.5rem" : (isMobile ? "0.75rem" : "1rem")), padding: isMobile ? "1.25rem" : "2rem", maxWidth: isMobile ? "100%" : "520px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: c.modalShadow, animation: "slideUp 0.3s cubic-bezier(.16,1,.3,1) both", border: isBrut ? `3px solid ${c.border}` : `1px solid ${c.border}`, margin: isMobile ? "0.5rem" : "0" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: `1px solid ${c.border}` }}>
                <h2 style={{ fontSize: "1.25rem", fontFamily: headingFont, fontWeight: bwh, color: c.textStrong, margin: 0 }}>Add Transaction</h2>
                <button onClick={() => setShowTxForm(false)} style={{ padding: "0.375rem", border: "none", background: "none", cursor: "pointer", color: c.textSec }}><X size={20} /></button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0.75rem" }}>
                <div><label style={fLabel}>Card Type</label><select value={txForm.cardType} onChange={(e) => setTxForm({ ...txForm, cardType: e.target.value })} style={fInput}>{cardTypes.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label style={fLabel}>Card Number</label><input type="text" value={txForm.cardNumber} onChange={(e) => setTxForm({ ...txForm, cardNumber: e.target.value })} placeholder="e.g. 2581" style={fInput} /></div>
                <div><label style={fLabel}>Owner</label><input type="text" value={txForm.owner} onChange={(e) => setTxForm({ ...txForm, owner: e.target.value })} placeholder="Name" style={fInput} /></div>
                <div><label style={fLabel}>Buy Rate</label><input type="number" step="0.01" value={txForm.buyRate} onChange={(e) => setTxForm({ ...txForm, buyRate: e.target.value })} style={fInput} /></div>
                <div><label style={fLabel}>Buy Amount ($)</label><input type="number" step="0.01" value={txForm.buyAmount} onChange={(e) => setTxForm({ ...txForm, buyAmount: e.target.value })} style={fInput} /></div>
                <div><label style={fLabel}>Sell Rate</label><input type="number" step="0.01" value={txForm.sellRate} onChange={(e) => setTxForm({ ...txForm, sellRate: e.target.value })} style={fInput} /></div>
                <div><label style={fLabel}>Sell Amount ($)</label><input type="number" step="0.01" value={txForm.sellAmount} onChange={(e) => setTxForm({ ...txForm, sellAmount: e.target.value })} style={fInput} /></div>
                <div><label style={fLabel}>Cost ($)</label><input type="number" step="0.01" value={txForm.cost} onChange={(e) => setTxForm({ ...txForm, cost: e.target.value })} style={fInput} /></div>
                <div><label style={fLabel}>Gross Profit ($)</label><input type="number" step="0.01" value={txForm.grossProfit} onChange={(e) => setTxForm({ ...txForm, grossProfit: e.target.value })} style={fInput} /></div>
                <div><label style={fLabel}>Net Profit ($)</label><input type="number" step="0.01" value={txForm.netProfit} onChange={(e) => setTxForm({ ...txForm, netProfit: e.target.value })} style={fInput} /></div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
                <button onClick={() => setShowTxForm(false)} style={{ padding: "0.5rem 1.25rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: `1px solid ${c.border}`, backgroundColor: "transparent", color: c.text, cursor: "pointer", fontSize: "0.875rem", fontWeight: bwm }}>Cancel</button>
                <button onClick={submitTransaction} disabled={submitting} style={{ padding: "0.5rem 1.5rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: "none", background: c.btnGrad, color: "#fff", cursor: submitting ? "not-allowed" : "pointer", fontSize: "0.875rem", fontWeight: bwm, opacity: submitting ? 0.7 : 1, boxShadow: `0 2px 8px ${c.btnGlow}` }}>{submitting ? "Saving..." : "Save"}</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===== ADD MONTHLY FORM ===== */}
      {showMonthlyForm && (() => {
        const fInput = { padding: isCompact ? "0.5rem" : "0.625rem 0.75rem", border: `1px solid ${c.inputBorder}`, borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.375rem"), fontSize: isCompact ? "0.8125rem" : "0.875rem", width: "100%", backgroundColor: c.inputBg, color: c.text, outline: "none" };
        const fLabel = { display: "block", fontSize: "0.75rem", fontWeight: bws, marginBottom: "0.375rem", color: c.textSec };
        return (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isLG ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 200, animation: "fadeIn 0.2s cubic-bezier(.16,1,.3,1) both" }} onClick={() => setShowMonthlyForm(false)}>
            <div style={{ backgroundColor: isGlass ? "rgba(20,14,48,0.95)" : (isLG ? "rgba(255,255,255,0.65)" : c.surface), borderRadius: isBrut ? "0" : (isCirc ? "2.5rem" : (isMobile ? "0.75rem" : "1rem")), padding: isMobile ? "1.25rem" : "2rem", maxWidth: "400px", width: "100%", boxShadow: c.modalShadow, animation: "slideUp 0.3s cubic-bezier(.16,1,.3,1) both", border: isBrut ? `3px solid ${c.border}` : `1px solid ${c.border}`, margin: isMobile ? "0.5rem" : "0" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: `1px solid ${c.border}` }}>
                <h2 style={{ fontSize: "1.25rem", fontFamily: headingFont, fontWeight: bwh, color: c.textStrong, margin: 0 }}>Add Monthly Record</h2>
                <button onClick={() => setShowMonthlyForm(false)} style={{ padding: "0.375rem", border: "none", background: "none", cursor: "pointer", color: c.textSec }}><X size={20} /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div><label style={fLabel}>Month</label><input type="text" value={monthlyForm.month} onChange={(e) => setMonthlyForm({ ...monthlyForm, month: e.target.value })} placeholder="e.g. March 2026" style={fInput} /></div>
                <div><label style={fLabel}>Profit ($)</label><input type="number" step="0.01" value={monthlyForm.profit} onChange={(e) => setMonthlyForm({ ...monthlyForm, profit: e.target.value })} placeholder="e.g. 5500" style={fInput} /></div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
                <button onClick={() => setShowMonthlyForm(false)} style={{ padding: "0.5rem 1.25rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: `1px solid ${c.border}`, backgroundColor: "transparent", color: c.text, cursor: "pointer", fontSize: "0.875rem", fontWeight: bwm }}>Cancel</button>
                <button onClick={submitMonthly} disabled={submitting} style={{ padding: "0.5rem 1.5rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: "none", background: c.btnGrad, color: "#fff", cursor: submitting ? "not-allowed" : "pointer", fontSize: "0.875rem", fontWeight: bwm, opacity: submitting ? 0.7 : 1, boxShadow: `0 2px 8px ${c.btnGlow}` }}>{submitting ? "Saving..." : "Save"}</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===== SETTINGS MODAL ===== */}
      {/* ===== SETTINGS MODAL ===== */}
      {showSettings && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isLG ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 200, animation: "fadeIn 0.2s cubic-bezier(.16,1,.3,1) both" }} onClick={() => setShowSettings(false)}>
          <div style={{ backgroundColor: isGlass ? "rgba(20,14,48,0.95)" : (isLG ? "rgba(255,255,255,0.65)" : c.surface), borderRadius: isBrut ? "0" : (isCirc ? "2.5rem" : (isMobile ? "0.75rem" : (isLG ? "1.5rem" : "1rem"))), padding: isMobile ? "1.25rem" : "2rem", maxWidth: isMobile ? "100%" : "560px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: c.modalShadow, animation: "slideUp 0.3s cubic-bezier(.16,1,.3,1) both", border: isBrut ? `3px solid ${c.border}` : (isLG ? "1px solid rgba(255,255,255,0.7)" : `1px solid ${c.border}`), ...((isGlass || isLG) ? { backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)" } : {}), margin: isMobile ? "0.5rem" : "0" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", paddingBottom: "1rem", borderBottom: `1px solid ${c.border}` }}>
              <h2 style={{ fontSize: "1.5rem", fontFamily: headingFont, fontWeight: bwh, color: c.textStrong, margin: 0, display: "flex", alignItems: "center", gap: "0.75rem" }}><Settings size={24} /> Settings</h2>
              <button onClick={() => setShowSettings(false)} style={{ padding: "0.5rem", border: "none", background: "none", cursor: "pointer", color: c.textSec, display: "flex", alignItems: "center" }}><X size={24} /></button>
            </div>

            {/* Theme */}
            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: bws, marginBottom: "0.75rem", color: c.text }}>Theme</label>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(auto-fill, minmax(90px, 1fr))", gap: "0.5rem" }}>
                {THEME_OPTIONS.map((opt) => (
                  <div key={opt.key} onClick={() => setTheme(opt.key)} style={{ padding: "0.5rem", border: theme === opt.key ? `2px solid ${c.accent}` : `2px solid ${c.border}`, borderRadius: isBrut ? "0" : (isCirc ? "1.5rem" : "0.625rem"), backgroundColor: theme === opt.key ? c.accentBg : c.surfaceAlt, cursor: "pointer", textAlign: "center", transition: "border-color 0.15s cubic-bezier(.4,0,.2,1), background-color 0.15s cubic-bezier(.4,0,.2,1)" }}>
                    <div style={{ display: "flex", height: "24px", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "4px"), overflow: "hidden", marginBottom: "0.375rem", border: `1px solid ${c.border}` }}>
                      {opt.preview.map((color, i) => <div key={i} style={{ flex: 1, background: color }}></div>)}
                    </div>
                    <div style={{ fontSize: "0.6875rem", fontWeight: bws, color: theme === opt.key ? c.accent : c.text }}>{opt.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* View Style */}
            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: bws, marginBottom: "0.75rem", color: c.text }}>View Style</label>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {[{ k: "normal", i: LayoutGrid, l: "Normal", d: "Large cards" }, { k: "compact", i: List, l: "Compact", d: "Dense layout" }].map((o) => (
                  <div key={o.k} onClick={() => setViewStyle(o.k)} style={{ flex: 1, padding: "0.75rem", border: viewStyle === o.k ? `2px solid ${c.accent}` : `2px solid ${c.border}`, borderRadius: isBrut ? "0" : (isCirc ? "2rem" : "0.75rem"), backgroundColor: viewStyle === o.k ? c.accentBg : c.surfaceAlt, cursor: "pointer", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", color: viewStyle === o.k ? c.accent : c.text }}>
                    <o.i size={24} /><span>{o.l}</span><div style={{ fontSize: "0.6875rem", opacity: 0.7 }}>{o.d}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Font */}
            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: bws, marginBottom: "0.75rem", color: c.text }}>Body Font</label>
              <select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} style={{ padding: "0.75rem", border: `1px solid ${c.inputBorder}`, borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), fontSize: "0.9375rem", width: "100%", backgroundColor: c.inputBg, color: c.text, cursor: "pointer" }}>
                {FONTS.map((f) => <option key={f.value} value={f.value}>{f.name}</option>)}
              </select>
            </div>

            {/* Title Font */}
            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: bws, marginBottom: "0.75rem", color: c.text }}>Title Font</label>
              <select value={titleFont} onChange={(e) => setTitleFont(e.target.value)} style={{ padding: "0.75rem", border: `1px solid ${c.inputBorder}`, borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), fontSize: "0.9375rem", width: "100%", backgroundColor: c.inputBg, color: c.text, cursor: "pointer" }}>
                {FONTS.map((f) => <option key={f.value} value={f.value}>{f.name}</option>)}
              </select>
              <div style={{ marginTop: "0.5rem", fontFamily: `"${titleFont}", sans-serif`, fontSize: "1.25rem", fontWeight: bwh, background: c.titleGrad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Sales Dashboard</div>
            </div>

            {/* Font Size */}
            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: bws, marginBottom: "0.75rem", color: c.text }}>Font Size</label>
              <input type="range" min="12" max="40" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} style={{ width: "100%", height: "8px", borderRadius: "4px", background: c.toggleBg, outline: "none" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontSize: "0.875rem", color: c.textSec }}>
                <span>Small (12px)</span><span style={{ fontSize: "1.125rem", fontWeight: bwx, color: c.textStrong }}>{fontSize}px</span><span>Large (40px)</span>
              </div>
            </div>

            {/* Bold Text */}
            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: bws, marginBottom: "0.75rem", color: c.text }}>Text Weight</label>
              <div onClick={() => setBoldText(!boldText)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", border: boldText ? `2px solid ${c.accent}` : `2px solid ${c.border}`, borderRadius: isBrut ? "0" : (isCirc ? "2rem" : "0.75rem"), backgroundColor: boldText ? c.accentBg : c.surfaceAlt, cursor: "pointer" }}>
                <div>
                  <div style={{ fontWeight: boldText ? bwx : bws, fontSize: "0.9375rem", color: c.textStrong }}>Bold Text</div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "0.25rem", color: c.textSec }}>Increase font weight across the UI</div>
                </div>
                <div style={{ width: "44px", height: "24px", borderRadius: "12px", backgroundColor: boldText ? c.accent : c.toggleBg, position: "relative", flexShrink: 0 }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#ffffff", position: "absolute", top: "2px", left: boldText ? "22px" : "2px", transition: "left 0.2s cubic-bezier(.4,0,.2,1)", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}></div>
                </div>
              </div>
            </div>

            {/* Auto-Refresh */}
            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: bws, marginBottom: "0.75rem", color: c.text }}>Auto-Refresh</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                {[{ v: 0, l: "Off" }, { v: 30, l: "30s" }, { v: 60, l: "1m" }, { v: 300, l: "5m" }].map((opt) => (
                  <button key={opt.v} onClick={() => setAutoRefresh(opt.v)} style={{ padding: "0.625rem", border: autoRefresh === opt.v ? `2px solid ${c.accent}` : `2px solid ${c.border}`, borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), backgroundColor: autoRefresh === opt.v ? c.accentBg : c.surfaceAlt, color: autoRefresh === opt.v ? c.accent : c.text, cursor: "pointer", fontSize: "0.8125rem", fontWeight: bws, textAlign: "center" }}>
                    {opt.l}
                  </button>
                ))}
              </div>
              {autoRefresh > 0 && <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginTop: "0.5rem", fontSize: "0.75rem", color: c.accent }}><Timer size={12} /> Refreshing every {autoRefresh}s</div>}
            </div>

          </div>
        </div>
      )}

      <style>{`
        *, *::before, *::after { font-family: inherit; box-sizing: border-box; }
        html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        button, select, input { font-family: inherit; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translate3d(0, 12px, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }
        @keyframes shake { 0%, 100% { transform: translate3d(0, 0, 0); } 20%, 60% { transform: translate3d(-4px, 0, 0); } 40%, 80% { transform: translate3d(4px, 0, 0); } }
        ${L.extraCss}
      `}</style>
    </div>
  );
}

export default App;