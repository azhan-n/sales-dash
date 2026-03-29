// =============================================
// utils.js — Helpers, card types, and export functions
// =============================================

// --- Card type normalization ---
export const normalizeCardType = (type) => {
  if (!type) return "UNKNOWN";
  const n = type.toString().trim().toUpperCase();
  if (n.includes("VISA") && n.includes("DEBIT")) return "VISA DEBIT";
  if (n.includes("VISA") && n.includes("CREDIT")) return "VISA CREDIT";
  if (n.includes("AMEX")) return "AMEX";
  if (n.includes("SELLER")) return "SELLER";
  if (n.includes("MASTERCARD")) return "MASTERCARD";
  return n;
};

export const CARD_TYPES = ["VISA DEBIT", "VISA CREDIT", "AMEX", "SELLER", "MASTERCARD"];

export const cardTypeColors = {
  "VISA DEBIT": "#3b82f6",
  "VISA CREDIT": "#10b981",
  AMEX: "#8b5cf6",
  SELLER: "#64748b",
  MASTERCARD: "#f59e0b",
  UNKNOWN: "#94a3b8",
};

export const getCardTypeColor = (type) =>
  cardTypeColors[normalizeCardType(type)] || cardTypeColors["UNKNOWN"];

// --- Today's date in dd/mm/yy ---
export const getTodayDate = () => {
  const now = new Date();
  return `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getFullYear()).slice(-2)}`;
};

// --- Export to CSV ---
export const exportToCSV = (transactions, getCardById, getOwnerById, filename = "transactions") => {
  const headers = ["Date", "Card Type", "Card No.", "Owner", "Buy Rate", "Buy Amount", "Sell Rate", "Sell Amount", "Cost", "Gross Profit", "Net Profit", "Margin %"];
  const rows = transactions.map((t) => {
    const cd = getCardById(t.cardId);
    const ow = getOwnerById(t.ownerId);
    return [
      t.date || "",
      cd?.type || "",
      cd?.number || "",
      ow?.name || "",
      parseFloat(t.buyRate).toFixed(2),
      parseFloat(t.buyAmount).toFixed(2),
      parseFloat(t.sellRate).toFixed(2),
      parseFloat(t.sellAmount).toFixed(2),
      t.cost.toFixed(2),
      t.grossProfit.toFixed(2),
      t.netProfit.toFixed(2),
      t.profitMargin.toFixed(1),
    ];
  });

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${getTodayDate().replace(/\//g, "-")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

// --- Export Monthly to CSV ---
export const exportMonthlyToCSV = (monthly) => {
  const headers = ["Month", "Profit"];
  const rows = monthly.map((m) => [m.month, m.profit.toFixed(2)]);
  const total = monthly.reduce((s, m) => s + m.profit, 0);
  rows.push(["TOTAL", total.toFixed(2)]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `monthly_${getTodayDate().replace(/\//g, "-")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

// --- Export to PDF (print-based) ---
export const exportToPDF = () => {
  window.print();
};