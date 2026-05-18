// ModernApp — top-level Modern (Tether Line) shell. Reads existing app state via props,
// derives a design-system theme object from the active palette, and renders the right view.
// Owns its own modal tree (TransactionForm, MonthlyForm, ConfirmDialog) styled to the Modern theme.
import React, { useEffect, useMemo, useState } from "react";
import { getThemeColors } from "../themes";
import { inferArchivePeriod, parseDate, getTodayDate } from "../utils";
import { Sidebar, TopBar, BottomTabs } from "./Nav";
import { I, IconContext, useIcons } from "./ui";
import { ICON_PACKS } from "../iconPacks";
import { ModernDashboard } from "./Dashboard";
import { ModernTransactions } from "./Transactions";
import { ModernMonthly } from "./Monthly";
import { ModernSettings } from "./Settings";
import { TransactionForm } from "./TransactionForm";
import { MonthlyForm } from "./MonthlyForm";
import { ConfirmDialog } from "./ConfirmDialog";

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

function makeModernIcons(packKey) {
  const pack = ICON_PACKS[packKey];
  if (!pack) return I;
  const c = (Comp) => (p) => React.createElement(Comp, { size: p });
  return {
    ...I,
    home:     c(pack.LayoutGrid),
    list:     c(pack.List),
    calendar: c(pack.Calendar),
    settings: c(pack.Settings),
    plus:     c(pack.Plus),
    search:   c(pack.Search),
    download: c(pack.Download),
    edit:     c(pack.Pencil),
    trash:    c(pack.Trash2),
    x:        c(pack.X),
    filter:   c(pack.Filter),
    chevron:  c(pack.ChevronDown),
    trending: c(pack.TrendingUp),
    dollar:   c(pack.DollarSign),
    user:     c(pack.User),
    timer:    c(pack.Timer),
  };
}

function buildTheme({ themeKey, palette, font, boldText }) {
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
    bold: !!boldText,
    fw: boldText
      ? { label: 600, body: 500, value: 700, heading: 800, heavy: 900 }
      : { label: 500, body: 400, value: 600, heading: 700, heavy: 800 },
    fz: (n) => `calc(${n}px * var(--fz-scale, 1))`,
  };
}

