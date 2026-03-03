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

// Load all fonts
if (typeof document !== 'undefined') {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Gabarito:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=League+Spartan:wght@300;400;500;600;700;800;900&family=Open+Sans:wght@300;400;500;600;700&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

const getStyles = (theme, font = "Poppins", fontSize = 16, viewStyle = "normal", boldText = false) => {
  const dark = theme === "dark" || (theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const isCompact = viewStyle === "compact";
  const headingFont = '"Gabarito", sans-serif';
  const bodyWeight = boldText ? "600" : "400";
  const bodyWeightMedium = boldText ? "700" : "500";
  const bodyWeightSemibold = boldText ? "800" : "600";
  const bodyWeightBold = boldText ? "900" : "700";
  
  return {
    container: {
      minHeight: "100vh",
      backgroundColor: dark ? "#0f172a" : (isCompact ? "#f8fafc" : "#f3f4f6"),
      fontFamily: `"${font}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
      fontSize: `${fontSize}px`,
      fontWeight: bodyWeight,
      transition: "background-color 0.3s ease",
    },
    header: {
      backgroundColor: dark ? "#1e293b" : "#ffffff",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      borderBottom: `1px solid ${dark ? "#334155" : "#e5e7eb"}`,
      padding: "1.5rem 1rem",
      transition: "all 0.3s ease",
    },
    headerContent: { maxWidth: "80rem", margin: "0 auto" },
    headerFlex: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    title: {
      fontSize: "2.5rem",
      fontFamily: headingFont,
      fontWeight: "800",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      color: "transparent",
      margin: 0,
      transition: "all 0.3s ease",
    },
    subtitle: {
      fontSize: "0.875rem",
      color: dark ? "#94a3b8" : "#6b7280",
      marginTop: "0.25rem",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      transition: "color 0.3s ease",
    },
    tabs: {
      backgroundColor: dark ? "#1e293b" : "#ffffff",
      borderBottom: `1px solid ${dark ? "#334155" : "#e5e7eb"}`,
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
      color: dark ? "#94a3b8" : "#6b7280",
    },
    tabActive: { 
      borderBottomColor: "#2563eb", 
      color: "#2563eb",
      transform: "translateY(-2px)",
    },
    tabInactive: { color: dark ? "#94a3b8" : "#6b7280" },
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
      borderRadius: isCompact ? "0.375rem" : "1rem",
      color: "#ffffff",
      boxShadow: isCompact ? "0 1px 3px rgba(0,0,0,0.1)" : "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
      cursor: "pointer",
      animation: "slideUp 0.5s ease-out",
    },
    statCardHover: {
      transform: "translateY(-8px)",
      boxShadow: "0 25px 35px -5px rgba(0,0,0,0.2)",
    },
    statCardBlue: { background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
    statCardGreen: { background: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)" },
    statCardPurple: { background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)" },
    statCardOrange: { background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)" },
    statCardTeal: { background: "linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%)" },
    statCardPink: { background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
    card: {
      backgroundColor: dark ? "#1e293b" : "#ffffff",
      borderRadius: isCompact ? "0.375rem" : "1rem",
      padding: isCompact ? "1rem" : "2rem",
      boxShadow: dark ? "0 1px 3px rgba(0,0,0,0.3)" : (isCompact ? "0 1px 2px rgba(0,0,0,0.05)" : "0 1px 3px rgba(0,0,0,0.1)"),
      marginBottom: isCompact ? "1rem" : "2rem",
      border: `1px solid ${dark ? "#334155" : (isCompact ? "#e2e8f0" : "transparent")}`,
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
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "#ffffff",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
    },
    viewToggle: {
      padding: "0.5rem 1rem",
      borderRadius: "0.5rem",
      border: `1px solid ${dark ? "#475569" : "#e5e7eb"}`,
      backgroundColor: dark ? "#334155" : "#f9fafb",
      color: dark ? "#f1f5f9" : "#374151",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      transition: "all 0.3s ease",
      fontSize: "0.875rem",
      fontWeight: bodyWeightMedium,
    },
    viewToggleActive: {
      backgroundColor: "#2563eb",
      color: "#ffffff",
      borderColor: "#2563eb",
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
      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
    },
    buttonPrimary: { backgroundColor: "#2563eb", color: "#ffffff" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: {
      padding: "0.75rem 1rem",
      textAlign: "left",
      fontSize: "0.75rem",
      fontWeight: bodyWeightSemibold,
      color: dark ? "#94a3b8" : "#6b7280",
      backgroundColor: dark ? "#0f172a" : "#f9fafb",
      borderBottom: `1px solid ${dark ? "#334155" : "#e5e7eb"}`,
      transition: "all 0.3s ease",
    },
    td: {
      padding: "0.75rem 1rem",
      fontSize: "0.875rem",
      borderBottom: `1px solid ${dark ? "#334155" : "#e5e7eb"}`,
      color: dark ? "#e2e8f0" : "#111827",
      backgroundColor: dark ? "#1e293b" : "#ffffff",
      transition: "all 0.3s ease",
    },
    transactionCard: {
      backgroundColor: dark ? "#1e293b" : "#ffffff",
      borderRadius: "0.75rem",
      padding: "1.5rem",
      marginBottom: "1rem",
      border: `1px solid ${dark ? "#334155" : "#e5e7eb"}`,
      transition: "all 0.3s ease, transform 0.2s ease",
      cursor: "pointer",
      animation: "slideUp 0.4s ease-out",
    },
    transactionCardHover: {
      transform: "translateY(-4px)",
      boxShadow: dark ? "0 8px 16px rgba(0,0,0,0.3)" : "0 8px 16px rgba(0,0,0,0.1)",
    },
    select: {
      padding: "0.5rem 0.75rem",
      border: `1px solid ${dark ? "#475569" : "#e5e7eb"}`,
      borderRadius: "0.25rem",
      fontSize: "0.875rem",
      minWidth: "150px",
      width: "100%",
      backgroundColor: dark ? "#334155" : "#ffffff",
      color: dark ? "#e2e8f0" : "#111827",
      transition: "all 0.3s ease",
    },
    loading: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      fontSize: "1.125rem",
      color: dark ? "#94a3b8" : "#6b7280",
      flexDirection: "column",
      gap: "1rem",
      backgroundColor: dark ? "#0f172a" : "#f3f4f6",
    },
    skeleton: {
      backgroundColor: dark ? "#334155" : "#e5e7eb",
      borderRadius: "0.5rem",
      animation: "pulse 1.5s ease-in-out infinite",
    },
    error: {
      padding: "1rem",
      backgroundColor: dark ? "#450a0a" : "#fee2e2",
      border: `1px solid ${dark ? "#991b1b" : "#ef4444"}`,
      borderRadius: "0.5rem",
      color: dark ? "#fca5a5" : "#991b1b",
      marginBottom: "2rem",
      textAlign: "center",
      animation: "shake 0.5s ease-in-out",
    },
    ownerCard: {
      padding: isCompact ? "1rem" : "1.5rem",
      backgroundColor: dark ? "#0f172a" : "#f9fafb",
      borderRadius: isCompact ? "0.375rem" : "0.75rem",
      border: `1px solid ${dark ? "#334155" : "#e5e7eb"}`,
      transition: "all 0.3s ease",
    },
    ownerStatBox: {
      textAlign: "center",
      padding: isCompact ? "0.625rem" : "1rem",
      backgroundColor: dark ? "#1e293b" : "#ffffff",
      borderRadius: isCompact ? "0.25rem" : "0.5rem",
      transition: "all 0.3s ease",
    },
    cardTypeStat: {
      padding: isCompact ? "1rem" : "1.5rem",
      border: `${isCompact ? "1px" : "2px"} solid ${dark ? "#334155" : "#e5e7eb"}`,
      borderRadius: isCompact ? "0.375rem" : "0.75rem",
      backgroundColor: dark ? "#0f172a" : "#ffffff",
      transition: "all 0.3s ease, transform 0.2s ease",
      cursor: "pointer",
    },
    cardTypeStatHover: {
      transform: "scale(1.05)",
      borderColor: "#2563eb",
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
    badgeGreen: { backgroundColor: dark ? "#064e3b" : "#d1fae5", color: dark ? "#6ee7b7" : "#065f46" },
    badgeYellow: { backgroundColor: dark ? "#78350f" : "#fef3c7", color: dark ? "#fcd34d" : "#92400e" },
    badgeRed: { backgroundColor: dark ? "#7f1d1d" : "#fee2e2", color: dark ? "#fca5a5" : "#991b1b" },
    sectionTitle: {
      fontSize: isCompact ? "1.125rem" : "1.5rem",
      fontFamily: headingFont,
      fontWeight: "800",
      marginBottom: isCompact ? "1rem" : "1.5rem",
      display: "flex",
      alignItems: "center",
      gap: isCompact ? "0.5rem" : "0.75rem",
      color: dark ? "#f1f5f9" : "#111827",
      transition: "color 0.3s ease",
    },
    ownerName: { 
      fontFamily: headingFont,
      fontWeight: "800", 
      fontSize: isCompact ? "1rem" : "1.25rem", 
      color: dark ? "#f1f5f9" : "#111827", 
      transition: "color 0.3s ease" 
    },
    ownerCount: {
      fontSize: isCompact ? "0.75rem" : "0.875rem",
      color: dark ? "#94a3b8" : "#6b7280",
      backgroundColor: dark ? "#1e293b" : "#ffffff",
      padding: isCompact ? "0.125rem 0.5rem" : "0.25rem 0.75rem",
      borderRadius: "0.5rem",
      fontWeight: bodyWeightSemibold,
      transition: "all 0.3s ease",
    },
    cardTypeText: { 
      fontFamily: headingFont,
      fontWeight: "800", 
      fontSize: isCompact ? "0.9375rem" : "1.125rem", 
      color: dark ? "#f1f5f9" : "#111827", 
      transition: "color 0.3s ease" 
    },
    settingsButton: {
      padding: "0.5rem",
      borderRadius: "0.5rem",
      border: `1px solid ${dark ? "#475569" : "#e5e7eb"}`,
      backgroundColor: dark ? "#334155" : "#f9fafb",
      color: dark ? "#f1f5f9" : "#374151",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.3s ease",
      marginLeft: "0.5rem",
    },
    settingsModal: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
      zIndex: 100,
      animation: "fadeIn 0.2s ease-out",
    },
    settingsContent: {
      backgroundColor: dark ? "#1e293b" : "#ffffff",
      borderRadius: "1rem",
      padding: "2rem",
      maxWidth: "500px",
      width: "100%",
      maxHeight: "90vh",
      overflowY: "auto",
      boxShadow: dark ? "0 20px 25px -5px rgba(0,0,0,0.5)" : "0 20px 25px -5px rgba(0,0,0,0.2)",
      animation: "slideUp 0.3s ease-out",
      border: `1px solid ${dark ? "#334155" : "#e5e7eb"}`,
    },
    settingsHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "2rem",
      paddingBottom: "1rem",
      borderBottom: `1px solid ${dark ? "#334155" : "#e5e7eb"}`,
    },
    settingsTitle: {
      fontSize: "1.5rem",
      fontFamily: headingFont,
      fontWeight: "800",
      color: dark ? "#f1f5f9" : "#111827",
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
      color: dark ? "#94a3b8" : "#6b7280",
      borderRadius: "0.5rem",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
    },
    settingsSection: {
      marginBottom: "2rem",
    },
    settingsLabel: {
      display: "block",
      fontSize: "0.875rem",
      fontWeight: bodyWeightSemibold,
      marginBottom: "0.75rem",
      color: dark ? "#e2e8f0" : "#374151",
    },
    boldToggle: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "1rem",
      border: `2px solid ${dark ? "#475569" : "#e5e7eb"}`,
      borderRadius: "0.75rem",
      backgroundColor: dark ? "#334155" : "#f9fafb",
      cursor: "pointer",
      transition: "all 0.3s ease",
    },
    boldToggleActive: {
      borderColor: "#2563eb",
      backgroundColor: dark ? "#1e3a8a" : "#dbeafe",
    },
    toggleSwitch: {
      width: "44px",
      height: "24px",
      borderRadius: "12px",
      backgroundColor: dark ? "#475569" : "#d1d5db",
      position: "relative",
      transition: "background-color 0.3s ease",
      flexShrink: 0,
    },
    toggleSwitchActive: {
      backgroundColor: "#2563eb",
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
    themeOptions: {
      display: "flex",
      gap: "0.75rem",
    },
    themeOption: {
      flex: 1,
      padding: "0.75rem",
      border: `2px solid ${dark ? "#475569" : "#e5e7eb"}`,
      borderRadius: "0.75rem",
      backgroundColor: dark ? "#334155" : "#f9fafb",
      cursor: "pointer",
      transition: "all 0.3s ease",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "0.5rem",
      color: dark ? "#e2e8f0" : "#374151",
    },
    themeOptionActive: {
      borderColor: "#2563eb",
      backgroundColor: dark ? "#1e3a8a" : "#dbeafe",
      color: "#2563eb",
    },
    fontSelect: {
      padding: "0.75rem",
      border: `1px solid ${dark ? "#475569" : "#e5e7eb"}`,
      borderRadius: "0.5rem",
      fontSize: "0.9375rem",
      width: "100%",
      backgroundColor: dark ? "#334155" : "#ffffff",
      color: dark ? "#e2e8f0" : "#111827",
      cursor: "pointer",
      transition: "all 0.3s ease",
    },
    fontSizeSlider: {
      width: "100%",
      height: "8px",
      borderRadius: "4px",
      background: dark ? "#475569" : "#e5e7eb",
      outline: "none",
      transition: "all 0.3s ease",
    },
    fontSizeDisplay: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "0.5rem",
      fontSize: "0.875rem",
      color: dark ? "#94a3b8" : "#6b7280",
    },
    fontSizeValue: {
      fontSize: "1.125rem",
      fontWeight: "700",
      color: dark ? "#f1f5f9" : "#111827",
    },
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

// Loading skeleton component
const SkeletonCard = ({ isDark }) => (
  <div style={{
    backgroundColor: isDark ? "#1e293b" : "#ffffff",
    borderRadius: "1rem",
    padding: "2rem",
    marginBottom: "2rem",
    border: `1px solid ${isDark ? "#334155" : "#e5e7eb"}`,
  }}>
    <div style={{
      height: "24px",
      width: "40%",
      backgroundColor: isDark ? "#334155" : "#e5e7eb",
      borderRadius: "0.5rem",
      marginBottom: "1rem",
      animation: "pulse 1.5s ease-in-out infinite",
    }}></div>
    <div style={{
      height: "100px",
      backgroundColor: isDark ? "#334155" : "#e5e7eb",
      borderRadius: "0.5rem",
      animation: "pulse 1.5s ease-in-out infinite",
    }}></div>
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
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "auto");
  const [viewMode, setViewMode] = useState("table"); // table or cards
  const [viewStyle, setViewStyle] = useState(() => localStorage.getItem("viewStyle") || "normal"); // normal or compact
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredStat, setHoveredStat] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFont, setSelectedFont] = useState(() => localStorage.getItem("font") || "Poppins");
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem("fontSize")) || 20);
  const [boldText, setBoldText] = useState(() => localStorage.getItem("boldText") === "true");

  const styles = getStyles(theme, selectedFont, fontSize, viewStyle, boldText);
  const isDark = theme === "dark" || (theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const getProfitMarginBadge = (margin) => {
    if (margin >= 20) return { style: styles.badgeGreen, label: "Excellent" };
    if (margin >= 10) return { style: styles.badgeYellow, label: "Good" };
    return { style: styles.badgeRed, label: "Low" };
  };

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Save font to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("font", selectedFont);
  }, [selectedFont]);

  // Save fontSize to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("fontSize", fontSize.toString());
  }, [fontSize]);

  // Save viewStyle to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("viewStyle", viewStyle);
  }, [viewStyle]);

  // Save boldText to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("boldText", boldText.toString());
  }, [boldText]);

  const fetchFromGoogleSheets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(GOOGLE_SHEETS_URL);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      console.log("📊 Full data from Google Sheets:", data);
      console.log("📅 Monthly data:", data.monthly);
      
      if (data.error) throw new Error(data.error);
      
      if (!data || (!data.transactions && !data.monthly)) {
        setTransactions([]);
        setMonthly([]);
        setOwners([]);
        setCards([]);
        setStats({});
      } else {
        setLastSync(new Date());
        if (data.transactions && data.transactions.length > 0) {
          processTransactions(data.transactions);
        }
        if (data.monthly && data.monthly.length > 0) {
          console.log("✅ Setting monthly data:", data.monthly);
          setMonthly(data.monthly);
        } else {
          console.log("❌ No monthly data found");
        }
      }
    } catch (err) {
      console.error("❌ Error:", err);
      setError("Failed to load data. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFromGoogleSheets(); }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (theme === "auto") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => setTheme("auto"); // Force re-render
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [theme]);

  const processTransactions = (transactionsData) => {
    const normalizedData = transactionsData.map((t) => ({
      ...t,
      cardType: normalizeCardType(t.cardType),
    }));

    const uniqueOwners = [...new Set(normalizedData.map((t) => t.owner))].map((name, index) => ({ id: index + 1, name }));

    const uniqueCards = [];
    const cardMap = new Map();
    normalizedData.forEach((t) => {
      const key = `${t.cardType}-${t.cardNumber}`;
      if (!cardMap.has(key)) {
        cardMap.set(key, { id: uniqueCards.length + 1, type: t.cardType, number: t.cardNumber });
        uniqueCards.push(cardMap.get(key));
      }
    });

    const processedTransactions = normalizedData.map((t) => {
      const card = uniqueCards.find((c) => c.type === t.cardType && c.number === t.cardNumber);
      const owner = uniqueOwners.find((o) => o.name === t.owner);
      const cost = parseFloat(t.cost) || 0;
      const grossProfit = parseFloat(t.grossProfit) || 0;
      let netProfit = parseFloat(t.netProfit) || 0;
      if (netProfit === 0 && (cost > 0 || grossProfit > 0)) netProfit = grossProfit - cost;
      const profitMargin = cost > 0 ? (netProfit / cost) * 100 : 0;
      return { ...t, cost, grossProfit, netProfit, cardId: card.id, ownerId: owner.id, profitMargin };
    });

    setOwners(uniqueOwners);
    setCards(uniqueCards);
    setTransactions(processedTransactions);
    calculateStats(processedTransactions, uniqueOwners, uniqueCards);
  };

  const calculateStats = (txns, ownrs, crds) => {
    const totalCost = txns.reduce((sum, t) => sum + t.cost, 0);
    const totalGrossProfit = txns.reduce((sum, t) => sum + t.grossProfit, 0);
    const totalNetProfit = txns.reduce((sum, t) => sum + t.netProfit, 0);
    const totalUsdtSold = txns.reduce((sum, t) => sum + (parseFloat(t.sellAmount) || 0), 0);
    const totalDollarUsed = txns.reduce((sum, t) => sum + (parseFloat(t.buyAmount) || 0), 0);
    const avgNetProfit = txns.length > 0 ? totalNetProfit / txns.length : 0;

    const ownerStats = {};
    ownrs.forEach((o) => {
      const ownerTxns = txns.filter((t) => t.ownerId === o.id);
      ownerStats[o.id] = {
        count: ownerTxns.length,
        totalCost: ownerTxns.reduce((sum, t) => sum + t.cost, 0),
        totalGrossProfit: ownerTxns.reduce((sum, t) => sum + t.grossProfit, 0),
        totalNetProfit: ownerTxns.reduce((sum, t) => sum + t.netProfit, 0),
      };
    });

    const cardTypeStats = {};
    crds.forEach((c) => {
      if (!cardTypeStats[c.type]) cardTypeStats[c.type] = { count: 0, netProfit: 0 };
      const cardTxns = txns.filter((t) => t.cardId === c.id);
      cardTypeStats[c.type].count += cardTxns.length;
      cardTypeStats[c.type].netProfit += cardTxns.reduce((sum, t) => sum + t.netProfit, 0);
    });

    setStats({ totalCost, totalGrossProfit, totalNetProfit, totalUsdtSold, totalDollarUsed, avgNetProfit, ownerStats, cardTypeStats });
  };

  const getCardById = (id) => cards.find((c) => c.id === id);
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
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerFlex}>
            <div>
              <h1 style={styles.title}>Sales Dashboard</h1>
              <p style={styles.subtitle}>
                {lastSync ? `Last updated: ${lastSync.toLocaleTimeString()}` : "Real-time data from Google Sheets"}
                <button onClick={() => setShowSettings(true)} style={styles.settingsButton} title="Settings">
                  <Settings size={16} />
                </button>
              </p>
            </div>
            <button
              onClick={fetchFromGoogleSheets}
              style={{
                ...styles.refreshButton,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
                transform: loading ? "scale(0.95)" : "scale(1)",
              }}
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
            <button onClick={() => setActiveTab("dashboard")} style={{ ...styles.tab, ...(activeTab === "dashboard" ? styles.tabActive : styles.tabInactive) }}>
              Dashboard
            </button>
            <button onClick={() => setActiveTab("transactions")} style={{ ...styles.tab, ...(activeTab === "transactions" ? styles.tabActive : styles.tabInactive) }}>
              Transactions
            </button>
            <button onClick={() => setActiveTab("monthly")} style={{ ...styles.tab, ...(activeTab === "monthly" ? styles.tabActive : styles.tabInactive) }}>
              Monthly
            </button>
          </nav>
        </div>
      </div>

      <div style={styles.mainContent}>
        {error && (
          <div style={styles.error}>
            <strong>Error:</strong> {error}
            <div style={{ marginTop: "0.5rem" }}>
              <button onClick={fetchFromGoogleSheets} style={styles.button}>Try Again</button>
            </div>
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
                return (
                  <div
                    key={idx}
                    style={{
                      ...styles.statCard,
                      ...styles[`statCard${stat.color}`],
                      ...(hoveredStat === idx ? styles.statCardHover : {}),
                      animationDelay: `${idx * 0.1}s`,
                    }}
                    onMouseEnter={() => setHoveredStat(idx)}
                    onMouseLeave={() => setHoveredStat(null)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: viewStyle === "compact" ? "0.5rem" : "1rem" }}>
                      <div style={{ fontSize: viewStyle === "compact" ? "0.75rem" : "1rem", opacity: 0.9, fontWeight: "600", color: stat.color === "Orange" || stat.color === "Purple" ? (stat.color === "Orange" ? "#78350f" : "#581c87") : undefined }}>
                        {stat.label}
                      </div>
                      <Icon size={viewStyle === "compact" ? 20 : 32} style={{ opacity: 0.7, color: stat.color === "Orange" || stat.color === "Purple" ? (stat.color === "Orange" ? "#78350f" : "#581c87") : undefined }} />
                    </div>
                    <div style={{ fontSize: viewStyle === "compact" ? "1.5rem" : "2.7rem", fontWeight: "700", color: stat.color === "Orange" || stat.color === "Purple" ? (stat.color === "Orange" ? "#78350f" : "#581c87") : undefined }}>
                      ${stat.value?.toFixed(2) || 0}
                    </div>
                    <div style={{ fontSize: viewStyle === "compact" ? "0.6875rem" : "0.875rem", opacity: 0.8, marginTop: "0.5rem", color: stat.color === "Orange" || stat.color === "Purple" ? (stat.color === "Orange" ? "#78350f" : "#581c87") : undefined }}>
                      {stat.count ? `${stat.count} transactions` : stat.sub}
                    </div>
                  </div>
                );
              })}
            </div>

            {loading ? (
              <>
                <SkeletonCard isDark={isDark} />
                <SkeletonCard isDark={isDark} />
              </>
            ) : (
              <>
                <div style={styles.card}>
                  <h2 style={styles.sectionTitle}>
                    <User size={viewStyle === "compact" ? 20 : 24} />
                    Owner Performance
                  </h2>
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
                            <div style={styles.ownerStatBox}>
                              <div style={{ fontSize: viewStyle === "compact" ? "0.6875rem" : "0.75rem", color: isDark ? "#94a3b8" : "#6b7280", marginBottom: "0.25rem", fontWeight: "600" }}>COST</div>
                              <div style={{ fontSize: viewStyle === "compact" ? "1.125rem" : "1.5rem", fontWeight: "700", color: "#3b82f6" }}>${oStats.totalCost.toFixed(2)}</div>
                            </div>
                            <div style={styles.ownerStatBox}>
                              <div style={{ fontSize: viewStyle === "compact" ? "0.6875rem" : "0.75rem", color: isDark ? "#94a3b8" : "#6b7280", marginBottom: "0.25rem", fontWeight: "600" }}>GROSS</div>
                              <div style={{ fontSize: viewStyle === "compact" ? "1.125rem" : "1.5rem", fontWeight: "700", color: "#f97316" }}>${oStats.totalGrossProfit.toFixed(2)}</div>
                            </div>
                            <div style={styles.ownerStatBox}>
                              <div style={{ fontSize: viewStyle === "compact" ? "0.6875rem" : "0.75rem", color: isDark ? "#94a3b8" : "#6b7280", marginBottom: "0.25rem", fontWeight: "600" }}>NET PROFIT</div>
                              <div style={{ fontSize: viewStyle === "compact" ? "1.125rem" : "1.5rem", fontWeight: "700", color: "#16a34a" }}>${oStats.totalNetProfit.toFixed(2)}</div>
                            </div>
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
                      <div
                        key={type}
                        style={{
                          ...styles.cardTypeStat,
                          ...(hoveredCard === idx ? styles.cardTypeStatHover : {}),
                        }}
                        onMouseEnter={() => setHoveredCard(idx)}
                        onMouseLeave={() => setHoveredCard(null)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: viewStyle === "compact" ? "0.5rem" : "0.75rem", marginBottom: viewStyle === "compact" ? "0.625rem" : "1rem" }}>
                          <div style={{ width: viewStyle === "compact" ? "12px" : "16px", height: viewStyle === "compact" ? "12px" : "16px", borderRadius: "50%", backgroundColor: getCardTypeColor(type), flexShrink: 0 }}></div>
                          <span style={styles.cardTypeText}>{type}</span>
                        </div>
                        <div style={{ fontSize: viewStyle === "compact" ? "0.75rem" : "0.875rem", color: isDark ? "#94a3b8" : "#6b7280", marginBottom: "0.5rem" }}>{data.count} transactions</div>
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
                    <Filter size={16} style={{ color: isDark ? "#94a3b8" : "#6b7280" }} />
                    <span style={{ fontSize: "0.875rem", fontWeight: "500", color: isDark ? "#e2e8f0" : "#111827" }}>Filters:</span>
                  </div>
                  <select style={styles.select} value={filterCardType} onChange={(e) => setFilterCardType(e.target.value)}>
                    <option value="all">All Card Types</option>
                    {cardTypes.map((type) => (<option key={type} value={type}>{type}</option>))}
                  </select>
                  <select style={styles.select} value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)}>
                    <option value="all">All Owners</option>
                    {owners.map((o) => (<option key={o.id} value={o.id}>{o.name}</option>))}
                  </select>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => setViewMode("table")}
                    style={{
                      ...styles.viewToggle,
                      ...(viewMode === "table" ? styles.viewToggleActive : {}),
                    }}
                  >
                    <List size={16} />
                    Table
                  </button>
                  <button
                    onClick={() => setViewMode("cards")}
                    style={{
                      ...styles.viewToggle,
                      ...(viewMode === "cards" ? styles.viewToggleActive : {}),
                    }}
                  >
                    <LayoutGrid size={16} />
                    Cards
                  </button>
                </div>
              </div>
            </div>

            {viewMode === "table" ? (
              <div style={styles.card}>
                <div style={{ overflowX: "auto" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Card Type</th>
                        <th style={styles.th}>Card No.</th>
                        <th style={styles.th}>Owner</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Buy Rate</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Buy Amount</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Sell Rate</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Sell Amount</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Cost</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Gross Profit</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Net Profit</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Margin</th>
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
                            <td style={styles.td}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: cardColor, flexShrink: 0 }}></div>
                                <span>{card?.type || "UNKNOWN"}</span>
                              </div>
                            </td>
                            <td style={styles.td}>{card?.number || "-"}</td>
                            <td style={{ ...styles.td, fontWeight: "500" }}>{owner?.name}</td>
                            <td style={{ ...styles.td, textAlign: "right" }}>{parseFloat(t.buyRate).toFixed(2)}</td>
                            <td style={{ ...styles.td, textAlign: "right" }}>${parseFloat(t.buyAmount).toFixed(2)}</td>
                            <td style={{ ...styles.td, textAlign: "right" }}>{parseFloat(t.sellRate).toFixed(2)}</td>
                            <td style={{ ...styles.td, textAlign: "right" }}>${parseFloat(t.sellAmount).toFixed(2)}</td>
                            <td style={{ ...styles.td, textAlign: "right" }}>${t.cost.toFixed(2)}</td>
                            <td style={{ ...styles.td, textAlign: "right", color: "#f97316", fontWeight: "600" }}>${t.grossProfit.toFixed(2)}</td>
                            <td style={{ ...styles.td, textAlign: "right", color: "#16a34a", fontWeight: "600" }}>${t.netProfit.toFixed(2)}</td>
                            <td style={{ ...styles.td, textAlign: "right" }}>
                              <span style={{ ...styles.badge, ...marginBadge.style }}>
                                {t.profitMargin.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: isDark ? "#0f172a" : "#f9fafb", fontWeight: "700", borderTop: `2px solid ${isDark ? "#475569" : "#d1d5db"}` }}>
                        <td colSpan="2" style={{ ...styles.td, textAlign: "left", fontWeight: "700", fontSize: "0.875rem", color: isDark ? "#f1f5f9" : "#111827" }}>
                          TOTALS / AVERAGES
                        </td>
                        <td colSpan="2" style={{ ...styles.td, textAlign: "center", fontWeight: "600", fontSize: "0.8125rem", color: isDark ? "#cbd5e1" : "#475569" }}>
                          <div>Sell Amount:</div>
                          <div style={{ fontWeight: "700", fontSize: "0.9375rem", color: isDark ? "#f1f5f9" : "#111827", marginTop: "0.125rem" }}>
                            ${filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.sellAmount) || 0), 0).toFixed(2)}
                          </div>
                        </td>
                        <td style={{ ...styles.td, textAlign: "center", fontWeight: "600", fontSize: "0.8125rem", color: isDark ? "#cbd5e1" : "#475569" }}>
                          <div>Avg Sell Rate:</div>
                          <div style={{ fontWeight: "700", fontSize: "0.9375rem", color: isDark ? "#f1f5f9" : "#111827", marginTop: "0.125rem" }}>
                            {filteredTransactions.length > 0 
                              ? (filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.sellRate) || 0), 0) / filteredTransactions.length).toFixed(2)
                              : "0.00"}
                          </div>
                        </td>
                        <td style={{ ...styles.td, textAlign: "center", fontWeight: "600", fontSize: "0.8125rem", color: isDark ? "#cbd5e1" : "#475569" }}>
                          <div>Avg Buy Rate:</div>
                          <div style={{ fontWeight: "700", fontSize: "0.9375rem", color: isDark ? "#f1f5f9" : "#111827", marginTop: "0.125rem" }}>
                            {(() => {
                              const totalCost = filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.cost) || 0), 0);
                              const totalSellAmount = filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.sellAmount) || 0), 0);
                              const avgBuyRate = totalSellAmount > 0 ? totalCost / totalSellAmount : 0;
                              return avgBuyRate.toFixed(2);
                            })()}
                          </div>
                        </td>
                        <td colSpan="2" style={{ ...styles.td, textAlign: "center" }}>
                          {/* Empty space */}
                        </td>
                        <td style={{ ...styles.td, textAlign: "center", fontWeight: "600", fontSize: "0.8125rem", color: isDark ? "#cbd5e1" : "#475569" }}>
                          <div>Gross:</div>
                          <div style={{ color: "#f97316", fontWeight: "700", fontSize: "0.9375rem", marginTop: "0.125rem" }}>
                            ${filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.grossProfit) || 0), 0).toFixed(2)}
                          </div>
                        </td>
                        <td style={{ ...styles.td, textAlign: "center", fontWeight: "600", fontSize: "0.8125rem", color: isDark ? "#cbd5e1" : "#475569" }}>
                          <div>Net:</div>
                          <div style={{ color: "#16a34a", fontWeight: "700", fontSize: "0.9375rem", marginTop: "0.125rem" }}>
                            ${filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.netProfit) || 0), 0).toFixed(2)}
                          </div>
                        </td>
                        <td style={{ ...styles.td, textAlign: "center" }}>
                          {/* Margin column - empty */}
                        </td>
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
                    <div
                      key={t.id}
                      style={{
                        ...styles.transactionCard,
                        ...(hoveredCard === `tx-${idx}` ? styles.transactionCardHover : {}),
                        animationDelay: `${idx * 0.05}s`,
                      }}
                      onMouseEnter={() => setHoveredCard(`tx-${idx}`)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: cardColor, flexShrink: 0 }}></div>
                          <div>
                            <div style={{ fontWeight: "700", fontSize: "1.125rem", color: isDark ? "#f1f5f9" : "#111827" }}>{card?.type || "UNKNOWN"}</div>
                            <div style={{ fontSize: "0.875rem", color: isDark ? "#94a3b8" : "#6b7280" }}>Card #{card?.number || "-"}</div>
                          </div>
                        </div>
                        <span style={{ ...styles.badge, ...marginBadge.style }}>
                          {t.profitMargin.toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ marginBottom: "1rem" }}>
                        <div style={{ fontSize: "0.875rem", color: isDark ? "#94a3b8" : "#6b7280", marginBottom: "0.25rem" }}>Owner</div>
                        <div style={{ fontWeight: "600", fontSize: "1rem", color: isDark ? "#e2e8f0" : "#111827" }}>{owner?.name}</div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                        <div>
                          <div style={{ fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#6b7280" }}>Buy</div>
                          <div style={{ fontWeight: "600", color: isDark ? "#e2e8f0" : "#111827" }}>
                            {parseFloat(t.buyRate).toFixed(2)} × ${parseFloat(t.buyAmount).toFixed(0)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#6b7280" }}>Sell</div>
                          <div style={{ fontWeight: "600", color: isDark ? "#e2e8f0" : "#111827" }}>
                            {parseFloat(t.sellRate).toFixed(2)} × ${parseFloat(t.sellAmount).toFixed(0)}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", paddingTop: "1rem", borderTop: `1px solid ${isDark ? "#334155" : "#e5e7eb"}` }}>
                        <div>
                          <div style={{ fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#6b7280", marginBottom: "0.25rem" }}>Cost</div>
                          <div style={{ fontWeight: "700", color: "#3b82f6" }}>${t.cost.toFixed(0)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#6b7280", marginBottom: "0.25rem" }}>Gross</div>
                          <div style={{ fontWeight: "700", color: "#f97316" }}>${t.grossProfit.toFixed(0)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#6b7280", marginBottom: "0.25rem" }}>Net</div>
                          <div style={{ fontWeight: "700", color: "#16a34a" }}>${t.netProfit.toFixed(0)}</div>
                        </div>
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
            {/* All Time Profit Stat Card */}
            {monthly.length > 0 && (
              <div style={{ marginBottom: viewStyle === "compact" ? "1rem" : "2rem" }}>
                <div
                  style={{
                    ...styles.statCard,
                    background: "linear-gradient(135deg, #16a34a 0%, #059669 100%)",
                    maxWidth: viewStyle === "compact" ? "400px" : "500px",
                    margin: "0 auto",
                    textAlign: "center",
                    animation: "slideUp 0.5s ease-out",
                  }}
                >
                  <div style={{ fontSize: viewStyle === "compact" ? "0.9375rem" : "1.125rem", opacity: 0.9, marginBottom: "0.5rem", fontWeight: "600" }}>
                    All Time Profit
                  </div>
                  <div style={{ fontSize: viewStyle === "compact" ? "2.5rem" : "3.5rem", fontWeight: "700", marginBottom: "0.25rem" }}>
                    ${monthly.reduce((sum, m) => sum + m.profit, 0).toFixed(2)}
                  </div>
                  <div style={{ fontSize: viewStyle === "compact" ? "0.8125rem" : "0.9375rem", opacity: 0.85 }}>
                    Total from {monthly.length} months
                  </div>
                </div>
              </div>
            )}

            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>
                <Calendar size={viewStyle === "compact" ? 20 : 24} />
                Monthly Breakdown
              </h2>
              
              {monthly.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: isDark ? "#94a3b8" : "#6b7280" }}>
                  <p style={{ fontSize: "1.125rem", marginBottom: "0.5rem", fontWeight: "600" }}>No monthly data available</p>
                  <p style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>Make sure your Google Sheet has a "Monthly" worksheet with:</p>
                  <div style={{ 
                    backgroundColor: isDark ? "#1e293b" : "#f9fafb", 
                    padding: "1rem", 
                    borderRadius: "0.5rem",
                    maxWidth: "400px",
                    margin: "0 auto",
                    textAlign: "left",
                    fontSize: "0.875rem"
                  }}>
                    <p style={{ margin: "0.25rem 0" }}>📋 <strong>Column A:</strong> Month (e.g., "June", "July")</p>
                    <p style={{ margin: "0.25rem 0" }}>💰 <strong>Column B:</strong> Amount (e.g., 4160.00)</p>
                  </div>
                  <div style={{ marginTop: "1.5rem" }}>
                    <button 
                      onClick={fetchFromGoogleSheets} 
                      style={{...styles.button, ...styles.buttonPrimary}}
                    >
                      <RefreshCw size={16} />
                      Refresh Data
                    </button>
                  </div>
                  <p style={{ fontSize: "0.75rem", marginTop: "1rem", opacity: 0.7 }}>
                    💡 Tip: Open browser console (F12) to see debug info
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Month</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthly.map((m, idx) => (
                        <tr 
                          key={m.id}
                          style={{
                            backgroundColor: idx % 2 === 0 ? (isDark ? "#1e293b" : "#ffffff") : (isDark ? "#0f172a" : "#f9fafb"),
                          }}
                        >
                          <td style={{ ...styles.td, fontWeight: "600", fontSize: "1rem" }}>{m.month}</td>
                          <td style={{ ...styles.td, textAlign: "right", color: "#16a34a", fontWeight: "700", fontSize: "1.125rem" }}>
                            ${m.profit.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: isDark ? "#0f172a" : "#f9fafb", fontWeight: "700", borderTop: `2px solid ${isDark ? "#475569" : "#d1d5db"}` }}>
                        <td style={{ ...styles.td, textAlign: "left", fontWeight: "700", fontSize: "1rem", color: isDark ? "#f1f5f9" : "#111827" }}>
                          TOTAL
                        </td>
                        <td style={{ ...styles.td, textAlign: "right", fontWeight: "700", color: "#16a34a", fontSize: "1.25rem" }}>
                          ${monthly.reduce((sum, m) => sum + m.profit, 0).toFixed(2)}
                        </td>
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
              <h2 style={styles.settingsTitle}>
                <Settings size={24} />
                Settings
              </h2>
              <button onClick={() => setShowSettings(false)} style={styles.closeButton}>
                <X size={24} />
              </button>
            </div>

            {/* Dark Mode Section */}
            <div style={styles.settingsSection}>
              <label style={styles.settingsLabel}>Theme</label>
              <div style={styles.themeOptions}>
                <div
                  onClick={() => setTheme("light")}
                  style={{
                    ...styles.themeOption,
                    ...(theme === "light" ? styles.themeOptionActive : {}),
                  }}
                >
                  <Sun size={24} />
                  <span>Light</span>
                </div>
                <div
                  onClick={() => setTheme("dark")}
                  style={{
                    ...styles.themeOption,
                    ...(theme === "dark" ? styles.themeOptionActive : {}),
                  }}
                >
                  <Moon size={24} />
                  <span>Dark</span>
                </div>
                <div
                  onClick={() => setTheme("auto")}
                  style={{
                    ...styles.themeOption,
                    ...(theme === "auto" ? styles.themeOptionActive : {}),
                  }}
                >
                  <Monitor size={24} />
                  <span>Auto</span>
                </div>
              </div>
            </div>

            {/* View Style Section */}
            <div style={styles.settingsSection}>
              <label style={styles.settingsLabel}>View Style</label>
              <div style={styles.themeOptions}>
                <div
                  onClick={() => setViewStyle("normal")}
                  style={{
                    ...styles.themeOption,
                    ...(viewStyle === "normal" ? styles.themeOptionActive : {}),
                  }}
                >
                  <LayoutGrid size={24} />
                  <span>Normal</span>
                  <div style={{ fontSize: "0.6875rem", opacity: 0.7, marginTop: "0.25rem" }}>
                    Large cards
                  </div>
                </div>
                <div
                  onClick={() => setViewStyle("compact")}
                  style={{
                    ...styles.themeOption,
                    ...(viewStyle === "compact" ? styles.themeOptionActive : {}),
                  }}
                >
                  <List size={24} />
                  <span>Compact</span>
                  <div style={{ fontSize: "0.6875rem", opacity: 0.7, marginTop: "0.25rem" }}>
                    Dense layout
                  </div>
                </div>
              </div>
            </div>

            {/* Font Style Section */}
            <div style={styles.settingsSection}>
              <label style={styles.settingsLabel}>Font Style</label>
              <select
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
                style={styles.fontSelect}
              >
                {FONTS.map((font) => (
                  <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                    {font.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size Section */}
            <div style={styles.settingsSection}>
              <label style={styles.settingsLabel}>Font Size</label>
              <input
                type="range"
                min="12"
                max="20"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                style={styles.fontSizeSlider}
              />
              <div style={styles.fontSizeDisplay}>
                <span>Small (12px)</span>
                <span style={styles.fontSizeValue}>{fontSize}px</span>
                <span>Large (20px)</span>
              </div>
            </div>

            {/* Bold Text Toggle */}
            <div style={styles.settingsSection}>
              <label style={styles.settingsLabel}>Text Weight</label>
              <div
                onClick={() => setBoldText(!boldText)}
                style={{
                  ...styles.boldToggle,
                  ...(boldText ? styles.boldToggleActive : {}),
                }}
              >
                <div>
                  <div style={{ fontWeight: boldText ? "700" : "600", fontSize: "0.9375rem", color: isDark ? "#f1f5f9" : "#111827" }}>
                    Bold Text
                  </div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "0.25rem", color: isDark ? "#94a3b8" : "#6b7280" }}>
                    Increase font weight across the UI
                  </div>
                </div>
                <div style={{
                  ...styles.toggleSwitch,
                  ...(boldText ? styles.toggleSwitchActive : {}),
                }}>
                  <div style={{
                    ...styles.toggleKnob,
                    ...(boldText ? styles.toggleKnobActive : {}),
                  }}></div>
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