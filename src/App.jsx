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
  Sparkles,
  Settings,
  X,
  Calendar,
} from "lucide-react";

// Google Sheets Configuration
const GOOGLE_SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbxVwc0buJoICP6sIzK6GxmZNtdvdYA4lw7MhmMxxYjI2weRxDReGIK4sbKyKESUPhEUHQ/exec";

// Available fonts
const FONTS = [
  { name: "Inter", value: "Inter" },
  { name: "Poppins", value: "Poppins" },
  { name: "League Spartan", value: "League Spartan" },
  { name: "Open Sans", value: "Open Sans" },
];

// Theme UI options for settings
const THEME_OPTIONS = [
  { key: "light", label: "Light", preview: ["#ffffff", "#667eea", "#84fab0", "#f3f4f6"] },
  { key: "dark", label: "Dark", preview: ["#1e293b", "#667eea", "#84fab0", "#0f172a"] },
  { key: "auto", label: "Auto", preview: ["#94a3b8", "#667eea", "#84fab0", "#64748b"] },
  { key: "ocean", label: "Ocean", preview: ["#0c1929", "#06b6d4", "#0ea5e9", "#155e75"] },
  { key: "sunset", label: "Sunset", preview: ["#fff7ed", "#f97316", "#e11d48", "#fbbf24"] },
  { key: "neon", label: "Neon", preview: ["#0a0a0a", "#d946ef", "#06b6d4", "#22d3ee"] },
  { key: "emerald", label: "Emerald", preview: ["#072116", "#10b981", "#fbbf24", "#065f46"] },
];

