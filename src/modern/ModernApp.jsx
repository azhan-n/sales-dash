// ModernApp — top-level Modern (Ledgerline) shell. Reads existing app state via props,
// derives a design-system theme object from the active palette, and renders the right view.
// Owns its own modal tree (TransactionForm, MonthlyForm, ConfirmDialog) styled to the Modern theme.
import React, { useEffect, useMemo, useState } from "react";
import { getThemeColors } from "../themes";
import { inferArchivePeriod, parseDate, getTodayDate } from "../utils";
import { Sidebar, TopBar, BottomTabs } from "./Nav";
import { I } from "./ui";
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

  // Confirm dialog state for delete actions originating in Modern.
  const [confirmDelete, setConfirmDelete] = useState(null);    // { kind, payload }
  // kind: "tx" (single transaction), "bulk" (selected transactions), "monthly" (single monthly record)
  const [confirmArchive, setConfirmArchive] = useState(false);

  useEffect(() => { lsSet("modern_route", route); }, [route]);
  useEffect(() => { lsSet("modern_chartStyle", chartStyle); }, [chartStyle]);

  const theme = useMemo(() => buildTheme({ themeKey, palette, font }), [themeKey, palette, font]);

  const navItems = [
    { key: "dashboard", label: "Overview", icon: I.home },
    { key: "transactions", label: "Transactions", icon: I.list },
    { key: "monthly", label: "Monthly", icon: I.calendar },
    { key: "settings", label: "Settings", icon: I.settings },
  ];

  const isHistory = selectedPeriod && selectedPeriod !== "current";
  const sourceTxs = isHistory ? (historyTransactions || []) : transactions;

  const txs = useMemo(() => sourceTxs.map((t) => ({
    ...t,
    date: parseDate(t.date),
  })), [sourceTxs]);

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
    minHeight: "100vh",
    background: theme.bg,
    backgroundImage: theme.bgGrad || undefined,
    color: theme.text,
    fontFamily: `"${font}", -apple-system, BlinkMacSystemFont, sans-serif`,
    display: "flex",
    WebkitFontSmoothing: "antialiased",
  };

  const bulkCount = confirmDelete?.kind === "bulk" ? (selectedTxIds?.size || 0) : 0;

  return (
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
      />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <TopBar
          theme={theme}
          route={route}
          navItems={navItems}
          isMobile={isMobile}
          onMenuClick={() => setDrawerOpen(true)}
          onAdd={handleAddTx}
        />
        <main style={{
          flex: 1,
          padding: isMobile ? "16px 14px 24px" : "24px clamp(16px, 3vw, 40px) 48px",
          maxWidth: 1440, width: "100%", margin: "0 auto",
        }}>
          {route === "dashboard" && (
            <ModernDashboard
              theme={theme}
              transactions={txs}
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
            />
          )}
        </main>
        {isMobile && <BottomTabs theme={theme} navItems={navItems} route={route} setRoute={setRoute} />}
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
  );
}

export { getThemeColors };
