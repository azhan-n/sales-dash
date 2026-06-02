import React, { useState, useEffect, useMemo, useCallback } from "react";

// Safe localStorage wrapper (throws in some private-browsing contexts)
const lsGet = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const lsSet = (key, val) => { try { localStorage.setItem(key, val); } catch {} };

import { supabase } from "./supabaseClient";
import { getThemeColors } from "./themes";
import { normalizeCardType, getTodayDate, normalizeDate, inferArchivePeriod } from "./utils";
import { ToastProvider, useToast } from "./Toast";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { ModernApp } from "./modern/ModernApp";
import { ErrorBoundary } from "./ErrorBoundary";

const APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";

if (typeof document !== 'undefined') {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&family=League+Spartan:wght@300;400;500;600;700;800;900&family=Open+Sans:wght@300;400;500;600;700;800&family=Lexend:wght@300;400;500;600;700;800;900&family=Rethink+Sans:wght@400;500;600;700;800&family=Noto+Sans:wght@300;400;500;600;700;800;900&family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

function AppInner() {
  const toast = useToast();
  // --- Data ---
  const [transactions, setTransactions] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [owners, setOwners] = useState([]);
  const [cards, setCards] = useState([]);
  const [stats, setStats] = useState({});
  const [ownerInfoMap, setOwnerInfoMap] = useState({});
  const [loading, setLoading] = useState(true);

  // --- Appearance (shared with Modern view) ---
  const [theme, setTheme] = useState(() => lsGet("theme") || "ledgerline");
  const [selectedFont, setSelectedFont] = useState(() => lsGet("font") || "Poppins");

  // --- Forms / editing ---
  const [submitting, setSubmitting] = useState(false);
  const [showTxForm, setShowTxForm] = useState(false);
  const [editingTxId, setEditingTxId] = useState(null);
  const [txForm, setTxForm] = useState({ cardType: "VISA DEBIT", cardNumber: "", owner: "", buyRate: "15.42", buyAmount: "", sellRate: "", sellAmount: "", date: getTodayDate() });
  const [showMonthlyForm, setShowMonthlyForm] = useState(false);
  const [editingMonthlyId, setEditingMonthlyId] = useState(null);
  const [monthlyForm, setMonthlyForm] = useState({ month: "", profit: "" });

  // --- Bulk select ---
  const [selectedTxIds, setSelectedTxIds] = useState(new Set());

  // --- Account ---
  const [userEmail, setUserEmail] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  const c = getThemeColors(theme);

  useEffect(() => { lsSet("theme", theme); }, [theme]);
  useEffect(() => { lsSet("font", selectedFont); }, [selectedFont]);

  // Sync iOS status bar & body background with theme
  useEffect(() => {
    document.body.style.backgroundColor = c.bg;
    document.body.style.margin = "0";
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "theme-color"; document.head.appendChild(meta); }
    meta.content = c.bg;
    const vp = document.querySelector('meta[name="viewport"]');
    if (vp && !vp.content.includes("viewport-fit")) vp.content += ", viewport-fit=cover";
    return () => { document.body.style.backgroundColor = ""; };
  }, [c.bg]);

  // Current user email for the Account section in settings
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setUserEmail(data.user.email);
    });
  }, []);
  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
  };

  // --- Data fetch + derivation ---
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [txRes, mRes, oiRes] = await Promise.all([
        supabase.from("transactions")
          .select("id, card_type, card_number, owner, buy_rate, buy_amount, sell_rate, sell_amount, cost, gross_profit, net_profit, date, created_at")
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase.from("monthly").select("id, month, profit").order("id", { ascending: true }),
        supabase.from("owner_info").select("owner_name, type, card_number"),
      ]);
      if (txRes.error) throw txRes.error;
      if (mRes.error) throw mRes.error;
      const oiMap = {};
      (oiRes.data || []).forEach((r) => {
        const key = r.owner_name.toUpperCase();
        if (!oiMap[key]) oiMap[key] = [];
        oiMap[key].push({ type: r.type, cardNumber: r.card_number.trim() });
      });
      setOwnerInfoMap(oiMap);
      const txData = (txRes.data || []).map((r) => ({
        id: r.id, cardType: r.card_type, cardNumber: r.card_number, owner: r.owner,
        buyRate: r.buy_rate, buyAmount: r.buy_amount, sellRate: r.sell_rate, sellAmount: r.sell_amount,
        cost: r.cost, grossProfit: r.gross_profit, netProfit: r.net_profit, date: normalizeDate(r.date),
      }));
      if (txData.length > 0) processTransactions(txData);
      else { setTransactions([]); setOwners([]); setCards([]); setStats({}); }
      setMonthly((mRes.data || []).map((r) => ({ id: r.id, month: r.month, profit: parseFloat(r.profit) || 0 })));
    } catch (err) { toast.error("Failed to load data: " + (err.message || "Check connection")); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, []);

  const processTransactions = (data) => {
    const today = getTodayDate();
    const nd = data.map((t, i) => ({ ...t, cardType: normalizeCardType(t.cardType), date: normalizeDate(t.date) || today, _idx: i }));
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

  const recentRates = useMemo(() =>
    transactions.slice(0, 10).map((t) => parseFloat(t.sellRate) || 0).filter((v) => v > 0),
  [transactions]);
  const cardTypes = ["VISA DEBIT", "VISA CREDIT", "AMEX", "SELLER", "MASTERCARD"];

  // --- Transaction create / update ---
  const submitTransaction = async () => {
    if (!txForm.owner || !txForm.cardNumber) return;
    const br = parseFloat(txForm.buyRate) || 0, ba = parseFloat(txForm.buyAmount) || 0;
    const sr = parseFloat(txForm.sellRate) || 0, sa = parseFloat(txForm.sellAmount) || 0;
    const cost = br * ba, gross = sr * sa, net = gross - cost;
    const row = {
      card_type: txForm.cardType, card_number: txForm.cardNumber, owner: txForm.owner,
      buy_rate: br, buy_amount: ba, sell_rate: sr, sell_amount: sa,
      cost, gross_profit: gross, net_profit: net, date: txForm.date || getTodayDate(),
    };
    setShowTxForm(false);
    setTxForm({ cardType: "VISA DEBIT", cardNumber: "", owner: "", buyRate: "15.42", buyAmount: "", sellRate: "", sellAmount: "", date: getTodayDate() });
    const wasEditing = editingTxId;
    setEditingTxId(null);
    try {
      const { error: err } = wasEditing
        ? await supabase.from("transactions").update(row).eq("id", wasEditing)
        : await supabase.from("transactions").insert(row);
      if (err) throw err;
      toast.success(wasEditing ? "Transaction updated" : "Transaction saved");
      fetchData(true);
    } catch (err) { toast.error("Failed to save: " + err.message); fetchData(true); }
  };

  const editTransaction = useCallback((t) => {
    const cd = getCardById(t.cardId); const ow = getOwnerById(t.ownerId);
    setTxForm({
      cardType: cd?.type || "VISA DEBIT", cardNumber: cd?.number || "", owner: ow?.name || "",
      buyRate: String(parseFloat(t.buyRate) || ""), buyAmount: String(parseFloat(t.buyAmount) || ""),
      sellRate: String(parseFloat(t.sellRate) || ""), sellAmount: String(parseFloat(t.sellAmount) || ""),
      date: t.date || getTodayDate(),
    });
    setEditingTxId(t.id);
    setShowTxForm(true);
  }, [cards, owners]);

  const deleteTransaction = async (tx) => {
    try {
      const { error: err } = await supabase.from("transactions").delete().eq("id", tx.id);
      if (err) throw err;
      toast.success("Transaction deleted");
      fetchData(true);
    } catch (err) { toast.error("Failed to delete: " + err.message); }
  };

  const deleteSelectedTransactions = useCallback(() => {
    if (selectedTxIds.size === 0) return;
    const ids = [...selectedTxIds];
    const count = ids.length;
    setSelectedTxIds(new Set());
    const timer = setTimeout(async () => {
      try {
        const { error: err } = await supabase.from("transactions").delete().in("id", ids);
        if (err) throw err;
        fetchData(true);
      } catch (err) { toast.error("Failed to delete: " + err.message); fetchData(true); }
    }, 5000);
    toast.info(
      `Deleted ${count} transaction${count > 1 ? "s" : ""}`,
      5000,
      { label: "Undo", countdown: 5, onClick: () => { clearTimeout(timer); } }
    );
  }, [selectedTxIds, fetchData]);

  // --- Monthly create / update / delete ---
  const submitMonthly = async () => {
    if (!monthlyForm.month || !monthlyForm.profit) return;
    const formData = { ...monthlyForm };
    const editId = editingMonthlyId;
    setShowMonthlyForm(false);
    setMonthlyForm({ month: "", profit: "" });
    setEditingMonthlyId(null);
    try {
      if (editId) {
        const { error: err } = await supabase.from("monthly").update({
          month: formData.month, profit: parseFloat(formData.profit) || 0,
        }).eq("id", editId);
        if (err) throw err;
        toast.success("Monthly record updated");
      } else {
        const { error: err } = await supabase.from("monthly").insert({
          month: formData.month, profit: parseFloat(formData.profit) || 0,
        });
        if (err) throw err;
        toast.success("Monthly record saved");
      }
      fetchData(true);
    } catch (err) { toast.error("Failed to save monthly record: " + err.message); fetchData(true); }
  };

  const deleteMonthlyRecord = async (id) => {
    try {
      const { error: err } = await supabase.from("monthly").delete().eq("id", id);
      if (err) throw err;
      toast.success("Monthly record deleted");
      fetchData(true);
    } catch (err) { toast.error("Failed to delete: " + err.message); }
  };

  // --- Monthly transaction history (archive) ---
  const [historyPeriods, setHistoryPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [historyTransactions, setHistoryTransactions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistoryPeriods = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("get_archive_periods");
      if (error) throw error;
      setHistoryPeriods((data || []).map((r) => r.period));
    } catch (err) { console.error("fetchHistoryPeriods:", err.message); }
  }, []);

  const fetchHistoryForPeriod = useCallback(async (period) => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase.from("transaction_history")
        .select("id, card_type, card_number, owner, buy_rate, buy_amount, sell_rate, sell_amount, cost, gross_profit, net_profit, date")
        .eq("period", period).order("id", { ascending: true });
      if (error) throw error;
      if (data) {
        setHistoryTransactions(data.map((r) => ({
          id: r.id, cardType: r.card_type, cardNumber: r.card_number, owner: r.owner,
          buyRate: r.buy_rate, buyAmount: r.buy_amount, sellRate: r.sell_rate, sellAmount: r.sell_amount,
          cost: parseFloat(r.cost) || 0, grossProfit: parseFloat(r.gross_profit) || 0,
          netProfit: parseFloat(r.net_profit) || 0, date: normalizeDate(r.date),
          profitMargin: (parseFloat(r.cost) || 0) > 0 ? ((parseFloat(r.net_profit) || 0) / (parseFloat(r.cost) || 0)) * 100 : 0,
        })));
      }
    } catch (err) { console.error("fetchHistoryForPeriod:", err.message); toast.error("Failed to load history."); }
    finally { setLoadingHistory(false); }
  }, []);

  const archiveTransactions = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const now = new Date();
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const period = prev.toLocaleString("default", { month: "long", year: "numeric" });
      const { error } = await supabase.rpc("archive_transactions", { p_period: period });
      if (error) throw error;
      toast.success("Transactions archived successfully");
      fetchData(true);
      fetchHistoryPeriods();
    } catch (err) { toast.error("Failed to archive: " + err.message); }
    finally { setSubmitting(false); }
  }, [submitting, fetchData, fetchHistoryPeriods]);

  // Archive current transactions to history AND record their net profit total in
  // the monthly table. Used by the "Archive period" action.
  const archiveCurrentPeriodWithMonthly = useCallback(async () => {
    if (submitting) return;
    if (!transactions.length) { toast.error("No transactions to archive"); return; }
    setSubmitting(true);
    try {
      const period = inferArchivePeriod(transactions);
      const netProfitTotal = transactions.reduce((s, t) => s + (parseFloat(t.netProfit) || 0), 0);
      const { error: monthlyErr } = await supabase.from("monthly").insert({ month: period, profit: netProfitTotal });
      if (monthlyErr) throw monthlyErr;
      const { error: archiveErr } = await supabase.rpc("archive_transactions", { p_period: period });
      if (archiveErr) throw archiveErr;
      toast.success(`Archived ${transactions.length} transactions to ${period}; saved net profit to monthly`);
      fetchData(true);
      fetchHistoryPeriods();
    } catch (err) { toast.error("Failed to archive: " + err.message); }
    finally { setSubmitting(false); }
  }, [submitting, transactions, fetchData, fetchHistoryPeriods]);

  // Auto-archive check on the 1st of the month. Guarded by localStorage so it
  // runs at most once per period — otherwise every page reload on the 1st would
  // re-trigger the archive RPC and surface an error toast.
  useEffect(() => {
    const now = new Date();
    if (now.getDate() === 1) {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const period = prev.toLocaleString("default", { month: "long", year: "numeric" });
      if (lsGet("autoArchivedPeriod") !== period) {
        lsSet("autoArchivedPeriod", period);
        archiveTransactions();
      }
    }
    fetchHistoryPeriods();
  }, []);

  if (loading && transactions.length === 0) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: c.bg, color: c.textSec, fontFamily: `"${selectedFont}", sans-serif`, gap: "0.75rem" }}>
        <div style={{ width: 22, height: 22, border: `2.5px solid ${c.border}`, borderTopColor: c.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: "0.9375rem" }}>Loading…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <ErrorBoundary fullPage bg={c.bg} title="Something went wrong" message="An unexpected error occurred. Please refresh the page.">
      <ModernApp
        themeKey={theme}
        palette={c}
        font={selectedFont}
        userEmail={userEmail}
        handleSignOut={handleSignOut}
        signingOut={signingOut}
        transactions={transactions}
        owners={owners}
        cards={cards}
        monthly={monthly}
        ownerStats={stats.ownerStats}
        getCardById={getCardById}
        getOwnerById={getOwnerById}
        setTheme={setTheme}
        setFont={setSelectedFont}
        txForm={txForm}
        setTxForm={setTxForm}
        showTxForm={showTxForm}
        setShowTxForm={setShowTxForm}
        editingTxId={editingTxId}
        setEditingTxId={setEditingTxId}
        submitting={submitting}
        cardTypes={cardTypes}
        ownerInfoMap={ownerInfoMap}
        recentRates={recentRates}
        submitTransaction={submitTransaction}
        editTransaction={editTransaction}
        deleteTransaction={deleteTransaction}
        selectedTxIds={selectedTxIds}
        setSelectedTxIds={setSelectedTxIds}
        deleteSelectedTransactions={deleteSelectedTransactions}
        monthlyForm={monthlyForm}
        setMonthlyForm={setMonthlyForm}
        showMonthlyForm={showMonthlyForm}
        setShowMonthlyForm={setShowMonthlyForm}
        editingMonthlyId={editingMonthlyId}
        setEditingMonthlyId={setEditingMonthlyId}
        submitMonthly={submitMonthly}
        deleteMonthlyRecord={deleteMonthlyRecord}
        historyPeriods={historyPeriods}
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
        fetchHistoryForPeriod={fetchHistoryForPeriod}
        historyTransactions={historyTransactions}
        loadingHistory={loadingHistory}
        onArchive={archiveCurrentPeriodWithMonthly}
      />
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppInner />
      <SpeedInsights />
    </ToastProvider>
  );
}

export default App;
