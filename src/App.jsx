import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  Filter,
  User,
  RefreshCw,
  Moon,
  Sun,
  Monitor,
  LayoutGrid,
  List,
  Settings,
  X,
  Calendar,
  Terminal as TerminalIcon,
  Gem,
  Layers,
  Star,
} from "lucide-react";

const GOOGLE_SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbxVwc0buJoICP6sIzK6GxmZNtdvdYA4lw7MhmMxxYjI2weRxDReGIK4sbKyKESUPhEUHQ/exec";

const FONTS = [
  { name: "Inter", value: "Inter" },
  { name: "Poppins", value: "Poppins" },
  { name: "League Spartan", value: "League Spartan" },
  { name: "Open Sans", value: "Open Sans" },
];

const THEME_OPTIONS = [
  { key: "light", label: "Light", preview: ["#ffffff", "#667eea", "#84fab0", "#f3f4f6"] },
  { key: "dark", label: "Dark", preview: ["#1e293b", "#667eea", "#84fab0", "#0f172a"] },
  { key: "auto", label: "Auto", preview: ["#94a3b8", "#667eea", "#84fab0", "#64748b"] },
  { key: "ocean", label: "Ocean", preview: ["#0c1929", "#06b6d4", "#0ea5e9", "#155e75"] },
  { key: "sunset", label: "Sunset", preview: ["#fff7ed", "#f97316", "#e11d48", "#fbbf24"] },
  { key: "neon", label: "Neon", preview: ["#0a0a0a", "#d946ef", "#06b6d4", "#22d3ee"] },
  { key: "emerald", label: "Emerald", preview: ["#072116", "#10b981", "#fbbf24", "#065f46"] },
  { key: "glass", label: "Glass", preview: ["#1a1a2e", "#e0e7ff", "#818cf8", "#312e81"] },
  { key: "terminal", label: "Terminal", preview: ["#0a0a0a", "#00ff41", "#003b00", "#1a1a1a"] },
  { key: "brutalist", label: "Brutalist", preview: ["#f5f5f0", "#000000", "#ff3333", "#ffffff"] },
  { key: "midnight", label: "Midnight", preview: ["#0f0720", "#7c3aed", "#c084fc", "#1e1b4b"] },
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
};

const getThemeLayout = (name) => {
  const map = { light: "default", dark: "default", auto: "default", ocean: "default", sunset: "default", neon: "default", emerald: "default",
    glass: "glass", terminal: "terminal", brutalist: "brutalist", midnight: "midnight" };
  return themeLayouts[map[name] || "default"];
};

