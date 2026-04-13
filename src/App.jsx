import React, { useState, useEffect, useMemo, useCallback } from "react";

// Safe localStorage wrapper (throws in some private-browsing contexts)
const lsGet = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const lsSet = (key, val) => { try { localStorage.setItem(key, val); } catch {} };
import {
  TrendingUp, DollarSign, Filter, User, RefreshCw, LayoutGrid, List,
  Settings, X, Calendar, Timer, Plus, Pencil, Download, Search, Trash2, ChevronLeft, ChevronRight, ChevronDown,
} from "lucide-react";
import { supabase } from "./supabaseClient";
import { ICON_PACKS, ICON_PACK_KEYS } from "./iconPacks";
import { FONTS, THEME_OPTIONS, getThemeLayout, getThemeColors } from "./themes";
import { normalizeCardType, CARD_TYPES, getCardTypeColor, getCardTypeBadge, getTodayDate, exportToCSV, exportMonthlyToCSV, exportTransactionsPDF, exportMonthlyPDF } from "./utils";
import { SimplePieChart, ChartToggle, StatIcon } from "./Charts";
import { ToastProvider, useToast } from "./Toast";
import { StatCardsSkeleton, ChartSkeleton, TableSkeleton, SKELETON_CSS } from "./Skeleton";
import { TransactionForm } from "./TransactionForm";
import { MonthlyForm } from "./MonthlyForm";
import { ErrorBoundary } from "./ErrorBoundary";
import { ConfirmDialog } from "./ConfirmDialog";

const APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";

