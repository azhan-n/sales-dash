import React, { useState, useEffect } from "react";
import {
  TrendingUp, DollarSign, Filter, User, RefreshCw, LayoutGrid, List,
  Settings, X, Calendar, Timer, Plus, Pencil, Download,
} from "lucide-react";
import { supabase } from "./supabaseClient";
import { FONTS, THEME_OPTIONS, getThemeLayout, getThemeColors } from "./themes";
import { normalizeCardType, CARD_TYPES, getCardTypeColor, getTodayDate, exportToCSV, exportMonthlyToCSV, exportTransactionsPDF, exportMonthlyPDF } from "./utils";
import { SimplePieChart, ChartToggle, StatIcon } from "./Charts";

if (typeof document !== 'undefined') {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&family=League+Spartan:wght@300;400;500;600;700;800;900&family=Open+Sans:wght@300;400;500;600;700;800&family=Lexend:wght@300;400;500;600;700;800;900&family=Public+Sans:wght@300;400;500;600;700;800;900&family=Rethink+Sans:wght@400;500;600;700;800&family=Noto+Sans:wght@300;400;500;600;700;800;900&family=Noto+Serif:wght@300;400;500;600;700;800;900&family=Quicksand:wght@300;400;500;600;700&family=Winky+Sans:wght@300;400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

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
  const [editingTxId, setEditingTxId] = useState(null);
  const [txForm, setTxForm] = useState({ cardType: "VISA DEBIT", cardNumber: "", owner: "", buyRate: "", buyAmount: "", sellRate: "", sellAmount: "" });
  const [monthlyForm, setMonthlyForm] = useState({ month: "", profit: "" });

  const submitTransaction = async () => {
    if (!txForm.owner || !txForm.cardNumber) return;
    const br = parseFloat(txForm.buyRate) || 0, ba = parseFloat(txForm.buyAmount) || 0;
    const sr = parseFloat(txForm.sellRate) || 0, sa = parseFloat(txForm.sellAmount) || 0;
    const cost = br * ba, gross = sr * sa, net = gross - cost;
    const dateStr = getTodayDate();
    const row = {
      card_type: txForm.cardType, card_number: txForm.cardNumber, owner: txForm.owner,
      buy_rate: br, buy_amount: ba, sell_rate: sr, sell_amount: sa,
      cost, gross_profit: gross, net_profit: net, date: dateStr,
    };
    // Close form immediately (optimistic)
    setShowTxForm(false);
    setTxForm({ cardType: "VISA DEBIT", cardNumber: "", owner: "", buyRate: "", buyAmount: "", sellRate: "", sellAmount: "" });
    const wasEditing = editingTxId;
    setEditingTxId(null);
    // Sync in background
    try {
      const { error: err } = wasEditing
        ? await supabase.from("transactions").update(row).eq("id", wasEditing)
        : await supabase.from("transactions").insert(row);
      if (err) throw err;
      fetchData(true);
    } catch (err) { setError("Failed to save: " + err.message); fetchData(true); }
  };

  const editTransaction = (t) => {
    const cd = getCardById(t.cardId); const ow = getOwnerById(t.ownerId);
    setTxForm({
      cardType: cd?.type || "VISA DEBIT", cardNumber: cd?.number || "", owner: ow?.name || "",
      buyRate: String(parseFloat(t.buyRate) || ""), buyAmount: String(parseFloat(t.buyAmount) || ""),
      sellRate: String(parseFloat(t.sellRate) || ""), sellAmount: String(parseFloat(t.sellAmount) || ""),
    });
    setEditingTxId(t.id);
    setShowTxForm(true);
  };

  const submitMonthly = async () => {
    if (!monthlyForm.month || !monthlyForm.profit) return;
    // Close form immediately
    const formData = { ...monthlyForm };
    setShowMonthlyForm(false);
    setMonthlyForm({ month: "", profit: "" });
    // Sync in background
    try {
      const { error: err } = await supabase.from("monthly").insert({
        month: formData.month, profit: parseFloat(formData.profit) || 0,
      });
      if (err) throw err;
      fetchData(true);
    } catch (err) { setError("Failed to add monthly record: " + err.message); fetchData(true); }
  };

  // --- Monthly Transaction History ---
  const [historyPeriods, setHistoryPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [historyTransactions, setHistoryTransactions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistoryPeriods = async () => {
    const { data } = await supabase.from("transaction_history").select("period").order("period", { ascending: false });
    if (data) {
      const unique = [...new Set(data.map((r) => r.period))];
      setHistoryPeriods(unique);
    }
  };

  const fetchHistoryForPeriod = async (period) => {
    setLoadingHistory(true);
    const { data } = await supabase.from("transaction_history").select("*").eq("period", period).order("id", { ascending: true });
    if (data) {
      setHistoryTransactions(data.map((r) => ({
        id: r.id, cardType: r.card_type, cardNumber: r.card_number, owner: r.owner,
        buyRate: r.buy_rate, buyAmount: r.buy_amount, sellRate: r.sell_rate, sellAmount: r.sell_amount,
        cost: r.cost, grossProfit: r.gross_profit, netProfit: r.net_profit, date: r.date || "",
      })));
    }
    setLoadingHistory(false);
  };

  const archiveTransactions = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // Get all current transactions
      const { data: txns, error: readErr } = await supabase.from("transactions").select("*");
      if (readErr) throw readErr;
      if (!txns || txns.length === 0) { setSubmitting(false); return; }
      // Determine period label (previous month)
      const now = new Date();
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const period = prev.toLocaleString("default", { month: "long", year: "numeric" });
      // Check if already archived
      const { data: existing } = await supabase.from("transaction_history").select("id").eq("period", period).limit(1);
      if (existing && existing.length > 0) { setSubmitting(false); return; }
      // Copy to history
      const historyRows = txns.map((r) => ({
        period, card_type: r.card_type, card_number: r.card_number, owner: r.owner,
        buy_rate: r.buy_rate, buy_amount: r.buy_amount, sell_rate: r.sell_rate, sell_amount: r.sell_amount,
        cost: r.cost, gross_profit: r.gross_profit, net_profit: r.net_profit, date: r.date || "",
      }));
      const { error: insertErr } = await supabase.from("transaction_history").insert(historyRows);
      if (insertErr) throw insertErr;
      // Clear transactions table
      const { error: delErr } = await supabase.from("transactions").delete().neq("id", 0);
      if (delErr) throw delErr;
      // Refresh
      fetchData(true);
      fetchHistoryPeriods();
    } catch (err) { setError("Failed to archive: " + err.message); }
    finally { setSubmitting(false); }
  };

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
  const [expandedOwner, setExpandedOwner] = useState(null);
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

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [txRes, mRes] = await Promise.all([
        supabase.from("transactions").select("*").order("created_at", { ascending: false }),
        supabase.from("monthly").select("*").order("id", { ascending: true }),
      ]);
      if (txRes.error) throw txRes.error;
      if (mRes.error) throw mRes.error;
      setLastSync(new Date());
      // Map snake_case DB columns to camelCase frontend fields
      const txData = (txRes.data || []).map((r, i) => ({
        id: r.id, cardType: r.card_type, cardNumber: r.card_number, owner: r.owner,
        buyRate: r.buy_rate, buyAmount: r.buy_amount, sellRate: r.sell_rate, sellAmount: r.sell_amount,
        cost: r.cost, grossProfit: r.gross_profit, netProfit: r.net_profit, date: r.date || "",
      }));
      if (txData.length > 0) processTransactions(txData);
      else { setTransactions([]); setOwners([]); setCards([]); setStats({}); }
      setMonthly((mRes.data || []).map((r) => ({ month: r.month, profit: parseFloat(r.profit) || 0 })));
    } catch (err) { setError("Failed to load data: " + (err.message || "Check connection")); }
    finally { setLoading(false); }
  };
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
    const colMap = { date: (t) => t.date || "", cardType: (t) => getCardById(t.cardId)?.type || "", cardNumber: (t) => getCardById(t.cardId)?.number || "", owner: (t) => getOwnerById(t.ownerId)?.name || "",
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
  const cardTypes = CARD_TYPES;

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
              {isTerm ? "> " : ""}{lastSync ? `Last updated: ${lastSync.toLocaleTimeString()}` : "Loading data..."}
              {autoRefresh > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.6875rem", color: c.accent, backgroundColor: c.accentBg, padding: "0.125rem 0.5rem", borderRadius: "999px" }}><Timer size={10} />{autoRefresh}s</span>}
              <button onClick={() => setShowSettings(true)} style={{ padding: "0.5rem", borderRadius: isBrut ? "0" : (isCirc || isLG ? "50%" : "0.5rem"), border: isBrut ? `2px solid ${c.border}` : `1px solid ${c.border}`, backgroundColor: c.inputBg, color: c.text, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", marginLeft: "0.5rem" }} title="Settings"><Settings size={16} /></button>
            </p>
          </div>
          <button onClick={fetchData} style={{ padding: isCompact ? "0.5rem 0.875rem" : "0.625rem 1.25rem", borderRadius: isBrut ? "0" : ((isLG || isCirc) ? "999px" : "0.5rem"), border: isBrut ? "3px solid #000" : (isLG ? "1px solid rgba(255,255,255,0.5)" : "none"), cursor: loading ? "not-allowed" : "pointer", fontSize: isCompact ? "0.75rem" : "0.875rem", fontWeight: bws, display: "inline-flex", alignItems: "center", gap: "0.5rem", background: c.btnGrad, color: isBrut ? "#fff" : "#ffffff", opacity: loading ? 0.7 : 1, boxShadow: isBrut ? "4px 4px 0 #000" : `0 4px 15px ${c.btnGlow}` }} disabled={loading}>
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
                        <div key={o.id} style={{ cursor: "pointer" }} onClick={() => setExpandedOwner(expandedOwner === o.id ? null : o.id)}>
                        <div style={{ padding: isCompact ? "1rem" : "1.5rem", backgroundColor: c.surfaceAlt, borderRadius: isBrut ? "0" : (isCirc ? "1.5rem" : rSm), border: isBrut ? `2px solid ${c.border}` : `1px solid ${expandedOwner === o.id ? c.accent : c.border}`, ...(isBrut ? { boxShadow: "3px 3px 0 #000" } : {}), ...((isGlass || isLG) ? { backdropFilter: "blur(16px) saturate(150%)", WebkitBackdropFilter: "blur(16px) saturate(150%)" } : {}), transition: "border-color 0.15s ease" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: isCompact ? "0.625rem" : "1rem", gap: "0.5rem" }}>
                            <span style={{ fontFamily: headingFont, fontWeight: bwh, fontSize: isMobile ? "0.9375rem" : (isCompact ? "1rem" : "1.25rem"), color: c.textStrong, textTransform: isBrut ? "uppercase" : "none", display: "flex", alignItems: "center", gap: "0.5rem" }} className={isTerm ? "terminal-glow" : ""}>
                              {isTerm ? `> ${o.name}` : o.name}
                              <span style={{ fontSize: "0.625rem", color: expandedOwner === o.id ? c.accent : c.textSec, transition: "transform 0.2s ease, color 0.15s ease", display: "inline-block", transform: expandedOwner === o.id ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
                            </span>
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
                        {expandedOwner === o.id && (() => {
                          const ownerTx = transactions.filter((t) => t.ownerId === o.id);
                          if (ownerTx.length === 0) return <div style={{ padding: "1rem", color: c.textSec, fontSize: "0.8125rem" }}>No transactions</div>;
                          return (
                            <div style={{ marginTop: isCompact ? "0.5rem" : "0.75rem", borderRadius: isBrut ? "0" : (isCirc ? "1rem" : rSm), overflow: "hidden", border: `1px solid ${c.border}`, animation: "slideUp 0.25s cubic-bezier(.16,1,.3,1) both" }}>
                              <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: isCompact ? "0.6875rem" : "0.8125rem" }}>
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
                                          <td style={{ padding: "0.375rem 0.5rem", textAlign: "right" }}>${parseFloat(t.sellAmount).toFixed(2)}</td>
                                          <td style={{ padding: "0.375rem 0.5rem", textAlign: "right" }}>${t.cost.toFixed(2)}</td>
                                          <td style={{ padding: "0.375rem 0.5rem", textAlign: "right", color: isTerm ? c.text : "#f97316", fontWeight: bws }}>${t.grossProfit.toFixed(2)}</td>
                                          <td style={{ padding: "0.375rem 0.5rem", textAlign: "right", color: isTerm ? c.text : (t.netProfit >= 0 ? "#16a34a" : "#ef4444"), fontWeight: bwx }}>${t.netProfit.toFixed(2)}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                  <tfoot><tr style={{ backgroundColor: c.surfaceDeep, borderTop: `2px solid ${c.border}` }}>
                                    <td colSpan="2" style={{ padding: "0.5rem", fontWeight: bwx, fontSize: isCompact ? "0.6875rem" : "0.8125rem", color: c.textStrong }}>TOTALS</td>
                                    <td style={{ padding: "0.375rem 0.5rem", textAlign: "right" }}></td>
                                    <td style={{ padding: "0.375rem 0.5rem", textAlign: "right", fontWeight: bwx }}>${ownerTx.reduce((s, t) => s + (parseFloat(t.buyAmount) || 0), 0).toFixed(2)}</td>
                                    <td style={{ padding: "0.375rem 0.5rem", textAlign: "right" }}></td>
                                    <td style={{ padding: "0.375rem 0.5rem", textAlign: "right", fontWeight: bwx }}>${ownerTx.reduce((s, t) => s + (parseFloat(t.sellAmount) || 0), 0).toFixed(2)}</td>
                                    <td style={{ padding: "0.375rem 0.5rem", textAlign: "right", fontWeight: bwx }}>${ownerTx.reduce((s, t) => s + t.cost, 0).toFixed(2)}</td>
                                    <td style={{ padding: "0.375rem 0.5rem", textAlign: "right", fontWeight: bwx, color: isTerm ? c.text : "#f97316" }}>${ownerTx.reduce((s, t) => s + t.grossProfit, 0).toFixed(2)}</td>
                                    <td style={{ padding: "0.375rem 0.5rem", textAlign: "right", fontWeight: bwx, color: isTerm ? c.text : "#16a34a" }}>${ownerTx.reduce((s, t) => s + t.netProfit, 0).toFixed(2)}</td>
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
            {/* Period Selector */}
            <div style={{ ...cardBase, marginBottom: isCompact ? "0.625rem" : "1rem", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", gap: "0.75rem", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <Calendar size={isCompact ? 14 : 16} style={{ color: c.textSec }} />
                <span style={{ fontSize: isCompact ? "0.75rem" : "0.875rem", fontWeight: bwm, color: c.text }}>{isTerm ? "> Period:" : "Period:"}</span>
                <select value={selectedPeriod} onChange={(e) => { setSelectedPeriod(e.target.value); if (e.target.value !== "current") fetchHistoryForPeriod(e.target.value); }} style={{ padding: isCompact ? "0.375rem 0.5rem" : "0.5rem 0.75rem", border: isBrut ? `2px solid ${c.border}` : `1px solid ${c.inputBorder}`, borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.25rem"), fontSize: isCompact ? "0.75rem" : "0.875rem", backgroundColor: c.inputBg, color: c.text }}>
                  <option value="current">Current Month</option>
                  {historyPeriods.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <button onClick={archiveTransactions} disabled={submitting || selectedPeriod !== "current"} style={{ padding: isCompact ? "0.375rem 0.625rem" : "0.5rem 1rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: `1px solid ${c.border}`, backgroundColor: c.inputBg, color: c.text, cursor: submitting ? "not-allowed" : "pointer", fontSize: isCompact ? "0.75rem" : "0.8125rem", fontWeight: bwm, opacity: submitting || selectedPeriod !== "current" ? 0.5 : 1, display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                <Calendar size={isCompact ? 12 : 14} /> {submitting ? "Archiving..." : "Archive & Clear"}
              </button>
            </div>
            {selectedPeriod !== "current" && (
              <div style={{ padding: isCompact ? "0.5rem 0.75rem" : "0.75rem 1rem", backgroundColor: c.accentBg, borderRadius: rSm, marginBottom: isCompact ? "0.625rem" : "1rem", fontSize: isCompact ? "0.75rem" : "0.8125rem", color: c.accent, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Calendar size={14} /> Viewing archived transactions from <strong style={{ marginLeft: "0.25rem" }}>{selectedPeriod}</strong>
              </div>
            )}
            {(() => {
              // Use history or current data
              const isHistory = selectedPeriod !== "current";
              const displayTx = isHistory ? historyTransactions : sortedTransactions;
              const displayFiltered = isHistory ? historyTransactions : filteredTransactions;
              return (<>
            <div style={{ ...cardBase, marginBottom: isCompact ? "0.625rem" : "1rem" }}>
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", flexWrap: "wrap", gap: isCompact ? "0.5rem" : "1rem", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", flexWrap: "wrap", gap: isCompact ? "0.5rem" : "1rem", alignItems: isMobile ? "stretch" : "center", flex: isMobile ? "1" : undefined }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><Filter size={isCompact ? 14 : 16} style={{ color: c.textSec }} /><span style={{ fontSize: isCompact ? "0.75rem" : "0.875rem", fontWeight: bwm, color: c.text, textTransform: isBrut ? "uppercase" : "none" }}>{isTerm ? "> Filters:" : "Filters:"}</span></div>
                  {!isHistory && [{val: filterCardType, set: setFilterCardType, opts: [{ v: "all", l: "All Card Types" }, ...cardTypes.map((t) => ({ v: t, l: t }))] }, { val: filterOwner, set: setFilterOwner, opts: [{ v: "all", l: "All Owners" }, ...owners.map((o) => ({ v: o.id, l: o.name }))] }, { val: filterCardNumber, set: setFilterCardNumber, opts: [{ v: "all", l: "All Card Numbers" }, ...availableCardNumbers.map((n) => ({ v: n, l: `Card #${n}` }))] }].map((f, i) => (
                    <select key={i} style={{ padding: isCompact ? "0.375rem 0.5rem" : "0.5rem 0.75rem", border: isBrut ? `2px solid ${c.border}` : `1px solid ${c.inputBorder}`, borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.25rem"), fontSize: isCompact ? "0.75rem" : "0.875rem", minWidth: isMobile ? "0" : (isCompact ? "120px" : "150px"), width: isMobile ? "100%" : "auto", backgroundColor: c.inputBg, color: c.text }} value={f.val} onChange={(e) => f.set(e.target.value)}>
                      {f.opts.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", width: isMobile ? "100%" : "auto" }}>
                  {[{ m: "table", icon: List, label: "Table" }, { m: "cards", icon: LayoutGrid, label: "Cards" }].map(({ m, icon: Ic, label }) => (
                    <button key={m} onClick={() => setViewMode(m)} style={{ padding: isCompact ? "0.375rem 0.625rem" : "0.5rem 1rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: isBrut ? `2px solid ${c.border}` : `1px solid ${c.border}`, backgroundColor: viewMode === m ? c.accent : c.inputBg, color: viewMode === m ? "#fff" : c.text, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", fontSize: isCompact ? "0.75rem" : "0.875rem", fontWeight: bwm, flex: isMobile ? 1 : undefined, ...(isBrut && viewMode === m ? { boxShadow: "3px 3px 0 #000" } : {}) }}><Ic size={isCompact ? 14 : 16} /> {label}</button>
                  ))}
                  {!isHistory && <button onClick={() => { setEditingTxId(null); setTxForm({ cardType: "VISA DEBIT", cardNumber: "", owner: "", buyRate: "", buyAmount: "", sellRate: "", sellAmount: "" }); setShowTxForm(true); }} style={{ padding: isCompact ? "0.375rem 0.625rem" : "0.5rem 1rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: "none", background: c.btnGrad, color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", fontSize: isCompact ? "0.75rem" : "0.875rem", fontWeight: bwm, flex: isMobile ? 1 : undefined, boxShadow: `0 2px 8px ${c.btnGlow}` }}><Plus size={isCompact ? 14 : 16} /> Add</button>}
                  <button onClick={() => exportToCSV(displayFiltered, getCardById, getOwnerById, isHistory ? selectedPeriod : "transactions")} style={{ padding: isCompact ? "0.375rem 0.625rem" : "0.5rem 1rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: `1px solid ${c.border}`, backgroundColor: c.inputBg, color: c.text, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", fontSize: isCompact ? "0.75rem" : "0.875rem", fontWeight: bwm }}><Download size={isCompact ? 12 : 14} /> CSV</button>
                  <button onClick={() => exportTransactionsPDF(displayFiltered, getCardById, getOwnerById, isHistory ? selectedPeriod : "Transactions Report")} style={{ padding: isCompact ? "0.375rem 0.625rem" : "0.5rem 1rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: `1px solid ${c.border}`, backgroundColor: c.inputBg, color: c.text, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", fontSize: isCompact ? "0.75rem" : "0.875rem", fontWeight: bwm }}><Download size={isCompact ? 12 : 14} /> PDF</button>
                </div>
              </div>
            </div>

            {viewMode === "table" ? (
              <div style={cardBase}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: isBrut ? "separate" : "collapse", borderSpacing: isBrut ? "0 2px" : "0" }}>
                    <thead><tr>
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
                      {!isHistory && <th style={{ ...thStyle, width: "40px" }}></th>}
                    </tr></thead>
                    <tbody>
                      {displayTx.map((t) => {
                        const cd = getCardById(t.cardId); const ow = getOwnerById(t.ownerId); const cc = getCardTypeColor(cd?.type); const mb = getProfitMarginBadge(t.profitMargin);
                        return (
                          <tr key={t.id}>
                            <td style={{ ...tdStyle, fontSize: isCompact ? "0.6875rem" : "0.8125rem", color: c.textSec, whiteSpace: "nowrap" }}>{t.date || "-"}</td>
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
                            {!isHistory && <td style={{ ...tdStyle, textAlign: "center" }}><button onClick={() => editTransaction(t)} style={{ background: "none", border: "none", cursor: "pointer", color: c.accent, padding: "0.25rem", display: "flex", alignItems: "center", opacity: 0.6, transition: "opacity 0.15s" }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}><Pencil size={14} /></button></td>}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: c.surfaceAlt, fontWeight: bwx, borderTop: `2px solid ${c.borderStrong}` }}>
                        <td colSpan="3" style={{ ...tdStyle, fontWeight: bwx, fontSize: isCompact ? "0.6875rem" : "0.875rem", color: c.textStrong, textTransform: isBrut ? "uppercase" : "none" }}>TOTALS</td>
                        <td colSpan="2" style={{ ...tdStyle, textAlign: "center", fontSize: isCompact ? "0.625rem" : "0.8125rem", color: c.textMid }}><div>Sell Amt:</div><div style={{ fontWeight: bwx, fontSize: isCompact ? "0.6875rem" : "0.9375rem", color: c.textStrong }}>${displayFiltered.reduce((s, t) => s + (parseFloat(t.sellAmount) || 0), 0).toFixed(2)}</div></td>
                        <td style={{ ...tdStyle, textAlign: "center", fontSize: isCompact ? "0.625rem" : "0.8125rem", color: c.textMid }}><div>Avg Sell:</div><div style={{ fontWeight: bwx, fontSize: isCompact ? "0.6875rem" : "0.9375rem", color: c.textStrong }}>{displayFiltered.length > 0 ? (displayFiltered.reduce((s, t) => s + (parseFloat(t.sellRate) || 0), 0) / displayFiltered.length).toFixed(2) : "0.00"}</div></td>
                        <td style={{ ...tdStyle, textAlign: "center", fontSize: isCompact ? "0.625rem" : "0.8125rem", color: c.textMid }}><div>Avg Buy:</div><div style={{ fontWeight: bwx, fontSize: isCompact ? "0.6875rem" : "0.9375rem", color: c.textStrong }}>{(() => { const tc2 = displayFiltered.reduce((s, t) => s + (parseFloat(t.cost) || 0), 0); const ts2 = displayFiltered.reduce((s, t) => s + (parseFloat(t.sellAmount) || 0), 0); return (ts2 > 0 ? tc2 / ts2 : 0).toFixed(2); })()}</div></td>
                        <td style={{ ...tdStyle, textAlign: "center", fontSize: isCompact ? "0.625rem" : "0.8125rem", color: c.textMid }}><div>Buy Amt:</div><div style={{ fontWeight: bwx, fontSize: isCompact ? "0.6875rem" : "0.9375rem", color: c.textStrong }}>${displayFiltered.reduce((s, t) => s + (parseFloat(t.buyAmount) || 0), 0).toFixed(2)}</div></td>
                        <td style={tdStyle}></td>
                        <td style={{ ...tdStyle, textAlign: "center", fontSize: isCompact ? "0.625rem" : "0.8125rem" }}><div>Gross:</div><div style={{ color: isTerm ? c.text : "#f97316", fontWeight: bwx, fontSize: isCompact ? "0.6875rem" : "0.9375rem" }}>${displayFiltered.reduce((s, t) => s + t.grossProfit, 0).toFixed(2)}</div></td>
                        <td style={{ ...tdStyle, textAlign: "center", fontSize: isCompact ? "0.625rem" : "0.8125rem" }}><div>Net:</div><div style={{ color: isTerm ? c.text : "#16a34a", fontWeight: bwx, fontSize: isCompact ? "0.6875rem" : "0.9375rem" }} className={isTerm ? "terminal-glow" : ""}>${displayFiltered.reduce((s, t) => s + t.netProfit, 0).toFixed(2)}</div></td>
                        <td style={tdStyle}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: (isBrut || isMobile) ? "1fr" : "repeat(2, 1fr)", gap: isCompact ? "0.625rem" : "1rem" }}>
                {displayTx.map((t, idx) => {
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
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isCompact ? "0.5rem" : "1rem" }}>
                        <div><div style={{ fontSize: isCompact ? "0.6875rem" : "0.875rem", color: c.textSec }}>Owner</div><div style={{ fontWeight: bws, fontSize: isCompact ? "0.8125rem" : "1rem", color: c.text }}>{ow?.name}</div></div>
                        <div style={{ textAlign: "right" }}><div style={{ fontSize: isCompact ? "0.6875rem" : "0.875rem", color: c.textSec }}>Date</div><div style={{ fontWeight: bwm, fontSize: isCompact ? "0.75rem" : "0.875rem", color: c.text }}>{t.date || "-"}</div></div>
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
                      {!isHistory && <button onClick={(e) => { e.stopPropagation(); editTransaction(t); }} style={{ marginTop: isCompact ? "0.5rem" : "0.75rem", width: "100%", padding: "0.375rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.375rem"), border: `1px solid ${c.border}`, backgroundColor: "transparent", color: c.textSec, cursor: "pointer", fontSize: "0.75rem", fontWeight: bwm, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", transition: "color 0.15s, border-color 0.15s" }} onMouseEnter={(e) => { e.currentTarget.style.color = c.accent; e.currentTarget.style.borderColor = c.accent; }} onMouseLeave={(e) => { e.currentTarget.style.color = c.textSec; e.currentTarget.style.borderColor = c.border; }}><Pencil size={12} /> Edit</button>}
                    </div>
                  );
                })}
              </div>
            )}
              </>);
            })()}
          </div>
        )}

        {/* ===== MONTHLY TAB ===== */}
        {activeTab === "monthly" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginBottom: isCompact ? "0.625rem" : "1rem" }}>
              <button onClick={() => exportMonthlyToCSV(monthly)} style={{ padding: isCompact ? "0.375rem 0.625rem" : "0.5rem 1rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: `1px solid ${c.border}`, backgroundColor: c.inputBg, color: c.text, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: isCompact ? "0.75rem" : "0.875rem", fontWeight: bwm }}><Download size={isCompact ? 12 : 14} /> CSV</button>
              <button onClick={() => exportMonthlyPDF(monthly)} style={{ padding: isCompact ? "0.375rem 0.625rem" : "0.5rem 1rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: `1px solid ${c.border}`, backgroundColor: c.inputBg, color: c.text, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: isCompact ? "0.75rem" : "0.875rem", fontWeight: bwm }}><Download size={isCompact ? 12 : 14} /> PDF</button>
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
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isLG ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 200, animation: "fadeIn 0.2s cubic-bezier(.16,1,.3,1) both" }} onClick={() => { setShowTxForm(false); setEditingTxId(null); setTxForm({ cardType: "VISA DEBIT", cardNumber: "", owner: "", buyRate: "", buyAmount: "", sellRate: "", sellAmount: "" }); }}>
            <div style={{ backgroundColor: isGlass ? "rgba(20,14,48,0.95)" : (isLG ? "rgba(255,255,255,0.65)" : c.surface), borderRadius: isBrut ? "0" : (isCirc ? "2.5rem" : (isMobile ? "0.75rem" : "1rem")), padding: isMobile ? "1.25rem" : "2rem", maxWidth: isMobile ? "100%" : "520px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: c.modalShadow, animation: "slideUp 0.3s cubic-bezier(.16,1,.3,1) both", border: isBrut ? `3px solid ${c.border}` : `1px solid ${c.border}`, margin: isMobile ? "0.5rem" : "0" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: `1px solid ${c.border}` }}>
                <h2 style={{ fontSize: "1.25rem", fontFamily: headingFont, fontWeight: bwh, color: c.textStrong, margin: 0 }}>{editingTxId ? "Edit Transaction" : "Add Transaction"}</h2>
                <button onClick={() => { setShowTxForm(false); setEditingTxId(null); setTxForm({ cardType: "VISA DEBIT", cardNumber: "", owner: "", buyRate: "", buyAmount: "", sellRate: "", sellAmount: "" }); }} style={{ padding: "0.375rem", border: "none", background: "none", cursor: "pointer", color: c.textSec }}><X size={20} /></button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0.75rem" }}>
                <div><label style={fLabel}>Card Type</label><select value={txForm.cardType} onChange={(e) => setTxForm({ ...txForm, cardType: e.target.value })} style={fInput}>{cardTypes.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label style={fLabel}>Card Number</label><input type="text" value={txForm.cardNumber} onChange={(e) => setTxForm({ ...txForm, cardNumber: e.target.value })} placeholder="e.g. 2581" style={fInput} /></div>
                <div><label style={fLabel}>Owner</label><input type="text" value={txForm.owner} onChange={(e) => setTxForm({ ...txForm, owner: e.target.value })} placeholder="Name" style={fInput} /></div>
                <div><label style={fLabel}>Buy Rate</label><input type="number" step="0.01" value={txForm.buyRate} onChange={(e) => setTxForm({ ...txForm, buyRate: e.target.value })} style={fInput} /></div>
                <div><label style={fLabel}>Buy Amount ($)</label><input type="number" step="0.01" value={txForm.buyAmount} onChange={(e) => setTxForm({ ...txForm, buyAmount: e.target.value })} style={fInput} /></div>
                <div><label style={fLabel}>Sell Rate</label><input type="number" step="0.01" value={txForm.sellRate} onChange={(e) => setTxForm({ ...txForm, sellRate: e.target.value })} style={fInput} /></div>
                <div><label style={fLabel}>Sell Amount ($)</label><input type="number" step="0.01" value={txForm.sellAmount} onChange={(e) => setTxForm({ ...txForm, sellAmount: e.target.value })} style={fInput} /></div>
              </div>
              {/* Auto-computed values */}
              {(() => {
                const br = parseFloat(txForm.buyRate) || 0, ba = parseFloat(txForm.buyAmount) || 0;
                const sr = parseFloat(txForm.sellRate) || 0, sa = parseFloat(txForm.sellAmount) || 0;
                const cost = br * ba, gross = sr * sa, net = gross - cost;
                const compStyle = { padding: isCompact ? "0.5rem" : "0.625rem 0.75rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.375rem"), fontSize: isCompact ? "0.8125rem" : "0.875rem", width: "100%", backgroundColor: c.surfaceAlt, color: c.textStrong, fontWeight: bwx, border: `1px solid ${c.border}` };
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
                    <div><label style={fLabel}>Cost</label><div style={compStyle}>${cost.toFixed(2)}</div></div>
                    <div><label style={fLabel}>Gross Profit</label><div style={{ ...compStyle, color: isTerm ? c.text : "#f97316" }}>${gross.toFixed(2)}</div></div>
                    <div><label style={fLabel}>Net Profit</label><div style={{ ...compStyle, color: isTerm ? c.text : (net >= 0 ? "#16a34a" : "#ef4444") }}>${net.toFixed(2)}</div></div>
                  </div>
                );
              })()}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
                <button onClick={() => { setShowTxForm(false); setEditingTxId(null); setTxForm({ cardType: "VISA DEBIT", cardNumber: "", owner: "", buyRate: "", buyAmount: "", sellRate: "", sellAmount: "" }); }} style={{ padding: "0.5rem 1.25rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: `1px solid ${c.border}`, backgroundColor: "transparent", color: c.text, cursor: "pointer", fontSize: "0.875rem", fontWeight: bwm }}>Cancel</button>
                <button onClick={submitTransaction} disabled={submitting} style={{ padding: "0.5rem 1.5rem", borderRadius: isBrut ? "0" : (isCirc ? "999px" : "0.5rem"), border: "none", background: c.btnGrad, color: "#fff", cursor: submitting ? "not-allowed" : "pointer", fontSize: "0.875rem", fontWeight: bwm, opacity: submitting ? 0.7 : 1, boxShadow: `0 2px 8px ${c.btnGlow}` }}>{submitting ? "Saving..." : (editingTxId ? "Update" : "Save")}</button>
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

export default App;