import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Filter,
  User,
  RefreshCw,
} from "lucide-react";

// Google Sheets Configuration
const GOOGLE_SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbxVwc0buJoICP6sIzK6GxmZNtdvdYA4lw7MhmMxxYjI2weRxDReGIK4sbKyKESUPhEUHQ/exec";

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f3f4f6",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    backgroundColor: "#ffffff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    borderBottom: "1px solid #e5e7eb",
    padding: "1.5rem 1rem",
  },
  headerContent: {
    maxWidth: "80rem",
    margin: "0 auto",
  },
  headerFlex: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "700",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    color: "transparent",
    margin: 0,
  },
  subtitle: {
    fontSize: "0.875rem",
    color: "#6b7280",
    marginTop: "0.25rem",
  },
  tabs: {
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
  },
  tabsContent: {
    maxWidth: "80rem",
    margin: "0 auto",
    padding: "0 1rem",
  },
  tabsNav: {
    display: "flex",
    gap: "2rem",
  },
  tab: {
    padding: "1rem 0.25rem",
    border: "none",
    borderBottom: "2px solid transparent",
    backgroundColor: "transparent",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  tabActive: {
    borderBottomColor: "#2563eb",
    color: "#2563eb",
  },
  tabInactive: {
    color: "#6b7280",
  },
  mainContent: {
    maxWidth: "80rem",
    margin: "0 auto",
    padding: "2rem 1rem",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  statCard: {
    padding: "2rem",
    borderRadius: "1rem",
    color: "#ffffff",
    boxShadow:
      "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
    transition: "transform 0.2s",
  },
  statCardBlue: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  statCardGreen: {
    background: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
  },
  statCardPurple: {
    background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  },
  statCardOrange: {
    background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "1rem",
    padding: "2rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    marginBottom: "2rem",
  },
  refreshButton: {
    padding: "0.875rem 1.75rem",
    borderRadius: "0.75rem",
    border: "none",
    cursor: "pointer",
    fontSize: "0.9375rem",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.625rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#ffffff",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
  },
  button: {
    padding: "0.75rem 1.5rem",
    borderRadius: "0.5rem",
    border: "none",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    transition: "all 0.2s",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
  },
  buttonPrimary: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "0.75rem 1rem",
    textAlign: "left",
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "#6b7280",
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
  },
  td: {
    padding: "0.75rem 1rem",
    fontSize: "0.875rem",
    borderBottom: "1px solid #e5e7eb",
  },
  select: {
    padding: "0.5rem 0.75rem",
    border: "1px solid #e5e7eb",
    borderRadius: "0.25rem",
    fontSize: "0.875rem",
    minWidth: "150px",
    width: "100%",
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    fontSize: "1.125rem",
    color: "#6b7280",
    flexDirection: "column",
    gap: "1rem",
  },
  error: {
    padding: "1rem",
    backgroundColor: "#fee2e2",
    border: "1px solid #ef4444",
    borderRadius: "0.5rem",
    color: "#991b1b",
    marginBottom: "2rem",
    textAlign: "center",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.25rem 0.625rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: "600",
  },
  badgeGreen: { backgroundColor: "#d1fae5", color: "#065f46" },
  badgeYellow: { backgroundColor: "#fef3c7", color: "#92400e" },
  badgeRed: { backgroundColor: "#fee2e2", color: "#991b1b" },
};

// ✅ Same normalizeCardType as compact version
const normalizeCardType = (type) => {
  if (!type) return "UNKNOWN";
  const normalized = type.toString().trim().toUpperCase();
  if (normalized.includes("VISA") && normalized.includes("DEBIT"))
    return "VISA DEBIT";
  if (normalized.includes("VISA") && normalized.includes("CREDIT"))
    return "VISA CREDIT";
  if (normalized.includes("AMEX")) return "AMEX";
  if (normalized.includes("SELLER")) return "SELLER";
  if (normalized.includes("MASTERCARD")) return "MASTERCARD";
  return normalized;
};

// ✅ Same card colors as compact version
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