// Complete theme color palettes
const getThemeColors = (themeName) => {
  const autoIsDark = typeof window !== 'undefined' && window.matchMedia("(prefers-color-scheme: dark)").matches;

  const palettes = {
    light: {
      isDark: false,
      bg: "#f3f4f6", bgAlt: "#f8fafc",
      surface: "#ffffff", surfaceAlt: "#f9fafb", surfaceDeep: "#f9fafb",
      text: "#111827", textSec: "#6b7280", textMuted: "#94a3b8", textLight: "#f1f5f9", textMid: "#cbd5e1", textStrong: "#374151",
      border: "#e5e7eb", borderAlt: "#e2e8f0", borderStrong: "#d1d5db", borderHover: "#475569",
      accent: "#2563eb", accentBg: "#dbeafe", accentDark: "#1e3a8a",
      inputBg: "#ffffff", inputBorder: "#e5e7eb",
      titleGrad: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      btnGrad: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      btnGlow: "rgba(102, 126, 234, 0.4)",
      statCards: {
        Green: { bg: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)", text: null },
        Teal: { bg: "linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%)", text: null },
        Orange: { bg: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)", text: "#78350f" },
        Blue: { bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", text: null },
        Pink: { bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", text: null },
        Purple: { bg: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)", text: "#581c87" },
      },
      profitGrad: "linear-gradient(135deg, #16a34a 0%, #059669 100%)",
      errorBg: "#fee2e2", errorBorder: "#ef4444", errorText: "#991b1b",
      badgeGreen: { bg: "#d1fae5", text: "#065f46" },
      badgeYellow: { bg: "#fef3c7", text: "#92400e" },
      badgeRed: { bg: "#fee2e2", text: "#991b1b" },
      radius: "1rem", radiusSm: "0.75rem", radiusCompact: "0.375rem", radiusCompactSm: "0.25rem",
      shadow: "0 1px 3px rgba(0,0,0,0.1)", shadowCompact: "0 1px 2px rgba(0,0,0,0.05)", shadowDark: "0 1px 3px rgba(0,0,0,0.3)",
      shadowLg: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)", shadowLgCompact: "0 1px 3px rgba(0,0,0,0.1)",
      hoverShadow: "0 25px 35px -5px rgba(0,0,0,0.2)",
      cardHoverShadow: "0 8px 16px rgba(0,0,0,0.1)", cardHoverShadowDark: "0 8px 16px rgba(0,0,0,0.3)",
      modalShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
      toggleBg: "#d1d5db",
      headerBorderBottom: null,
      bgPattern: null,
      cardGlow: null,
    },
    dark: {
      isDark: true,
      bg: "#0f172a", bgAlt: "#0f172a",
      surface: "#1e293b", surfaceAlt: "#0f172a", surfaceDeep: "#0f172a",
      text: "#e2e8f0", textSec: "#94a3b8", textMuted: "#94a3b8", textLight: "#f1f5f9", textMid: "#cbd5e1", textStrong: "#f1f5f9",
      border: "#334155", borderAlt: "#334155", borderStrong: "#475569", borderHover: "#475569",
      accent: "#2563eb", accentBg: "#1e3a8a", accentDark: "#1e3a8a",
      inputBg: "#334155", inputBorder: "#475569",
      titleGrad: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      btnGrad: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      btnGlow: "rgba(102, 126, 234, 0.4)",
      statCards: {
        Green: { bg: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)", text: null },
        Teal: { bg: "linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%)", text: null },
        Orange: { bg: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)", text: "#78350f" },
        Blue: { bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", text: null },
        Pink: { bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", text: null },
        Purple: { bg: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)", text: "#581c87" },
      },
      profitGrad: "linear-gradient(135deg, #16a34a 0%, #059669 100%)",
      errorBg: "#450a0a", errorBorder: "#991b1b", errorText: "#fca5a5",
      badgeGreen: { bg: "#064e3b", text: "#6ee7b7" },
      badgeYellow: { bg: "#78350f", text: "#fcd34d" },
      badgeRed: { bg: "#7f1d1d", text: "#fca5a5" },
      radius: "1rem", radiusSm: "0.75rem", radiusCompact: "0.375rem", radiusCompactSm: "0.25rem",
      shadow: "0 1px 3px rgba(0,0,0,0.3)", shadowCompact: "0 1px 2px rgba(0,0,0,0.2)", shadowDark: "0 1px 3px rgba(0,0,0,0.3)",
      shadowLg: "0 20px 25px -5px rgba(0,0,0,0.3), 0 10px 10px -5px rgba(0,0,0,0.2)", shadowLgCompact: "0 1px 3px rgba(0,0,0,0.2)",
      hoverShadow: "0 25px 35px -5px rgba(0,0,0,0.4)",
      cardHoverShadow: "0 8px 16px rgba(0,0,0,0.3)", cardHoverShadowDark: "0 8px 16px rgba(0,0,0,0.3)",
      modalShadow: "0 20px 25px -5px rgba(0,0,0,0.5)",
      toggleBg: "#475569",
      headerBorderBottom: null,
      bgPattern: null,
      cardGlow: null,
    },
    ocean: {
      isDark: true,
      bg: "#0a1628", bgAlt: "#0a1628",
      surface: "#0f2035", surfaceAlt: "#0a1628", surfaceDeep: "#071320",
      text: "#e0f2fe", textSec: "#7dd3fc", textMuted: "#38bdf8", textLight: "#f0f9ff", textMid: "#bae6fd", textStrong: "#f0f9ff",
      border: "#164e63", borderAlt: "#155e75", borderStrong: "#0e7490", borderHover: "#06b6d4",
      accent: "#06b6d4", accentBg: "#164e63", accentDark: "#155e75",
      inputBg: "#132a42", inputBorder: "#164e63",
      titleGrad: "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 50%, #38bdf8 100%)",
      btnGrad: "linear-gradient(135deg, #0891b2 0%, #0284c7 100%)",
      btnGlow: "rgba(6, 182, 212, 0.4)",
      statCards: {
        Green: { bg: "linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)", text: null },
        Teal: { bg: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)", text: null },
        Orange: { bg: "linear-gradient(135deg, #155e75 0%, #0e7490 100%)", text: "#67e8f9" },
        Blue: { bg: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)", text: null },
        Pink: { bg: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)", text: null },
        Purple: { bg: "linear-gradient(135deg, #164e63 0%, #0891b2 100%)", text: "#a5f3fc" },
      },
      profitGrad: "linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)",
      errorBg: "#1c1917", errorBorder: "#dc2626", errorText: "#fca5a5",
      badgeGreen: { bg: "#064e3b", text: "#5eead4" },
      badgeYellow: { bg: "#164e63", text: "#67e8f9" },
      badgeRed: { bg: "#7f1d1d", text: "#fca5a5" },
      radius: "1.25rem", radiusSm: "1rem", radiusCompact: "0.625rem", radiusCompactSm: "0.375rem",
      shadow: "0 2px 8px rgba(6,182,212,0.08)", shadowCompact: "0 1px 4px rgba(6,182,212,0.06)", shadowDark: "0 2px 8px rgba(6,182,212,0.1)",
      shadowLg: "0 20px 40px -10px rgba(6,182,212,0.15), 0 8px 16px -8px rgba(6,182,212,0.1)", shadowLgCompact: "0 2px 8px rgba(6,182,212,0.08)",
      hoverShadow: "0 25px 50px -12px rgba(6,182,212,0.25)",
      cardHoverShadow: "0 8px 24px rgba(6,182,212,0.15)", cardHoverShadowDark: "0 8px 24px rgba(6,182,212,0.15)",
      modalShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
      toggleBg: "#164e63",
      headerBorderBottom: "2px solid rgba(6,182,212,0.3)",
      bgPattern: "radial-gradient(ellipse at 20% 50%, rgba(6,182,212,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(14,165,233,0.04) 0%, transparent 50%)",
      cardGlow: null,
    },
    sunset: {
      isDark: false,
      bg: "#fef7f0", bgAlt: "#fff5eb",
      surface: "#ffffff", surfaceAlt: "#fff5eb", surfaceDeep: "#fff1e6",
      text: "#431407", textSec: "#9a3412", textMuted: "#c2410c", textLight: "#fff7ed", textMid: "#ea580c", textStrong: "#7c2d12",
      border: "#fed7aa", borderAlt: "#fdba74", borderStrong: "#fb923c", borderHover: "#ea580c",
      accent: "#ea580c", accentBg: "#ffedd5", accentDark: "#9a3412",
      inputBg: "#ffffff", inputBorder: "#fed7aa",
      titleGrad: "linear-gradient(135deg, #f97316 0%, #e11d48 50%, #be123c 100%)",
      btnGrad: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
      btnGlow: "rgba(249, 115, 22, 0.4)",
      statCards: {
        Green: { bg: "linear-gradient(135deg, #fbbf24 0%, #f97316 100%)", text: "#451a03" },
        Teal: { bg: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)", text: null },
        Orange: { bg: "linear-gradient(135deg, #fde68a 0%, #fbbf24 100%)", text: "#78350f" },
        Blue: { bg: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)", text: null },
        Pink: { bg: "linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)", text: null },
        Purple: { bg: "linear-gradient(135deg, #fecdd3 0%, #fda4af 100%)", text: "#9f1239" },
      },
      profitGrad: "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)",
      errorBg: "#fef2f2", errorBorder: "#ef4444", errorText: "#991b1b",
      badgeGreen: { bg: "#fef3c7", text: "#92400e" },
      badgeYellow: { bg: "#ffedd5", text: "#9a3412" },
      badgeRed: { bg: "#fee2e2", text: "#991b1b" },
      radius: "1.125rem", radiusSm: "0.875rem", radiusCompact: "0.5rem", radiusCompactSm: "0.25rem",
      shadow: "0 2px 8px rgba(249,115,22,0.08)", shadowCompact: "0 1px 4px rgba(249,115,22,0.06)", shadowDark: "0 2px 8px rgba(0,0,0,0.1)",
      shadowLg: "0 20px 40px -10px rgba(249,115,22,0.12), 0 8px 16px -8px rgba(249,115,22,0.08)", shadowLgCompact: "0 2px 8px rgba(249,115,22,0.06)",
      hoverShadow: "0 25px 50px -12px rgba(249,115,22,0.2)",
      cardHoverShadow: "0 8px 24px rgba(249,115,22,0.12)", cardHoverShadowDark: "0 8px 24px rgba(0,0,0,0.15)",
      modalShadow: "0 25px 50px -12px rgba(249,115,22,0.15)",
      toggleBg: "#fed7aa",
      headerBorderBottom: "3px solid linear-gradient(90deg, #f97316, #e11d48, #fbbf24)",
      bgPattern: "radial-gradient(ellipse at 80% 80%, rgba(251,191,36,0.08) 0%, transparent 50%), radial-gradient(ellipse at 20% 30%, rgba(249,115,22,0.06) 0%, transparent 50%)",
      cardGlow: null,
    },
    neon: {
      isDark: true,
      bg: "#050505", bgAlt: "#050505",
      surface: "#111111", surfaceAlt: "#0a0a0a", surfaceDeep: "#050505",
      text: "#fafafa", textSec: "#a1a1aa", textMuted: "#71717a", textLight: "#fafafa", textMid: "#d4d4d8", textStrong: "#ffffff",
      border: "#27272a", borderAlt: "#27272a", borderStrong: "#3f3f46", borderHover: "#d946ef",
      accent: "#d946ef", accentBg: "#3b0764", accentDark: "#581c87",
      inputBg: "#18181b", inputBorder: "#3f3f46",
      titleGrad: "linear-gradient(135deg, #d946ef 0%, #06b6d4 50%, #22d3ee 100%)",
      btnGrad: "linear-gradient(135deg, #d946ef 0%, #a855f7 100%)",
      btnGlow: "rgba(217, 70, 239, 0.5)",
      statCards: {
        Green: { bg: "linear-gradient(135deg, #059669 0%, #06b6d4 100%)", text: null },
        Teal: { bg: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)", text: null },
        Orange: { bg: "linear-gradient(135deg, #18181b 0%, #27272a 100%)", text: "#fbbf24", border: "1px solid rgba(251,191,36,0.4)" },
        Blue: { bg: "linear-gradient(135deg, #d946ef 0%, #a855f7 100%)", text: null },
        Pink: { bg: "linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)", text: null },
        Purple: { bg: "linear-gradient(135deg, #18181b 0%, #27272a 100%)", text: "#c084fc", border: "1px solid rgba(192,132,252,0.4)" },
      },
      profitGrad: "linear-gradient(135deg, #059669 0%, #06b6d4 100%)",
      errorBg: "#18181b", errorBorder: "#ef4444", errorText: "#fca5a5",
      badgeGreen: { bg: "rgba(16,185,129,0.2)", text: "#34d399" },
      badgeYellow: { bg: "rgba(251,191,36,0.2)", text: "#fbbf24" },
      badgeRed: { bg: "rgba(239,68,68,0.2)", text: "#f87171" },
      radius: "0.5rem", radiusSm: "0.375rem", radiusCompact: "0.25rem", radiusCompactSm: "0.125rem",
      shadow: "0 0 0 1px rgba(63,63,70,0.5)", shadowCompact: "0 0 0 1px rgba(63,63,70,0.3)", shadowDark: "0 0 0 1px rgba(63,63,70,0.5)",
      shadowLg: "0 0 30px rgba(217,70,239,0.1), 0 0 0 1px rgba(63,63,70,0.5)", shadowLgCompact: "0 0 0 1px rgba(63,63,70,0.3)",
      hoverShadow: "0 0 40px rgba(217,70,239,0.2), 0 0 0 1px rgba(217,70,239,0.3)",
      cardHoverShadow: "0 0 20px rgba(217,70,239,0.15)", cardHoverShadowDark: "0 0 20px rgba(217,70,239,0.15)",
      modalShadow: "0 0 50px rgba(217,70,239,0.15), 0 25px 50px rgba(0,0,0,0.5)",
      toggleBg: "#3f3f46",
      headerBorderBottom: "1px solid rgba(217,70,239,0.3)",
      bgPattern: "radial-gradient(ellipse at 50% 0%, rgba(217,70,239,0.05) 0%, transparent 50%), radial-gradient(ellipse at 0% 100%, rgba(6,182,212,0.03) 0%, transparent 50%)",
      cardGlow: "0 0 0 1px rgba(217,70,239,0.15)",
    },
    emerald: {
      isDark: true,
      bg: "#071210", bgAlt: "#071210",
      surface: "#0f1f1b", surfaceAlt: "#071210", surfaceDeep: "#040e0c",
      text: "#d1fae5", textSec: "#6ee7b7", textMuted: "#34d399", textLight: "#ecfdf5", textMid: "#a7f3d0", textStrong: "#ecfdf5",
      border: "#14532d", borderAlt: "#166534", borderStrong: "#15803d", borderHover: "#10b981",
      accent: "#10b981", accentBg: "#064e3b", accentDark: "#065f46",
      inputBg: "#14251f", inputBorder: "#14532d",
      titleGrad: "linear-gradient(135deg, #10b981 0%, #fbbf24 100%)",
      btnGrad: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
      btnGlow: "rgba(16, 185, 129, 0.4)",
      statCards: {
        Green: { bg: "linear-gradient(135deg, #059669 0%, #10b981 100%)", text: null },
        Teal: { bg: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)", text: null },
        Orange: { bg: "linear-gradient(135deg, #92400e 0%, #b45309 100%)", text: "#fef3c7" },
        Blue: { bg: "linear-gradient(135deg, #14532d 0%, #166534 100%)", text: "#a7f3d0" },
        Pink: { bg: "linear-gradient(135deg, #854d0e 0%, #a16207 100%)", text: null },
        Purple: { bg: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)", text: "#6ee7b7" },
      },
      profitGrad: "linear-gradient(135deg, #059669 0%, #fbbf24 100%)",
      errorBg: "#1c1917", errorBorder: "#dc2626", errorText: "#fca5a5",
      badgeGreen: { bg: "#064e3b", text: "#6ee7b7" },
      badgeYellow: { bg: "#422006", text: "#fcd34d" },
      badgeRed: { bg: "#450a0a", text: "#fca5a5" },
      radius: "0.875rem", radiusSm: "0.625rem", radiusCompact: "0.375rem", radiusCompactSm: "0.25rem",
      shadow: "0 2px 8px rgba(16,185,129,0.06)", shadowCompact: "0 1px 4px rgba(16,185,129,0.04)", shadowDark: "0 2px 8px rgba(16,185,129,0.08)",
      shadowLg: "0 20px 40px -10px rgba(16,185,129,0.1), 0 8px 16px -8px rgba(16,185,129,0.06)", shadowLgCompact: "0 2px 8px rgba(16,185,129,0.04)",
      hoverShadow: "0 25px 50px -12px rgba(16,185,129,0.2)",
      cardHoverShadow: "0 8px 24px rgba(16,185,129,0.1)", cardHoverShadowDark: "0 8px 24px rgba(16,185,129,0.1)",
      modalShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
      toggleBg: "#14532d",
      headerBorderBottom: "2px solid rgba(251,191,36,0.3)",
      bgPattern: "radial-gradient(ellipse at 30% 80%, rgba(16,185,129,0.05) 0%, transparent 50%), radial-gradient(ellipse at 70% 20%, rgba(251,191,36,0.03) 0%, transparent 50%)",
      cardGlow: null,
    },
  };

  if (themeName === "auto") return palettes[autoIsDark ? "dark" : "light"];
  return palettes[themeName] || palettes.light;
};

// Load all fonts
if (typeof document !== 'undefined') {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Gabarito:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=League+Spartan:wght@300;400;500;600;700;800;900&family=Open+Sans:wght@300;400;500;600;700&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

const getStyles = (themeName, font = "Poppins", fontSize = 16, viewStyle = "normal", boldText = false) => {
  const c = getThemeColors(themeName);
  const isCompact = viewStyle === "compact";
  const headingFont = '"Gabarito", sans-serif';
  const bodyWeight = boldText ? "600" : "400";
  const bodyWeightMedium = boldText ? "700" : "500";
  const bodyWeightSemibold = boldText ? "800" : "600";
  const bodyWeightBold = boldText ? "900" : "700";
  const r = isCompact ? c.radiusCompact : c.radius;
  const rSm = isCompact ? c.radiusCompactSm : c.radiusSm;

  return {
    container: {
      minHeight: "100vh",
      backgroundColor: isCompact ? c.bgAlt : c.bg,
      backgroundImage: c.bgPattern || "none",
      fontFamily: `"${font}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
      fontSize: `${fontSize}px`,
      fontWeight: bodyWeight,
      transition: "background-color 0.3s ease",
    },
    header: {
      backgroundColor: c.surface,
      boxShadow: c.shadow,
      borderBottom: c.headerBorderBottom || `1px solid ${c.border}`,
      padding: "1.5rem 1rem",
      transition: "all 0.3s ease",
    },
    headerContent: { maxWidth: "80rem", margin: "0 auto" },
    headerFlex: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    title: {
      fontSize: "2.5rem",
      fontFamily: headingFont,
      fontWeight: "800",
      background: c.titleGrad,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      color: "transparent",
      display: "inline-block",
      width: "fit-content",
      margin: 0,
    },
    subtitle: {
      fontSize: "0.875rem",
      color: c.textSec,
      marginTop: "0.25rem",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      transition: "color 0.3s ease",
    },
    tabs: {
      backgroundColor: c.surface,
      borderBottom: `1px solid ${c.border}`,
      transition: "all 0.3s ease",
    },
    tabsContent: { maxWidth: "80rem", margin: "0 auto", padding: "0 1rem" },
    tabsNav: { display: "flex", gap: "2rem" },
    tab: {
      padding: "1rem 0.25rem",
      border: "none",
      borderBottom: "2px solid transparent",
      backgroundColor: "transparent",
      fontSize: "0.875rem",
      fontWeight: bodyWeightMedium,
      cursor: "pointer",
      transition: "all 0.3s ease",
      color: c.textSec,
    },
    tabActive: {
      borderBottomColor: c.accent,
      color: c.accent,
      transform: "translateY(-2px)",
    },
    tabInactive: { color: c.textSec },
    mainContent: {
      maxWidth: "80rem",
      margin: "0 auto",
      padding: "2rem 1rem",
      animation: "fadeIn 0.4s ease-in",
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: isCompact ? "repeat(auto-fit, minmax(180px, 1fr))" : "repeat(auto-fit, minmax(280px, 1fr))",
      gap: isCompact ? "0.75rem" : "1.5rem",
      marginBottom: isCompact ? "1rem" : "2rem",
    },
    statCard: {
      padding: isCompact ? "0.875rem" : "2rem",
      borderRadius: r,
      color: "#ffffff",
      boxShadow: isCompact ? c.shadowLgCompact : c.shadowLg,
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
      cursor: "pointer",
      animation: "slideUp 0.5s ease-out",
    },
    statCardHover: {
      transform: "translateY(-8px)",
      boxShadow: c.hoverShadow,
    },
    statCardGreen: { background: c.statCards.Green.bg, ...(c.statCards.Green.border ? { border: c.statCards.Green.border } : {}) },
    statCardTeal: { background: c.statCards.Teal.bg, ...(c.statCards.Teal.border ? { border: c.statCards.Teal.border } : {}) },
    statCardOrange: { background: c.statCards.Orange.bg, ...(c.statCards.Orange.border ? { border: c.statCards.Orange.border } : {}) },
    statCardBlue: { background: c.statCards.Blue.bg, ...(c.statCards.Blue.border ? { border: c.statCards.Blue.border } : {}) },
    statCardPink: { background: c.statCards.Pink.bg, ...(c.statCards.Pink.border ? { border: c.statCards.Pink.border } : {}) },
    statCardPurple: { background: c.statCards.Purple.bg, ...(c.statCards.Purple.border ? { border: c.statCards.Purple.border } : {}) },
    statTextGreen: c.statCards.Green.text,
    statTextTeal: c.statCards.Teal.text,
    statTextOrange: c.statCards.Orange.text,
    statTextBlue: c.statCards.Blue.text,
    statTextPink: c.statCards.Pink.text,
    statTextPurple: c.statCards.Purple.text,
    card: {
      backgroundColor: c.surface,
      borderRadius: r,
      padding: isCompact ? "1rem" : "2rem",
      boxShadow: c.cardGlow ? `${c.shadow}, ${c.cardGlow}` : c.shadow,
      marginBottom: isCompact ? "1rem" : "2rem",
      border: `1px solid ${c.border}`,
      transition: "all 0.3s ease",
      animation: "fadeIn 0.5s ease-out",
    },
    refreshButton: {
      padding: "0.625rem 1.25rem",
      borderRadius: "0.5rem",
      border: "none",
      cursor: "pointer",
      fontSize: "0.875rem",
      fontWeight: bodyWeightSemibold,
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      background: c.btnGrad,
      color: "#ffffff",
      transition: "all 0.3s ease",
      boxShadow: `0 4px 15px ${c.btnGlow}`,
    },
    viewToggle: {
      padding: "0.5rem 1rem",
      borderRadius: "0.5rem",
      border: `1px solid ${c.borderHover}`,
      backgroundColor: c.inputBg,
      color: c.text,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      transition: "all 0.3s ease",
      fontSize: "0.875rem",
      fontWeight: bodyWeightMedium,
    },
    viewToggleActive: {
      backgroundColor: c.accent,
      color: "#ffffff",
      borderColor: c.accent,
    },
    button: {
      padding: "0.75rem 1.5rem",
      borderRadius: "0.5rem",
      border: "none",
      cursor: "pointer",
      fontSize: "0.875rem",
      fontWeight: bodyWeightSemibold,
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      transition: "all 0.3s ease",
      boxShadow: c.shadow,
    },
    buttonPrimary: { backgroundColor: c.accent, color: "#ffffff" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: {
      padding: "0.75rem 1rem",
      textAlign: "left",
      fontSize: "0.75rem",
      fontWeight: bodyWeightSemibold,
      color: c.textSec,
      backgroundColor: c.surfaceAlt,
      borderBottom: `1px solid ${c.border}`,
      transition: "all 0.3s ease",
    },
    td: {
      padding: "0.75rem 1rem",
      fontSize: "0.875rem",
      borderBottom: `1px solid ${c.border}`,
      color: c.text,
      backgroundColor: c.surface,
      transition: "all 0.3s ease",
    },
    transactionCard: {
      backgroundColor: c.surface,
      borderRadius: rSm,
      padding: "1.5rem",
      marginBottom: "1rem",
      border: `1px solid ${c.border}`,
      boxShadow: c.cardGlow || "none",
      transition: "all 0.3s ease, transform 0.2s ease",
      cursor: "pointer",
      animation: "slideUp 0.4s ease-out",
    },
    transactionCardHover: {
      transform: "translateY(-4px)",
      boxShadow: c.cardHoverShadow,
    },
    select: {
      padding: "0.5rem 0.75rem",
      border: `1px solid ${c.inputBorder}`,
      borderRadius: "0.25rem",
      fontSize: "0.875rem",
      minWidth: "150px",
      width: "100%",
      backgroundColor: c.inputBg,
      color: c.text,
      transition: "all 0.3s ease",
    },
    loading: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      fontSize: "1.125rem",
      color: c.textSec,
      flexDirection: "column",
      gap: "1rem",
      backgroundColor: c.bg,
    },
    error: {
      padding: "1rem",
      backgroundColor: c.errorBg,
      border: `1px solid ${c.errorBorder}`,
      borderRadius: "0.5rem",
      color: c.errorText,
      marginBottom: "2rem",
      textAlign: "center",
      animation: "shake 0.5s ease-in-out",
    },
    ownerCard: {
      padding: isCompact ? "1rem" : "1.5rem",
      backgroundColor: c.surfaceAlt,
      borderRadius: rSm,
      border: `1px solid ${c.border}`,
      transition: "all 0.3s ease",
    },
    ownerStatBox: {
      textAlign: "center",
      padding: isCompact ? "0.625rem" : "1rem",
      backgroundColor: c.surface,
      borderRadius: isCompact ? c.radiusCompactSm : "0.5rem",
      transition: "all 0.3s ease",
    },
    cardTypeStat: {
      padding: isCompact ? "1rem" : "1.5rem",
      border: `${isCompact ? "1px" : "2px"} solid ${c.border}`,
      borderRadius: rSm,
      backgroundColor: c.surfaceAlt,
      transition: "all 0.3s ease, transform 0.2s ease",
      cursor: "pointer",
    },
    cardTypeStatHover: {
      transform: "scale(1.05)",
      borderColor: c.accent,
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      padding: "0.25rem 0.625rem",
      borderRadius: "9999px",
      fontSize: "0.75rem",
      fontWeight: bodyWeightSemibold,
      transition: "all 0.3s ease",
    },
    badgeGreen: { backgroundColor: c.badgeGreen.bg, color: c.badgeGreen.text },
    badgeYellow: { backgroundColor: c.badgeYellow.bg, color: c.badgeYellow.text },
    badgeRed: { backgroundColor: c.badgeRed.bg, color: c.badgeRed.text },
    sectionTitle: {
      fontSize: isCompact ? "1.125rem" : "1.5rem",
      fontFamily: headingFont,
      fontWeight: "800",
      marginBottom: isCompact ? "1rem" : "1.5rem",
      display: "flex",
      alignItems: "center",
      gap: isCompact ? "0.5rem" : "0.75rem",
      color: c.textStrong,
      transition: "color 0.3s ease",
    },
    ownerName: {
      fontFamily: headingFont,
      fontWeight: "800",
      fontSize: isCompact ? "1rem" : "1.25rem",
      color: c.textStrong,
      transition: "color 0.3s ease",
    },
    ownerCount: {
      fontSize: isCompact ? "0.75rem" : "0.875rem",
      color: c.textSec,
      backgroundColor: c.surface,
      padding: isCompact ? "0.125rem 0.5rem" : "0.25rem 0.75rem",
      borderRadius: "0.5rem",
      fontWeight: bodyWeightSemibold,
      transition: "all 0.3s ease",
    },
    cardTypeText: {
      fontFamily: headingFont,
      fontWeight: "800",
      fontSize: isCompact ? "0.9375rem" : "1.125rem",
      color: c.textStrong,
      transition: "color 0.3s ease",
    },
    settingsButton: {
      padding: "0.5rem",
      borderRadius: "0.5rem",
      border: `1px solid ${c.border}`,
      backgroundColor: c.inputBg,
      color: c.text,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.3s ease",
      marginLeft: "0.5rem",
    },
    settingsModal: {
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
      zIndex: 100,
      animation: "fadeIn 0.2s ease-out",
    },
    settingsContent: {
      backgroundColor: c.surface,
      borderRadius: "1rem",
      padding: "2rem",
      maxWidth: "560px",
      width: "100%",
      maxHeight: "90vh",
      overflowY: "auto",
      boxShadow: c.modalShadow,
      animation: "slideUp 0.3s ease-out",
      border: `1px solid ${c.border}`,
    },
    settingsHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "2rem",
      paddingBottom: "1rem",
      borderBottom: `1px solid ${c.border}`,
    },
    settingsTitle: {
      fontSize: "1.5rem",
      fontFamily: headingFont,
      fontWeight: "800",
      color: c.textStrong,
      margin: 0,
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    },
    closeButton: {
      padding: "0.5rem",
      border: "none",
      background: "none",
      cursor: "pointer",
      color: c.textSec,
      borderRadius: "0.5rem",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
    },
    settingsSection: { marginBottom: "2rem" },
    settingsLabel: {
      display: "block",
      fontSize: "0.875rem",
      fontWeight: bodyWeightSemibold,
      marginBottom: "0.75rem",
      color: c.text,
    },
    themeGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
      gap: "0.625rem",
    },
    themeOption: {
      padding: "0.625rem",
      border: `2px solid ${c.border}`,
      borderRadius: "0.75rem",
      backgroundColor: c.surfaceAlt,
      cursor: "pointer",
      transition: "all 0.3s ease",
      textAlign: "center",
    },
    themeOptionActive: {
      borderColor: c.accent,
      backgroundColor: c.accentBg,
    },
    viewStyleOptions: {
      display: "flex",
      gap: "0.75rem",
    },
    viewStyleOption: {
      flex: 1,
      padding: "0.75rem",
      border: `2px solid ${c.border}`,
      borderRadius: "0.75rem",
      backgroundColor: c.surfaceAlt,
      cursor: "pointer",
      transition: "all 0.3s ease",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "0.5rem",
      color: c.text,
    },
    viewStyleOptionActive: {
      borderColor: c.accent,
      backgroundColor: c.accentBg,
      color: c.accent,
    },
    fontSelect: {
      padding: "0.75rem",
      border: `1px solid ${c.inputBorder}`,
      borderRadius: "0.5rem",
      fontSize: "0.9375rem",
      width: "100%",
      backgroundColor: c.inputBg,
      color: c.text,
      cursor: "pointer",
      transition: "all 0.3s ease",
    },
    fontSizeSlider: {
      width: "100%",
      height: "8px",
      borderRadius: "4px",
      background: c.toggleBg,
      outline: "none",
      transition: "all 0.3s ease",
    },
    fontSizeDisplay: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "0.5rem",
      fontSize: "0.875rem",
      color: c.textSec,
    },
    fontSizeValue: {
      fontSize: "1.125rem",
      fontWeight: "700",
      color: c.textStrong,
    },
    boldToggle: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "1rem",
      border: `2px solid ${c.border}`,
      borderRadius: "0.75rem",
      backgroundColor: c.surfaceAlt,
      cursor: "pointer",
      transition: "all 0.3s ease",
    },
    boldToggleActive: {
      borderColor: c.accent,
      backgroundColor: c.accentBg,
    },
    toggleSwitch: {
      width: "44px",
      height: "24px",
      borderRadius: "12px",
      backgroundColor: c.toggleBg,
      position: "relative",
      transition: "background-color 0.3s ease",
      flexShrink: 0,
    },
    toggleSwitchActive: {
      backgroundColor: c.accent,
    },
    toggleKnob: {
      width: "20px",
      height: "20px",
      borderRadius: "50%",
      backgroundColor: "#ffffff",
      position: "absolute",
      top: "2px",
      left: "2px",
      transition: "transform 0.3s ease",
      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
    },
    toggleKnobActive: {
      transform: "translateX(20px)",
    },
    // expose colors for inline usage
    _c: c,
  };
};

const normalizeCardType = (type) => {
  if (!type) return "UNKNOWN";
  const normalized = type.toString().trim().toUpperCase();
  if (normalized.includes("VISA") && normalized.includes("DEBIT")) return "VISA DEBIT";
  if (normalized.includes("VISA") && normalized.includes("CREDIT")) return "VISA CREDIT";
  if (normalized.includes("AMEX")) return "AMEX";
  if (normalized.includes("SELLER")) return "SELLER";
  if (normalized.includes("MASTERCARD")) return "MASTERCARD";
  return normalized;
};

const cardTypeColors = {
  "VISA DEBIT": "#3b82f6",
  "VISA CREDIT": "#10b981",
  AMEX: "#8b5cf6",
  SELLER: "#64748b",
  MASTERCARD: "#f59e0b",
  UNKNOWN: "#94a3b8",
};

const getCardTypeColor = (type) => {
  const normalized = normalizeCardType(type);
  return cardTypeColors[normalized] || cardTypeColors["UNKNOWN"];
};

const SkeletonCard = ({ c }) => (
  <div style={{
    backgroundColor: c.surface,
    borderRadius: "1rem",
    padding: "2rem",
    marginBottom: "2rem",
    border: `1px solid ${c.border}`,
  }}>
    <div style={{ height: "24px", width: "40%", backgroundColor: c.surfaceAlt, borderRadius: "0.5rem", marginBottom: "1rem", animation: "pulse 1.5s ease-in-out infinite" }}></div>
    <div style={{ height: "100px", backgroundColor: c.surfaceAlt, borderRadius: "0.5rem", animation: "pulse 1.5s ease-in-out infinite" }}></div>
  </div>
);

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

  const styles = getStyles(theme, selectedFont, fontSize, viewStyle, boldText);
  const c = styles._c;

  const getProfitMarginBadge = (margin) => {
    if (margin >= 20) return { style: styles.badgeGreen, label: "Excellent" };
    if (margin >= 10) return { style: styles.badgeYellow, label: "Good" };
    return { style: styles.badgeRed, label: "Low" };
  };

  useEffect(() => { localStorage.setItem("theme", theme); }, [theme]);
  useEffect(() => { localStorage.setItem("font", selectedFont); }, [selectedFont]);
  useEffect(() => { localStorage.setItem("fontSize", fontSize.toString()); }, [fontSize]);
  useEffect(() => { localStorage.setItem("viewStyle", viewStyle); }, [viewStyle]);
  useEffect(() => { localStorage.setItem("boldText", boldText.toString()); }, [boldText]);

  const fetchFromGoogleSheets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(GOOGLE_SHEETS_URL);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      if (!data || (!data.transactions && !data.monthly)) {
        setTransactions([]); setMonthly([]); setOwners([]); setCards([]); setStats({});
      } else {
        setLastSync(new Date());
        if (data.transactions?.length > 0) processTransactions(data.transactions);
        if (data.monthly?.length > 0) setMonthly(data.monthly);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to load data. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFromGoogleSheets(); }, []);

  useEffect(() => {
    if (theme === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => setTheme("auto");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  const processTransactions = (transactionsData) => {
    const normalizedData = transactionsData.map((t) => ({ ...t, cardType: normalizeCardType(t.cardType) }));
    const uniqueOwners = [...new Set(normalizedData.map((t) => t.owner))].map((name, index) => ({ id: index + 1, name }));
    const uniqueCards = [];
    const cardMap = new Map();
    normalizedData.forEach((t) => {
      const key = `${t.cardType}-${t.cardNumber}`;
      if (!cardMap.has(key)) { cardMap.set(key, { id: uniqueCards.length + 1, type: t.cardType, number: t.cardNumber }); uniqueCards.push(cardMap.get(key)); }
    });
    const processedTransactions = normalizedData.map((t) => {
      const card = uniqueCards.find((x) => x.type === t.cardType && x.number === t.cardNumber);
      const owner = uniqueOwners.find((o) => o.name === t.owner);
      const cost = parseFloat(t.cost) || 0;
      const grossProfit = parseFloat(t.grossProfit) || 0;
      let netProfit = parseFloat(t.netProfit) || 0;
      if (netProfit === 0 && (cost > 0 || grossProfit > 0)) netProfit = grossProfit - cost;
      const profitMargin = cost > 0 ? (netProfit / cost) * 100 : 0;
      return { ...t, cost, grossProfit, netProfit, cardId: card.id, ownerId: owner.id, profitMargin };
    });
    setOwners(uniqueOwners); setCards(uniqueCards); setTransactions(processedTransactions);
    calculateStats(processedTransactions, uniqueOwners, uniqueCards);
  };

  const calculateStats = (txns, ownrs, crds) => {
    const totalCost = txns.reduce((s, t) => s + t.cost, 0);
    const totalGrossProfit = txns.reduce((s, t) => s + t.grossProfit, 0);
    const totalNetProfit = txns.reduce((s, t) => s + t.netProfit, 0);
    const totalUsdtSold = txns.reduce((s, t) => s + (parseFloat(t.sellAmount) || 0), 0);
    const totalDollarUsed = txns.reduce((s, t) => s + (parseFloat(t.buyAmount) || 0), 0);
    const avgNetProfit = txns.length > 0 ? totalNetProfit / txns.length : 0;
    const ownerStats = {};
    ownrs.forEach((o) => {
      const ot = txns.filter((t) => t.ownerId === o.id);
      ownerStats[o.id] = { count: ot.length, totalCost: ot.reduce((s, t) => s + t.cost, 0), totalGrossProfit: ot.reduce((s, t) => s + t.grossProfit, 0), totalNetProfit: ot.reduce((s, t) => s + t.netProfit, 0) };
    });
    const cardTypeStats = {};
    crds.forEach((x) => {
      if (!cardTypeStats[x.type]) cardTypeStats[x.type] = { count: 0, netProfit: 0 };
      const ct = txns.filter((t) => t.cardId === x.id);
      cardTypeStats[x.type].count += ct.length;
      cardTypeStats[x.type].netProfit += ct.reduce((s, t) => s + t.netProfit, 0);
    });
    setStats({ totalCost, totalGrossProfit, totalNetProfit, totalUsdtSold, totalDollarUsed, avgNetProfit, ownerStats, cardTypeStats });
  };

  const getCardById = (id) => cards.find((x) => x.id === id);
  const getOwnerById = (id) => owners.find((o) => o.id === id);

  const filteredTransactions = transactions.filter((t) => {
    const card = getCardById(t.cardId);
    if (filterCardType !== "all" && card?.type !== filterCardType) return false;
    if (filterOwner !== "all" && t.ownerId !== parseInt(filterOwner)) return false;
    return true;
  });

  const cardTypes = ["VISA DEBIT", "VISA CREDIT", "AMEX", "SELLER", "MASTERCARD"];

  if (loading && transactions.length === 0) {
    return (
      <div style={styles.loading}>
        <RefreshCw size={48} style={{ animation: "spin 1s linear infinite" }} />
        <div>Loading dashboard...</div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerFlex}>
            <div>
              <h1 key={theme} style={styles.title}>Sales Dashboard</h1>
              <p style={styles.subtitle}>
                {lastSync ? `Last updated: ${lastSync.toLocaleTimeString()}` : "Real-time data from Google Sheets"}
                <button onClick={() => setShowSettings(true)} style={styles.settingsButton} title="Settings">
                  <Settings size={16} />
                </button>
              </p>
            </div>
            <button
              onClick={fetchFromGoogleSheets}
              style={{ ...styles.refreshButton, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer", transform: loading ? "scale(0.95)" : "scale(1)" }}
              disabled={loading}
            >
              <RefreshCw size={18} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      <div style={styles.tabs}>
        <div style={styles.tabsContent}>
          <nav style={styles.tabsNav}>
            {["dashboard", "transactions", "monthly"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : styles.tabInactive) }}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div style={styles.mainContent}>
        {error && (
          <div style={styles.error}>
            <strong>Error:</strong> {error}
            <div style={{ marginTop: "0.5rem" }}><button onClick={fetchFromGoogleSheets} style={styles.button}>Try Again</button></div>
          </div>
        )}

        {activeTab === "dashboard" && (
          <div>
            <div style={styles.statsGrid}>
              {[
                { label: "Net Profit", value: stats.totalNetProfit, icon: TrendingUp, color: "Green", sub: "After costs" },
                { label: "Total USDT Sold", value: stats.totalUsdtSold, icon: DollarSign, color: "Teal", sub: "Total sell amount" },
                { label: "Gross Profit", value: stats.totalGrossProfit, icon: TrendingUp, color: "Orange", sub: "Total revenue" },
                { label: "Total Cost", value: stats.totalCost, icon: DollarSign, color: "Blue", count: transactions.length },
                { label: "Dollar Used", value: stats.totalDollarUsed, icon: DollarSign, color: "Pink", sub: "Total buy amount" },
                { label: "Average Profit", value: stats.avgNetProfit, icon: TrendingUp, color: "Purple", sub: "Per transaction" },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                const txtColor = styles[`statText${stat.color}`];
                return (
                  <div key={idx} style={{ ...styles.statCard, ...styles[`statCard${stat.color}`], ...(hoveredStat === idx ? styles.statCardHover : {}), animationDelay: `${idx * 0.1}s` }}
                    onMouseEnter={() => setHoveredStat(idx)} onMouseLeave={() => setHoveredStat(null)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: viewStyle === "compact" ? "0.5rem" : "1rem" }}>
                      <div style={{ fontSize: viewStyle === "compact" ? "0.75rem" : "1rem", opacity: 0.9, fontWeight: "600", color: txtColor || undefined }}>{stat.label}</div>
                      <Icon size={viewStyle === "compact" ? 20 : 32} style={{ opacity: 0.7, color: txtColor || undefined }} />
                    </div>
                    <div style={{ fontSize: viewStyle === "compact" ? "1.5rem" : "2.7rem", fontWeight: "700", color: txtColor || undefined }}>${stat.value?.toFixed(2) || 0}</div>
                    <div style={{ fontSize: viewStyle === "compact" ? "0.6875rem" : "0.875rem", opacity: 0.8, marginTop: "0.5rem", color: txtColor || undefined }}>{stat.count ? `${stat.count} transactions` : stat.sub}</div>
                  </div>
                );
              })}
            </div>

            {loading ? (
              <><SkeletonCard c={c} /><SkeletonCard c={c} /></>
            ) : (
              <>
                <div style={styles.card}>
                  <h2 style={styles.sectionTitle}><User size={viewStyle === "compact" ? 20 : 24} /> Owner Performance</h2>
                  <div style={{ display: "grid", gap: viewStyle === "compact" ? "1rem" : "1.5rem" }}>
                    {owners.map((o) => {
                      const oStats = stats.ownerStats?.[o.id] || { count: 0, totalCost: 0, totalGrossProfit: 0, totalNetProfit: 0 };
                      return (
                        <div key={o.id} style={styles.ownerCard}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: viewStyle === "compact" ? "0.625rem" : "1rem" }}>
                            <span style={styles.ownerName}>{o.name}</span>
                            <span style={styles.ownerCount}>{oStats.count} transactions</span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: viewStyle === "compact" ? "0.625rem" : "1rem" }}>
                            {[{ label: "COST", value: oStats.totalCost, color: "#3b82f6" }, { label: "GROSS", value: oStats.totalGrossProfit, color: "#f97316" }, { label: "NET PROFIT", value: oStats.totalNetProfit, color: "#16a34a" }].map((s) => (
                              <div key={s.label} style={styles.ownerStatBox}>
                                <div style={{ fontSize: viewStyle === "compact" ? "0.6875rem" : "0.75rem", color: c.textSec, marginBottom: "0.25rem", fontWeight: "600" }}>{s.label}</div>
                                <div style={{ fontSize: viewStyle === "compact" ? "1.125rem" : "1.5rem", fontWeight: "700", color: s.color }}>${s.value.toFixed(2)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={styles.card}>
                  <h2 style={{ ...styles.sectionTitle, marginBottom: viewStyle === "compact" ? "1rem" : "1.5rem" }}>Card Type Statistics</h2>
                  <div style={{ display: "grid", gridTemplateColumns: viewStyle === "compact" ? "repeat(auto-fit, minmax(180px, 1fr))" : "repeat(auto-fit, minmax(240px, 1fr))", gap: viewStyle === "compact" ? "0.75rem" : "1.5rem" }}>
                    {Object.entries(stats.cardTypeStats || {}).map(([type, data], idx) => (
                      <div key={type} style={{ ...styles.cardTypeStat, ...(hoveredCard === idx ? styles.cardTypeStatHover : {}) }} onMouseEnter={() => setHoveredCard(idx)} onMouseLeave={() => setHoveredCard(null)}>
                        <div style={{ display: "flex", alignItems: "center", gap: viewStyle === "compact" ? "0.5rem" : "0.75rem", marginBottom: viewStyle === "compact" ? "0.625rem" : "1rem" }}>
                          <div style={{ width: viewStyle === "compact" ? "12px" : "16px", height: viewStyle === "compact" ? "12px" : "16px", borderRadius: "50%", backgroundColor: getCardTypeColor(type), flexShrink: 0 }}></div>
                          <span style={styles.cardTypeText}>{type}</span>
                        </div>
                        <div style={{ fontSize: viewStyle === "compact" ? "0.75rem" : "0.875rem", color: c.textSec, marginBottom: "0.5rem" }}>{data.count} transactions</div>
                        <div style={{ fontSize: viewStyle === "compact" ? "1.25rem" : "1.75rem", fontWeight: "700", color: "#16a34a" }}>${data.netProfit.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "transactions" && (
          <div>
            <div style={{ ...styles.card, marginBottom: "1rem" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Filter size={16} style={{ color: c.textSec }} />
                    <span style={{ fontSize: "0.875rem", fontWeight: "500", color: c.text }}>Filters:</span>
                  </div>
                  <select style={styles.select} value={filterCardType} onChange={(e) => setFilterCardType(e.target.value)}>
                    <option value="all">All Card Types</option>
                    {cardTypes.map((t) => (<option key={t} value={t}>{t}</option>))}
                  </select>
                  <select style={styles.select} value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)}>
                    <option value="all">All Owners</option>
                    {owners.map((o) => (<option key={o.id} value={o.id}>{o.name}</option>))}
                  </select>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {[{ mode: "table", icon: List, label: "Table" }, { mode: "cards", icon: LayoutGrid, label: "Cards" }].map(({ mode, icon: Icon, label }) => (
                    <button key={mode} onClick={() => setViewMode(mode)} style={{ ...styles.viewToggle, ...(viewMode === mode ? styles.viewToggleActive : {}) }}>
                      <Icon size={16} /> {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {viewMode === "table" ? (
              <div style={styles.card}>
                <div style={{ overflowX: "auto" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        {["Card Type", "Card No.", "Owner"].map((h) => <th key={h} style={styles.th}>{h}</th>)}
                        {["Buy Rate", "Buy Amount", "Sell Rate", "Sell Amount", "Cost", "Gross Profit", "Net Profit", "Margin"].map((h) => <th key={h} style={{ ...styles.th, textAlign: "right" }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((t) => {
                        const card = getCardById(t.cardId);
                        const owner = getOwnerById(t.ownerId);
                        const cardColor = getCardTypeColor(card?.type);
                        const marginBadge = getProfitMarginBadge(t.profitMargin);
                        return (
                          <tr key={t.id}>
                            <td style={styles.td}><div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: cardColor, flexShrink: 0 }}></div><span>{card?.type || "UNKNOWN"}</span></div></td>
                            <td style={styles.td}>{card?.number || "-"}</td>
                            <td style={{ ...styles.td, fontWeight: "500" }}>{owner?.name}</td>
                            <td style={{ ...styles.td, textAlign: "right" }}>{parseFloat(t.buyRate).toFixed(2)}</td>
                            <td style={{ ...styles.td, textAlign: "right" }}>${parseFloat(t.buyAmount).toFixed(2)}</td>
                            <td style={{ ...styles.td, textAlign: "right" }}>{parseFloat(t.sellRate).toFixed(2)}</td>
                            <td style={{ ...styles.td, textAlign: "right" }}>${parseFloat(t.sellAmount).toFixed(2)}</td>
                            <td style={{ ...styles.td, textAlign: "right" }}>${t.cost.toFixed(2)}</td>
                            <td style={{ ...styles.td, textAlign: "right", color: "#f97316", fontWeight: "600" }}>${t.grossProfit.toFixed(2)}</td>
                            <td style={{ ...styles.td, textAlign: "right", color: "#16a34a", fontWeight: "600" }}>${t.netProfit.toFixed(2)}</td>
                            <td style={{ ...styles.td, textAlign: "right" }}><span style={{ ...styles.badge, ...marginBadge.style }}>{t.profitMargin.toFixed(1)}%</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: c.surfaceAlt, fontWeight: "700", borderTop: `2px solid ${c.borderStrong}` }}>
                        <td colSpan="2" style={{ ...styles.td, textAlign: "left", fontWeight: "700", fontSize: "0.875rem", color: c.textStrong }}>TOTALS / AVERAGES</td>
                        <td colSpan="2" style={{ ...styles.td, textAlign: "center", fontWeight: "600", fontSize: "0.8125rem", color: c.textMid }}>
                          <div>Sell Amount:</div>
                          <div style={{ fontWeight: "700", fontSize: "0.9375rem", color: c.textStrong, marginTop: "0.125rem" }}>${filteredTransactions.reduce((s, t) => s + (parseFloat(t.sellAmount) || 0), 0).toFixed(2)}</div>
                        </td>
                        <td style={{ ...styles.td, textAlign: "center", fontWeight: "600", fontSize: "0.8125rem", color: c.textMid }}>
                          <div>Avg Sell Rate:</div>
                          <div style={{ fontWeight: "700", fontSize: "0.9375rem", color: c.textStrong, marginTop: "0.125rem" }}>{filteredTransactions.length > 0 ? (filteredTransactions.reduce((s, t) => s + (parseFloat(t.sellRate) || 0), 0) / filteredTransactions.length).toFixed(2) : "0.00"}</div>
                        </td>
                        <td style={{ ...styles.td, textAlign: "center", fontWeight: "600", fontSize: "0.8125rem", color: c.textMid }}>
                          <div>Avg Buy Rate:</div>
                          <div style={{ fontWeight: "700", fontSize: "0.9375rem", color: c.textStrong, marginTop: "0.125rem" }}>{(() => { const tc = filteredTransactions.reduce((s, t) => s + (parseFloat(t.cost) || 0), 0); const ts = filteredTransactions.reduce((s, t) => s + (parseFloat(t.sellAmount) || 0), 0); return (ts > 0 ? tc / ts : 0).toFixed(2); })()}</div>
                        </td>
                        <td colSpan="2" style={{ ...styles.td, textAlign: "center" }}></td>
                        <td style={{ ...styles.td, textAlign: "center", fontWeight: "600", fontSize: "0.8125rem", color: c.textMid }}>
                          <div>Gross:</div>
                          <div style={{ color: "#f97316", fontWeight: "700", fontSize: "0.9375rem", marginTop: "0.125rem" }}>${filteredTransactions.reduce((s, t) => s + (parseFloat(t.grossProfit) || 0), 0).toFixed(2)}</div>
                        </td>
                        <td style={{ ...styles.td, textAlign: "center", fontWeight: "600", fontSize: "0.8125rem", color: c.textMid }}>
                          <div>Net:</div>
                          <div style={{ color: "#16a34a", fontWeight: "700", fontSize: "0.9375rem", marginTop: "0.125rem" }}>${filteredTransactions.reduce((s, t) => s + (parseFloat(t.netProfit) || 0), 0).toFixed(2)}</div>
                        </td>
                        <td style={{ ...styles.td, textAlign: "center" }}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "1rem" }}>
                {filteredTransactions.map((t, idx) => {
                  const card = getCardById(t.cardId);
                  const owner = getOwnerById(t.ownerId);
                  const cardColor = getCardTypeColor(card?.type);
                  const marginBadge = getProfitMarginBadge(t.profitMargin);
                  return (
                    <div key={t.id} style={{ ...styles.transactionCard, ...(hoveredCard === `tx-${idx}` ? styles.transactionCardHover : {}), animationDelay: `${idx * 0.05}s` }}
                      onMouseEnter={() => setHoveredCard(`tx-${idx}`)} onMouseLeave={() => setHoveredCard(null)}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: cardColor, flexShrink: 0 }}></div>
                          <div>
                            <div style={{ fontWeight: "700", fontSize: "1.125rem", color: c.textStrong }}>{card?.type || "UNKNOWN"}</div>
                            <div style={{ fontSize: "0.875rem", color: c.textSec }}>Card #{card?.number || "-"}</div>
                          </div>
                        </div>
                        <span style={{ ...styles.badge, ...marginBadge.style }}>{t.profitMargin.toFixed(1)}%</span>
                      </div>
                      <div style={{ marginBottom: "1rem" }}>
                        <div style={{ fontSize: "0.875rem", color: c.textSec, marginBottom: "0.25rem" }}>Owner</div>
                        <div style={{ fontWeight: "600", fontSize: "1rem", color: c.text }}>{owner?.name}</div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                        <div><div style={{ fontSize: "0.75rem", color: c.textSec }}>Buy</div><div style={{ fontWeight: "600", color: c.text }}>{parseFloat(t.buyRate).toFixed(2)} × ${parseFloat(t.buyAmount).toFixed(0)}</div></div>
                        <div><div style={{ fontSize: "0.75rem", color: c.textSec }}>Sell</div><div style={{ fontWeight: "600", color: c.text }}>{parseFloat(t.sellRate).toFixed(2)} × ${parseFloat(t.sellAmount).toFixed(0)}</div></div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", paddingTop: "1rem", borderTop: `1px solid ${c.border}` }}>
                        <div><div style={{ fontSize: "0.75rem", color: c.textSec, marginBottom: "0.25rem" }}>Cost</div><div style={{ fontWeight: "700", color: "#3b82f6" }}>${t.cost.toFixed(0)}</div></div>
                        <div><div style={{ fontSize: "0.75rem", color: c.textSec, marginBottom: "0.25rem" }}>Gross</div><div style={{ fontWeight: "700", color: "#f97316" }}>${t.grossProfit.toFixed(0)}</div></div>
                        <div><div style={{ fontSize: "0.75rem", color: c.textSec, marginBottom: "0.25rem" }}>Net</div><div style={{ fontWeight: "700", color: "#16a34a" }}>${t.netProfit.toFixed(0)}</div></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "monthly" && (
          <div>
            {monthly.length > 0 && (
              <div style={{ marginBottom: viewStyle === "compact" ? "1rem" : "2rem" }}>
                <div style={{ ...styles.statCard, background: c.profitGrad, maxWidth: viewStyle === "compact" ? "400px" : "500px", margin: "0 auto", textAlign: "center", animation: "slideUp 0.5s ease-out" }}>
                  <div style={{ fontSize: viewStyle === "compact" ? "0.9375rem" : "1.125rem", opacity: 0.9, marginBottom: "0.5rem", fontWeight: "600" }}>All Time Profit</div>
                  <div style={{ fontSize: viewStyle === "compact" ? "2.5rem" : "3.5rem", fontWeight: "700", marginBottom: "0.25rem" }}>${monthly.reduce((s, m) => s + m.profit, 0).toFixed(2)}</div>
                  <div style={{ fontSize: viewStyle === "compact" ? "0.8125rem" : "0.9375rem", opacity: 0.85 }}>Total from {monthly.length} months</div>
                </div>
              </div>
            )}
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}><Calendar size={viewStyle === "compact" ? 20 : 24} /> Monthly Breakdown</h2>
              {monthly.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: c.textSec }}>
                  <p style={{ fontSize: "1.125rem", marginBottom: "0.5rem", fontWeight: "600" }}>No monthly data available</p>
                  <p style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>Make sure your Google Sheet has a "Monthly" worksheet with:</p>
                  <div style={{ backgroundColor: c.surfaceAlt, padding: "1rem", borderRadius: "0.5rem", maxWidth: "400px", margin: "0 auto", textAlign: "left", fontSize: "0.875rem" }}>
                    <p style={{ margin: "0.25rem 0" }}>📋 <strong>Column A:</strong> Month (e.g., "June", "July")</p>
                    <p style={{ margin: "0.25rem 0" }}>💰 <strong>Column B:</strong> Amount (e.g., 4160.00)</p>
                  </div>
                  <div style={{ marginTop: "1.5rem" }}><button onClick={fetchFromGoogleSheets} style={{ ...styles.button, ...styles.buttonPrimary }}><RefreshCw size={16} /> Refresh Data</button></div>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={styles.table}>
                    <thead><tr><th style={styles.th}>Month</th><th style={{ ...styles.th, textAlign: "right" }}>Profit</th></tr></thead>
                    <tbody>
                      {monthly.map((m, idx) => (
                        <tr key={m.id} style={{ backgroundColor: idx % 2 === 0 ? c.surface : c.surfaceAlt }}>
                          <td style={{ ...styles.td, fontWeight: "600", fontSize: "1rem" }}>{m.month}</td>
                          <td style={{ ...styles.td, textAlign: "right", color: "#16a34a", fontWeight: "700", fontSize: "1.125rem" }}>${m.profit.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: c.surfaceAlt, fontWeight: "700", borderTop: `2px solid ${c.borderStrong}` }}>
                        <td style={{ ...styles.td, textAlign: "left", fontWeight: "700", fontSize: "1rem", color: c.textStrong }}>TOTAL</td>
                        <td style={{ ...styles.td, textAlign: "right", fontWeight: "700", color: "#16a34a", fontSize: "1.25rem" }}>${monthly.reduce((s, m) => s + m.profit, 0).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={styles.settingsModal} onClick={() => setShowSettings(false)}>
          <div style={styles.settingsContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.settingsHeader}>
              <h2 style={styles.settingsTitle}><Settings size={24} /> Settings</h2>
              <button onClick={() => setShowSettings(false)} style={styles.closeButton}><X size={24} /></button>
            </div>

            {/* Theme Section */}
            <div style={styles.settingsSection}>
              <label style={styles.settingsLabel}>Theme</label>
              <div style={styles.themeGrid}>
                {THEME_OPTIONS.map((opt) => (
                  <div
                    key={opt.key}
                    onClick={() => setTheme(opt.key)}
                    style={{
                      ...styles.themeOption,
                      ...(theme === opt.key ? styles.themeOptionActive : {}),
                    }}
                  >
                    <div style={{ display: "flex", height: "32px", borderRadius: "6px", overflow: "hidden", marginBottom: "0.5rem", border: `1px solid ${c.border}` }}>
                      {opt.preview.map((color, i) => (
                        <div key={i} style={{ flex: 1, background: color }}></div>
                      ))}
                    </div>
                    <div style={{ fontSize: "0.75rem", fontWeight: "600", color: theme === opt.key ? c.accent : c.text }}>
                      {opt.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* View Style Section */}
            <div style={styles.settingsSection}>
              <label style={styles.settingsLabel}>View Style</label>
              <div style={styles.viewStyleOptions}>
                {[{ key: "normal", icon: LayoutGrid, label: "Normal", desc: "Large cards" }, { key: "compact", icon: List, label: "Compact", desc: "Dense layout" }].map((opt) => (
                  <div key={opt.key} onClick={() => setViewStyle(opt.key)}
                    style={{ ...styles.viewStyleOption, ...(viewStyle === opt.key ? styles.viewStyleOptionActive : {}) }}>
                    <opt.icon size={24} />
                    <span>{opt.label}</span>
                    <div style={{ fontSize: "0.6875rem", opacity: 0.7, marginTop: "0.25rem" }}>{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Font Style Section */}
            <div style={styles.settingsSection}>
              <label style={styles.settingsLabel}>Font Style</label>
              <select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} style={styles.fontSelect}>
                {FONTS.map((f) => (<option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.name}</option>))}
              </select>
            </div>

            {/* Font Size Section */}
            <div style={styles.settingsSection}>
              <label style={styles.settingsLabel}>Font Size</label>
              <input type="range" min="12" max="20" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} style={styles.fontSizeSlider} />
              <div style={styles.fontSizeDisplay}>
                <span>Small (12px)</span>
                <span style={styles.fontSizeValue}>{fontSize}px</span>
                <span>Large (20px)</span>
              </div>
            </div>

            {/* Bold Text Toggle */}
            <div style={styles.settingsSection}>
              <label style={styles.settingsLabel}>Text Weight</label>
              <div onClick={() => setBoldText(!boldText)} style={{ ...styles.boldToggle, ...(boldText ? styles.boldToggleActive : {}) }}>
                <div>
                  <div style={{ fontWeight: boldText ? "700" : "600", fontSize: "0.9375rem", color: c.textStrong }}>Bold Text</div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "0.25rem", color: c.textSec }}>Increase font weight across the UI</div>
                </div>
                <div style={{ ...styles.toggleSwitch, ...(boldText ? styles.toggleSwitchActive : {}) }}>
                  <div style={{ ...styles.toggleKnob, ...(boldText ? styles.toggleKnobActive : {}) }}></div>
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
        @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); } 20%, 40%, 60%, 80% { transform: translateX(5px); } }
      `}</style>
    </div>
  );
}

export default App;