const getThemeColors = (themeName) => {
  const autoIsDark = typeof window !== 'undefined' && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const base = {
    radius: "1rem", radiusSm: "0.75rem", radiusCompact: "0.375rem", radiusCompactSm: "0.25rem",
    headerBorderBottom: null, bgPattern: null, cardGlow: null, cardBackdrop: null,
  };

  const palettes = {
    light: {
      ...base, isDark: false,
      bg: "#f3f4f6", bgAlt: "#f8fafc", surface: "#ffffff", surfaceAlt: "#f9fafb", surfaceDeep: "#f9fafb",
      text: "#111827", textSec: "#6b7280", textMuted: "#94a3b8", textLight: "#f1f5f9", textMid: "#cbd5e1", textStrong: "#374151",
      border: "#e5e7eb", borderAlt: "#e2e8f0", borderStrong: "#d1d5db", borderHover: "#475569",
      accent: "#2563eb", accentBg: "#dbeafe", accentDark: "#1e3a8a",
      inputBg: "#ffffff", inputBorder: "#e5e7eb",
      titleGrad: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      btnGrad: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", btnGlow: "rgba(102, 126, 234, 0.4)",
      statCards: { Green: { bg: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)" }, Teal: { bg: "linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%)" }, Orange: { bg: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)", text: "#78350f" }, Blue: { bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }, Pink: { bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" }, Purple: { bg: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)", text: "#581c87" } },
      profitGrad: "linear-gradient(135deg, #16a34a 0%, #059669 100%)",
      errorBg: "#fee2e2", errorBorder: "#ef4444", errorText: "#991b1b",
      badgeGreen: { bg: "#d1fae5", text: "#065f46" }, badgeYellow: { bg: "#fef3c7", text: "#92400e" }, badgeRed: { bg: "#fee2e2", text: "#991b1b" },
      shadow: "0 1px 3px rgba(0,0,0,0.1)", shadowCompact: "0 1px 2px rgba(0,0,0,0.05)",
      shadowLg: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)", shadowLgCompact: "0 1px 3px rgba(0,0,0,0.1)",
      hoverShadow: "0 25px 35px -5px rgba(0,0,0,0.2)",
      cardHoverShadow: "0 8px 16px rgba(0,0,0,0.1)", modalShadow: "0 20px 25px -5px rgba(0,0,0,0.2)", toggleBg: "#d1d5db",
    },
    dark: {
      ...base, isDark: true,
      bg: "#0f172a", bgAlt: "#0f172a", surface: "#1e293b", surfaceAlt: "#0f172a", surfaceDeep: "#0f172a",
      text: "#e2e8f0", textSec: "#94a3b8", textMuted: "#94a3b8", textLight: "#f1f5f9", textMid: "#cbd5e1", textStrong: "#f1f5f9",
      border: "#334155", borderAlt: "#334155", borderStrong: "#475569", borderHover: "#475569",
      accent: "#2563eb", accentBg: "#1e3a8a", accentDark: "#1e3a8a",
      inputBg: "#334155", inputBorder: "#475569",
      titleGrad: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      btnGrad: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", btnGlow: "rgba(102, 126, 234, 0.4)",
      statCards: { Green: { bg: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)" }, Teal: { bg: "linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%)" }, Orange: { bg: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)", text: "#78350f" }, Blue: { bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }, Pink: { bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" }, Purple: { bg: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)", text: "#581c87" } },
      profitGrad: "linear-gradient(135deg, #16a34a 0%, #059669 100%)",
      errorBg: "#450a0a", errorBorder: "#991b1b", errorText: "#fca5a5",
      badgeGreen: { bg: "#064e3b", text: "#6ee7b7" }, badgeYellow: { bg: "#78350f", text: "#fcd34d" }, badgeRed: { bg: "#7f1d1d", text: "#fca5a5" },
      shadow: "0 1px 3px rgba(0,0,0,0.3)", shadowCompact: "0 1px 2px rgba(0,0,0,0.2)",
      shadowLg: "0 20px 25px -5px rgba(0,0,0,0.3)", shadowLgCompact: "0 1px 3px rgba(0,0,0,0.2)",
      hoverShadow: "0 25px 35px -5px rgba(0,0,0,0.4)",
      cardHoverShadow: "0 8px 16px rgba(0,0,0,0.3)", modalShadow: "0 20px 25px -5px rgba(0,0,0,0.5)", toggleBg: "#475569",
    },
    ocean: {
      ...base, isDark: true, radius: "1.25rem", radiusSm: "1rem", radiusCompact: "0.625rem", radiusCompactSm: "0.375rem",
      bg: "#0a1628", bgAlt: "#0a1628", surface: "#0f2035", surfaceAlt: "#0a1628", surfaceDeep: "#071320",
      text: "#e0f2fe", textSec: "#7dd3fc", textMuted: "#38bdf8", textLight: "#f0f9ff", textMid: "#bae6fd", textStrong: "#f0f9ff",
      border: "#164e63", borderAlt: "#155e75", borderStrong: "#0e7490", borderHover: "#06b6d4",
      accent: "#06b6d4", accentBg: "#164e63", accentDark: "#155e75", inputBg: "#132a42", inputBorder: "#164e63",
      titleGrad: "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 50%, #38bdf8 100%)",
      btnGrad: "linear-gradient(135deg, #0891b2 0%, #0284c7 100%)", btnGlow: "rgba(6, 182, 212, 0.4)",
      statCards: { Green: { bg: "linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)" }, Teal: { bg: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" }, Orange: { bg: "linear-gradient(135deg, #155e75 0%, #0e7490 100%)", text: "#67e8f9" }, Blue: { bg: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)" }, Pink: { bg: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)" }, Purple: { bg: "linear-gradient(135deg, #164e63 0%, #0891b2 100%)", text: "#a5f3fc" } },
      profitGrad: "linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)",
      errorBg: "#1c1917", errorBorder: "#dc2626", errorText: "#fca5a5",
      badgeGreen: { bg: "#064e3b", text: "#5eead4" }, badgeYellow: { bg: "#164e63", text: "#67e8f9" }, badgeRed: { bg: "#7f1d1d", text: "#fca5a5" },
      shadow: "0 2px 8px rgba(6,182,212,0.08)", shadowCompact: "0 1px 4px rgba(6,182,212,0.06)",
      shadowLg: "0 20px 40px -10px rgba(6,182,212,0.15)", shadowLgCompact: "0 2px 8px rgba(6,182,212,0.08)",
      hoverShadow: "0 25px 50px -12px rgba(6,182,212,0.25)",
      cardHoverShadow: "0 8px 24px rgba(6,182,212,0.15)", modalShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", toggleBg: "#164e63",
      headerBorderBottom: "2px solid rgba(6,182,212,0.3)",
      bgPattern: "radial-gradient(ellipse at 20% 50%, rgba(6,182,212,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(14,165,233,0.04) 0%, transparent 50%)",
    },
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
    neon: {
      ...base, isDark: true, radius: "0.5rem", radiusSm: "0.375rem", radiusCompact: "0.25rem", radiusCompactSm: "0.125rem",
      bg: "#050505", bgAlt: "#050505", surface: "#111111", surfaceAlt: "#0a0a0a", surfaceDeep: "#050505",
      text: "#fafafa", textSec: "#a1a1aa", textMuted: "#71717a", textLight: "#fafafa", textMid: "#d4d4d8", textStrong: "#ffffff",
      border: "#27272a", borderAlt: "#27272a", borderStrong: "#3f3f46", borderHover: "#d946ef",
      accent: "#d946ef", accentBg: "#3b0764", accentDark: "#581c87", inputBg: "#18181b", inputBorder: "#3f3f46",
      titleGrad: "linear-gradient(135deg, #d946ef 0%, #06b6d4 50%, #22d3ee 100%)",
      btnGrad: "linear-gradient(135deg, #d946ef 0%, #a855f7 100%)", btnGlow: "rgba(217, 70, 239, 0.5)",
      statCards: { Green: { bg: "linear-gradient(135deg, #059669 0%, #06b6d4 100%)" }, Teal: { bg: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)" }, Orange: { bg: "linear-gradient(135deg, #18181b 0%, #27272a 100%)", text: "#fbbf24", border: "1px solid rgba(251,191,36,0.4)" }, Blue: { bg: "linear-gradient(135deg, #d946ef 0%, #a855f7 100%)" }, Pink: { bg: "linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)" }, Purple: { bg: "linear-gradient(135deg, #18181b 0%, #27272a 100%)", text: "#c084fc", border: "1px solid rgba(192,132,252,0.4)" } },
      profitGrad: "linear-gradient(135deg, #059669 0%, #06b6d4 100%)",
      errorBg: "#18181b", errorBorder: "#ef4444", errorText: "#fca5a5",
      badgeGreen: { bg: "rgba(16,185,129,0.2)", text: "#34d399" }, badgeYellow: { bg: "rgba(251,191,36,0.2)", text: "#fbbf24" }, badgeRed: { bg: "rgba(239,68,68,0.2)", text: "#f87171" },
      shadow: "0 0 0 1px rgba(63,63,70,0.5)", shadowCompact: "0 0 0 1px rgba(63,63,70,0.3)",
      shadowLg: "0 0 30px rgba(217,70,239,0.1), 0 0 0 1px rgba(63,63,70,0.5)", shadowLgCompact: "0 0 0 1px rgba(63,63,70,0.3)",
      hoverShadow: "0 0 40px rgba(217,70,239,0.2), 0 0 0 1px rgba(217,70,239,0.3)",
      cardHoverShadow: "0 0 20px rgba(217,70,239,0.15)", modalShadow: "0 0 50px rgba(217,70,239,0.15), 0 25px 50px rgba(0,0,0,0.5)", toggleBg: "#3f3f46",
      headerBorderBottom: "1px solid rgba(217,70,239,0.3)",
      bgPattern: "radial-gradient(ellipse at 50% 0%, rgba(217,70,239,0.05) 0%, transparent 50%)",
      cardGlow: "0 0 0 1px rgba(217,70,239,0.15)",
    },
    emerald: {
      ...base, isDark: true, radius: "0.875rem", radiusSm: "0.625rem",
      bg: "#071210", bgAlt: "#071210", surface: "#0f1f1b", surfaceAlt: "#071210", surfaceDeep: "#040e0c",
      text: "#d1fae5", textSec: "#6ee7b7", textMuted: "#34d399", textLight: "#ecfdf5", textMid: "#a7f3d0", textStrong: "#ecfdf5",
      border: "#14532d", borderAlt: "#166534", borderStrong: "#15803d", borderHover: "#10b981",
      accent: "#10b981", accentBg: "#064e3b", accentDark: "#065f46", inputBg: "#14251f", inputBorder: "#14532d",
      titleGrad: "linear-gradient(135deg, #10b981 0%, #fbbf24 100%)",
      btnGrad: "linear-gradient(135deg, #059669 0%, #10b981 100%)", btnGlow: "rgba(16, 185, 129, 0.4)",
      statCards: { Green: { bg: "linear-gradient(135deg, #059669 0%, #10b981 100%)" }, Teal: { bg: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)" }, Orange: { bg: "linear-gradient(135deg, #92400e 0%, #b45309 100%)", text: "#fef3c7" }, Blue: { bg: "linear-gradient(135deg, #14532d 0%, #166534 100%)", text: "#a7f3d0" }, Pink: { bg: "linear-gradient(135deg, #854d0e 0%, #a16207 100%)" }, Purple: { bg: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)", text: "#6ee7b7" } },
      profitGrad: "linear-gradient(135deg, #059669 0%, #fbbf24 100%)",
      errorBg: "#1c1917", errorBorder: "#dc2626", errorText: "#fca5a5",
      badgeGreen: { bg: "#064e3b", text: "#6ee7b7" }, badgeYellow: { bg: "#422006", text: "#fcd34d" }, badgeRed: { bg: "#450a0a", text: "#fca5a5" },
      shadow: "0 2px 8px rgba(16,185,129,0.06)", shadowCompact: "0 1px 4px rgba(16,185,129,0.04)",
      shadowLg: "0 20px 40px -10px rgba(16,185,129,0.1)", shadowLgCompact: "0 2px 8px rgba(16,185,129,0.04)",
      hoverShadow: "0 25px 50px -12px rgba(16,185,129,0.2)",
      cardHoverShadow: "0 8px 24px rgba(16,185,129,0.1)", modalShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", toggleBg: "#14532d",
      headerBorderBottom: "2px solid rgba(251,191,36,0.3)",
      bgPattern: "radial-gradient(ellipse at 30% 80%, rgba(16,185,129,0.05) 0%, transparent 50%)",
    },
    // --- 4 NEW ADVANCED THEMES ---
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
  };

  if (themeName === "auto") return palettes[autoIsDark ? "dark" : "light"];
  return palettes[themeName] || palettes.light;
};

if (typeof document !== 'undefined') {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Gabarito:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=League+Spartan:wght@300;400;500;600;700;800;900&family=Open+Sans:wght@300;400;500;600;700&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

const normalizeCardType = (type) => { if (!type) return "UNKNOWN"; const n = type.toString().trim().toUpperCase(); if (n.includes("VISA") && n.includes("DEBIT")) return "VISA DEBIT"; if (n.includes("VISA") && n.includes("CREDIT")) return "VISA CREDIT"; if (n.includes("AMEX")) return "AMEX"; if (n.includes("SELLER")) return "SELLER"; if (n.includes("MASTERCARD")) return "MASTERCARD"; return n; };
const cardTypeColors = { "VISA DEBIT": "#3b82f6", "VISA CREDIT": "#10b981", AMEX: "#8b5cf6", SELLER: "#64748b", MASTERCARD: "#f59e0b", UNKNOWN: "#94a3b8" };
const getCardTypeColor = (type) => cardTypeColors[normalizeCardType(type)] || cardTypeColors["UNKNOWN"];

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
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [viewMode, setViewMode] = useState("table");
  const [viewStyle, setViewStyle] = useState(() => localStorage.getItem("viewStyle") || "normal");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredStat, setHoveredStat] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFont, setSelectedFont] = useState(() => localStorage.getItem("font") || "Poppins");
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem("fontSize")) || 20);
  const [boldText, setBoldText] = useState(() => localStorage.getItem("boldText") === "true");

  const c = getThemeColors(theme);
  const L = getThemeLayout(theme);
  const isCompact = viewStyle === "compact";
  const headingFont = '"Gabarito", sans-serif';
  const bw = boldText ? "600" : "400";
  const bwm = boldText ? "700" : "500";
  const bws = boldText ? "800" : "600";
  const r = isCompact ? c.radiusCompact : c.radius;
  const rSm = isCompact ? c.radiusCompactSm : c.radiusSm;

  const isBrut = theme === "brutalist";
  const isTerm = theme === "terminal";
  const isGlass = theme === "glass";
  const isMid = theme === "midnight";

  const font = selectedFont;

  useEffect(() => { localStorage.setItem("theme", theme); }, [theme]);
  useEffect(() => { localStorage.setItem("font", selectedFont); }, [selectedFont]);
  useEffect(() => { localStorage.setItem("fontSize", fontSize.toString()); }, [fontSize]);
  useEffect(() => { localStorage.setItem("viewStyle", viewStyle); }, [viewStyle]);
  useEffect(() => { localStorage.setItem("boldText", boldText.toString()); }, [boldText]);

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
    const nd = data.map((t) => ({ ...t, cardType: normalizeCardType(t.cardType) }));
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
    setStats({ totalCost: tc, totalGrossProfit: tgp, totalNetProfit: tnp, totalUsdtSold: tus, totalDollarUsed: tdu, avgNetProfit: txns.length > 0 ? tnp / txns.length : 0, ownerStats: os, cardTypeStats: cts });
  };
  const getCardById = (id) => cards.find((x) => x.id === id);
  const getOwnerById = (id) => owners.find((o) => o.id === id);
  const filteredTransactions = transactions.filter((t) => { const cd = getCardById(t.cardId); if (filterCardType !== "all" && cd?.type !== filterCardType) return false; if (filterOwner !== "all" && t.ownerId !== parseInt(filterOwner)) return false; return true; });
  const cardTypes = ["VISA DEBIT", "VISA CREDIT", "AMEX", "SELLER", "MASTERCARD"];

  // -- Shared styles --
  const cardBase = { backgroundColor: c.surface, borderRadius: r, padding: isCompact ? "1rem" : "2rem", boxShadow: c.cardGlow ? `${c.shadow}, ${c.cardGlow}` : c.shadow, marginBottom: isCompact ? "1rem" : "2rem", border: isBrut ? `3px solid ${c.border}` : `1px solid ${c.border}`, ...(c.cardBackdrop ? { backdropFilter: c.cardBackdrop, WebkitBackdropFilter: c.cardBackdrop } : {}), transition: "all 0.3s ease", animation: "fadeIn 0.5s ease-out" };
  const thStyle = { padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: bws, color: c.textSec, backgroundColor: c.surfaceAlt, borderBottom: isBrut ? `3px solid ${c.border}` : `1px solid ${c.border}`, textTransform: isBrut ? "uppercase" : "none", letterSpacing: isBrut ? "0.1em" : "normal" };
  const tdStyle = { padding: "0.75rem 1rem", fontSize: "0.875rem", borderBottom: isBrut ? `2px solid ${c.border}` : isTerm ? `1px dashed ${c.border}` : `1px solid ${c.border}`, color: c.text, backgroundColor: c.surface };
  const sectionTitleStyle = { fontSize: isCompact ? "1.125rem" : "1.5rem", fontFamily: headingFont, fontWeight: "800", marginBottom: isCompact ? "1rem" : "1.5rem", display: "flex", alignItems: "center", gap: isCompact ? "0.5rem" : "0.75rem", color: c.textStrong, textTransform: isBrut ? "uppercase" : "none", letterSpacing: isBrut ? "0.05em" : "normal" };

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
    <div style={{ minHeight: "100vh", backgroundColor: c.bg, backgroundImage: c.bgPattern || "none", fontFamily: `"${font}", sans-serif`, fontSize: `${fontSize}px`, fontWeight: bw, position: "relative", transition: "background-color 0.3s ease" }}>

      {isTerm && <div className="terminal-scanline"></div>}
      {isMid && <div className="midnight-stars"></div>}

      {/* HEADER */}
      <div style={{ backgroundColor: isGlass ? "rgba(255,255,255,0.04)" : c.surface, boxShadow: c.shadow, borderBottom: c.headerBorderBottom || `1px solid ${c.border}`, padding: "1.5rem 1rem", ...(isGlass ? { backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" } : {}), position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 key={theme} style={{ fontSize: isBrut ? "3rem" : "2.5rem", fontFamily: headingFont, fontWeight: isBrut ? "900" : "800", background: c.titleGrad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", color: "transparent", display: "inline-block", width: "fit-content", margin: 0, textTransform: isBrut ? "uppercase" : "none", letterSpacing: isBrut ? "0.05em" : "normal" }}>Sales Dashboard</h1>
            <p style={{ fontSize: "0.875rem", color: c.textSec, marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }} className={isTerm ? "terminal-glow" : ""}>
              {isTerm ? "> " : ""}{lastSync ? `Last updated: ${lastSync.toLocaleTimeString()}` : "Real-time data from Google Sheets"}
              <button onClick={() => setShowSettings(true)} style={{ padding: "0.5rem", borderRadius: isBrut ? "0" : "0.5rem", border: isBrut ? `2px solid ${c.border}` : `1px solid ${c.border}`, backgroundColor: c.inputBg, color: c.text, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", marginLeft: "0.5rem" }} title="Settings"><Settings size={16} /></button>
            </p>
          </div>
          <button onClick={fetchFromGoogleSheets} style={{ padding: "0.625rem 1.25rem", borderRadius: isBrut ? "0" : "0.5rem", border: isBrut ? "3px solid #000" : "none", cursor: loading ? "not-allowed" : "pointer", fontSize: "0.875rem", fontWeight: bws, display: "inline-flex", alignItems: "center", gap: "0.5rem", background: c.btnGrad, color: isBrut ? "#fff" : "#ffffff", opacity: loading ? 0.7 : 1, boxShadow: isBrut ? "4px 4px 0 #000" : `0 4px 15px ${c.btnGlow}` }} disabled={loading}>
            <RefreshCw size={18} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ backgroundColor: isGlass ? "rgba(255,255,255,0.02)" : c.surface, borderBottom: isBrut ? `3px solid ${c.border}` : `1px solid ${c.border}`, ...(isGlass ? { backdropFilter: "blur(12px)" } : {}), position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1rem" }}>
          <nav style={{ display: "flex", gap: isBrut ? "0" : "2rem" }}>
            {["dashboard", "transactions", "monthly"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: isBrut ? "1rem 1.5rem" : "1rem 0.25rem", border: "none",
                borderBottom: activeTab === tab ? (isBrut ? `4px solid ${c.accent}` : `2px solid ${c.accent}`) : (isBrut ? "4px solid transparent" : "2px solid transparent"),
                backgroundColor: isBrut && activeTab === tab ? c.accentBg : "transparent",
                fontSize: "0.875rem", fontWeight: bwm, cursor: "pointer", color: activeTab === tab ? c.accent : c.textSec,
                textTransform: isBrut ? "uppercase" : "none", letterSpacing: isBrut ? "0.1em" : "normal",
                transform: activeTab === tab && !isBrut ? "translateY(-2px)" : "none",
              }} className={isTerm && activeTab === tab ? "terminal-glow" : ""}>
                {isTerm ? `[${tab.toUpperCase()}]` : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "2rem 1rem", animation: "fadeIn 0.4s ease-in", position: "relative", zIndex: 5 }}>
        {error && <div style={{ padding: "1rem", backgroundColor: c.errorBg, border: `1px solid ${c.errorBorder}`, borderRadius: r, color: c.errorText, marginBottom: "2rem", textAlign: "center", animation: "shake 0.5s ease-in-out" }}><strong>Error:</strong> {error}</div>}

        {/* ===== DASHBOARD TAB ===== */}
        {activeTab === "dashboard" && (
          <div>
            {/* STAT CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: isCompact ? `repeat(auto-fit, minmax(${L.statGridMinSm}, 1fr))` : `repeat(auto-fit, minmax(${L.statGridMin}, 1fr))`, gap: isCompact ? "0.75rem" : (isBrut ? "0" : "1.5rem"), marginBottom: isCompact ? "1rem" : "2rem" }}>
              {[
                { label: "Net Profit", value: stats.totalNetProfit, icon: TrendingUp, color: "Green", sub: "After costs" },
                { label: "Total USDT Sold", value: stats.totalUsdtSold, icon: DollarSign, color: "Teal", sub: "Total sell amount" },
                { label: "Gross Profit", value: stats.totalGrossProfit, icon: TrendingUp, color: "Orange", sub: "Total revenue" },
                { label: "Total Cost", value: stats.totalCost, icon: DollarSign, color: "Blue", count: transactions.length },
                { label: "Dollar Used", value: stats.totalDollarUsed, icon: DollarSign, color: "Pink", sub: "Total buy amount" },
                { label: "Average Profit", value: stats.avgNetProfit, icon: TrendingUp, color: "Purple", sub: "Per transaction" },
              ].map((stat, idx) => {
                const sc = c.statCards[stat.color] || {};
                const txtColor = sc.text || null;
                const iconSz = isCompact ? L.statIconSizeSm : L.statIconSize;
                const isRow = L.statCardDir === "row";
                return (
                  <div key={idx} style={{
                    padding: isCompact ? "0.875rem" : (isBrut ? "1.5rem" : "2rem"),
                    borderRadius: isBrut ? "0" : r, color: txtColor || "#ffffff",
                    background: sc.bg, border: sc.border || (isBrut ? "3px solid #000" : "none"),
                    boxShadow: isBrut ? "4px 4px 0 #000" : (isCompact ? c.shadowLgCompact : c.shadowLg),
                    ...(isGlass ? { backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" } : {}),
                    cursor: "pointer", animation: "slideUp 0.5s ease-out", animationDelay: `${idx * 0.1}s`,
                    display: isRow ? "flex" : "block", alignItems: isRow ? "center" : undefined, gap: isRow ? "1.25rem" : undefined,
                    transform: hoveredStat === idx ? (isBrut ? "translate(-2px,-2px)" : "translateY(-8px)") : "none",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    ...(isBrut && hoveredStat === idx ? { boxShadow: "8px 8px 0 #000" } : {}),
                    ...(isBrut ? { marginBottom: "0.5rem" } : {}),
                  }}
                    onMouseEnter={() => setHoveredStat(idx)} onMouseLeave={() => setHoveredStat(null)}>
                    {isRow ? (
                      <>
                        <StatIcon Icon={stat.icon} size={iconSz} layout={L} c={c} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: isCompact ? "0.75rem" : "0.875rem", opacity: 0.9, fontWeight: bws, color: txtColor || undefined, marginBottom: "0.25rem" }}>{isTerm ? `> ${stat.label}` : stat.label}</div>
                          <div style={{ fontSize: isCompact ? "1.5rem" : "2rem", fontWeight: "700", color: txtColor || undefined }} className={isTerm ? "terminal-glow" : ""}>${stat.value?.toFixed(2) || 0}</div>
                          <div style={{ fontSize: "0.75rem", opacity: 0.7, color: txtColor || undefined }}>{stat.count ? `${stat.count} transactions` : stat.sub}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        {isMid && L.statIconBg && <div style={{ display: "flex", justifyContent: "center" }}><StatIcon Icon={stat.icon} size={iconSz} layout={L} c={c} /></div>}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isCompact ? "0.5rem" : "1rem" }}>
                          <div style={{ fontSize: isCompact ? "0.75rem" : "1rem", opacity: 0.9, fontWeight: bws, color: txtColor || undefined, textTransform: isBrut ? "uppercase" : "none", letterSpacing: isBrut ? "0.05em" : "normal" }}>{stat.label}</div>
                          {!isMid && <StatIcon Icon={stat.icon} size={iconSz} layout={L} c={c} />}
                        </div>
                        <div style={{ fontSize: isCompact ? "1.5rem" : "2.7rem", fontWeight: "700", color: txtColor || undefined, textAlign: isMid ? "center" : undefined }} className={isTerm ? "terminal-glow" : ""}>${stat.value?.toFixed(2) || 0}</div>
                        <div style={{ fontSize: isCompact ? "0.6875rem" : "0.875rem", opacity: 0.8, marginTop: "0.5rem", color: txtColor || undefined, textAlign: isMid ? "center" : undefined }}>{stat.count ? `${stat.count} transactions` : stat.sub}</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* OWNER PERFORMANCE */}
            {!loading && (
              <>
                <div style={cardBase}>
                  <h2 style={sectionTitleStyle}><User size={isCompact ? 20 : 24} /> Owner Performance</h2>
                  <div style={{ display: L.ownerLayout === "horizontal" ? "flex" : "grid", flexDirection: L.ownerLayout === "horizontal" ? "column" : undefined, gap: isCompact ? "1rem" : "1.5rem" }}>
                    {owners.map((o) => {
                      const os = stats.ownerStats?.[o.id] || { count: 0, totalCost: 0, totalGrossProfit: 0, totalNetProfit: 0 };
                      return (
                        <div key={o.id} style={{ padding: isCompact ? "1rem" : "1.5rem", backgroundColor: c.surfaceAlt, borderRadius: rSm, border: isBrut ? `2px solid ${c.border}` : `1px solid ${c.border}`, ...(isBrut ? { boxShadow: "3px 3px 0 #000" } : {}), ...(isGlass ? { backdropFilter: "blur(12px)" } : {}) }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isCompact ? "0.625rem" : "1rem" }}>
                            <span style={{ fontFamily: headingFont, fontWeight: "800", fontSize: isCompact ? "1rem" : "1.25rem", color: c.textStrong, textTransform: isBrut ? "uppercase" : "none" }} className={isTerm ? "terminal-glow" : ""}>{isTerm ? `> ${o.name}` : o.name}</span>
                            <span style={{ fontSize: isCompact ? "0.75rem" : "0.875rem", color: c.textSec, backgroundColor: c.surface, padding: "0.25rem 0.75rem", borderRadius: isBrut ? "0" : "0.5rem", fontWeight: bws, border: isBrut ? "1px solid #000" : "none" }}>{os.count} transactions</span>
                          </div>
                          <div style={{ display: L.ownerLayout === "horizontal" ? "flex" : "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: isCompact ? "0.625rem" : "1rem" }}>
                            {[{ label: "COST", value: os.totalCost, color: "#3b82f6" }, { label: "GROSS", value: os.totalGrossProfit, color: "#f97316" }, { label: "NET PROFIT", value: os.totalNetProfit, color: "#16a34a" }].map((s) => (
                              <div key={s.label} style={{ textAlign: "center", padding: isCompact ? "0.625rem" : "1rem", backgroundColor: c.surface, borderRadius: isBrut ? "0" : rSm, flex: L.ownerLayout === "horizontal" ? 1 : undefined, border: isBrut ? "1px solid #000" : "none" }}>
                                <div style={{ fontSize: isCompact ? "0.6875rem" : "0.75rem", color: c.textSec, marginBottom: "0.25rem", fontWeight: bws, textTransform: isBrut ? "uppercase" : "none", letterSpacing: isBrut ? "0.05em" : "normal" }}>{s.label}</div>
                                <div style={{ fontSize: isCompact ? "1.125rem" : "1.5rem", fontWeight: "700", color: isTerm ? c.text : s.color }} className={isTerm ? "terminal-glow" : ""}>${s.value.toFixed(2)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CARD TYPE STATS */}
                <div style={cardBase}>
                  <h2 style={{ ...sectionTitleStyle, marginBottom: isCompact ? "1rem" : "1.5rem" }}>Card Type Statistics</h2>
                  <div style={{ display: L.cardTypeLayout === "list" ? "flex" : "grid", flexDirection: L.cardTypeLayout === "list" ? "column" : undefined, gridTemplateColumns: isCompact ? "repeat(auto-fit, minmax(180px, 1fr))" : "repeat(auto-fit, minmax(240px, 1fr))", gap: L.cardTypeLayout === "list" ? "0.5rem" : (isCompact ? "0.75rem" : "1.5rem") }}>
                    {Object.entries(stats.cardTypeStats || {}).map(([type, data], idx) => (
                      <div key={type} style={{
                        padding: L.cardTypeLayout === "list" ? "1rem" : (isCompact ? "1rem" : "1.5rem"),
                        border: isBrut ? `2px solid ${c.border}` : `${isCompact ? "1px" : "2px"} solid ${c.border}`,
                        borderRadius: rSm, backgroundColor: c.surfaceAlt, cursor: "pointer",
                        display: L.cardTypeLayout === "list" ? "flex" : "block", alignItems: "center", justifyContent: "space-between",
                        ...(isBrut ? { boxShadow: "3px 3px 0 #000" } : {}),
                        ...(hoveredCard === idx ? { borderColor: c.accent, transform: L.cardTypeLayout === "list" ? "none" : "scale(1.05)" } : {}),
                        transition: "all 0.3s ease, transform 0.2s ease",
                      }} onMouseEnter={() => setHoveredCard(idx)} onMouseLeave={() => setHoveredCard(null)}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: L.cardTypeLayout === "list" ? "0" : (isCompact ? "0.625rem" : "1rem") }}>
                          <div style={{ width: isBrut ? "16px" : "14px", height: isBrut ? "16px" : "14px", borderRadius: isBrut ? "0" : "50%", backgroundColor: getCardTypeColor(type), flexShrink: 0, border: isBrut ? "2px solid #000" : "none" }}></div>
                          <span style={{ fontFamily: headingFont, fontWeight: "800", fontSize: isCompact ? "0.9375rem" : "1.125rem", color: c.textStrong, textTransform: isBrut ? "uppercase" : "none" }} className={isTerm ? "terminal-glow" : ""}>{type}</span>
                          {L.cardTypeLayout === "list" && <span style={{ fontSize: "0.8125rem", color: c.textSec, marginLeft: "0.5rem" }}>({data.count})</span>}
                        </div>
                        {L.cardTypeLayout !== "list" && <div style={{ fontSize: isCompact ? "0.75rem" : "0.875rem", color: c.textSec, marginBottom: "0.5rem" }}>{data.count} transactions</div>}
                        <div style={{ fontSize: L.cardTypeLayout === "list" ? "1.25rem" : (isCompact ? "1.25rem" : "1.75rem"), fontWeight: "700", color: isTerm ? c.text : "#16a34a" }} className={isTerm ? "terminal-glow" : ""}>${data.netProfit.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== TRANSACTIONS TAB ===== */}
        {activeTab === "transactions" && (
          <div>
            <div style={{ ...cardBase, marginBottom: "1rem" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><Filter size={16} style={{ color: c.textSec }} /><span style={{ fontSize: "0.875rem", fontWeight: bwm, color: c.text, textTransform: isBrut ? "uppercase" : "none" }}>{isTerm ? "> Filters:" : "Filters:"}</span></div>
                  {[{ val: filterCardType, set: setFilterCardType, opts: [{ v: "all", l: "All Card Types" }, ...cardTypes.map((t) => ({ v: t, l: t }))] }, { val: filterOwner, set: setFilterOwner, opts: [{ v: "all", l: "All Owners" }, ...owners.map((o) => ({ v: o.id, l: o.name }))] }].map((f, i) => (
                    <select key={i} style={{ padding: "0.5rem 0.75rem", border: isBrut ? `2px solid ${c.border}` : `1px solid ${c.inputBorder}`, borderRadius: isBrut ? "0" : "0.25rem", fontSize: "0.875rem", minWidth: "150px", backgroundColor: c.inputBg, color: c.text }} value={f.val} onChange={(e) => f.set(e.target.value)}>
                      {f.opts.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {[{ m: "table", icon: List, label: "Table" }, { m: "cards", icon: LayoutGrid, label: "Cards" }].map(({ m, icon: Ic, label }) => (
                    <button key={m} onClick={() => setViewMode(m)} style={{ padding: "0.5rem 1rem", borderRadius: isBrut ? "0" : "0.5rem", border: isBrut ? `2px solid ${c.border}` : `1px solid ${c.border}`, backgroundColor: viewMode === m ? c.accent : c.inputBg, color: viewMode === m ? "#fff" : c.text, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: bwm, ...(isBrut && viewMode === m ? { boxShadow: "3px 3px 0 #000" } : {}) }}><Ic size={16} /> {label}</button>
                  ))}
                </div>
              </div>
            </div>

            {viewMode === "table" ? (
              <div style={cardBase}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: isBrut ? "separate" : "collapse", borderSpacing: isBrut ? "0 2px" : "0" }}>
                    <thead><tr>
                      {["Card Type", "Card No.", "Owner"].map((h) => <th key={h} style={thStyle}>{h}</th>)}
                      {["Buy Rate", "Buy Amount", "Sell Rate", "Sell Amount", "Cost", "Gross Profit", "Net Profit", "Margin"].map((h) => <th key={h} style={{ ...thStyle, textAlign: "right" }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {filteredTransactions.map((t) => {
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
                      <tr style={{ backgroundColor: c.surfaceAlt, fontWeight: "700", borderTop: `2px solid ${c.borderStrong}` }}>
                        <td colSpan="2" style={{ ...tdStyle, fontWeight: "700", fontSize: "0.875rem", color: c.textStrong, textTransform: isBrut ? "uppercase" : "none" }}>TOTALS</td>
                        <td colSpan="2" style={{ ...tdStyle, textAlign: "center", fontSize: "0.8125rem", color: c.textMid }}><div>Sell Amt:</div><div style={{ fontWeight: "700", color: c.textStrong }}>${filteredTransactions.reduce((s, t) => s + (parseFloat(t.sellAmount) || 0), 0).toFixed(2)}</div></td>
                        <td style={{ ...tdStyle, textAlign: "center", fontSize: "0.8125rem", color: c.textMid }}><div>Avg Sell:</div><div style={{ fontWeight: "700", color: c.textStrong }}>{filteredTransactions.length > 0 ? (filteredTransactions.reduce((s, t) => s + (parseFloat(t.sellRate) || 0), 0) / filteredTransactions.length).toFixed(2) : "0.00"}</div></td>
                        <td style={{ ...tdStyle, textAlign: "center", fontSize: "0.8125rem", color: c.textMid }}><div>Avg Buy:</div><div style={{ fontWeight: "700", color: c.textStrong }}>{(() => { const tc2 = filteredTransactions.reduce((s, t) => s + (parseFloat(t.cost) || 0), 0); const ts2 = filteredTransactions.reduce((s, t) => s + (parseFloat(t.sellAmount) || 0), 0); return (ts2 > 0 ? tc2 / ts2 : 0).toFixed(2); })()}</div></td>
                        <td colSpan="2" style={tdStyle}></td>
                        <td style={{ ...tdStyle, textAlign: "center", fontSize: "0.8125rem" }}><div>Gross:</div><div style={{ color: isTerm ? c.text : "#f97316", fontWeight: "700" }}>${filteredTransactions.reduce((s, t) => s + t.grossProfit, 0).toFixed(2)}</div></td>
                        <td style={{ ...tdStyle, textAlign: "center", fontSize: "0.8125rem" }}><div>Net:</div><div style={{ color: isTerm ? c.text : "#16a34a", fontWeight: "700" }} className={isTerm ? "terminal-glow" : ""}>${filteredTransactions.reduce((s, t) => s + t.netProfit, 0).toFixed(2)}</div></td>
                        <td style={tdStyle}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "1rem" }}>
                {filteredTransactions.map((t, idx) => {
                  const cd = getCardById(t.cardId); const ow = getOwnerById(t.ownerId); const cc = getCardTypeColor(cd?.type); const mb = getProfitMarginBadge(t.profitMargin);
                  return (
                    <div key={t.id} style={{ backgroundColor: c.surface, borderRadius: rSm, padding: "1.5rem", border: isBrut ? `3px solid ${c.border}` : `1px solid ${c.border}`, ...(isGlass ? { backdropFilter: "blur(16px)" } : {}), ...(isBrut ? { boxShadow: "4px 4px 0 #000" } : {}), cursor: "pointer", animation: "slideUp 0.4s ease-out", transform: hoveredCard === `tx-${idx}` ? "translateY(-4px)" : "none", boxShadow: hoveredCard === `tx-${idx}` ? c.cardHoverShadow : (c.cardGlow || "none"), transition: "all 0.3s ease" }}
                      onMouseEnter={() => setHoveredCard(`tx-${idx}`)} onMouseLeave={() => setHoveredCard(null)}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ width: "16px", height: "16px", borderRadius: isBrut ? "0" : "50%", backgroundColor: cc, flexShrink: 0 }}></div>
                          <div><div style={{ fontWeight: "700", fontSize: "1.125rem", color: c.textStrong }}>{cd?.type || "UNKNOWN"}</div><div style={{ fontSize: "0.875rem", color: c.textSec }}>Card #{cd?.number || "-"}</div></div>
                        </div>
                        <span style={mb.style}>{t.profitMargin.toFixed(1)}%</span>
                      </div>
                      <div style={{ marginBottom: "1rem" }}><div style={{ fontSize: "0.875rem", color: c.textSec }}>Owner</div><div style={{ fontWeight: bws, color: c.text }}>{ow?.name}</div></div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                        <div><div style={{ fontSize: "0.75rem", color: c.textSec }}>Buy</div><div style={{ fontWeight: bws, color: c.text }}>{parseFloat(t.buyRate).toFixed(2)} × ${parseFloat(t.buyAmount).toFixed(0)}</div></div>
                        <div><div style={{ fontSize: "0.75rem", color: c.textSec }}>Sell</div><div style={{ fontWeight: bws, color: c.text }}>{parseFloat(t.sellRate).toFixed(2)} × ${parseFloat(t.sellAmount).toFixed(0)}</div></div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", paddingTop: "1rem", borderTop: `1px solid ${c.border}` }}>
                        {[{ l: "Cost", v: t.cost, cl: "#3b82f6" }, { l: "Gross", v: t.grossProfit, cl: "#f97316" }, { l: "Net", v: t.netProfit, cl: "#16a34a" }].map((x) => (
                          <div key={x.l}><div style={{ fontSize: "0.75rem", color: c.textSec }}>{x.l}</div><div style={{ fontWeight: "700", color: isTerm ? c.text : x.cl }}>${x.v.toFixed(0)}</div></div>
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
                <div style={{ padding: isCompact ? "1.5rem" : "2.5rem", borderRadius: isBrut ? "0" : r, background: c.profitGrad, color: "#ffffff", maxWidth: isCompact ? "400px" : "500px", margin: "0 auto", textAlign: "center", animation: "slideUp 0.5s ease-out", border: isBrut ? "3px solid #000" : "none", boxShadow: isBrut ? "6px 6px 0 #000" : c.shadowLg, ...(isGlass ? { backdropFilter: "blur(16px)" } : {}) }}>
                  <div style={{ fontSize: isCompact ? "0.9375rem" : "1.125rem", opacity: 0.9, fontWeight: bws }} className={isTerm ? "terminal-glow" : ""}>{isTerm ? "> ALL TIME PROFIT" : "All Time Profit"}</div>
                  <div style={{ fontSize: isCompact ? "2.5rem" : "3.5rem", fontWeight: "700", margin: "0.5rem 0" }} className={isTerm ? "terminal-glow" : ""}>${monthly.reduce((s, m) => s + m.profit, 0).toFixed(2)}</div>
                  <div style={{ fontSize: isCompact ? "0.8125rem" : "0.9375rem", opacity: 0.85 }}>Total from {monthly.length} months</div>
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
                          <td style={{ ...tdStyle, fontWeight: bws, fontSize: "1rem" }} className={isTerm ? "terminal-glow" : ""}>{isTerm ? `> ${m.month}` : m.month}</td>
                          <td style={{ ...tdStyle, textAlign: "right", color: isTerm ? c.text : "#16a34a", fontWeight: "700", fontSize: "1.125rem" }} className={isTerm ? "terminal-glow" : ""}>${m.profit.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr style={{ backgroundColor: c.surfaceAlt, fontWeight: "700", borderTop: `2px solid ${c.borderStrong}` }}>
                      <td style={{ ...tdStyle, fontWeight: "700", fontSize: "1rem", color: c.textStrong }}>TOTAL</td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: "700", color: isTerm ? c.text : "#16a34a", fontSize: "1.25rem" }} className={isTerm ? "terminal-glow" : ""}>${monthly.reduce((s, m) => s + m.profit, 0).toFixed(2)}</td>
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
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 200, animation: "fadeIn 0.2s ease-out" }} onClick={() => setShowSettings(false)}>
          <div style={{ backgroundColor: isGlass ? "rgba(20,14,48,0.95)" : c.surface, borderRadius: isBrut ? "0" : "1rem", padding: "2rem", maxWidth: "560px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: c.modalShadow, animation: "slideUp 0.3s ease-out", border: isBrut ? `3px solid ${c.border}` : `1px solid ${c.border}`, ...(isGlass ? { backdropFilter: "blur(24px)" } : {}) }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", paddingBottom: "1rem", borderBottom: `1px solid ${c.border}` }}>
              <h2 style={{ fontSize: "1.5rem", fontFamily: headingFont, fontWeight: "800", color: c.textStrong, margin: 0, display: "flex", alignItems: "center", gap: "0.75rem" }}><Settings size={24} /> Settings</h2>
              <button onClick={() => setShowSettings(false)} style={{ padding: "0.5rem", border: "none", background: "none", cursor: "pointer", color: c.textSec, display: "flex", alignItems: "center" }}><X size={24} /></button>
            </div>

            {/* Theme */}
            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: bws, marginBottom: "0.75rem", color: c.text }}>Theme</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "0.5rem" }}>
                {THEME_OPTIONS.map((opt) => (
                  <div key={opt.key} onClick={() => setTheme(opt.key)} style={{ padding: "0.5rem", border: theme === opt.key ? `2px solid ${c.accent}` : `2px solid ${c.border}`, borderRadius: isBrut ? "0" : "0.625rem", backgroundColor: theme === opt.key ? c.accentBg : c.surfaceAlt, cursor: "pointer", textAlign: "center", transition: "all 0.2s ease" }}>
                    <div style={{ display: "flex", height: "24px", borderRadius: isBrut ? "0" : "4px", overflow: "hidden", marginBottom: "0.375rem", border: `1px solid ${c.border}` }}>
                      {opt.preview.map((color, i) => <div key={i} style={{ flex: 1, background: color }}></div>)}
                    </div>
                    <div style={{ fontSize: "0.6875rem", fontWeight: "600", color: theme === opt.key ? c.accent : c.text }}>{opt.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* View Style */}
            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: bws, marginBottom: "0.75rem", color: c.text }}>View Style</label>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {[{ k: "normal", i: LayoutGrid, l: "Normal", d: "Large cards" }, { k: "compact", i: List, l: "Compact", d: "Dense layout" }].map((o) => (
                  <div key={o.k} onClick={() => setViewStyle(o.k)} style={{ flex: 1, padding: "0.75rem", border: viewStyle === o.k ? `2px solid ${c.accent}` : `2px solid ${c.border}`, borderRadius: isBrut ? "0" : "0.75rem", backgroundColor: viewStyle === o.k ? c.accentBg : c.surfaceAlt, cursor: "pointer", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", color: viewStyle === o.k ? c.accent : c.text }}>
                    <o.i size={24} /><span>{o.l}</span><div style={{ fontSize: "0.6875rem", opacity: 0.7 }}>{o.d}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Font */}
            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: bws, marginBottom: "0.75rem", color: c.text }}>Font Style</label>
              <select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} style={{ padding: "0.75rem", border: `1px solid ${c.inputBorder}`, borderRadius: isBrut ? "0" : "0.5rem", fontSize: "0.9375rem", width: "100%", backgroundColor: c.inputBg, color: c.text, cursor: "pointer" }}>
                {FONTS.map((f) => <option key={f.value} value={f.value}>{f.name}</option>)}
              </select>
            </div>

            {/* Font Size */}
            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: bws, marginBottom: "0.75rem", color: c.text }}>Font Size</label>
              <input type="range" min="12" max="20" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} style={{ width: "100%", height: "8px", borderRadius: "4px", background: c.toggleBg, outline: "none" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontSize: "0.875rem", color: c.textSec }}>
                <span>Small (12px)</span><span style={{ fontSize: "1.125rem", fontWeight: "700", color: c.textStrong }}>{fontSize}px</span><span>Large (20px)</span>
              </div>
            </div>

            {/* Bold Text */}
            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: bws, marginBottom: "0.75rem", color: c.text }}>Text Weight</label>
              <div onClick={() => setBoldText(!boldText)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", border: boldText ? `2px solid ${c.accent}` : `2px solid ${c.border}`, borderRadius: isBrut ? "0" : "0.75rem", backgroundColor: boldText ? c.accentBg : c.surfaceAlt, cursor: "pointer" }}>
                <div>
                  <div style={{ fontWeight: boldText ? "700" : "600", fontSize: "0.9375rem", color: c.textStrong }}>Bold Text</div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "0.25rem", color: c.textSec }}>Increase font weight across the UI</div>
                </div>
                <div style={{ width: "44px", height: "24px", borderRadius: "12px", backgroundColor: boldText ? c.accent : c.toggleBg, position: "relative", flexShrink: 0 }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#ffffff", position: "absolute", top: "2px", left: boldText ? "22px" : "2px", transition: "left 0.3s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        *, *::before, *::after { font-family: inherit; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25%, 75% { transform: translateX(-5px); } 50% { transform: translateX(5px); } }
        ${L.extraCss}
      `}</style>
    </div>
  );
}

export default App;