if (typeof document !== 'undefined') {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&family=League+Spartan:wght@300;400;500;600;700;800;900&family=Open+Sans:wght@300;400;500;600;700;800&family=Lexend:wght@300;400;500;600;700;800;900&family=Public+Sans:wght@300;400;500;600;700;800;900&family=Rethink+Sans:wght@400;500;600;700;800&family=Noto+Sans:wght@300;400;500;600;700;800;900&family=Noto+Serif:wght@300;400;500;600;700;800;900&family=Quicksand:wght@300;400;500;600;700&family=Winky+Sans:wght@300;400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

function AppInner() {
  const toast = useToast();
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
  const [theme, setTheme] = useState(() => lsGet("theme") || "sunset");
  const [viewMode, setViewMode] = useState("table");
  const [viewStyle, setViewStyle] = useState(() => lsGet("viewStyle") || "normal");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredStat, setHoveredStat] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFont, setSelectedFont] = useState(() => lsGet("font") || "Poppins");
  const [titleFont, setTitleFont] = useState(() => lsGet("titleFont") || "Poppins");
  const [fontSize, setFontSize] = useState(() => parseInt(lsGet("fontSize")) || 20);
  const [titleFontSize, setTitleFontSize] = useState(() => parseInt(lsGet("titleFontSize")) || 40);
  const [boldText, setBoldText] = useState(() => lsGet("boldText") === "true");
  const [pillTags, setPillTags] = useState(() => lsGet("pillTags") === "true");
  const [statCardCols, setStatCardCols] = useState(() => parseInt(lsGet("statCardCols")) || 4);
  const [iconPack, setIconPack] = useState(() => lsGet("iconPack") || "lucide");

  // Sort
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [monthlySort, setMonthlySort] = useState("name");
  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(() => parseInt(lsGet("autoRefresh")) || 0);
  const [hoveredBar, setHoveredBar] = useState(null);

  // Add form states
  const [showTxForm, setShowTxForm] = useState(false);
  const [showMonthlyForm, setShowMonthlyForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingTxId, setEditingTxId] = useState(null);
  const [txForm, setTxForm] = useState({ cardType: "VISA DEBIT", cardNumber: "", owner: "", buyRate: "15.42", buyAmount: "", sellRate: "", sellAmount: "", date: getTodayDate() });
  const [ownerInfoMap, setOwnerInfoMap] = useState({});
  const [pendingDelete, setPendingDelete] = useState(null); // { ids: Set }
  const [monthlyForm, setMonthlyForm] = useState({ month: "", profit: "" });
  const [editingMonthlyId, setEditingMonthlyId] = useState(null);
  const [editModeMonthly, setEditModeMonthly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState(() => lsGet("filterDateFrom") || "");
  const [filterDateTo, setFilterDateTo] = useState(() => lsGet("filterDateTo") || "");
  const [deleteCountdown, setDeleteCountdown] = useState(0);
  // Bulk select (declared here so deleteSelectedTransactions useCallback can reference it)
  const [selectedTxIds, setSelectedTxIds] = useState(new Set());

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
    // Close form immediately (optimistic)
    setShowTxForm(false);
    setTxForm({ cardType: "VISA DEBIT", cardNumber: "", owner: "", buyRate: "15.42", buyAmount: "", sellRate: "", sellAmount: "", date: getTodayDate() });
    const wasEditing = editingTxId;
    setEditingTxId(null);
    // Sync in background
    try {
      const { error: err } = wasEditing
        ? await supabase.from("transactions").update(row).eq("id", wasEditing)
        : await supabase.from("transactions").insert(row);
      if (err) throw err;
      toast.success(wasEditing ? "Transaction updated" : "Transaction saved");
      fetchData(true);
    } catch (err) { toast.error("Failed to save: " + err.message); setError("Failed to save: " + err.message); fetchData(true); }
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

  // --- Monthly Transaction History ---
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
          netProfit: parseFloat(r.net_profit) || 0, date: r.date || "",
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
    } catch (err) { toast.error("Failed to archive: " + err.message); setError("Failed to archive: " + err.message); }
    finally { setSubmitting(false); }
  }, [submitting]);

  const deleteSelectedTransactions = useCallback(() => {
    if (selectedTxIds.size === 0) return;
    const ids = [...selectedTxIds];
    const count = ids.length;
    setPendingDelete({ ids: new Set(ids) });
    setSelectedTxIds(new Set());
    setDeleteCountdown(5);
    const countInterval = setInterval(() => {
      setDeleteCountdown((prev) => {
        if (prev <= 1) { clearInterval(countInterval); return 0; }
        return prev - 1;
      });
    }, 1000);
    const timer = setTimeout(async () => {
      clearInterval(countInterval);
      setDeleteCountdown(0);
      setPendingDelete(null);
      try {
        const { error: err } = await supabase.from("transactions").delete().in("id", ids);
        if (err) throw err;
        fetchData(true);
      } catch (err) { toast.error("Failed to delete: " + err.message); fetchData(true); }
    }, 5000);
    toast.info(
      `Deleted ${count} transaction${count > 1 ? "s" : ""}`,
      5000,
      { label: "Undo", countdown: 5, onClick: () => { clearTimeout(timer); clearInterval(countInterval); setPendingDelete(null); setDeleteCountdown(0); } }
    );
  }, [selectedTxIds]);

  // Auto-archive check on the 1st of the month
  useEffect(() => {
    const now = new Date();
    if (now.getDate() === 1) archiveTransactions();
    fetchHistoryPeriods();
  }, []);

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
  const isSky = theme === "sky";

  // Icon pack — shadow lucide module-level imports with the selected pack's components
  const {
    TrendingUp, DollarSign, Filter, User, RefreshCw, LayoutGrid, List,
    Settings, X, Calendar, Timer, Plus, Pencil, Download, Search, Trash2,
    ChevronLeft, ChevronRight, ChevronDown,
  } = ICON_PACKS[iconPack] || ICON_PACKS.lucide;

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
  // Search
  const [searchQuery, setSearchQuery] = useState("");
  // Pagination
  const PAGE_SIZE = 25;
  const [currentPage, setCurrentPage] = useState(1);
  // Confirm dialogs
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  // Edit mode (shows checkboxes + pencil buttons)
  const [editMode, setEditMode] = useState(false);
  // Chart toggles
  const [profitChartMode, setProfitChartMode] = useState("bar");
  const [ownerChartMode, setOwnerChartMode] = useState("stats");
  const [expandedOwner, setExpandedOwner] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [cardTypeChartMode, setCardTypeChartMode] = useState("stats");

  const font = selectedFont;

  useEffect(() => { lsSet("theme", theme); }, [theme]);
  useEffect(() => { lsSet("font", selectedFont); }, [selectedFont]);
  useEffect(() => { lsSet("titleFont", titleFont); }, [titleFont]);
  useEffect(() => { lsSet("fontSize", fontSize.toString()); }, [fontSize]);
  useEffect(() => { lsSet("titleFontSize", titleFontSize.toString()); }, [titleFontSize]);

  // Apply font size to root HTML element so all rem units scale
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    return () => { document.documentElement.style.fontSize = ""; };
  }, [fontSize]);

  // Close settings modal on Escape
  useEffect(() => {
    if (!showSettings) return;
    const onKey = (e) => { if (e.key === "Escape") setShowSettings(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSettings]);

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
  useEffect(() => { lsSet("viewStyle", viewStyle); }, [viewStyle]);
  useEffect(() => { lsSet("boldText", boldText.toString()); }, [boldText]);
  useEffect(() => { lsSet("pillTags", pillTags.toString()); }, [pillTags]);
  useEffect(() => { lsSet("autoRefresh", autoRefresh.toString()); }, [autoRefresh]);
  useEffect(() => { lsSet("statCardCols", statCardCols.toString()); }, [statCardCols]);
  useEffect(() => { lsSet("iconPack", iconPack); }, [iconPack]);
  useEffect(() => { lsSet("filterDateFrom", filterDateFrom); }, [filterDateFrom]);
  useEffect(() => { lsSet("filterDateTo", filterDateTo); }, [filterDateTo]);

  // Auto-refresh timer
  useEffect(() => {
    if (autoRefresh > 0) {
      const interval = setInterval(() => fetchData(true), autoRefresh * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getProfitMarginBadge = (margin) => {
    const mkBadge = (bg, text) => ({ style: { display: "inline-flex", alignItems: "center", padding: isBrut ? "0.25rem 0.5rem" : "0.25rem 0.625rem", borderRadius: isBrut ? "0" : "9999px", fontSize: "0.75rem", fontWeight: bws, backgroundColor: bg, color: text, border: isBrut ? "2px solid #000" : "none" } });
    if (margin >= 20) return mkBadge(c.badgeGreen.bg, c.badgeGreen.text);
    if (margin >= 10) return mkBadge(c.badgeYellow.bg, c.badgeYellow.text);
    return mkBadge(c.badgeRed.bg, c.badgeRed.text);
  };

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
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
      setLastSync(new Date());
      const oiMap = {};
      (oiRes.data || []).forEach((r) => {
        const key = r.owner_name.toUpperCase();
        if (!oiMap[key]) oiMap[key] = [];
        oiMap[key].push({ type: r.type, cardNumber: r.card_number.trim() });
      });
      setOwnerInfoMap(oiMap);
      const txData = (txRes.data || []).map((r, i) => ({
        id: r.id, cardType: r.card_type, cardNumber: r.card_number, owner: r.owner,
        buyRate: r.buy_rate, buyAmount: r.buy_amount, sellRate: r.sell_rate, sellAmount: r.sell_amount,
        cost: r.cost, grossProfit: r.gross_profit, netProfit: r.net_profit, date: r.date || "",
      }));
      if (txData.length > 0) processTransactions(txData);
      else { setTransactions([]); setOwners([]); setCards([]); setStats({}); }
      setMonthly((mRes.data || []).map((r) => ({ id: r.id, month: r.month, profit: parseFloat(r.profit) || 0 })));
    } catch (err) { setError("Failed to load data: " + (err.message || "Check connection")); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, []);
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
  const OWNER_BADGES = isTerm ? Array.from({ length: 8 }, (_, i) => i % 2 === 0
    ? { bg: "rgba(0,255,65,0.12)", text: "#00ff41" }
    : { bg: "rgba(0,204,51,0.12)", text: "#00cc33" }
  ) : c.isDark ? [
    { bg: "rgba(96,165,250,0.15)",  text: "#93c5fd" },
    { bg: "rgba(251,146,60,0.15)",  text: "#fdba74" },
    { bg: "rgba(52,211,153,0.15)",  text: "#6ee7b7" },
    { bg: "rgba(196,181,253,0.15)", text: "#c4b5fd" },
    { bg: "rgba(249,168,212,0.15)", text: "#f9a8d4" },
    { bg: "rgba(103,232,249,0.15)", text: "#67e8f9" },
    { bg: "rgba(253,224,71,0.15)",  text: "#fde047" },
    { bg: "rgba(252,165,165,0.15)", text: "#fca5a5" },
  ] : [
    { bg: "#dbeafe", text: "#1d4ed8" }, { bg: "#ffedd5", text: "#c2410c" },
    { bg: "#dcfce7", text: "#15803d" }, { bg: "#ede9fe", text: "#6d28d9" },
    { bg: "#fce7f3", text: "#be185d" }, { bg: "#cffafe", text: "#0e7490" },
    { bg: "#fef9c3", text: "#a16207" }, { bg: "#fee2e2", text: "#b91c1c" },
  ];
  const getOwnerBadge = (ownerId) => OWNER_BADGES[((ownerId || 1) - 1) % OWNER_BADGES.length];
  const ownerBadgeStyle = (ownerId) => { const { bg, text } = getOwnerBadge(ownerId); return { display: "inline-flex", alignItems: "center", padding: isBrut ? "0.25rem 0.5rem" : "0.2rem 0.6rem", borderRadius: isBrut ? "0" : "9999px", fontSize: "0.75rem", fontWeight: bws, backgroundColor: bg, color: text, border: isBrut ? "2px solid #000" : "none", whiteSpace: "nowrap" }; };
  const _cardBadgesDark = { "VISA DEBIT": { bg: "rgba(96,165,250,0.15)", text: "#93c5fd" }, "VISA CREDIT": { bg: "rgba(52,211,153,0.15)", text: "#6ee7b7" }, AMEX: { bg: "rgba(196,181,253,0.15)", text: "#c4b5fd" }, SELLER: { bg: "rgba(148,163,184,0.15)", text: "#94a3b8" }, MASTERCARD: { bg: "rgba(253,224,71,0.15)", text: "#fde047" }, UNKNOWN: { bg: "rgba(148,163,184,0.15)", text: "#94a3b8" } };
  const _cardBadgesTerm = { "VISA DEBIT": { bg: "rgba(0,255,65,0.12)", text: "#00ff41" }, "VISA CREDIT": { bg: "rgba(0,204,51,0.12)", text: "#00cc33" }, AMEX: { bg: "rgba(0,255,65,0.08)", text: "#00ff41" }, SELLER: { bg: "rgba(0,204,51,0.08)", text: "#00cc33" }, MASTERCARD: { bg: "rgba(0,255,65,0.15)", text: "#00ff41" }, UNKNOWN: { bg: "rgba(0,204,51,0.06)", text: "#00cc33" } };
  const cardBadgeStyle = (type) => { const norm = normalizeCardType(type); const { bg, text } = isTerm ? (_cardBadgesTerm[norm] || _cardBadgesTerm.UNKNOWN) : (c.isDark ? (_cardBadgesDark[norm] || _cardBadgesDark.UNKNOWN) : (getCardTypeBadge(type))); return { display: "inline-flex", alignItems: "center", padding: isBrut ? "0.25rem 0.5rem" : "0.2rem 0.6rem", borderRadius: isBrut ? "0" : "9999px", fontSize: "0.75rem", fontWeight: bws, backgroundColor: bg, color: text, border: isBrut ? "2px solid #000" : "none", whiteSpace: "nowrap" }; };
  // pill(content, color, bg) — bg is used when pill tags are enabled
  const pill = (content, color, bg) => pillTags ? <span style={{ display: "inline-flex", alignItems: "center", padding: isBrut ? "0.15rem 0.4rem" : "0.15rem 0.55rem", borderRadius: isBrut ? "0" : "9999px", fontSize: "inherit", fontWeight: "inherit", backgroundColor: bg || c.surfaceAlt, color: color || c.text, border: isBrut ? "2px solid #000" : `1px solid ${color || c.border}`, whiteSpace: "nowrap" }}>{content}</span> : <span style={{ color: color || "inherit" }}>{content}</span>;
  // badge(content, color, bg) — always rendered as a pill, used for cost/gross/net profit
  const badge = (content, color, bg) => <span style={{ display: "inline-flex", alignItems: "center", padding: isBrut ? "0.15rem 0.4rem" : "0.2rem 0.6rem", borderRadius: isBrut ? "0" : "9999px", fontSize: "inherit", fontWeight: "inherit", backgroundColor: bg || c.surfaceAlt, color: color || c.text, border: isBrut ? "2px solid #000" : "none", whiteSpace: "nowrap" }}>{content}</span>;
  // Theme-aware profit colors — text and background, styled like the Margin badge
  const clCost  = isBrut ? c.text   : (isTerm ? c.accent : (c.isDark ? "#93c5fd" : "#3b82f6"));
  const clGross = isBrut ? c.text   : (isTerm ? c.accent : (c.isDark ? "#fdba74" : "#f97316"));
  const clNet   = isBrut ? c.text   : (isTerm ? c.accent : c.badgeGreen.text);
  const bgCost  = isBrut ? c.surfaceAlt : (isTerm ? c.badgeGreen.bg  : (c.isDark ? "rgba(147,197,253,0.15)" : "#eff6ff"));
  const bgGross = isBrut ? c.surfaceAlt : (isTerm ? c.badgeYellow.bg : (c.isDark ? "rgba(253,186,116,0.15)" : "#fff7ed"));
  const bgNet   = isBrut ? c.surfaceAlt : c.badgeGreen.bg;
  const selectBg = isGlass ? "rgba(20,14,48,0.85)" : (isLG ? "rgba(255,255,255,0.92)" : c.inputBg);

  // Reset card number filter when owner changes
  useEffect(() => { setFilterCardNumber("all"); }, [filterOwner]);
  // Reset to page 1 when filters/search change
  useEffect(() => { setCurrentPage(1); setSelectedTxIds(new Set()); }, [filterCardType, filterOwner, filterCardNumber, filterDateFrom, filterDateTo, searchQuery]);

  // Available card numbers based on selected owner
  const availableCardNumbers = useMemo(() =>
    filterOwner === "all"
      ? [...new Set(transactions.map((t) => getCardById(t.cardId)?.number).filter(Boolean))]
      : [...new Set(transactions.filter((t) => t.ownerId === parseInt(filterOwner)).map((t) => getCardById(t.cardId)?.number).filter(Boolean))],
  [transactions, filterOwner, cards]);

  // Filter + search
  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((t) => {
      if (pendingDelete?.ids.has(t.id)) return false;
      const cd = getCardById(t.cardId);
      const ow = getOwnerById(t.ownerId);
      if (filterCardType !== "all" && cd?.type !== filterCardType) return false;
      if (filterOwner !== "all" && t.ownerId !== parseInt(filterOwner)) return false;
      if (filterCardNumber !== "all" && cd?.number !== filterCardNumber) return false;
      if (filterDateFrom && t.date && t.date < filterDateFrom) return false;
      if (filterDateTo && t.date && t.date > filterDateTo) return false;
      if (q) {
        const haystack = [cd?.type, cd?.number, ow?.name, t.date].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, filterCardType, filterOwner, filterCardNumber, filterDateFrom, filterDateTo, searchQuery, cards, owners, pendingDelete]);

  // Sort
  const sortedTransactions = useMemo(() => [...filteredTransactions].sort((a, b) => {
    if (!sortCol) return 0;
    let va, vb;
    const colMap = { date: (t) => t.date || "", cardType: (t) => getCardById(t.cardId)?.type || "", cardNumber: (t) => getCardById(t.cardId)?.number || "", owner: (t) => getOwnerById(t.ownerId)?.name || "",
      buyRate: (t) => parseFloat(t.buyRate) || 0, buyAmount: (t) => parseFloat(t.buyAmount) || 0, sellRate: (t) => parseFloat(t.sellRate) || 0, sellAmount: (t) => parseFloat(t.sellAmount) || 0,
      cost: (t) => t.cost, grossProfit: (t) => t.grossProfit, netProfit: (t) => t.netProfit, profitMargin: (t) => t.profitMargin };
    const fn = colMap[sortCol];
    if (!fn) return 0;
    va = fn(a); vb = fn(b);
    if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortDir === "asc" ? va - vb : vb - va;
  }), [filteredTransactions, sortCol, sortDir, cards, owners]);

  // Pagination derived values
  const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / PAGE_SIZE));
  const pagedTransactions = useMemo(() =>
    sortedTransactions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
  [sortedTransactions, currentPage]);

  const recentRates = useMemo(() =>
    transactions.slice(0, 10).map((t) => parseFloat(t.sellRate) || 0).filter((v) => v > 0),
  [transactions]);

  const handleSort = useCallback((col) => {
    if (sortCol === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }, [sortCol, sortDir]);
  const cardTypes = CARD_TYPES;

  // -- Shared styles --
  const cardBase = { backgroundColor: c.surface, borderRadius: isCirc ? "2rem" : r, padding: isCompact ? "1rem" : "2rem", boxShadow: c.cardGlow ? `${c.shadow}, ${c.cardGlow}` : c.shadow, marginBottom: isCompact ? "1rem" : "2rem", border: isBrut ? `3px solid ${c.border}` : `1px solid ${c.border}`, ...(c.cardBackdrop ? { backdropFilter: c.cardBackdrop, WebkitBackdropFilter: c.cardBackdrop } : {}), animation: "fadeIn 0.35s cubic-bezier(.16,1,.3,1) both" };
  const thStyle = { padding: isCompact ? "0.5rem 0.5rem" : "0.75rem 0.625rem", textAlign: "left", fontSize: isCompact ? "0.6875rem" : "0.75rem", fontWeight: bws, color: c.textSec, backgroundColor: c.surfaceAlt, borderBottom: isBrut ? `3px solid ${c.border}` : `1px solid ${c.border}`, textTransform: isBrut ? "uppercase" : "none", letterSpacing: isBrut ? "0.1em" : "normal" };
  const tdStyle = { padding: isCompact ? "0.375rem 0.5rem" : "0.625rem 0.625rem", fontSize: isCompact ? "0.75rem" : "0.875rem", borderBottom: isBrut ? `2px solid ${c.border}` : isTerm ? `1px dashed ${c.border}` : `1px solid ${c.border}`, color: c.text, backgroundColor: c.surface };
  const sectionTitleStyle = { fontSize: isMobile ? "1rem" : (isCompact ? "1.125rem" : "1.5rem"), fontFamily: headingFont, fontWeight: bwh, marginBottom: isCompact ? "1rem" : "1.5rem", display: "flex", alignItems: "center", gap: isCompact ? "0.5rem" : "0.75rem", color: c.textStrong, textTransform: isBrut ? "uppercase" : "none", letterSpacing: isBrut ? "0.05em" : "normal" };

  // Compute even grid columns for card type stats
  const ctCount = Object.keys(stats.cardTypeStats || {}).length;
  const ctCols = isMobile ? "1fr" : (isCompact || isTablet ? `repeat(${Math.min(ctCount || 2, 3)}, 1fr)` : `repeat(${Math.min(ctCount || 3, 5)}, 1fr)`);

  if (loading && transactions.length === 0) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: c.bg, fontFamily: `"${font}", sans-serif` }}>
        <style>{`@keyframes skeletonShimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } } ${SKELETON_CSS}`}</style>
        {/* Skeleton header */}
        <div style={{ backgroundColor: c.surface, borderBottom: `1px solid ${c.border}`, padding: "1.5rem 1rem" }}>
          <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
            <div style={{ width: "200px", height: "2rem", borderRadius: "0.5rem", backgroundColor: "rgba(128,128,128,0.12)", backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)", backgroundSize: "200% 100%", animation: "skeletonShimmer 1.5s infinite linear", marginBottom: "0.5rem" }} />
            <div style={{ width: "160px", height: "0.875rem", borderRadius: "0.375rem", backgroundColor: "rgba(128,128,128,0.08)", backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)", backgroundSize: "200% 100%", animation: "skeletonShimmer 1.5s infinite linear" }} />
          </div>
        </div>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: isCompact ? "1rem" : "2rem 1rem" }}>
          <StatCardsSkeleton count={8} isMobile={isMobile} isCompact={isCompact} />
          <ChartSkeleton isMobile={isMobile} isCompact={isCompact} c={c} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: c.bg, backgroundImage: c.bgPattern || "none", fontFamily: `"${font}", sans-serif`, fontWeight: bw, position: "relative", overflowX: "hidden", paddingTop: "env(safe-area-inset-top)" }}>

      {isTerm && <div className="terminal-scanline"></div>}
      {isMid && <div className="midnight-stars"></div>}
      {isCirc && <>
        <div className="circ-blob" style={{ width: "min(400px,60vw)", height: "min(400px,60vw)", background: "#8b5cf6", top: "-100px", left: "-100px" }}></div>
        <div className="circ-blob" style={{ width: "min(300px,50vw)", height: "min(300px,50vw)", background: "#e879f9", bottom: "10%", right: "-80px" }}></div>
        <div className="circ-blob" style={{ width: "min(250px,40vw)", height: "min(250px,40vw)", background: "#6366f1", top: "40%", left: "30%" }}></div>
      </>}

      {/* HEADER */}
      <div style={{ backgroundColor: isSky ? "transparent" : ((isGlass || isLG) ? (isLG ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.04)") : c.surface), background: isSky ? "linear-gradient(135deg, #0284c7 0%, #0ea5e9 60%, #38bdf8 100%)" : undefined, boxShadow: isSky ? "0 4px 20px rgba(14,165,233,0.25)" : (isLG ? "0 1px 0 rgba(0,0,0,0.04)" : c.shadow), borderBottom: isSky ? "none" : (c.headerBorderBottom || `1px solid ${c.border}`), padding: isMobile ? "0.75rem 0.625rem" : (isCompact ? "0.875rem 1rem" : "1.5rem 1rem"), ...((isGlass || isLG) ? { backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)" } : {}), position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? "0.75rem" : "0" }}>
          <div>
            <h1 key={theme} style={{ fontSize: isBrut ? "3rem" : `${titleFontSize}px`, fontFamily: titleFontFamily, fontWeight: isBrut ? "900" : bwh, background: isSky ? "none" : c.titleGrad, WebkitBackgroundClip: isSky ? "unset" : "text", WebkitTextFillColor: isSky ? "#ffffff" : "transparent", backgroundClip: isSky ? "unset" : "text", color: isSky ? "#ffffff" : "transparent", display: "inline-block", width: "fit-content", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0, textTransform: isBrut ? "uppercase" : "none", letterSpacing: isBrut ? "0.05em" : "normal" }}>Sales Dashboard</h1>
            <p style={{ fontSize: isCompact ? "0.75rem" : "0.875rem", color: isSky ? "rgba(255,255,255,0.85)" : c.textSec, marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }} className={isTerm ? "terminal-glow" : ""}>
              {isTerm ? "> " : ""}{lastSync ? `Last updated: ${lastSync.toLocaleTimeString()}` : "Loading data..."} <span style={{ opacity: 0.5, fontSize: "0.75em" }}>v{APP_VERSION}</span>
              {autoRefresh > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.6875rem", color: isSky ? "#ffffff" : c.accent, backgroundColor: isSky ? "rgba(255,255,255,0.2)" : c.accentBg, padding: "0.125rem 0.5rem", borderRadius: "999px" }}><Timer size={10} />{autoRefresh}s</span>}
              <button onClick={fetchData} disabled={loading} style={{ padding: "0.5rem", borderRadius: isBrut ? "0" : (isCirc || isLG ? "50%" : "0.5rem"), border: isSky ? "1px solid rgba(255,255,255,0.3)" : (isBrut ? `2px solid ${c.border}` : `1px solid ${c.border}`), backgroundColor: isSky ? "rgba(255,255,255,0.15)" : c.inputBg, color: isSky ? "#ffffff" : c.text, cursor: loading ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", opacity: loading ? 0.6 : 1 }} title="Refresh"><RefreshCw size={16} style={loading ? { animation: "spin 1s linear infinite" } : {}} /></button>
              <button onClick={() => setShowSettings(true)} style={{ padding: "0.5rem", borderRadius: isBrut ? "0" : (isCirc || isLG ? "50%" : "0.5rem"), border: isSky ? "1px solid rgba(255,255,255,0.3)" : (isBrut ? `2px solid ${c.border}` : `1px solid ${c.border}`), backgroundColor: isSky ? "rgba(255,255,255,0.15)" : c.inputBg, color: isSky ? "#ffffff" : c.text, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }} title="Settings"><Settings size={16} /></button>
            </p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ backgroundColor: isSky ? "rgba(255,255,255,0.45)" : ((isGlass || isLG) ? (isLG ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.02)") : c.surface), borderBottom: isBrut ? `3px solid ${c.border}` : `1px solid ${isSky ? "rgba(255,255,255,0.5)" : c.border}`, boxShadow: isSky ? "0 2px 12px rgba(14,165,233,0.1)" : "none", ...((isGlass || isLG || isSky) ? { backdropFilter: "blur(20px) saturate(160%)", WebkitBackdropFilter: "blur(20px) saturate(160%)" } : {}), position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1rem" }}>
          <nav style={{ display: "flex", gap: isBrut ? "0" : (isMobile ? "1rem" : "2rem"), alignItems: "center" }}>
            {["dashboard", "transactions", "monthly"].map((tab) => (
              <button key={tab} onClick={() => { setActiveTab(tab); setShowExportMenu(false); }} style={{
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
            {activeTab === "dashboard" && (
              <div style={{ display: "flex", alignItems: "center", gap: "2px", marginLeft: isMobile ? "auto" : "1.5rem", borderLeft: isMobile ? "none" : `1px solid ${c.border}`, paddingLeft: isMobile ? 0 : "1.5rem" }}>
                {[1, 2, 3, 4].map((n) => (
                  <button key={n} onClick={() => setStatCardCols(n)} title={`${n} column${n > 1 ? "s" : ""}`} style={{ padding: "0.25rem", width: isMobile ? "1.75rem" : "2rem", height: isMobile ? "1.75rem" : "2rem", border: statCardCols === n ? `1.5px solid ${c.accent}` : `1px solid ${c.border}`, borderRadius: isBrut ? "0" : "0.375rem", backgroundColor: statCardCols === n ? c.accentBg : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.15s, background-color 0.15s" }}>
                    <div style={{ display: "grid", gridTemplateColumns: `repeat(${n}, 1fr)`, gap: "1.5px", width: isMobile ? "12px" : "14px" }}>
                      {Array.from({ length: n * 2 }).map((_, i) => (
                        <div key={i} style={{ height: isMobile ? "4px" : "5px", borderRadius: "1px", backgroundColor: statCardCols === n ? c.accent : c.textSec, opacity: statCardCols === n ? 0.9 : 0.4 }} />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {(activeTab === "transactions" || activeTab === "monthly") && (
              <div style={{ marginLeft: "auto", position: "relative" }}>
                <button onClick={() => setShowExportMenu(!showExportMenu)} style={{
                  padding: isCompact ? "0.375rem 0.625rem" : "0.5rem 0.875rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"),
                  border: `1px solid ${showExportMenu ? c.accent : c.border}`, backgroundColor: showExportMenu ? c.accentBg : c.inputBg,
                  color: showExportMenu ? c.accent : c.text, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.375rem",
                  fontSize: isCompact ? "0.75rem" : "0.8125rem", fontWeight: bwm,
                  transition: "border-color 0.15s, background-color 0.15s, color 0.15s",
                }}><Download size={isCompact ? 13 : 15} /> {isMobile ? "" : "Export"}</button>
                {showExportMenu && (
                  <div style={{
                    position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 100,
                    backgroundColor: isGlass ? "rgba(20,14,48,0.95)" : (isLG ? "rgba(255,255,255,0.85)" : c.surface),
                    border: `1px solid ${c.border}`, borderRadius: isBrut ? "0" : (isCirc ? "1rem" : "0.5rem"),
                    boxShadow: c.shadowLg, overflow: "hidden", minWidth: "120px",
                    animation: "slideUp 0.2s cubic-bezier(.16,1,.3,1) both",
                    ...((isGlass || isLG) ? { backdropFilter: "blur(16px) saturate(150%)", WebkitBackdropFilter: "blur(16px) saturate(150%)" } : {}),
                  }}>
                    <button onClick={() => {
                      if (activeTab === "transactions") exportToCSV(filteredTransactions, getCardById, getOwnerById, "transactions");
                      else exportMonthlyToCSV(monthly);
                      setShowExportMenu(false);
                    }} style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%", padding: "0.625rem 1rem", border: "none", backgroundColor: "transparent", color: c.text, cursor: "pointer", fontSize: "0.8125rem", fontWeight: bwm, textAlign: "left", transition: "background-color 0.1s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = c.accentBg} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                      <Download size={14} /> Download CSV
                    </button>
                    <div style={{ height: "1px", backgroundColor: c.border }}></div>
                    <button onClick={() => {
                      if (activeTab === "transactions") exportTransactionsPDF(filteredTransactions, getCardById, getOwnerById, "Transactions Report");
                      else exportMonthlyPDF(monthly);
                      setShowExportMenu(false);
                    }} style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%", padding: "0.625rem 1rem", border: "none", backgroundColor: "transparent", color: c.text, cursor: "pointer", fontSize: "0.8125rem", fontWeight: bwm, textAlign: "left", transition: "background-color 0.1s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = c.accentBg} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                      <Download size={14} /> Download PDF
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div onClick={() => showExportMenu && setShowExportMenu(false)} style={{ maxWidth: "80rem", margin: "0 auto", padding: isMobile ? "0.75rem 0.5rem" : (isCompact ? "1rem" : "2rem 1rem"), position: "relative", zIndex: 5, animation: "fadeIn 0.3s cubic-bezier(.16,1,.3,1) both" }}>
        {error && <div style={{ padding: isCompact ? "0.625rem" : "1rem", backgroundColor: c.errorBg, border: `1px solid ${c.errorBorder}`, borderRadius: r, color: c.errorText, marginBottom: isCompact ? "1rem" : "2rem", textAlign: "center", fontSize: isCompact ? "0.8125rem" : "inherit", animation: "shake 0.5s ease-in-out" }}><strong>Error:</strong> {error}</div>}
        <ErrorBoundary bg={c.bg} title="Section failed to render" message="An error occurred in this tab. Try refreshing or switching tabs.">

        {/* ===== DASHBOARD TAB ===== */}
        {activeTab === "dashboard" && (
          <div>
            {/* STAT CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: isBrut ? "1fr" : `repeat(${statCardCols}, 1fr)`, gap: isMobile ? "0.625rem" : (isCompact ? "0.75rem" : (isBrut ? "0.5rem" : "1.5rem")), marginBottom: isCompact ? "1rem" : "2rem" }}>
              {[
                { label: "Net Profit", value: stats.totalNetProfit, icon: TrendingUp, color: "Green", sub: "After costs", prefix: "ރ." },
                { label: "Total USDT Sold", value: stats.totalUsdtSold, icon: DollarSign, color: "Teal", sub: "Total sell amount", prefix: "₮ " },
                { label: "Gross Profit", value: stats.totalGrossProfit, icon: TrendingUp, color: "Orange", sub: "Total revenue", prefix: "ރ." },
                { label: "Total Cost", value: stats.totalCost, icon: DollarSign, color: "Blue", count: transactions.length, prefix: "ރ." },
                { label: "Dollar Used", value: stats.totalDollarUsed, icon: DollarSign, color: "Pink", sub: "Total buy amount" },
                { label: "Average Profit", value: stats.avgNetProfit, icon: TrendingUp, color: "Purple", sub: "Per transaction", prefix: "ރ." },
                { label: "Avg Buy Rate", value: stats.avgBuyRate, icon: DollarSign, color: "Teal", sub: "Average buy rate", noPrefix: true },
                { label: "Avg Sell Rate", value: stats.avgSellRate, icon: DollarSign, color: "Green", sub: "Average sell rate", noPrefix: true },
              ].map((stat, idx) => {
                const sc = c.statCards[stat.color] || {};
                const txtColor = sc.text || null;
                const iconSz = isCompact ? L.statIconSizeSm : L.statIconSize;
                const isRow = L.statCardDir === "row";
                const isGlassy = isGlass || isLG || isSky;
                return (
                  <div key={idx} className={isLG ? "lg-specular" : ""} style={{
                    padding: isMobile ? "1rem" : (isCompact ? "0.875rem" : (isBrut ? "1.5rem" : "2rem")),
                    borderRadius: isBrut ? "0" : r, color: txtColor || (isLG ? c.text : "#ffffff"),
                    background: sc.bg, border: sc.border || (isBrut ? "3px solid #000" : (isLG ? "1px solid rgba(255,255,255,0.6)" : (isCirc ? `2px solid ${c.border}` : "none"))),
                    boxShadow: isBrut ? "4px 4px 0 #000" : (isLG ? "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)" : (isCompact ? c.shadowLgCompact : c.shadowLg)),
                    ...((isGlass || isLG) ? { backdropFilter: "blur(16px) saturate(150%)", WebkitBackdropFilter: "blur(16px) saturate(150%)" } : {}),
                    cursor: "pointer", willChange: "transform, box-shadow, opacity",
                    display: (isRow && !isGlassy) ? "flex" : "block", alignItems: (isRow && !isGlassy) ? "center" : undefined, gap: (isRow && !isGlassy) ? "1.25rem" : undefined,
                    textAlign: isGlassy ? "center" : undefined,
                    transform: hoveredStat === idx ? (isBrut ? "translate(-2px,-2px)" : "translateY(-6px)") : "translateY(0)",
                    transition: "transform 0.2s cubic-bezier(.4,0,.2,1), box-shadow 0.2s cubic-bezier(.4,0,.2,1)",
                    animation: `slideUp 0.4s cubic-bezier(.16,1,.3,1) ${idx * 0.06}s both`,
                    ...(isBrut && hoveredStat === idx ? { boxShadow: "8px 8px 0 #000" } : {}),
                    ...(isBrut ? { marginBottom: "0.5rem" } : {}),
                    containerType: "inline-size",
                    minWidth: 0,
                    overflow: "hidden",
                  }}
                    onMouseEnter={() => setHoveredStat(idx)} onMouseLeave={() => setHoveredStat(null)}>
                    {isGlassy ? (
                      <>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}>
                          <StatIcon Icon={stat.icon} size={isCompact ? 24 : 32} layout={L} c={c} variant={stat.color} />
                        </div>
                        <div style={{ fontSize: isCompact ? "0.8125rem" : "0.9375rem", fontWeight: bwm, opacity: 0.85, color: txtColor || undefined, marginBottom: "0.375rem", letterSpacing: "0.02em" }}>{stat.label}</div>
                        <div style={{ fontSize: "clamp(1rem, 13cqi, 2.75rem)", fontWeight: "800", color: txtColor || undefined, lineHeight: 1.1, letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{stat.noPrefix ? "" : (stat.prefix || "$")}{stat.value?.toFixed(2) || 0}</div>
                        <div style={{ fontSize: isCompact ? "0.75rem" : "0.875rem", opacity: 0.75, marginTop: "0.5rem", color: txtColor || undefined }}>{stat.count ? `${stat.count} transactions` : stat.sub}</div>
                      </>
                    ) : isRow ? (
                      <>
                        <StatIcon Icon={stat.icon} size={iconSz} layout={L} c={c} variant={stat.color} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: isCompact ? "0.75rem" : "0.875rem", opacity: 0.9, fontWeight: bws, color: txtColor || undefined, marginBottom: "0.25rem" }}>{isTerm ? `> ${stat.label}` : stat.label}</div>
                          <div style={{ fontSize: "clamp(0.95rem, 11cqi, 2rem)", fontWeight: bwx, color: txtColor || undefined, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} className={isTerm ? "terminal-glow" : ""}>{stat.noPrefix ? "" : (stat.prefix || "$")}{stat.value?.toFixed(2) || 0}</div>
                          <div style={{ fontSize: "0.75rem", opacity: 0.7, color: txtColor || undefined }}>{stat.count ? `${stat.count} transactions` : stat.sub}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        {(isMid || isCirc) && L.statIconBg && <div style={{ display: "flex", justifyContent: "center" }}><StatIcon Icon={stat.icon} size={iconSz} layout={L} c={c} variant={stat.color} /></div>}
                        <div style={{ display: isCirc ? "block" : "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isCompact ? "0.5rem" : "1rem", textAlign: isCirc ? "center" : undefined }}>
                          <div style={{ fontSize: isCompact ? "0.75rem" : "1rem", opacity: 0.9, fontWeight: bws, color: txtColor || undefined, textTransform: isBrut ? "uppercase" : "none", letterSpacing: isBrut ? "0.05em" : "normal" }}>{stat.label}</div>
                          {!isMid && !isCirc && <StatIcon Icon={stat.icon} size={iconSz} layout={L} c={c} variant={stat.color} />}
                        </div>
                        <div style={{ fontSize: "clamp(0.95rem, 13cqi, 2.7rem)", fontWeight: bwx, color: txtColor || undefined, textAlign: (isMid || isCirc) ? "center" : undefined, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} className={isTerm ? "terminal-glow" : ""}>{stat.noPrefix ? "" : (stat.prefix || "$")}{stat.value?.toFixed(2) || 0}</div>
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
                      <div key={pct} style={{ position: "absolute", left: 0, bottom: `${2 + pct * (chartH - 32) / chartH * 100}%`, fontSize: isMobile ? "0.6875rem" : (isCompact ? "0.5625rem" : "0.625rem"), color: c.textMuted, width: "2.75rem", textAlign: "right", paddingRight: "0.5rem", transform: "translateY(50%)" }}>${Math.round(maxProfit * pct)}</div>
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
                                {m.month}: ރ.{m.profit.toFixed(2)}
                              </div>
                            )}
                            <div style={{
                              width: "100%", maxWidth: isMobile ? "28px" : "48px", height: `${barH}px`, minHeight: "4px",
                              background: c.accent, borderRadius: isCirc ? "999px" : (isBrut ? "0" : "4px 4px 0 0"),
                              transition: "height 0.5s cubic-bezier(.16,1,.3,1), opacity 0.15s cubic-bezier(.4,0,.2,1), transform 0.15s cubic-bezier(.4,0,.2,1)",
                              opacity: hoveredBar === null || hoveredBar === i ? 1 : 0.5,
                              transform: hoveredBar === i ? "scaleY(1.03)" : "scaleY(1)", transformOrigin: "bottom",
                            }}></div>
                            <div style={{ fontSize: isMobile ? "0.6875rem" : (isCompact ? "0.5625rem" : "0.6875rem"), color: c.textMuted, marginTop: "0.375rem", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
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
                          <div key={i} style={{ fontSize: isMobile ? "0.6875rem" : (isCompact ? "0.5625rem" : "0.6875rem"), color: c.textMuted, textAlign: "center" }}
                            onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHoveredBar(null)}>
                            {isMobile ? m.month.slice(0, 3) : m.month}
                          </div>
                        ))}
                      </div>
                    )}
                    {profitChartMode === "line" && hoveredBar !== null && monthly[hoveredBar] && (
                      <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: isCirc ? "999px" : rSm, padding: "0.375rem 0.75rem", fontSize: isCompact ? "0.625rem" : "0.75rem", color: c.text, fontWeight: bws, boxShadow: c.shadow, zIndex: 10 }}>
                        {monthly[hoveredBar].month}: ރ.{monthly[hoveredBar].profit.toFixed(2)}
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
                    <SimplePieChart data={[...owners].sort((a, b) => (stats.ownerStats?.[b.id]?.totalNetProfit || 0) - (stats.ownerStats?.[a.id]?.totalNetProfit || 0)).map((o) => ({ label: o.name, value: stats.ownerStats?.[o.id]?.totalNetProfit || 0 }))} colors={["#3b82f6", "#f97316", "#16a34a", "#8b5cf6", "#ec4899", "#06b6d4"]} size={isMobile ? 180 : 240} c={c} />
                  ) : (
                  <div style={{ display: (L.ownerLayout === "horizontal" && !isMobile) ? "flex" : "grid", flexDirection: L.ownerLayout === "horizontal" ? "column" : undefined, gap: isCompact ? "1rem" : "1.5rem" }}>
                    {[...owners].sort((a, b) => (stats.ownerStats?.[b.id]?.totalNetProfit || 0) - (stats.ownerStats?.[a.id]?.totalNetProfit || 0)).map((o) => {
                      const os = stats.ownerStats?.[o.id] || { count: 0, totalCost: 0, totalGrossProfit: 0, totalNetProfit: 0 };
                      const now2 = new Date();
                      const thisYm = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, "0")}`;
                      const prevDate = new Date(now2.getFullYear(), now2.getMonth() - 1, 1);
                      const prevYm = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
                      const ownerTxAll = transactions.filter((t) => t.ownerId === o.id);
                      const thisMonthNet = ownerTxAll.filter((t) => t.date && t.date.startsWith(thisYm)).reduce((s, t) => s + t.netProfit, 0);
                      const prevMonthNet = ownerTxAll.filter((t) => t.date && t.date.startsWith(prevYm)).reduce((s, t) => s + t.netProfit, 0);
                      const hasTrend = ownerTxAll.some((t) => t.date && t.date.startsWith(prevYm));
                      const trendPct = hasTrend && prevMonthNet !== 0 ? ((thisMonthNet - prevMonthNet) / Math.abs(prevMonthNet)) * 100 : null;
                      return (
                        <div key={o.id} style={{ cursor: "pointer" }} onClick={() => setExpandedOwner(expandedOwner === o.id ? null : o.id)}>
                        <div style={{ padding: isCompact ? "1rem" : "1.5rem", backgroundColor: c.surfaceAlt, borderRadius: isBrut ? "0" : (isCirc ? "1.5rem" : rSm), border: isBrut ? `2px solid ${c.border}` : `1px solid ${expandedOwner === o.id ? c.accent : c.border}`, ...(isBrut ? { boxShadow: "3px 3px 0 #000" } : {}), ...((isGlass || isLG) ? { backdropFilter: "blur(16px) saturate(150%)", WebkitBackdropFilter: "blur(16px) saturate(150%)" } : {}), transition: "border-color 0.15s ease" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: isCompact ? "0.625rem" : "1rem", gap: "0.5rem" }}>
                            <span style={{ fontFamily: headingFont, fontWeight: bwh, fontSize: isMobile ? "0.9375rem" : (isCompact ? "1rem" : "1.25rem"), color: c.textStrong, textTransform: isBrut ? "uppercase" : "none", display: "flex", alignItems: "center", gap: "0.5rem" }} className={isTerm ? "terminal-glow" : ""}>
                              <span style={ownerBadgeStyle(o.id)}>{isTerm ? `> ${o.name}` : o.name}</span>
                              {trendPct !== null ? (
                                <span style={{ fontSize: isCompact ? "0.6875rem" : "0.75rem", fontWeight: bwm, color: trendPct >= 0 ? "#16a34a" : "#dc2626" }}>
                                  {trendPct >= 0 ? "↑" : "↓"} {trendPct >= 0 ? "+" : ""}{trendPct.toFixed(1)}%
                                </span>
                              ) : null}
                              <span style={{ fontSize: "0.625rem", color: expandedOwner === o.id ? c.accent : c.textSec, transition: "transform 0.2s ease, color 0.15s ease", display: "inline-block", transform: expandedOwner === o.id ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
                            </span>
                            <span style={{ fontSize: isCompact ? "0.75rem" : "0.875rem", color: c.textSec, backgroundColor: c.surface, padding: "0.25rem 0.75rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), fontWeight: bws, border: isBrut ? "1px solid #000" : "none" }}>{os.count} transactions</span>
                          </div>
                          <div style={{ display: (L.ownerLayout === "horizontal" && !isMobile) ? "flex" : "grid", flexDirection: L.ownerLayout === "horizontal" ? "column" : undefined, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isCompact ? "0.625rem" : "1rem" }}>
                            {[{ label: "COST", value: os.totalCost, color: clCost, bg: bgCost }, { label: "GROSS", value: os.totalGrossProfit, color: clGross, bg: bgGross }, { label: "NET PROFIT", value: os.totalNetProfit, color: clNet, bg: bgNet }].map((s) => (
                              <div key={s.label} style={{ textAlign: "center", padding: isCompact ? "0.625rem" : "1rem", backgroundColor: c.surface, borderRadius: isBrut ? "0" : (isCirc ? "1.5rem" : rSm), flex: L.ownerLayout === "horizontal" ? 1 : undefined, border: isBrut ? "1px solid #000" : "none" }}>
                                <div style={{ fontSize: isCompact ? "0.6875rem" : "0.75rem", color: c.textSec, marginBottom: "0.25rem", fontWeight: bws, textTransform: isBrut ? "uppercase" : "none", letterSpacing: isBrut ? "0.05em" : "normal" }}>{s.label}</div>
                                <div style={{ fontSize: isCompact ? "1rem" : "1.375rem", fontWeight: bwx, marginTop: "0.25rem" }} className={isTerm ? "terminal-glow" : ""}>{badge(`ރ.${s.value.toFixed(2)}`, s.color, s.bg)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {expandedOwner === o.id && (() => {
                          const ownerTx = transactions.filter((t) => t.ownerId === o.id);
                          if (ownerTx.length === 0) return <div style={{ padding: "1rem", color: c.textSec, fontSize: "0.8125rem" }}>No transactions</div>;
                          return (
                            <div style={{ marginTop: isCompact ? "0.5rem" : "0.75rem", borderRadius: isBrut ? "0" : (isCirc ? "1rem" : rSm), overflow: "auto", WebkitOverflowScrolling: "touch", maxHeight: "60vh", border: `1px solid ${c.border}`, animation: "slideUp 0.25s cubic-bezier(.16,1,.3,1) both" }}>
                              <div>
                                <table style={{ width: "max-content", minWidth: "100%", borderCollapse: "collapse", fontSize: isCompact ? "0.6875rem" : "0.8125rem" }}>
                                  <thead><tr>
                                    {["Date", "Card", "Buy Rate", "Buy Amt", "Sell Rate", "Sell Amt", "Cost", "Gross", "Net"].map((h) => (
                                      <th key={h} style={{ padding: isCompact ? "0.375rem 0.5rem" : "0.5rem 0.625rem", textAlign: h === "Date" || h === "Card" ? "left" : "right", backgroundColor: c.surfaceDeep, color: c.textSec, fontWeight: bws, fontSize: isCompact ? "0.5625rem" : "0.6875rem", borderBottom: `1px solid ${c.border}`, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                                    ))}
                                  </tr></thead>
                                  <tbody>
                                    {ownerTx.map((t, ti) => {
                                      const cd = getCardById(t.cardId);
                                      return (
                                        <tr key={t.id} style={{ backgroundColor: ti % 2 === 0 ? "transparent" : c.surfaceAlt }}>
                                          <td style={{ padding: "0.375rem 0.5rem", color: c.textSec, whiteSpace: "nowrap" }}>{t.date || "-"}</td>
                                          <td style={{ padding: "0.375rem 0.5rem", whiteSpace: "nowrap" }}><span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: getCardTypeColor(cd?.type), marginRight: "0.375rem", verticalAlign: "middle" }}></span>{cd?.type} #{cd?.number}</td>
                                          <td style={{ padding: "0.375rem 0.5rem", textAlign: "right" }}>{parseFloat(t.buyRate).toFixed(2)}</td>
                                          <td style={{ padding: "0.375rem 0.5rem", textAlign: "right" }}>${parseFloat(t.buyAmount).toFixed(2)}</td>
                                          <td style={{ padding: "0.375rem 0.5rem", textAlign: "right" }}>{parseFloat(t.sellRate).toFixed(2)}</td>
                                          <td style={{ padding: "0.375rem 0.5rem", textAlign: "right" }}>₮ {parseFloat(t.sellAmount).toFixed(2)}</td>
                                          <td style={{ padding: "0.375rem 0.5rem", textAlign: "right", fontWeight: bws }}>{badge(`ރ.${t.cost.toFixed(2)}`, clCost, bgCost)}</td>
                                          <td style={{ padding: "0.375rem 0.5rem", textAlign: "right", fontWeight: bws }}>{badge(`ރ.${t.grossProfit.toFixed(2)}`, clGross, bgGross)}</td>
                                          <td style={{ padding: "0.375rem 0.5rem", textAlign: "right", fontWeight: bwx }}>{badge(`ރ.${t.netProfit.toFixed(2)}`, t.netProfit >= 0 ? clNet : (isTerm ? c.text : (c.isDark ? "#fca5a5" : "#ef4444")), t.netProfit >= 0 ? bgNet : (c.isDark ? "rgba(252,165,165,0.15)" : "#fee2e2"))}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                  <tfoot><tr style={{ backgroundColor: c.surfaceDeep, borderTop: `2px solid ${c.border}` }}>
                                    <td colSpan="2" style={{ padding: "0.5rem", fontWeight: bwx, fontSize: isCompact ? "0.6875rem" : "0.8125rem", color: c.textStrong }}>TOTALS</td>
                                    <td style={{ padding: "0.375rem 0.5rem", textAlign: "right" }}></td>
                                    <td style={{ padding: "0.375rem 0.5rem", textAlign: "right", fontWeight: bwx }}>${ownerTx.reduce((s, t) => s + (parseFloat(t.buyAmount) || 0), 0).toFixed(2)}</td>
                                    <td style={{ padding: "0.375rem 0.5rem", textAlign: "right" }}></td>
                                    <td style={{ padding: "0.375rem 0.5rem", textAlign: "right", fontWeight: bwx }}>₮ {ownerTx.reduce((s, t) => s + (parseFloat(t.sellAmount) || 0), 0).toFixed(2)}</td>
                                    <td style={{ padding: "0.375rem 0.5rem", textAlign: "right", fontWeight: bwx }}>{badge(`ރ.${ownerTx.reduce((s, t) => s + t.cost, 0).toFixed(2)}`, clCost, bgCost)}</td>
                                    <td style={{ padding: "0.375rem 0.5rem", textAlign: "right", fontWeight: bwx }}>{badge(`ރ.${ownerTx.reduce((s, t) => s + t.grossProfit, 0).toFixed(2)}`, clGross, bgGross)}</td>
                                    <td style={{ padding: "0.375rem 0.5rem", textAlign: "right", fontWeight: bwx }}>{badge(`ރ.${ownerTx.reduce((s, t) => s + t.netProfit, 0).toFixed(2)}`, clNet, bgNet)}</td>
                                  </tr></tfoot>
                                </table>
                              </div>
                            </div>
                          );
                        })()}
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
                        <div style={{ fontSize: L.cardTypeLayout === "list" ? "1.25rem" : (isCompact ? "1.25rem" : "1.75rem"), fontWeight: bwx, color: isTerm ? c.text : "#16a34a" }} className={isTerm ? "terminal-glow" : ""}>ރ.{data.netProfit.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              {/* RATE SPREAD ANALYSIS */}
              <div style={cardBase}>
                <h2 style={{ ...sectionTitleStyle, marginBottom: isCompact ? "1rem" : "1.5rem" }}>Rate Spread Analysis</h2>
                {(() => {
                  const txs = filteredTransactions.length > 0 ? filteredTransactions : transactions;
                  const n = txs.length;
                  if (n === 0) return <div style={{ color: c.textSec, fontSize: "0.875rem" }}>No data</div>;
                  const avgBuy = txs.reduce((s, t) => s + (parseFloat(t.buyRate) || 0), 0) / n;
                  const avgSell = txs.reduce((s, t) => s + (parseFloat(t.sellRate) || 0), 0) / n;
                  const avgSpread = avgSell - avgBuy;
                  const avgSpreadPct = avgBuy > 0 ? (avgSpread / avgBuy) * 100 : 0;
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: isCompact ? "0.75rem" : "1.25rem" }}>
                      {[{ label: "Avg Buy Rate", value: avgBuy.toFixed(4), color: "#3b82f6" }, { label: "Avg Sell Rate", value: avgSell.toFixed(4), color: "#16a34a" }, { label: "Avg Spread", value: avgSpread.toFixed(4), color: "#f97316" }, { label: "Avg Spread %", value: `${avgSpreadPct.toFixed(2)}%`, color: "#8b5cf6" }].map((s) => (
                        <div key={s.label} style={{ textAlign: "center", padding: isCompact ? "0.75rem" : "1.25rem", backgroundColor: c.surfaceAlt, borderRadius: isBrut ? "0" : (isCirc ? "1.5rem" : rSm), border: isBrut ? `2px solid ${c.border}` : `1px solid ${c.border}` }}>
                          <div style={{ fontSize: isCompact ? "0.6875rem" : "0.75rem", color: c.textSec, marginBottom: "0.375rem", fontWeight: bws, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
                          <div style={{ fontSize: isCompact ? "1.125rem" : "1.5rem", fontWeight: bwx, color: isTerm ? c.text : s.color }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* TOP PERFORMER CARDS */}
              <div style={cardBase}>
                <h2 style={{ ...sectionTitleStyle, marginBottom: isCompact ? "1rem" : "1.5rem" }}>Top Cards</h2>
                {(() => {
                  const cardNetMap = {};
                  transactions.forEach((t) => {
                    const cd = getCardById(t.cardId);
                    if (!cd) return;
                    const key = cd.number;
                    if (!cardNetMap[key]) cardNetMap[key] = { number: cd.number, type: cd.type, net: 0, count: 0 };
                    cardNetMap[key].net += t.netProfit;
                    cardNetMap[key].count += 1;
                  });
                  const sorted = Object.values(cardNetMap).sort((a, b) => b.net - a.net).slice(0, 5);
                  if (sorted.length === 0) return <div style={{ color: c.textSec, fontSize: "0.875rem" }}>No data</div>;
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: isCompact ? "0.5rem" : "0.75rem" }}>
                      {sorted.map((card, i) => (
                        <div key={card.number} style={{ display: "flex", alignItems: "center", gap: isCompact ? "0.75rem" : "1rem", padding: isCompact ? "0.625rem 0.875rem" : "0.875rem 1.25rem", backgroundColor: c.surfaceAlt, borderRadius: isBrut ? "0" : (isCirc ? "1.5rem" : rSm), border: isBrut ? `2px solid ${c.border}` : `1px solid ${c.border}` }}>
                          <div style={{ fontSize: isCompact ? "0.875rem" : "1rem", fontWeight: bwx, color: c.textSec, minWidth: "1.5rem", textAlign: "center" }}>#{i + 1}</div>
                          <span style={cardBadgeStyle(card.type)}>{card.type}</span>
                          <div style={{ flex: 1, fontWeight: bwm, fontSize: isCompact ? "0.8125rem" : "0.9375rem", color: c.text }}>Card {card.number}</div>
                          <div style={{ fontSize: isCompact ? "0.75rem" : "0.8125rem", color: c.textSec }}>{card.count} tx</div>
                          <div style={{ fontWeight: bwx, fontSize: isCompact ? "0.9375rem" : "1.125rem", color: isTerm ? c.text : "#16a34a" }}>ރ.{card.net.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
              </>
            )}
          </div>
        )}

        {/* ===== TRANSACTIONS TAB ===== */}
        {activeTab === "transactions" && (
          <div>
            {(() => {
              const isHistory = selectedPeriod !== "current";
              const displayTx = isHistory ? historyTransactions : sortedTransactions;
              const displayFiltered = isHistory ? historyTransactions : filteredTransactions;
              const activeFilterCount = [filterCardType !== "all", filterOwner !== "all", filterCardNumber !== "all", filterDateFrom !== "", filterDateTo !== "", searchQuery !== "", selectedPeriod !== "current"].filter(Boolean).length;
              return (<>
            {selectedPeriod !== "current" && (
              <div style={{ padding: isCompact ? "0.5rem 0.75rem" : "0.75rem 1rem", backgroundColor: c.accentBg, borderRadius: rSm, marginBottom: isCompact ? "0.625rem" : "1rem", fontSize: isCompact ? "0.75rem" : "0.8125rem", color: c.accent, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Calendar size={14} /> Viewing archived transactions from <strong style={{ marginLeft: "0.25rem" }}>{selectedPeriod}</strong>
              </div>
            )}
            <div style={{ ...cardBase, marginBottom: isCompact ? "0.625rem" : "1rem", position: "relative", zIndex: showFilters ? 100 : 1 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: isCompact ? "0.375rem" : "0.5rem", alignItems: "center", justifyContent: "space-between" }}>
                {/* Left: Filters dropdown + view toggle */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: isCompact ? "0.375rem" : "0.5rem", alignItems: "center" }}>
                  <div style={{ position: "relative" }}>
                    <button onClick={() => setShowFilters((v) => !v)} style={{ padding: isCompact ? "0.375rem 0.625rem" : "0.5rem 0.875rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: isBrut ? `2px solid ${c.border}` : `1px solid ${showFilters || activeFilterCount > 0 ? c.accent : c.border}`, backgroundColor: showFilters || activeFilterCount > 0 ? c.accentBg : c.inputBg, color: showFilters || activeFilterCount > 0 ? c.accent : c.text, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: isCompact ? "0.75rem" : "0.875rem", fontWeight: bwm, transition: "border-color 0.15s, background-color 0.15s, color 0.15s" }}>
                      <Filter size={isCompact ? 12 : 14} />
                      {isTerm ? "> Filters" : "Filters"}
                      {activeFilterCount > 0 && <span style={{ backgroundColor: c.accent, color: "#fff", borderRadius: "999px", fontSize: "0.625rem", padding: "0.1rem 0.4rem", fontWeight: "700", lineHeight: 1.4 }}>{activeFilterCount}</span>}
                      <ChevronDown size={isCompact ? 12 : 14} style={{ transition: "transform 0.15s", transform: showFilters ? "rotate(180deg)" : "rotate(0deg)" }} />
                    </button>
                    {showFilters && (
                      <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 200, backgroundColor: isGlass ? "rgba(20,14,48,0.95)" : (isLG ? "rgba(255,255,255,0.85)" : c.surface), border: isBrut ? `2px solid ${c.border}` : `1px solid ${c.border}`, borderRadius: isBrut ? "0" : (isCirc ? "1.5rem" : "0.75rem"), padding: isCompact ? "0.75rem" : "1rem", boxShadow: c.shadow, minWidth: isMobile ? "calc(100vw - 2rem)" : "360px", display: "flex", flexDirection: "column", gap: isCompact ? "0.5rem" : "0.75rem", animation: "slideUp 0.15s cubic-bezier(.16,1,.3,1) both", ...((isGlass || isLG) ? { backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)" } : {}) }}>
                        {/* Period */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: isCompact ? "0.6875rem" : "0.75rem", color: c.textSec, fontWeight: bwm, minWidth: "5.5rem" }}>Period</span>
                          <select value={selectedPeriod} onChange={(e) => { setSelectedPeriod(e.target.value); if (e.target.value !== "current") fetchHistoryForPeriod(e.target.value); }} style={{ flex: 1, padding: isCompact ? "0.3rem 0.5rem" : "0.4rem 0.625rem", border: isBrut ? `2px solid ${c.border}` : `1px solid ${c.inputBorder}`, borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.375rem"), fontSize: isCompact ? "0.75rem" : "0.8125rem", backgroundColor: selectBg, color: c.text }}>
                            <option value="current">Current Month</option>
                            {historyPeriods.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        {/* Filters (only when not history) */}
                        {!isHistory && (
                          <>
                            {[{ label: "Card Type", val: filterCardType, set: setFilterCardType, opts: [{ v: "all", l: "All Card Types" }, ...cardTypes.map((t) => ({ v: t, l: t }))] }, { label: "Owner", val: filterOwner, set: setFilterOwner, opts: [{ v: "all", l: "All Owners" }, ...owners.map((o) => ({ v: o.id, l: o.name }))] }, { label: "Card No.", val: filterCardNumber, set: setFilterCardNumber, opts: [{ v: "all", l: "All Card Numbers" }, ...availableCardNumbers.map((n) => ({ v: n, l: `Card #${n}` }))] }].map((f, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ fontSize: isCompact ? "0.6875rem" : "0.75rem", color: c.textSec, fontWeight: bwm, minWidth: "5.5rem" }}>{f.label}</span>
                                <select style={{ flex: 1, padding: isCompact ? "0.3rem 0.5rem" : "0.4rem 0.625rem", border: isBrut ? `2px solid ${c.border}` : `1px solid ${c.inputBorder}`, borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.375rem"), fontSize: isCompact ? "0.75rem" : "0.8125rem", backgroundColor: selectBg, color: c.text }} value={f.val} onChange={(e) => f.set(e.target.value)}>
                                  {f.opts.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                                </select>
                              </div>
                            ))}
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span style={{ fontSize: isCompact ? "0.6875rem" : "0.75rem", color: c.textSec, fontWeight: bwm, minWidth: "5.5rem" }}>Date From</span>
                              <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} style={{ flex: 1, padding: isCompact ? "0.3rem 0.5rem" : "0.4rem 0.625rem", border: isBrut ? `2px solid ${c.border}` : `1px solid ${filterDateFrom ? c.accent : c.inputBorder}`, borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.375rem"), fontSize: isCompact ? "0.75rem" : "0.8125rem", backgroundColor: c.inputBg, color: c.text, colorScheme: "auto" }} />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span style={{ fontSize: isCompact ? "0.6875rem" : "0.75rem", color: c.textSec, fontWeight: bwm, minWidth: "5.5rem" }}>Date To</span>
                              <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} style={{ flex: 1, padding: isCompact ? "0.3rem 0.5rem" : "0.4rem 0.625rem", border: isBrut ? `2px solid ${c.border}` : `1px solid ${filterDateTo ? c.accent : c.inputBorder}`, borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.375rem"), fontSize: isCompact ? "0.75rem" : "0.8125rem", backgroundColor: c.inputBg, color: c.text, colorScheme: "auto" }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: isCompact ? "0.6875rem" : "0.75rem", color: c.textSec, fontWeight: bwm }}>{filteredTransactions.length} result{filteredTransactions.length !== 1 ? "s" : ""}</span>
                              {activeFilterCount > 0 && <button onClick={() => { setFilterCardType("all"); setFilterOwner("all"); setFilterCardNumber("all"); setFilterDateFrom(""); setFilterDateTo(""); setSearchQuery(""); setSelectedPeriod("current"); }} style={{ padding: "0.25rem 0.625rem", border: `1px solid ${c.border}`, borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.375rem"), backgroundColor: "transparent", color: c.textSec, cursor: "pointer", fontSize: isCompact ? "0.625rem" : "0.6875rem", fontWeight: bwm }}>Clear all</button>}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Sort dropdown */}
                  {!isHistory && (() => {
                    const SORT_OPTS = [
                      { key: null,         dir: "asc",  label: "Default" },
                      { key: "owner",      dir: "asc",  label: "Name" },
                      { key: "date",       dir: "desc", label: "Date" },
                      { key: "netProfit",  dir: "desc", label: "Net Profit" },
                    ];
                    const active = SORT_OPTS.find((o) => o.key === sortCol) || SORT_OPTS[0];
                    return (
                      <div style={{ position: "relative" }}>
                        <button onClick={() => setShowSortMenu((v) => !v)} style={{ padding: isCompact ? "0.375rem 0.625rem" : "0.5rem 0.875rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: isBrut ? `2px solid ${c.border}` : `1px solid ${showSortMenu || sortCol ? c.accent : c.border}`, backgroundColor: showSortMenu || sortCol ? c.accentBg : c.inputBg, color: showSortMenu || sortCol ? c.accent : c.text, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: isCompact ? "0.75rem" : "0.875rem", fontWeight: bwm, transition: "border-color 0.15s, background-color 0.15s, color 0.15s" }}>
                          <ChevronDown size={isCompact ? 12 : 14} />
                          {isTerm ? `> Sort: ${active.label}` : `Sort: ${active.label}`}
                          <ChevronDown size={isCompact ? 12 : 14} style={{ transition: "transform 0.15s", transform: showSortMenu ? "rotate(180deg)" : "rotate(0deg)" }} />
                        </button>
                        {showSortMenu && (
                          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 200, backgroundColor: isGlass ? "rgba(20,14,48,0.95)" : (isLG ? "rgba(255,255,255,0.85)" : c.surface), border: isBrut ? `2px solid ${c.border}` : `1px solid ${c.border}`, borderRadius: isBrut ? "0" : (isCirc ? "1.5rem" : "0.75rem"), padding: "0.375rem", boxShadow: c.shadow, minWidth: "9rem", display: "flex", flexDirection: "column", gap: "0.125rem", animation: "slideUp 0.15s cubic-bezier(.16,1,.3,1) both", ...((isGlass || isLG) ? { backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)" } : {}) }}>
                            {SORT_OPTS.map((o) => (
                              <button key={String(o.key)} onClick={() => { setSortCol(o.key); setSortDir(o.dir); setShowSortMenu(false); }} style={{ padding: isCompact ? "0.375rem 0.625rem" : "0.5rem 0.75rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: "none", backgroundColor: sortCol === o.key ? c.accentBg : "transparent", color: sortCol === o.key ? c.accent : c.text, cursor: "pointer", textAlign: "left", fontSize: isCompact ? "0.75rem" : "0.8125rem", fontWeight: sortCol === o.key ? bwx : bwm, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                {sortCol === o.key && <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: c.accent, flexShrink: 0 }} />}
                                {o.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {/* Persistent search bar */}
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Search size={isCompact ? 12 : 13} style={{ position: "absolute", left: "0.5rem", color: c.textSec, pointerEvents: "none" }} />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." aria-label="Search transactions" style={{ padding: isCompact ? "0.375rem 0.5rem 0.375rem 1.625rem" : "0.5rem 0.625rem 0.5rem 1.75rem", border: isBrut ? `2px solid ${c.border}` : `1px solid ${searchQuery ? c.accent : c.inputBorder}`, borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), fontSize: isCompact ? "0.75rem" : "0.8125rem", backgroundColor: c.inputBg, color: c.text, outline: "none", width: isMobile ? "11rem" : "13rem", transition: "border-color 0.15s, width 0.2s" }} />
                    {searchQuery && <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: "0.375rem", background: "none", border: "none", cursor: "pointer", color: c.textSec, display: "flex", alignItems: "center", padding: 0 }}><X size={13} /></button>}
                  </div>
                  {[{ m: "table", icon: List, label: "Table" }, { m: "cards", icon: LayoutGrid, label: "Cards" }].map(({ m, icon: Ic, label }) => (
                    <button key={m} onClick={() => setViewMode(m)} style={{ padding: isCompact ? "0.375rem 0.625rem" : "0.5rem 1rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: isBrut ? `2px solid ${c.border}` : `1px solid ${c.border}`, backgroundColor: viewMode === m ? c.accent : c.inputBg, color: viewMode === m ? "#fff" : c.text, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", fontSize: isCompact ? "0.75rem" : "0.875rem", fontWeight: bwm, ...(isBrut && viewMode === m ? { boxShadow: "3px 3px 0 #000" } : {}) }}><Ic size={isCompact ? 14 : 16} /> {label}</button>
                  ))}
                </div>
                {/* Right: Edit, Bulk Delete, Add */}
                <div style={{ display: "flex", gap: isCompact ? "0.375rem" : "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                  <button onClick={() => { setEditMode((m) => { if (m) setSelectedTxIds(new Set()); return !m; }); }} disabled={selectedPeriod !== "current"} aria-pressed={editMode} style={{ padding: isCompact ? "0.375rem 0.625rem" : "0.5rem 1rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: `1px solid ${editMode ? c.accent : c.border}`, backgroundColor: editMode ? c.accentBg : c.inputBg, color: editMode ? c.accent : c.text, cursor: selectedPeriod !== "current" ? "not-allowed" : "pointer", fontSize: isCompact ? "0.75rem" : "0.8125rem", fontWeight: bwm, opacity: selectedPeriod !== "current" ? 0.4 : 1, display: "inline-flex", alignItems: "center", gap: "0.375rem", transition: "border-color 0.15s, background-color 0.15s, color 0.15s" }}><Pencil size={isCompact ? 12 : 14} /> {editMode ? "Done" : "Edit"}</button>
                  {editMode && !isHistory && selectedTxIds.size > 0 && (
                    <button onClick={() => setConfirmBulkDelete(true)} style={{ padding: isCompact ? "0.375rem 0.625rem" : "0.5rem 1rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: "1px solid #ef4444", background: "transparent", color: "#ef4444", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", fontSize: isCompact ? "0.75rem" : "0.875rem", fontWeight: bwm }}>
                      <Trash2 size={isCompact ? 13 : 15} /> Delete {selectedTxIds.size}
                    </button>
                  )}
                  {!isHistory && <button onClick={() => { setEditingTxId(null); setTxForm({ cardType: "VISA DEBIT", cardNumber: "", owner: "", buyRate: "15.42", buyAmount: "", sellRate: "", sellAmount: "", date: getTodayDate() }); setShowTxForm(true); }} style={{ padding: isCompact ? "0.375rem 0.625rem" : "0.5rem 1rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: "none", background: c.btnGrad, color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", fontSize: isCompact ? "0.75rem" : "0.875rem", fontWeight: bwm, boxShadow: `0 2px 8px ${c.btnGlow}` }}><Plus size={isCompact ? 14 : 16} /> Add</button>}
                </div>
              </div>
            </div>

            {viewMode === "table" ? (
              <div style={cardBase}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: isBrut ? "separate" : "collapse", borderSpacing: isBrut ? "0 2px" : "0" }}>
                    <thead><tr>
                      {editMode && !isHistory && (
                        <th style={{ ...thStyle, width: "36px", textAlign: "center" }}>
                          <input
                            type="checkbox"
                            aria-label="Select all transactions on this page"
                            checked={pagedTransactions.length > 0 && pagedTransactions.every((t) => selectedTxIds.has(t.id))}
                            onChange={(e) => {
                              const next = new Set(selectedTxIds);
                              pagedTransactions.forEach((t) => e.target.checked ? next.add(t.id) : next.delete(t.id));
                              setSelectedTxIds(next);
                            }}
                            style={{ cursor: "pointer", accentColor: c.accent }}
                          />
                        </th>
                      )}
                      {[{ label: "Date", col: "date" }, { label: "Card Type", col: "cardType" }, { label: "Card No.", col: "cardNumber" }, { label: "Owner", col: "owner" }].map(({ label, col }) => (
                        <th key={col} style={{ ...thStyle, cursor: "pointer", userSelect: "none" }} onClick={() => handleSort(col)}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>{label} {sortCol === col && <span style={{ fontSize: "0.625rem" }}>{sortDir === "asc" ? "▲" : "▼"}</span>}</div>
                        </th>
                      ))}
                      {[{ label: "Buy Rate", col: "buyRate" }, { label: "Buy Amount", col: "buyAmount" }, { label: "Sell Rate", col: "sellRate" }, { label: "Sell Amount", col: "sellAmount" }, { label: "Cost", col: "cost" }, { label: "Gross Profit", col: "grossProfit" }, { label: "Net Profit", col: "netProfit" }, { label: "Margin", col: "profitMargin" }].map(({ label, col }) => (
                        <th key={col} style={{ ...thStyle, textAlign: "right", cursor: "pointer", userSelect: "none" }} onClick={() => handleSort(col)}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", justifyContent: "flex-end" }}>{label} {sortCol === col && <span style={{ fontSize: "0.625rem" }}>{sortDir === "asc" ? "▲" : "▼"}</span>}</div>
                        </th>
                      ))}
                      {editMode && !isHistory && <th style={{ ...thStyle, width: "40px" }}></th>}
                    </tr></thead>
                    <tbody>
                      {(isHistory ? displayFiltered : pagedTransactions).map((t) => {
                        const cc = getCardTypeColor(t.cardType);
                        const mb = getProfitMarginBadge(t.profitMargin || 0);
                        const ownerColorId = t.ownerId || (owners.findIndex((o) => o.name === t.owner) + 1) || 1;
                        const isSelected = selectedTxIds.has(t.id);
                        return (
                          <tr key={t.id} style={isSelected ? { backgroundColor: c.accentBg } : {}}>
                            {editMode && !isHistory && (
                              <td style={{ ...tdStyle, textAlign: "center", backgroundColor: isSelected ? c.accentBg : c.surface }}>
                                <input
                                  type="checkbox"
                                  aria-label={`Select transaction ${t.id}`}
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const next = new Set(selectedTxIds);
                                    e.target.checked ? next.add(t.id) : next.delete(t.id);
                                    setSelectedTxIds(next);
                                  }}
                                  style={{ cursor: "pointer", accentColor: c.accent }}
                                />
                              </td>
                            )}
                            <td style={{ ...tdStyle, fontSize: isCompact ? "0.6875rem" : "0.8125rem", color: c.textSec, whiteSpace: "nowrap" }}>{pill(t.date || "-")}</td>
                            <td style={tdStyle}><span style={cardBadgeStyle(t.cardType)}>{t.cardType || "UNKNOWN"}</span></td>
                            <td style={tdStyle}>{pill(t.cardNumber || "-")}</td>
                            <td style={tdStyle}><span style={ownerBadgeStyle(ownerColorId)}>{t.owner}</span></td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>{pill(parseFloat(t.buyRate).toFixed(2))}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>{pill(`$${parseFloat(t.buyAmount).toFixed(2)}`)}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>{pill(parseFloat(t.sellRate).toFixed(2))}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>{pill(`₮ ${parseFloat(t.sellAmount).toFixed(2)}`)}</td>
                            <td style={{ ...tdStyle, textAlign: "right", fontWeight: bws }}>{badge(`ރ.${t.cost.toFixed(2)}`, clCost, bgCost)}</td>
                            <td style={{ ...tdStyle, textAlign: "right", fontWeight: bws }}>{badge(`ރ.${t.grossProfit.toFixed(2)}`, clGross, bgGross)}</td>
                            <td style={{ ...tdStyle, textAlign: "right", fontWeight: bws }} className={isTerm ? "terminal-glow" : ""}>{badge(`ރ.${t.netProfit.toFixed(2)}`, clNet, bgNet)}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}><span style={mb.style}>{(t.profitMargin || 0).toFixed(1)}%</span></td>
                            {editMode && !isHistory && <td style={{ ...tdStyle, textAlign: "center" }}><button onClick={() => editTransaction(t)} aria-label="Edit transaction" style={{ background: "none", border: "none", cursor: "pointer", color: c.accent, padding: "0.25rem", display: "flex", alignItems: "center", opacity: 0.6, transition: "opacity 0.15s" }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}><Pencil size={14} /></button></td>}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: c.surfaceAlt, fontWeight: bwx, borderTop: `2px solid ${c.borderStrong}` }}>
                        <td colSpan={editMode && !isHistory ? 5 : 4} style={{ ...tdStyle, fontWeight: bwx, fontSize: isCompact ? "0.6875rem" : "0.875rem", color: c.textStrong, textTransform: isBrut ? "uppercase" : "none" }}>TOTALS</td>
                        <td colSpan="2" style={{ ...tdStyle, textAlign: "center", fontSize: isCompact ? "0.625rem" : "0.8125rem", color: c.textMid }}><div>Sell Amt:</div><div style={{ fontWeight: bwx, fontSize: isCompact ? "0.6875rem" : "0.9375rem", color: c.textStrong }}>₮ {displayFiltered.reduce((s, t) => s + (parseFloat(t.sellAmount) || 0), 0).toFixed(2)}</div></td>
                        <td style={{ ...tdStyle, textAlign: "center", fontSize: isCompact ? "0.625rem" : "0.8125rem", color: c.textMid }}><div>Avg Sell:</div><div style={{ fontWeight: bwx, fontSize: isCompact ? "0.6875rem" : "0.9375rem", color: c.textStrong }}>{displayFiltered.length > 0 ? (displayFiltered.reduce((s, t) => s + (parseFloat(t.sellRate) || 0), 0) / displayFiltered.length).toFixed(2) : "0.00"}</div></td>
                        <td style={{ ...tdStyle, textAlign: "center", fontSize: isCompact ? "0.625rem" : "0.8125rem", color: c.textMid }}><div>Avg Buy:</div><div style={{ fontWeight: bwx, fontSize: isCompact ? "0.6875rem" : "0.9375rem", color: c.textStrong }}>{(() => { const tc2 = displayFiltered.reduce((s, t) => s + (parseFloat(t.cost) || 0), 0); const ts2 = displayFiltered.reduce((s, t) => s + (parseFloat(t.sellAmount) || 0), 0); return (ts2 > 0 ? tc2 / ts2 : 0).toFixed(2); })()}</div></td>
                        <td style={{ ...tdStyle, textAlign: "center", fontSize: isCompact ? "0.625rem" : "0.8125rem", color: c.textMid }}><div>Buy Amt:</div><div style={{ fontWeight: bwx, fontSize: isCompact ? "0.6875rem" : "0.9375rem", color: c.textStrong }}>${displayFiltered.reduce((s, t) => s + (parseFloat(t.buyAmount) || 0), 0).toFixed(2)}</div></td>
                        <td style={{ ...tdStyle, textAlign: "center", fontSize: isCompact ? "0.625rem" : "0.8125rem" }}><div>Cost:</div><div style={{ fontWeight: bwx, marginTop: "0.2rem" }}>{badge(`ރ.${displayFiltered.reduce((s, t) => s + t.cost, 0).toFixed(2)}`, clCost, bgCost)}</div></td>
                        <td style={{ ...tdStyle, textAlign: "center", fontSize: isCompact ? "0.625rem" : "0.8125rem" }}><div>Gross:</div><div style={{ fontWeight: bwx, marginTop: "0.2rem" }}>{badge(`ރ.${displayFiltered.reduce((s, t) => s + t.grossProfit, 0).toFixed(2)}`, clGross, bgGross)}</div></td>
                        <td style={{ ...tdStyle, textAlign: "center", fontSize: isCompact ? "0.625rem" : "0.8125rem" }}><div>Net:</div><div style={{ fontWeight: bwx, marginTop: "0.2rem" }} className={isTerm ? "terminal-glow" : ""}>{badge(`ރ.${displayFiltered.reduce((s, t) => s + t.netProfit, 0).toFixed(2)}`, clNet, bgNet)}</div></td>
                        {(() => { const totCost = displayFiltered.reduce((s, t) => s + t.cost, 0); const totNet = displayFiltered.reduce((s, t) => s + t.netProfit, 0); const avgMargin = totCost > 0 ? (totNet / totCost) * 100 : 0; const mb = getProfitMarginBadge(avgMargin); return <td style={{ ...tdStyle, textAlign: "center" }}><div style={{ fontSize: isCompact ? "0.625rem" : "0.8125rem", color: c.textMid, marginBottom: "0.2rem" }}>Avg:</div><span style={mb.style}>{avgMargin.toFixed(1)}%</span></td>; })()}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: (isBrut || isMobile) ? "1fr" : "repeat(2, 1fr)", gap: isCompact ? "0.625rem" : "1rem" }}>
                {(() => {
                  const cardRows = isHistory ? displayFiltered : pagedTransactions;
                  const totCost = cardRows.reduce((s, t) => s + t.cost, 0);
                  const totGross = cardRows.reduce((s, t) => s + t.grossProfit, 0);
                  const totNet = cardRows.reduce((s, t) => s + t.netProfit, 0);
                  const totBuyAmt = cardRows.reduce((s, t) => s + (parseFloat(t.buyAmount) || 0), 0);
                  const totSellAmt = cardRows.reduce((s, t) => s + (parseFloat(t.sellAmount) || 0), 0);
                  const avgSell = cardRows.length > 0 ? cardRows.reduce((s, t) => s + (parseFloat(t.sellRate) || 0), 0) / cardRows.length : 0;
                  const avgMargin = totCost > 0 ? (totNet / totCost) * 100 : 0;
                  const mb = getProfitMarginBadge(avgMargin);
                  return (
                    <div style={{ backgroundColor: c.surfaceAlt, borderRadius: isLG ? r : (isCirc ? "2rem" : rSm), padding: isCompact ? "0.875rem" : "1.5rem", border: isBrut ? `3px solid ${c.border}` : `2px solid ${c.borderStrong || c.border}`, ...(isBrut ? { boxShadow: "4px 4px 0 #000" } : {}), animation: "slideUp 0.2s cubic-bezier(.16,1,.3,1) both" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isCompact ? "0.75rem" : "1rem" }}>
                        <div style={{ fontSize: isCompact ? "0.6875rem" : "0.8125rem", fontWeight: bwx, color: c.textStrong, textTransform: isBrut ? "uppercase" : "none", letterSpacing: isBrut ? "0.05em" : "normal" }}>Totals · {cardRows.length} transaction{cardRows.length !== 1 ? "s" : ""}</div>
                        <span style={mb.style}>{avgMargin.toFixed(1)}% avg</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: isCompact ? "0.5rem" : "0.75rem", marginBottom: isCompact ? "0.5rem" : "0.75rem" }}>
                        <div><div style={{ fontSize: isCompact ? "0.625rem" : "0.75rem", color: c.textSec }}>Buy Amt</div><div style={{ fontWeight: bws, fontSize: isCompact ? "0.75rem" : "inherit", color: c.text }}>${totBuyAmt.toFixed(2)}</div></div>
                        <div><div style={{ fontSize: isCompact ? "0.625rem" : "0.75rem", color: c.textSec }}>Sell Amt</div><div style={{ fontWeight: bws, fontSize: isCompact ? "0.75rem" : "inherit", color: c.text }}>₮ {totSellAmt.toFixed(2)}</div></div>
                        <div><div style={{ fontSize: isCompact ? "0.625rem" : "0.75rem", color: c.textSec }}>Avg Sell Rate</div><div style={{ fontWeight: bws, fontSize: isCompact ? "0.75rem" : "inherit", color: c.text }}>{avgSell.toFixed(2)}</div></div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: isCompact ? "0.5rem" : "1rem", paddingTop: isCompact ? "0.5rem" : "0.75rem", borderTop: `1px solid ${c.border}` }}>
                        {[{ l: "Cost", v: totCost, cl: clCost, bg: bgCost }, { l: "Gross", v: totGross, cl: clGross, bg: bgGross }, { l: "Net", v: totNet, cl: clNet, bg: bgNet }].map((x) => (
                          <div key={x.l}><div style={{ fontSize: isCompact ? "0.625rem" : "0.75rem", color: c.textSec }}>{x.l}</div><div style={{ fontWeight: bwx, fontSize: isCompact ? "0.875rem" : "inherit" }}>{badge(`ރ.${x.v.toFixed(0)}`, x.cl, x.bg)}</div></div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                {(isHistory ? displayFiltered : pagedTransactions).map((t, idx) => {
                  const cc = getCardTypeColor(t.cardType); const mb = getProfitMarginBadge(t.profitMargin || 0);
                  const ownerColorId = t.ownerId || (owners.findIndex((o) => o.name === t.owner) + 1) || 1;
                  return (
                    <div key={t.id} className={isLG ? "lg-specular" : ""} style={{ backgroundColor: c.surface, borderRadius: isLG ? r : (isCirc ? "2rem" : rSm), padding: isCompact ? "0.875rem" : "1.5rem", border: isBrut ? `3px solid ${c.border}` : (isLG ? "1px solid rgba(255,255,255,0.6)" : `1px solid ${c.border}`), ...((isGlass || isLG) ? { backdropFilter: "blur(16px) saturate(150%)", WebkitBackdropFilter: "blur(16px) saturate(150%)" } : {}), ...(isBrut ? { boxShadow: "4px 4px 0 #000" } : {}), cursor: "pointer", animation: `slideUp 0.35s cubic-bezier(.16,1,.3,1) ${Math.min(idx, 10) * 0.04}s both`, transform: hoveredCard === `tx-${idx}` ? "translateY(-4px)" : "translateY(0)", boxShadow: hoveredCard === `tx-${idx}` ? c.cardHoverShadow : (isLG ? "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)" : (c.cardGlow || "none")), transition: "transform 0.2s cubic-bezier(.4,0,.2,1), box-shadow 0.2s cubic-bezier(.4,0,.2,1)" }}
                      onMouseEnter={() => setHoveredCard(`tx-${idx}`)} onMouseLeave={() => setHoveredCard(null)}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: isCompact ? "0.5rem" : "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: isCompact ? "0.5rem" : "0.75rem" }}>
                          <div><span style={cardBadgeStyle(t.cardType)}>{t.cardType || "UNKNOWN"}</span><div style={{ fontSize: isCompact ? "0.6875rem" : "0.8125rem", color: c.textSec, marginTop: "0.25rem" }}>Card #{pill(t.cardNumber || "-")}</div></div>
                        </div>
                        <span style={mb.style}>{(t.profitMargin || 0).toFixed(1)}%</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isCompact ? "0.5rem" : "1rem" }}>
                        <div><div style={{ fontSize: isCompact ? "0.6875rem" : "0.875rem", color: c.textSec, marginBottom: "0.25rem" }}>Owner</div><span style={ownerBadgeStyle(ownerColorId)}>{t.owner}</span></div>
                        <div style={{ textAlign: "right" }}><div style={{ fontSize: isCompact ? "0.6875rem" : "0.875rem", color: c.textSec }}>Date</div><div style={{ fontWeight: bwm, fontSize: isCompact ? "0.75rem" : "0.875rem", color: c.text }}>{pill(t.date || "-")}</div></div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: isCompact ? "0.5rem" : "1rem", marginBottom: isCompact ? "0.5rem" : "1rem" }}>
                        <div><div style={{ fontSize: isCompact ? "0.625rem" : "0.75rem", color: c.textSec }}>Buy</div><div style={{ fontWeight: bws, fontSize: isCompact ? "0.75rem" : "inherit", color: c.text }}>{pill(`${parseFloat(t.buyRate).toFixed(2)} × $${parseFloat(t.buyAmount).toFixed(0)}`)}</div></div>
                        <div><div style={{ fontSize: isCompact ? "0.625rem" : "0.75rem", color: c.textSec }}>Sell</div><div style={{ fontWeight: bws, fontSize: isCompact ? "0.75rem" : "inherit", color: c.text }}>{pill(`${parseFloat(t.sellRate).toFixed(2)} × ₮ ${parseFloat(t.sellAmount).toFixed(0)}`)}</div></div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: isCompact ? "0.5rem" : "1rem", paddingTop: isCompact ? "0.5rem" : "1rem", borderTop: `1px solid ${c.border}` }}>
                        {[{ l: "Cost", v: t.cost, cl: clCost, bg: bgCost }, { l: "Gross", v: t.grossProfit, cl: clGross, bg: bgGross }, { l: "Net", v: t.netProfit, cl: clNet, bg: bgNet }].map((x) => (
                          <div key={x.l}><div style={{ fontSize: isCompact ? "0.625rem" : "0.75rem", color: c.textSec }}>{x.l}</div><div style={{ fontWeight: bwx, fontSize: isCompact ? "0.875rem" : "inherit" }}>{badge(`ރ.${x.v.toFixed(0)}`, x.cl, x.bg)}</div></div>
                        ))}
                      </div>
                      {editMode && !isHistory && <button onClick={(e) => { e.stopPropagation(); editTransaction(t); }} style={{ marginTop: isCompact ? "0.5rem" : "0.75rem", width: "100%", padding: "0.375rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.375rem"), border: `1px solid ${c.border}`, backgroundColor: "transparent", color: c.textSec, cursor: "pointer", fontSize: "0.75rem", fontWeight: bwm, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", transition: "color 0.15s, border-color 0.15s" }} onMouseEnter={(e) => { e.currentTarget.style.color = c.accent; e.currentTarget.style.borderColor = c.accent; }} onMouseLeave={(e) => { e.currentTarget.style.color = c.textSec; e.currentTarget.style.borderColor = c.border; }}><Pencil size={12} /> Edit</button>}
                    </div>
                  );
                })}
              </div>
            )}
            {/* Pagination */}
            {!isHistory && totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: isCompact ? "0.75rem" : "1.25rem", padding: isCompact ? "0.5rem 0.75rem" : "0.75rem 1rem", backgroundColor: c.surface, borderRadius: isCirc ? "2rem" : rSm, border: `1px solid ${c.border}` }}>
                <span style={{ fontSize: isCompact ? "0.6875rem" : "0.8125rem", color: c.textSec }}>{sortedTransactions.length} result{sortedTransactions.length !== 1 ? "s" : ""} &nbsp;·&nbsp; Page {currentPage} of {totalPages}</span>
                <div style={{ display: "flex", gap: "0.375rem" }}>
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} aria-label="Previous page" style={{ padding: isMobile ? "0.625rem 1rem" : (isCompact ? "0.25rem 0.5rem" : "0.375rem 0.625rem"), borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.375rem"), border: `1px solid ${c.border}`, backgroundColor: c.inputBg, color: currentPage === 1 ? c.textSec : c.text, cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1, display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: isCompact ? "0.6875rem" : "0.8125rem", fontWeight: bwm }}>
                    <ChevronLeft size={isCompact ? 13 : 15} /> Prev
                  </button>
                  <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} aria-label="Next page" style={{ padding: isMobile ? "0.625rem 1rem" : (isCompact ? "0.25rem 0.5rem" : "0.375rem 0.625rem"), borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.375rem"), border: `1px solid ${c.border}`, backgroundColor: c.inputBg, color: currentPage === totalPages ? c.textSec : c.text, cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.4 : 1, display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: isCompact ? "0.6875rem" : "0.8125rem", fontWeight: bwm }}>
                    Next <ChevronRight size={isCompact ? 13 : 15} />
                  </button>
                </div>
              </div>
            )}
              </>);
            })()}
          </div>
        )}

        {/* ===== MONTHLY TAB ===== */}
        {activeTab === "monthly" && (
          <div>
            {monthly.length > 0 && (
              <div style={{ marginBottom: isCompact ? "1rem" : "2rem" }}>
                <div className={isLG ? "lg-specular" : ""} style={{ padding: isMobile ? "1.25rem" : (isCompact ? "1.5rem" : "2.5rem"), borderRadius: isBrut ? "0" : (isCirc ? "2rem" : r), background: c.profitGrad, color: isLG ? "#1c7a36" : "#ffffff", maxWidth: isMobile ? "100%" : (isCompact ? "400px" : "500px"), margin: "0 auto", textAlign: "center", animation: "slideUp 0.4s cubic-bezier(.16,1,.3,1) both", border: isBrut ? "3px solid #000" : (isLG ? "1px solid rgba(52,199,89,0.25)" : (isCirc ? `2px solid ${c.border}` : "none")), boxShadow: isBrut ? "6px 6px 0 #000" : (isLG ? "0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)" : c.shadowLg), ...((isGlass || isLG) ? { backdropFilter: "blur(16px) saturate(150%)", WebkitBackdropFilter: "blur(16px) saturate(150%)" } : {}) }}>
                  <div style={{ fontSize: isMobile ? "0.8125rem" : (isCompact ? "0.9375rem" : "1.125rem"), opacity: 0.9, fontWeight: bws }} className={isTerm ? "terminal-glow" : ""}>{isTerm ? "> ALL TIME PROFIT" : "All Time Profit"}</div>
                  <div style={{ fontSize: isMobile ? "2rem" : (isCompact ? "2.5rem" : "3.5rem"), fontWeight: bwx, margin: "0.5rem 0" }} className={isTerm ? "terminal-glow" : ""}>ރ.{monthly.reduce((s, m) => s + m.profit, 0).toFixed(2)}</div>
                  <div style={{ fontSize: isMobile ? "0.6875rem" : (isCompact ? "0.8125rem" : "0.9375rem"), opacity: 0.85 }}>Total from {monthly.length} months</div>
                </div>
              </div>
            )}
            <div style={cardBase}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: sectionTitleStyle.marginBottom }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <button onClick={() => { setEditingMonthlyId(null); setMonthlyForm({ month: "", profit: "" }); setShowMonthlyForm(true); }} style={{ padding: isCompact ? "0.25rem 0.5rem" : "0.375rem 0.75rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: "none", background: c.btnGrad, color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: isCompact ? "0.6875rem" : "0.8125rem", fontWeight: bwm, boxShadow: `0 2px 8px ${c.btnGlow}` }}><Plus size={isCompact ? 12 : 14} /> Add Month</button>
                  <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}><Calendar size={isCompact ? 20 : 24} /> Monthly Records</h2>
                </div>
                <button onClick={() => { setEditModeMonthly((m) => !m); }} aria-pressed={editModeMonthly} style={{ padding: isCompact ? "0.25rem 0.5rem" : "0.375rem 0.75rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: `1px solid ${editModeMonthly ? c.accent : c.border}`, backgroundColor: editModeMonthly ? c.accentBg : c.inputBg, color: editModeMonthly ? c.accent : c.text, cursor: "pointer", fontSize: isCompact ? "0.6875rem" : "0.8125rem", fontWeight: bwm, display: "inline-flex", alignItems: "center", gap: "0.3rem", transition: "border-color 0.15s, background-color 0.15s, color 0.15s" }}><Pencil size={isCompact ? 11 : 13} /> {editModeMonthly ? "Done" : "Edit"}</button>
              </div>
              {monthly.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: c.textSec }}><p style={{ fontSize: "1.125rem", fontWeight: bws }}>No monthly data available</p></div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: isBrut ? "separate" : "collapse", borderSpacing: isBrut ? "0 2px" : "0" }}>
                    <thead><tr>
                      <th style={thStyle}>Month</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Profit</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Growth</th>
                      {editModeMonthly && <th style={{ ...thStyle, width: "72px" }}></th>}
                    </tr></thead>
                    <tbody>
                      {monthly.map((m, idx) => {
                        const prev = monthly[idx - 1];
                        const growthPct = prev && prev.profit !== 0 ? ((m.profit - prev.profit) / Math.abs(prev.profit)) * 100 : null;
                        return (
                        <tr key={m.id} style={{ backgroundColor: idx % 2 === 0 ? c.surface : c.surfaceAlt }}>
                          <td style={{ ...tdStyle, fontWeight: bws, fontSize: isCompact ? "0.8125rem" : "1rem" }} className={isTerm ? "terminal-glow" : ""}>{isTerm ? `> ${m.month}` : m.month}</td>
                          <td style={{ ...tdStyle, textAlign: "right", color: isTerm ? c.text : "#16a34a", fontWeight: bwx, fontSize: isCompact ? "0.875rem" : "1.125rem" }} className={isTerm ? "terminal-glow" : ""}>ރ.{m.profit.toFixed(2)}</td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>{growthPct !== null ? <span style={{ display: "inline-flex", alignItems: "center", padding: "0.15rem 0.5rem", borderRadius: isBrut ? "0" : "9999px", fontSize: "0.75rem", fontWeight: bws, backgroundColor: growthPct >= 0 ? "#dcfce7" : "#fee2e2", color: growthPct >= 0 ? "#15803d" : "#b91c1c" }}>{growthPct >= 0 ? "+" : ""}{growthPct.toFixed(1)}%</span> : <span style={{ color: c.textSec, fontSize: "0.75rem" }}>—</span>}</td>
                          {editModeMonthly && (
                            <td style={{ ...tdStyle, textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "0.375rem", justifyContent: "flex-end" }}>
                                <button onClick={() => { setEditingMonthlyId(m.id); setMonthlyForm({ month: m.month, profit: String(m.profit) }); setShowMonthlyForm(true); }} style={{ padding: "0.25rem", border: `1px solid ${c.border}`, borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.25rem"), backgroundColor: c.inputBg, color: c.textSec, cursor: "pointer", display: "inline-flex" }} title="Edit"><Pencil size={13} /></button>
                                <button onClick={() => deleteMonthlyRecord(m.id)} style={{ padding: "0.25rem", border: "1px solid #ef4444", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.25rem"), backgroundColor: "transparent", color: "#ef4444", cursor: "pointer", display: "inline-flex" }} title="Delete"><Trash2 size={13} /></button>
                              </div>
                            </td>
                          )}
                        </tr>
                        );
                      })}
                    </tbody>
                    <tfoot><tr style={{ backgroundColor: c.surfaceAlt, fontWeight: bwx, borderTop: `2px solid ${c.borderStrong}` }}>
                      <td style={{ ...tdStyle, fontWeight: bwx, fontSize: isCompact ? "0.8125rem" : "1rem", color: c.textStrong }}>TOTAL</td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: bwx, color: isTerm ? c.text : "#16a34a", fontSize: isCompact ? "1rem" : "1.25rem" }} className={isTerm ? "terminal-glow" : ""}>ރ.{monthly.reduce((s, m) => s + m.profit, 0).toFixed(2)}</td>
                      <td style={tdStyle}></td>
                      {editModeMonthly && <td style={tdStyle}></td>}
                    </tr></tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        </ErrorBoundary>
      </div>

      {/* ===== ADD TRANSACTION FORM ===== */}
      <TransactionForm
        th={{ c, isBrut, isCirc, isGlass, isLG, isTerm, isMobile, isCompact, headingFont, bwh, bwm, bws, bwx, r, rSm }}
        txForm={txForm}
        setTxForm={setTxForm}
        editingTxId={editingTxId}
        setEditingTxId={setEditingTxId}
        showTxForm={showTxForm}
        setShowTxForm={setShowTxForm}
        submitting={submitting}
        cardTypes={cardTypes}
        ownerInfoMap={ownerInfoMap}
        onSubmit={submitTransaction}
        recentRates={recentRates}
      />

      {/* ===== ADD MONTHLY FORM ===== */}
      <MonthlyForm
        th={{ c, isBrut, isCirc, isGlass, isLG, isMobile, isCompact, headingFont, bwh, bwm, bws }}
        monthlyForm={monthlyForm}
        setMonthlyForm={setMonthlyForm}
        showMonthlyForm={showMonthlyForm}
        setShowMonthlyForm={setShowMonthlyForm}
        submitting={submitting}
        onSubmit={submitMonthly}
        editingMonthlyId={editingMonthlyId}
      />

      {/* ===== CONFIRM DIALOGS ===== */}
      <ConfirmDialog
        open={confirmBulkDelete}
        title={`Delete ${selectedTxIds.size} transaction${selectedTxIds.size !== 1 ? "s" : ""}?`}
        message="Selected transactions will be permanently deleted and cannot be recovered."
        confirmLabel={`Delete ${selectedTxIds.size}`}
        danger
        th={{ c, isBrut, isCirc, isGlass, isLG, isMobile, headingFont, bwh, bwm, bws }}
        onConfirm={() => { setConfirmBulkDelete(false); deleteSelectedTransactions(); }}
        onCancel={() => setConfirmBulkDelete(false)}
      />

      {/* ===== SETTINGS MODAL ===== */}
      {showSettings && (
        <div role="dialog" aria-modal="true" aria-labelledby="settings-title" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isLG ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 200, animation: "fadeIn 0.2s cubic-bezier(.16,1,.3,1) both" }} onClick={() => setShowSettings(false)}>
          <div style={{ backgroundColor: isGlass ? "rgba(20,14,48,0.95)" : (isLG ? "rgba(255,255,255,0.65)" : c.surface), borderRadius: isBrut ? "0" : (isCirc ? "2.5rem" : (isMobile ? "0.75rem" : (isLG ? "1.5rem" : "1rem"))), padding: isMobile ? "1.25rem" : "2rem", maxWidth: isMobile ? "100%" : "560px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: c.modalShadow, animation: "slideUp 0.3s cubic-bezier(.16,1,.3,1) both", border: isBrut ? `3px solid ${c.border}` : (isLG ? "1px solid rgba(255,255,255,0.7)" : `1px solid ${c.border}`), ...((isGlass || isLG) ? { backdropFilter: "blur(20px) saturate(150%)", WebkitBackdropFilter: "blur(20px) saturate(150%)" } : {}), margin: isMobile ? "0.5rem" : "0" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", paddingBottom: "1rem", borderBottom: `1px solid ${c.border}` }}>
              <h2 id="settings-title" style={{ fontSize: "1.5rem", fontFamily: headingFont, fontWeight: bwh, color: c.textStrong, margin: 0, display: "flex", alignItems: "center", gap: "0.75rem" }}><Settings size={24} /> Settings</h2>
              <button onClick={() => setShowSettings(false)} style={{ padding: "0.5rem", border: "none", background: "none", cursor: "pointer", color: c.textSec, display: "flex", alignItems: "center" }}><X size={24} /></button>
            </div>

            {(() => {
              const sectionHeader = (label) => (
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginTop: "1.5rem", marginBottom: "0.875rem" }}>
                  <div style={{ fontSize: "0.6875rem", fontWeight: bwx, color: c.textSec, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
                  <div style={{ flex: 1, height: "1px", background: c.border }} />
                </div>
              );
              const firstSectionHeader = (label) => (
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.875rem" }}>
                  <div style={{ fontSize: "0.6875rem", fontWeight: bwx, color: c.textSec, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
                  <div style={{ flex: 1, height: "1px", background: c.border }} />
                </div>
              );
              const itemStyle = { marginBottom: "1.25rem" };
              const itemLabel = { display: "block", fontSize: "0.8125rem", fontWeight: bws, marginBottom: "0.5rem", color: c.text };
              return (
                <>
                  {/* ---- Appearance ---- */}
                  {firstSectionHeader("Appearance")}
                  <div style={itemStyle}>
                    <label style={itemLabel}>Theme</label>
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
                  <div style={itemStyle}>
                    <label style={itemLabel}>View Style</label>
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      {[{ k: "normal", i: LayoutGrid, l: "Normal", d: "Large cards" }, { k: "compact", i: List, l: "Compact", d: "Dense layout" }].map((o) => (
                        <div key={o.k} onClick={() => setViewStyle(o.k)} style={{ flex: 1, padding: "0.75rem", border: viewStyle === o.k ? `2px solid ${c.accent}` : `2px solid ${c.border}`, borderRadius: isBrut ? "0" : (isCirc ? "2rem" : "0.75rem"), backgroundColor: viewStyle === o.k ? c.accentBg : c.surfaceAlt, cursor: "pointer", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", color: viewStyle === o.k ? c.accent : c.text }}>
                          <o.i size={24} /><span>{o.l}</span><div style={{ fontSize: "0.6875rem", opacity: 0.7 }}>{o.d}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ---- Typography ---- */}
                  {sectionHeader("Typography")}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
                    <div>
                      <label style={itemLabel}>Body Font</label>
                      <select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} style={{ padding: "0.625rem 0.75rem", border: `1px solid ${c.inputBorder}`, borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), fontSize: "0.875rem", width: "100%", backgroundColor: selectBg, color: c.text, cursor: "pointer" }}>
                        {FONTS.map((f) => <option key={f.value} value={f.value}>{f.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={itemLabel}>Title Font</label>
                      <select value={titleFont} onChange={(e) => setTitleFont(e.target.value)} style={{ padding: "0.625rem 0.75rem", border: `1px solid ${c.inputBorder}`, borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), fontSize: "0.875rem", width: "100%", backgroundColor: selectBg, color: c.text, cursor: "pointer" }}>
                        {FONTS.map((f) => <option key={f.value} value={f.value}>{f.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: "1.25rem", padding: "0.625rem 0.75rem", backgroundColor: c.surfaceAlt, borderRadius: isBrut ? "0" : rSm, overflow: "hidden" }}>
                    <div style={{ fontFamily: titleFontFamily, fontSize: `${Math.min(titleFontSize, 36)}px`, fontWeight: bwh, background: c.titleGrad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Sales Dashboard</div>
                    <div style={{ fontFamily: `"${selectedFont}", sans-serif`, fontSize: `${fontSize}px`, color: c.textSec, marginTop: "0.25rem" }}>The quick brown fox jumps over.</div>
                  </div>
                  <div style={itemStyle}>
                    <label style={itemLabel}>Body Size <span style={{ fontWeight: bwm, color: c.textSec }}>· {fontSize}px</span></label>
                    <input type="range" min="12" max="40" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} style={{ width: "100%", height: "8px", borderRadius: "4px", background: c.toggleBg, outline: "none" }} />
                  </div>
                  <div style={itemStyle}>
                    <label style={itemLabel}>Heading Size <span style={{ fontWeight: bwm, color: c.textSec }}>· {titleFontSize}px</span></label>
                    <input type="range" min="16" max="72" value={titleFontSize} onChange={(e) => setTitleFontSize(parseInt(e.target.value))} style={{ width: "100%", height: "8px", borderRadius: "4px", background: c.toggleBg, outline: "none" }} />
                  </div>
                  <div style={itemStyle}>
                    <div onClick={() => setBoldText(!boldText)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1rem", border: boldText ? `2px solid ${c.accent}` : `2px solid ${c.border}`, borderRadius: isBrut ? "0" : (isCirc ? "2rem" : "0.75rem"), backgroundColor: boldText ? c.accentBg : c.surfaceAlt, cursor: "pointer" }}>
                      <div>
                        <div style={{ fontWeight: boldText ? bwx : bws, fontSize: "0.9375rem", color: c.textStrong }}>Bold Text</div>
                        <div style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "0.125rem", color: c.textSec }}>Increase font weight across the UI</div>
                      </div>
                      <div style={{ width: "44px", height: "24px", borderRadius: "12px", backgroundColor: boldText ? c.accent : c.toggleBg, position: "relative", flexShrink: 0 }}>
                        <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#ffffff", position: "absolute", top: "2px", left: boldText ? "22px" : "2px", transition: "left 0.2s cubic-bezier(.4,0,.2,1)", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}></div>
                      </div>
                    </div>
                  </div>

                  {/* ---- Display ---- */}
                  {sectionHeader("Display")}
                  <div style={itemStyle}>
                    <div onClick={() => setPillTags(!pillTags)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1rem", border: pillTags ? `2px solid ${c.accent}` : `2px solid ${c.border}`, borderRadius: isBrut ? "0" : (isCirc ? "2rem" : "0.75rem"), backgroundColor: pillTags ? c.accentBg : c.surfaceAlt, cursor: "pointer" }}>
                      <div>
                        <div style={{ fontWeight: bws, fontSize: "0.9375rem", color: c.textStrong }}>Pill Tags</div>
                        <div style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "0.125rem", color: c.textSec }}>Wrap all field values in pill-shaped tags</div>
                      </div>
                      <div style={{ width: "44px", height: "24px", borderRadius: "12px", backgroundColor: pillTags ? c.accent : c.toggleBg, position: "relative", flexShrink: 0 }}>
                        <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#ffffff", position: "absolute", top: "2px", left: pillTags ? "22px" : "2px", transition: "left 0.2s cubic-bezier(.4,0,.2,1)", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}></div>
                      </div>
                    </div>
                  </div>

                  {/* ---- Data ---- */}
                  {sectionHeader("Data")}
                  <div style={itemStyle}>
                    <label style={itemLabel}>Auto-Refresh {autoRefresh > 0 && <span style={{ fontWeight: bwm, color: c.accent }}>· every {autoRefresh}s</span>}</label>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: "0.5rem" }}>
                      {[{ v: 0, l: "Off" }, { v: 30, l: "30s" }, { v: 60, l: "1m" }, { v: 300, l: "5m" }].map((opt) => (
                        <button key={opt.v} onClick={() => setAutoRefresh(opt.v)} style={{ padding: "0.5rem", border: autoRefresh === opt.v ? `2px solid ${c.accent}` : `2px solid ${c.border}`, borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), backgroundColor: autoRefresh === opt.v ? c.accentBg : c.surfaceAlt, color: autoRefresh === opt.v ? c.accent : c.text, cursor: "pointer", fontSize: "0.8125rem", fontWeight: bws, textAlign: "center" }}>
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ---- About ---- */}
                  {sectionHeader("About")}
                  <div style={{ fontSize: "0.75rem", color: c.textSec, textAlign: "center", padding: "0.5rem 0 0.25rem" }}>
                    Sales Dashboard <span style={{ opacity: 0.7 }}>· v{APP_VERSION}</span>
                  </div>
                </>
              );
            })()}

            {/* Icon Pack */}
            <div style={{ marginBottom: "0.5rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: bws, marginBottom: "0.75rem", color: c.text }}>Icon Pack</label>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: "0.5rem" }}>
                {ICON_PACK_KEYS.map((key) => {
                  const pack = ICON_PACKS[key];
                  const PreviewSettings = pack.Settings;
                  const PreviewDownload = pack.Download;
                  const PreviewUser = pack.User;
                  const isSelected = iconPack === key;
                  return (
                    <div
                      key={key}
                      onClick={() => setIconPack(key)}
                      style={{
                        padding: "0.75rem 0.5rem",
                        border: isSelected ? `2px solid ${c.accent}` : `2px solid ${c.border}`,
                        borderRadius: isBrut ? "0" : (isCirc ? "1.5rem" : "0.625rem"),
                        backgroundColor: isSelected ? c.accentBg : c.surfaceAlt,
                        cursor: "pointer",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.5rem",
                        transition: "border-color 0.15s, background-color 0.15s",
                        color: isSelected ? c.accent : c.textSec,
                      }}
                    >
                      <div style={{ display: "flex", gap: "0.375rem", alignItems: "center", justifyContent: "center" }}>
                        <PreviewSettings size={16} />
                        <PreviewDownload size={16} />
                        <PreviewUser size={16} />
                      </div>
                      <div style={{ fontSize: "0.6875rem", fontWeight: bws, color: isSelected ? c.accent : c.text }}>{pack.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      <style>{`
        ${SKELETON_CSS}
        *, *::before, *::after { font-family: inherit; box-sizing: border-box; }
        html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        button, select, input { font-family: inherit; }
        @media (max-width: 640px) { button { min-height: 2.75rem; } input:not([type="checkbox"]):not([type="radio"]), select { min-height: 2.75rem; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translate3d(0, 12px, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }
        @keyframes shake { 0%, 100% { transform: translate3d(0, 0, 0); } 20%, 60% { transform: translate3d(-4px, 0, 0); } 40%, 80% { transform: translate3d(4px, 0, 0); } }
        @media print {
          body { background: white !important; color: black !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          * { box-shadow: none !important; text-shadow: none !important; animation: none !important; transition: none !important; }
          [style*="position: sticky"], [style*="position: fixed"] { position: static !important; }
          button, select, nav, .terminal-scanline, .midnight-stars, .circ-blob, .lg-specular::before { display: none !important; }
          table { font-size: 10px !important; border-collapse: collapse !important; }
          td, th { border: 1px solid #ddd !important; padding: 4px 8px !important; color: #000 !important; background: white !important; }
          th { background: #f5f5f5 !important; font-weight: 700 !important; }
          h1, h2, h3 { color: #000 !important; -webkit-text-fill-color: #000 !important; background: none !important; }
        }
        ${L.extraCss}
      `}</style>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}

export default App;