export function ModernApp({
  themeKey, palette, font, userEmail = "", isMobile: parentIsMobile,
  // shared data
  transactions, owners, cards, monthly,
  ownerStats,
  getCardById, getOwnerById,
  // settings
  setTheme, setFont, onExitModern,
  // transaction form (shared with Classic)
  txForm, setTxForm,
  showTxForm, setShowTxForm,
  editingTxId, setEditingTxId,
  submitting,
  cardTypes, ownerInfoMap, recentRates,
  submitTransaction,
  editTransaction,
  // delete + bulk
  deleteTransaction,
  selectedTxIds, setSelectedTxIds,
  deleteSelectedTransactions,
  // monthly form (shared with Classic)
  monthlyForm, setMonthlyForm,
  showMonthlyForm, setShowMonthlyForm,
  editingMonthlyId, setEditingMonthlyId,
  submitMonthly, deleteMonthlyRecord,
  // archive history
  historyPeriods, selectedPeriod, setSelectedPeriod, fetchHistoryForPeriod,
  historyTransactions, loadingHistory,
  onArchive,
}) {
  const localIsMobile = useIsMobile(760);
  const isMobile = parentIsMobile ?? localIsMobile;
  const [route, setRoute] = useState(() => lsGet("modern_route", "dashboard"));
  const [chartStyle, setChartStyle] = useState(() => lsGet("modern_chartStyle", "area"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editModeMonthly, setEditModeMonthly] = useState(false);
  const [fontScale, setFontScale] = useState(() => parseFloat(lsGet("modern_fontScale")) || 1.0);
  const [textScale, setTextScale] = useState(() => parseFloat(lsGet("modern_textScale")) || 1.0);
  const [iconPack, setIconPack] = useState(() => lsGet("iconPack") || "lucide");
  const [boldText, setBoldText] = useState(() => lsGet("boldText") === "true");
  useEffect(() => { lsSet("modern_fontScale", fontScale.toString()); }, [fontScale]);
  useEffect(() => { lsSet("modern_textScale", textScale.toString()); }, [textScale]);
  useEffect(() => { lsSet("iconPack", iconPack); }, [iconPack]);
  useEffect(() => { lsSet("boldText", boldText.toString()); }, [boldText]);

  // Confirm dialog state for delete actions originating in Modern.
  const [confirmDelete, setConfirmDelete] = useState(null);    // { kind, payload }
  // kind: "tx" (single transaction), "bulk" (selected transactions), "monthly" (single monthly record)
  const [confirmArchive, setConfirmArchive] = useState(false);

  useEffect(() => { lsSet("modern_route", route); }, [route]);
  useEffect(() => { lsSet("modern_chartStyle", chartStyle); }, [chartStyle]);

  const theme = useMemo(() => buildTheme({ themeKey, palette, font, boldText }), [themeKey, palette, font, boldText]);
  const icons = useMemo(() => makeModernIcons(iconPack), [iconPack]);

  const navItems = [
    { key: "dashboard", label: "Overview", icon: icons.home },
    { key: "transactions", label: "Transactions", icon: icons.list },
    { key: "monthly", label: "Monthly", icon: icons.calendar },
    { key: "settings", label: "Settings", icon: icons.settings },
  ];

  const isHistory = selectedPeriod && selectedPeriod !== "current";
  const sourceTxs = isHistory ? (historyTransactions || []) : transactions;

  // txs switches to history when a period is selected (used by Transactions tab).
  const txs = useMemo(() => sourceTxs.map((t) => ({
    ...t,
    date: parseDate(t.date),
  })), [sourceTxs]);

  // currentTxs is always the live current-period data regardless of period selection.
  // Used by Dashboard so the Overview never shows archived data.
  const currentTxs = useMemo(() => transactions.map((t) => ({
    ...t,
    date: parseDate(t.date),
  })), [transactions]);

  const handleAddTx = () => {
    setEditingTxId(null);
    setTxForm({ cardType: "VISA DEBIT", cardNumber: "", owner: "", buyRate: "15.42", buyAmount: "", sellRate: "", sellAmount: "", date: getTodayDate() });
    setShowTxForm(true);
  };

  const handleEditTx = (tx) => {
    // The view receives Date-converted transactions; editTransaction expects the
    // raw shape with a "dd/mm/yy" string date. Look up the original record by id.
    const original = transactions.find((t) => t.id === tx.id) || tx;
    editTransaction(original);
  };
  const handleDeleteTx = (tx) => setConfirmDelete({ kind: "tx", payload: tx });
  const handleBulkDelete = () => setConfirmDelete({ kind: "bulk" });
  const handleDeleteMonthly = (m) => setConfirmDelete({ kind: "monthly", payload: m });

  const onConfirmDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.kind === "tx") {
      deleteTransaction(confirmDelete.payload);
    } else if (confirmDelete.kind === "bulk") {
      deleteSelectedTransactions();
    } else if (confirmDelete.kind === "monthly") {
      deleteMonthlyRecord?.(confirmDelete.payload.id);
    }
    setConfirmDelete(null);
  };

  const pageStyle = {
    minHeight: "100dvh",
    background: theme.bg,
    backgroundImage: theme.bgGrad || undefined,
    color: theme.text,
    fontFamily: `"${font}", -apple-system, BlinkMacSystemFont, sans-serif`,
    display: "flex",
    WebkitFontSmoothing: "antialiased",
    zoom: fontScale,
    "--fz-scale": textScale,
  };

  const bulkCount = confirmDelete?.kind === "bulk" ? (selectedTxIds?.size || 0) : 0;

  return (
    <IconContext.Provider value={icons}>
    <div style={pageStyle}>
      <Sidebar
        theme={theme}
        navItems={navItems}
        route={route}
        setRoute={setRoute}
        onAdd={handleAddTx}
        isMobile={isMobile}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        fontScale={fontScale}
      />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <TopBar
          theme={theme}
          route={route}
          navItems={navItems}
          isMobile={isMobile}
          userEmail={userEmail}
          onMenuClick={() => setDrawerOpen(true)}
          onAdd={handleAddTx}
          fontScale={fontScale}
        />
        <main style={{
          flex: 1,
          padding: isMobile
            ? "16px 14px calc(76px + env(safe-area-inset-bottom))"
            : "24px clamp(16px, 3vw, 40px) 48px",
          maxWidth: 1440, width: "100%", margin: "0 auto",
        }}>
          <div key={route} style={{ animation: "slideUp .28s cubic-bezier(.16,1,.3,1) both" }}>
          {route === "dashboard" && (
            <ModernDashboard
              theme={theme}
              transactions={currentTxs}
              monthly={monthly}
              owners={owners}
              ownerStats={ownerStats}
              getCard={getCardById}
              getOwner={getOwnerById}
              setRoute={setRoute}
              chartStyle={chartStyle}
              isMobile={isMobile}
            />
          )}
          {route === "transactions" && (
            <ModernTransactions
              theme={theme}
              transactions={txs}
              getCard={getCardById}
              getOwner={getOwnerById}
              owners={owners}
              cards={cards}
              onAdd={handleAddTx}
              onEdit={handleEditTx}
              onDelete={handleDeleteTx}
              isMobile={isMobile}
              historyPeriods={historyPeriods}
              selectedPeriod={selectedPeriod}
              setSelectedPeriod={(p) => { setSelectedPeriod(p); if (p !== "current") fetchHistoryForPeriod(p); }}
              loadingHistory={loadingHistory}
              selectedTxIds={selectedTxIds}
              setSelectedTxIds={setSelectedTxIds}
              onBulkDelete={handleBulkDelete}
            />
          )}
          {route === "monthly" && (
            <ModernMonthly
              theme={theme}
              transactions={txs}
              monthly={monthly}
              chartStyle={chartStyle}
              isMobile={isMobile}
              editModeMonthly={editModeMonthly}
              setEditModeMonthly={setEditModeMonthly}
              setMonthlyForm={setMonthlyForm}
              setShowMonthlyForm={setShowMonthlyForm}
              setEditingMonthlyId={setEditingMonthlyId}
              onDeleteMonthly={handleDeleteMonthly}
              onRequestArchive={onArchive ? () => setConfirmArchive(true) : null}
              archiveCount={transactions.length}
            />
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
              fontScale={fontScale}
              setFontScale={setFontScale}
              textScale={textScale}
              setTextScale={setTextScale}
              iconPack={iconPack}
              setIconPack={setIconPack}
              boldText={boldText}
              setBoldText={setBoldText}
            />
          )}
          </div>
        </main>
        {isMobile && <BottomTabs theme={theme} navItems={navItems} route={route} setRoute={setRoute} fontScale={fontScale} />}
      </div>

      {/* Themed transaction form */}
      <TransactionForm
        theme={theme}
        txForm={txForm}
        setTxForm={setTxForm}
        editingTxId={editingTxId}
        setEditingTxId={setEditingTxId}
        showTxForm={showTxForm}
        setShowTxForm={setShowTxForm}
        submitting={submitting}
        cardTypes={cardTypes}
        ownerInfoMap={ownerInfoMap}
        recentRates={recentRates}
        onSubmit={submitTransaction}
      />

      {/* Themed monthly form */}
      <MonthlyForm
        theme={theme}
        monthlyForm={monthlyForm}
        setMonthlyForm={setMonthlyForm}
        showMonthlyForm={showMonthlyForm}
        setShowMonthlyForm={setShowMonthlyForm}
        editingMonthlyId={editingMonthlyId}
        setEditingMonthlyId={setEditingMonthlyId}
        submitting={submitting}
        onSubmit={submitMonthly}
      />

      {/* Themed confirm dialog (single tx, bulk, monthly) */}
      <ConfirmDialog
        open={!!confirmDelete}
        theme={theme}
        danger
        title={
          confirmDelete?.kind === "bulk"
            ? `Delete ${bulkCount} transaction${bulkCount === 1 ? "" : "s"}?`
            : confirmDelete?.kind === "monthly"
              ? "Delete monthly record?"
              : "Delete transaction?"
        }
        message={
          confirmDelete?.kind === "bulk"
            ? "This action will permanently delete the selected transactions."
            : confirmDelete?.kind === "monthly"
              ? `${confirmDelete?.payload?.month} will be permanently removed.`
              : "This transaction will be permanently deleted and cannot be recovered."
        }
        confirmLabel={
          confirmDelete?.kind === "bulk"
            ? `Delete ${bulkCount}`
            : "Delete"
        }
        onConfirm={onConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Archive confirm dialog */}
      <ConfirmDialog
        open={confirmArchive}
        theme={theme}
        title="Archive current period?"
        message={(() => {
          const period = inferArchivePeriod(transactions);
          const net = transactions.reduce((s, t) => s + (parseFloat(t.netProfit) || 0), 0);
          return `${transactions.length} transactions will move to history under "${period}". A monthly record with net profit ${net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} will be created. The main table will be cleared.`;
        })()}
        confirmLabel="Archive"
        onConfirm={() => { setConfirmArchive(false); onArchive?.(); }}
        onCancel={() => setConfirmArchive(false)}
      />
    </div>
    </IconContext.Provider>
  );
}

export { getThemeColors };
