// ModernApp — top-level Modern (Ledgerline) shell. Reads existing app state via props,
// derives a design-system theme object from the active palette, and renders the right view.
import React, { useEffect, useMemo, useState } from "react";
import { getThemeColors } from "../themes";
import { Sidebar, TopBar, BottomTabs } from "./Nav";
import { I } from "./ui";
import { ModernDashboard } from "./Dashboard";
import { ModernTransactions } from "./Transactions";
import { ModernMonthly } from "./Monthly";
import { ModernSettings } from "./Settings";

const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

function useIsMobile(bp = 760) {
  const [m, setM] = useState(() => typeof window !== "undefined" && window.innerWidth < bp);
  useEffect(() => {
    const r = () => setM(window.innerWidth < bp);
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, [bp]);
  return m;
}

// Map an existing palette + theme key to the design system's token shape.
function buildTheme({ themeKey, palette, font }) {
  const c = palette;
  const isDark = !!c.isDark;
  const radius = c.radius || "10px";
  const radiusSm = c.radiusSm || "6px";
  const accent = c.accent;
  const positive = c.positive || c.badgeGreen?.text || (isDark ? "#34d399" : "#0e9f6e");
  const negative = c.negative || c.errorText || "#e11d48";
  const chartA = accent;
  const chartB = c.chartB || positive;
  const chartC = c.statCards?.Purple?.accentStrip || "#7c3aed";
  const chartD = c.statCards?.Orange?.accentStrip || "#f59e0b";
  const chartE = c.statCards?.Pink?.accentStrip || "#ec4899";
  return {
    key: themeKey,
    font,
    bg: c.bg,
    bgGrad: c.bgPattern || null,
    surface: c.surface,
    surfaceAlt: c.surfaceAlt,
    surfaceDeep: c.surfaceDeep,
    text: c.text,
    textSec: c.textSec,
    textMuted: c.textMuted,
    border: c.border,
    borderStrong: c.borderStrong,
    accent,
    accentSoft: c.accentBg,
    positive,
    negative,
    chartA, chartB, chartC, chartD, chartE,
    radius,
    radiusSm,
    shadow: c.shadow,
    shadowHover: c.cardHoverShadow || c.shadowLg,
    sidebarBg: c.surface,
    isDark,
    glass: themeKey === "glass" || themeKey === "liquid_glass",
    brutal: themeKey === "brutalist",
  };
}

export function ModernApp({
  themeKey, palette, font, isMobile: parentIsMobile,
  transactions, owners, cards,
  getCardById, getOwnerById,
  onAdd, onEdit, onDelete,
  setTheme, setFont, onExitModern,
}) {
  const localIsMobile = useIsMobile(760);
  const isMobile = parentIsMobile ?? localIsMobile;
  const [route, setRoute] = useState(() => lsGet("modern_route", "dashboard"));
  const [chartStyle, setChartStyle] = useState(() => lsGet("modern_chartStyle", "area"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { lsSet("modern_route", route); }, [route]);
  useEffect(() => { lsSet("modern_chartStyle", chartStyle); }, [chartStyle]);

  const theme = useMemo(() => buildTheme({ themeKey, palette, font }), [themeKey, palette, font]);

  const navItems = [
    { key: "dashboard", label: "Overview", icon: I.home },
    { key: "transactions", label: "Transactions", icon: I.list },
    { key: "monthly", label: "Monthly", icon: I.calendar },
    { key: "settings", label: "Settings", icon: I.settings },
  ];

  // Normalize transactions so the Modern views always receive Date instances.
  const txs = useMemo(() => transactions.map((t) => ({
    ...t,
    date: t.date instanceof Date ? t.date : new Date(t.date),
  })), [transactions]);

  const pageStyle = {
    minHeight: "100vh",
    background: theme.bg,
    backgroundImage: theme.bgGrad || undefined,
    color: theme.text,
    fontFamily: `"${font}", -apple-system, BlinkMacSystemFont, sans-serif`,
    display: "flex",
    WebkitFontSmoothing: "antialiased",
  };

  return (
    <div style={pageStyle}>
      <Sidebar
        theme={theme}
        navItems={navItems}
        route={route}
        setRoute={setRoute}
        onAdd={onAdd}
        isMobile={isMobile}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <TopBar
          theme={theme}
          route={route}
          navItems={navItems}
          isMobile={isMobile}
          onMenuClick={() => setDrawerOpen(true)}
          onAdd={onAdd}
        />
        <main style={{
          flex: 1,
          padding: isMobile ? "16px 14px 24px" : "24px clamp(16px, 3vw, 40px) 48px",
          maxWidth: 1440, width: "100%", margin: "0 auto",
        }}>
          {route === "dashboard" && (
            <ModernDashboard theme={theme} transactions={txs} getCard={getCardById} getOwner={getOwnerById} setRoute={setRoute} chartStyle={chartStyle} isMobile={isMobile} />
          )}
          {route === "transactions" && (
            <ModernTransactions theme={theme} transactions={txs} getCard={getCardById} getOwner={getOwnerById} owners={owners} cards={cards} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} isMobile={isMobile} />
          )}
          {route === "monthly" && (
            <ModernMonthly theme={theme} transactions={txs} chartStyle={chartStyle} isMobile={isMobile} />
          )}
          {route === "settings" && (
            <ModernSettings
              theme={theme}
              currentTheme={themeKey}
              setTheme={setTheme}
              font={font}
              setFont={setFont}
              chartStyle={chartStyle}
              setChartStyle={setChartStyle}
              onSwitchToClassic={onExitModern}
              isMobile={isMobile}
            />
          )}
        </main>
        {isMobile && <BottomTabs theme={theme} navItems={navItems} route={route} setRoute={setRoute} />}
      </div>
    </div>
  );
}

// Re-export so callers can hook into the same palette resolver as the classic app.
export { getThemeColors };