// ✅ Same profit margin badge as compact version
const getProfitMarginBadge = (margin) => {
  if (margin >= 20) return { style: styles.badgeGreen, label: "Excellent" };
  if (margin >= 10) return { style: styles.badgeYellow, label: "Good" };
  return { style: styles.badgeRed, label: "Low" };
};

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [transactions, setTransactions] = useState([]);
  const [owners, setOwners] = useState([]);
  const [cards, setCards] = useState([]);
  const [stats, setStats] = useState({});
  const [filterCardType, setFilterCardType] = useState("all");
  const [filterOwner, setFilterOwner] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [isRefreshHovered, setIsRefreshHovered] = useState(false);

  const fetchFromGoogleSheets = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(GOOGLE_SHEETS_URL);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (!data || data.length === 0) {
        setTransactions([]);
        setOwners([]);
        setCards([]);
        setStats({});
      } else {
        setLastSync(new Date());
        processTransactions(data);
      }
    } catch (err) {
      console.error("Error fetching from Google Sheets:", err);
      setError(
        "Failed to load data. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFromGoogleSheets();
  }, []);

  const processTransactions = (transactionsData) => {
    // ✅ Normalize card types just like compact version
    const normalizedData = transactionsData.map((t) => ({
      ...t,
      cardType: normalizeCardType(t.cardType),
    }));

    const uniqueOwners = [...new Set(normalizedData.map((t) => t.owner))].map(
      (name, index) => ({ id: index + 1, name })
    );

    const uniqueCards = [];
    const cardMap = new Map();
    normalizedData.forEach((t) => {
      const key = `${t.cardType}-${t.cardNumber}`;
      if (!cardMap.has(key)) {
        cardMap.set(key, {
          id: uniqueCards.length + 1,
          type: t.cardType,
          number: t.cardNumber,
        });
        uniqueCards.push(cardMap.get(key));
      }
    });

    const processedTransactions = normalizedData.map((t) => {
      const card = uniqueCards.find(
        (c) => c.type === t.cardType && c.number === t.cardNumber
      );
      const owner = uniqueOwners.find((o) => o.name === t.owner);
      const cost = parseFloat(t.cost) || 0;
      const grossProfit = parseFloat(t.grossProfit) || 0;
      let netProfit = parseFloat(t.netProfit) || 0;

      // Auto-calculate if missing
      if (netProfit === 0 && (cost > 0 || grossProfit > 0)) {
        netProfit = grossProfit - cost;
      }

      const profitMargin = cost > 0 ? (netProfit / cost) * 100 : 0;

      return {
        ...t,
        cost,
        grossProfit,
        netProfit,
        cardId: card.id,
        ownerId: owner.id,
        profitMargin,
      };
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
      if (!cardTypeStats[c.type]) {
        cardTypeStats[c.type] = { count: 0, netProfit: 0 };
      }
      const cardTxns = txns.filter((t) => t.cardId === c.id);
      cardTypeStats[c.type].count += cardTxns.length;
      cardTypeStats[c.type].netProfit += cardTxns.reduce(
        (sum, t) => sum + t.netProfit,
        0
      );
    });

    setStats({
      totalCost,
      totalGrossProfit,
      totalNetProfit,
      avgNetProfit,
      ownerStats,
      cardTypeStats,
    });
  };

  const getCardById = (id) => cards.find((c) => c.id === id);
  const getOwnerById = (id) => owners.find((o) => o.id === id);

  const filteredTransactions = transactions.filter((t) => {
    const card = getCardById(t.cardId);
    if (filterCardType !== "all" && card?.type !== filterCardType) return false;
    if (filterOwner !== "all" && t.ownerId !== parseInt(filterOwner))
      return false;
    return true;
  });

  const cardTypes = [
    "VISA DEBIT",
    "VISA CREDIT",
    "AMEX",
    "SELLER",
    "MASTERCARD",
  ];

  if (loading && transactions.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <RefreshCw
            size={48}
            style={{ animation: "spin 1s linear infinite" }}
          />
          <div>Loading dashboard...</div>
        </div>
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
                {lastSync
                  ? `Last updated: ${lastSync.toLocaleTimeString()}`
                  : "Real-time data from Google Sheets"}
              </p>
            </div>
            <button
              onClick={fetchFromGoogleSheets}
              onMouseEnter={() => setIsRefreshHovered(true)}
              onMouseLeave={() => setIsRefreshHovered(false)}
              style={{
                ...styles.refreshButton,
                ...(isRefreshHovered && !loading
                  ? {
                      transform: "translateY(-2px)",
                      boxShadow: "0 6px 20px rgba(102, 126, 234, 0.6)",
                    }
                  : {}),
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              disabled={loading}
            >
              <RefreshCw
                size={20}
                style={loading ? { animation: "spin 1s linear infinite" } : {}}
              />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      <div style={styles.tabs}>
        <div style={styles.tabsContent}>
          <nav style={styles.tabsNav}>
            <button
              onClick={() => setActiveTab("dashboard")}
              style={{
                ...styles.tab,
                ...(activeTab === "dashboard"
                  ? styles.tabActive
                  : styles.tabInactive),
              }}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              style={{
                ...styles.tab,
                ...(activeTab === "transactions"
                  ? styles.tabActive
                  : styles.tabInactive),
              }}
            >
              Transactions
            </button>
          </nav>
        </div>
      </div>

      <div style={styles.mainContent}>
        {error && (
          <div style={styles.error}>
            <strong>Error:</strong> {error}
            <div style={{ marginTop: "0.5rem" }}>
              <button onClick={fetchFromGoogleSheets} style={styles.button}>
                Try Again
              </button>
            </div>
          </div>
        )}

        {activeTab === "dashboard" && (
          <div>
            <div style={styles.statsGrid}>
              <div style={{ ...styles.statCard, ...styles.statCardBlue }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1rem",
                      opacity: 0.9,
                      fontWeight: "600",
                    }}
                  >
                    Total Cost
                  </div>
                  <DollarSign size={32} style={{ opacity: 0.7 }} />
                </div>
                <div style={{ fontSize: "2.5rem", fontWeight: "700" }}>
                  ${stats.totalCost?.toFixed(2) || 0}
                </div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    opacity: 0.8,
                    marginTop: "0.5rem",
                  }}
                >
                  {transactions.length} transactions
                </div>
              </div>

              <div style={{ ...styles.statCard, ...styles.statCardOrange }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1rem",
                      opacity: 0.9,
                      fontWeight: "600",
                      color: "#78350f",
                    }}
                  >
                    Gross Profit
                  </div>
                  <TrendingUp
                    size={32}
                    style={{ opacity: 0.7, color: "#78350f" }}
                  />
                </div>
                <div
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: "700",
                    color: "#78350f",
                  }}
                >
                  ${stats.totalGrossProfit?.toFixed(2) || 0}
                </div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    opacity: 0.8,
                    marginTop: "0.5rem",
                    color: "#78350f",
                  }}
                >
                  Total revenue
                </div>
              </div>

              <div style={{ ...styles.statCard, ...styles.statCardGreen }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1rem",
                      opacity: 0.9,
                      fontWeight: "600",
                      color: "#065f46",
                    }}
                  >
                    Net Profit
                  </div>
                  <TrendingUp
                    size={32}
                    style={{ opacity: 0.7, color: "#065f46" }}
                  />
                </div>
                <div
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: "700",
                    color: "#065f46",
                  }}
                >
                  ${stats.totalNetProfit?.toFixed(2) || 0}
                </div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    opacity: 0.8,
                    marginTop: "0.5rem",
                    color: "#065f46",
                  }}
                >
                  After costs
                </div>
              </div>

              <div style={{ ...styles.statCard, ...styles.statCardPurple }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1rem",
                      opacity: 0.9,
                      fontWeight: "600",
                      color: "#581c87",
                    }}
                  >
                    Average Profit
                  </div>
                  <TrendingUp
                    size={32}
                    style={{ opacity: 0.7, color: "#581c87" }}
                  />
                </div>
                <div
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: "700",
                    color: "#581c87",
                  }}
                >
                  ${stats.avgNetProfit?.toFixed(2) || 0}
                </div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    opacity: 0.8,
                    marginTop: "0.5rem",
                    color: "#581c87",
                  }}
                >
                  Per transaction
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  color: "#111827",
                }}
              >
                <User size={24} />
                Owner Performance
              </h2>
              <div style={{ display: "grid", gap: "1.5rem" }}>
                {owners.map((o) => {
                  const oStats = stats.ownerStats?.[o.id] || {
                    count: 0,
                    totalCost: 0,
                    totalGrossProfit: 0,
                    totalNetProfit: 0,
                  };
                  return (
                    <div
                      key={o.id}
                      style={{
                        padding: "1.5rem",
                        backgroundColor: "#f9fafb",
                        borderRadius: "0.75rem",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "1rem",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "700",
                            fontSize: "1.25rem",
                            color: "#111827",
                          }}
                        >
                          {o.name}
                        </span>
                        <span
                          style={{
                            fontSize: "0.875rem",
                            color: "#6b7280",
                            backgroundColor: "#ffffff",
                            padding: "0.25rem 0.75rem",
                            borderRadius: "0.5rem",
                            fontWeight: "600",
                          }}
                        >
                          {oStats.count} transactions
                        </span>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(150px, 1fr))",
                          gap: "1rem",
                        }}
                      >
                        <div
                          style={{
                            textAlign: "center",
                            padding: "1rem",
                            backgroundColor: "#ffffff",
                            borderRadius: "0.5rem",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#6b7280",
                              marginBottom: "0.25rem",
                              fontWeight: "600",
                            }}
                          >
                            COST
                          </div>
                          <div
                            style={{
                              fontSize: "1.5rem",
                              fontWeight: "700",
                              color: "#3b82f6",
                            }}
                          >
                            ${oStats.totalCost.toFixed(2)}
                          </div>
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            padding: "1rem",
                            backgroundColor: "#ffffff",
                            borderRadius: "0.5rem",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#6b7280",
                              marginBottom: "0.25rem",
                              fontWeight: "600",
                            }}
                          >
                            GROSS
                          </div>
                          <div
                            style={{
                              fontSize: "1.5rem",
                              fontWeight: "700",
                              color: "#f97316",
                            }}
                          >
                            ${oStats.totalGrossProfit.toFixed(2)}
                          </div>
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            padding: "1rem",
                            backgroundColor: "#ffffff",
                            borderRadius: "0.5rem",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#6b7280",
                              marginBottom: "0.25rem",
                              fontWeight: "600",
                            }}
                          >
                            NET PROFIT
                          </div>
                          <div
                            style={{
                              fontSize: "1.5rem",
                              fontWeight: "700",
                              color: "#16a34a",
                            }}
                          >
                            ${oStats.totalNetProfit.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={styles.card}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  marginBottom: "1.5rem",
                  color: "#111827",
                }}
              >
                Card Type Statistics
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                {Object.entries(stats.cardTypeStats || {}).map(
                  ([type, data]) => (
                    <div
                      key={type}
                      style={{
                        padding: "1.5rem",
                        border: "2px solid #e5e7eb",
                        borderRadius: "0.75rem",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          marginBottom: "1rem",
                        }}
                      >
                        {/* ✅ Fixed color dot */}
                        <div
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            backgroundColor: getCardTypeColor(type),
                            flexShrink: 0,
                          }}
                        ></div>
                        <span
                          style={{
                            fontWeight: "700",
                            fontSize: "1.125rem",
                            color: "#111827",
                          }}
                        >
                          {type}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "0.875rem",
                          color: "#6b7280",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {data.count} transactions
                      </div>
                      <div
                        style={{
                          fontSize: "1.75rem",
                          fontWeight: "700",
                          color: "#16a34a",
                        }}
                      >
                        ${data.netProfit.toFixed(2)}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div>
            <div style={{ ...styles.card, marginBottom: "1rem" }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1rem",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Filter size={16} style={{ color: "#6b7280" }} />
                  <span style={{ fontSize: "0.875rem", fontWeight: "500" }}>
                    Filters:
                  </span>
                </div>
                <select
                  style={styles.select}
                  value={filterCardType}
                  onChange={(e) => setFilterCardType(e.target.value)}
                >
                  <option value="all">All Card Types</option>
                  {cardTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <select
                  style={styles.select}
                  value={filterOwner}
                  onChange={(e) => setFilterOwner(e.target.value)}
                >
                  <option value="all">All Owners</option>
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.card}>
              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Card Type</th>
                      <th style={styles.th}>Card No.</th>
                      <th style={styles.th}>Owner</th>
                      <th style={{ ...styles.th, textAlign: "right" }}>
                        Buy Rate
                      </th>
                      <th style={{ ...styles.th, textAlign: "right" }}>
                        Buy Amount
                      </th>
                      <th style={{ ...styles.th, textAlign: "right" }}>
                        Sell Rate
                      </th>
                      <th style={{ ...styles.th, textAlign: "right" }}>
                        Sell Amount
                      </th>
                      <th style={{ ...styles.th, textAlign: "right" }}>Cost</th>
                      <th style={{ ...styles.th, textAlign: "right" }}>
                        Gross Profit
                      </th>
                      <th style={{ ...styles.th, textAlign: "right" }}>
                        Net Profit
                      </th>
                      <th style={{ ...styles.th, textAlign: "right" }}>
                        Margin
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((t) => {
                      const card = getCardById(t.cardId);
                      const owner = getOwnerById(t.ownerId);
                      const cardColor = getCardTypeColor(card?.type);
                      const marginBadge = getProfitMarginBadge(t.profitMargin);
                      return (
                        <tr key={t.id} style={{ backgroundColor: "#ffffff" }}>
                          <td style={styles.td}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                              }}
                            >
                              {/* ✅ Fixed color dot */}
                              <div
                                style={{
                                  width: "10px",
                                  height: "10px",
                                  borderRadius: "50%",
                                  backgroundColor: cardColor,
                                  flexShrink: 0,
                                }}
                              ></div>
                              <span>{card?.type || "UNKNOWN"}</span>
                            </div>
                          </td>
                          <td style={styles.td}>{card?.number || "-"}</td>
                          <td style={{ ...styles.td, fontWeight: "500" }}>
                            {owner?.name}
                          </td>
                          <td style={{ ...styles.td, textAlign: "right" }}>
                            {parseFloat(t.buyRate).toFixed(2)}
                          </td>
                          <td style={{ ...styles.td, textAlign: "right" }}>
                            ${parseFloat(t.buyAmount).toFixed(2)}
                          </td>
                          <td style={{ ...styles.td, textAlign: "right" }}>
                            {parseFloat(t.sellRate).toFixed(2)}
                          </td>
                          <td style={{ ...styles.td, textAlign: "right" }}>
                            ${parseFloat(t.sellAmount).toFixed(2)}
                          </td>
                          <td style={{ ...styles.td, textAlign: "right" }}>
                            ${t.cost.toFixed(2)}
                          </td>
                          <td
                            style={{
                              ...styles.td,
                              textAlign: "right",
                              color: "#f97316",
                              fontWeight: "600",
                            }}
                          >
                            ${t.grossProfit.toFixed(2)}
                          </td>
                          <td
                            style={{
                              ...styles.td,
                              textAlign: "right",
                              color: "#16a34a",
                              fontWeight: "600",
                            }}
                          >
                            ${t.netProfit.toFixed(2)}
                          </td>
                          {/* ✅ New profit margin column */}
                          <td style={{ ...styles.td, textAlign: "right" }}>
                            <span
                              style={{ ...styles.badge, ...marginBadge.style }}
                            >
                              {t.profitMargin.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

export default App;
