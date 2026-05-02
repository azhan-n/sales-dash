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

export const cardTypeBadgeColors = {
  "VISA DEBIT":   { bg: "#dbeafe", text: "#1d4ed8" },
  "VISA CREDIT":  { bg: "#d1fae5", text: "#065f46" },
  AMEX:           { bg: "#ede9fe", text: "#6d28d9" },
  SELLER:         { bg: "#f1f5f9", text: "#334155" },
  MASTERCARD:     { bg: "#fef3c7", text: "#92400e" },
  UNKNOWN:        { bg: "#f1f5f9", text: "#475569" },
};
export const getCardTypeBadge = (type) => cardTypeBadgeColors[normalizeCardType(type)] || cardTypeBadgeColors["UNKNOWN"];

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

// --- Date helpers ---
// Canonical display format: dd/mm/yyyy. Internal sort/compare key: yyyy-mm-dd.
// normalizeDate accepts dd/mm/yyyy, dd/mm/yy (legacy, assumed 20yy), or yyyy-mm-dd
// and returns dd/mm/yyyy. Returns "" for falsy/unparseable input.
export const normalizeDate = (s) => {
  if (!s) return "";
  const str = String(s).trim();
  if (str.includes("-")) {
    const [yyyy, mm, dd] = str.split("-");
    if (yyyy?.length === 4 && mm && dd) return `${dd.padStart(2, "0")}/${mm.padStart(2, "0")}/${yyyy}`;
    return "";
  }
  const [dd, mm, yy] = str.split("/");
  if (!dd || !mm || !yy) return "";
  const yyyy = yy.length === 2 ? `20${yy}` : yy;
  return `${dd.padStart(2, "0")}/${mm.padStart(2, "0")}/${yyyy}`;
};

// Sort/compare key for a dd/mm/yyyy (or legacy) date. Empty → "".
export const dateSortKey = (s) => {
  const n = normalizeDate(s);
  if (!n) return "";
  const [dd, mm, yyyy] = n.split("/");
  return `${yyyy}-${mm}-${dd}`;
};

// Today as dd/mm/yyyy.
export const getTodayDate = () => {
  const now = new Date();
  return `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
};

// --- Infer the archive-period label from transactions' dominant month ---
// Uses normalizeDate so it handles dd/mm/yyyy, dd/mm/yy, or yyyy-mm-dd input.
// Picks the month with the most rows and formats it as e.g. "April 2026".
// Falls back to the current month if no parseable dates.
export const inferArchivePeriod = (transactions = []) => {
  const counts = {};
  transactions.forEach((t) => {
    const norm = normalizeDate(t.date); // always dd/mm/yyyy
    if (!norm) return;
    const parts = norm.split("/");
    const m = parseInt(parts[1], 10), yyyy = parseInt(parts[2], 10);
    if (!m || !yyyy) return;
    const key = `${m}/${yyyy}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  let bestKey = null, bestCount = 0;
  Object.entries(counts).forEach(([k, c]) => { if (c > bestCount) { bestKey = k; bestCount = c; } });
  let date;
  if (bestKey) {
    const [m, yyyy] = bestKey.split("/").map(Number);
    date = new Date(yyyy, m - 1, 1);
  } else {
    const now = new Date();
    date = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return date.toLocaleString("default", { month: "long", year: "numeric" });
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

// --- Export Transactions to PDF ---
export const exportTransactionsPDF = async (transactions, getCardById, getOwnerById, title = "Transactions Report") => {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const today = getTodayDate();
  const totals = {
    cost: transactions.reduce((s, t) => s + (t.cost || 0), 0),
    gross: transactions.reduce((s, t) => s + (t.grossProfit || 0), 0),
    net: transactions.reduce((s, t) => s + (t.netProfit || 0), 0),
    buyAmt: transactions.reduce((s, t) => s + (parseFloat(t.buyAmount) || 0), 0),
    sellAmt: transactions.reduce((s, t) => s + (parseFloat(t.sellAmount) || 0), 0),
  };

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor("#1a1a2e");
  doc.text("Sales Dashboard", margin, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#888");
  doc.text(title, margin, 66);
  doc.text(`Generated: ${today}`, pageWidth - margin, 50, { align: "right" });
  doc.text(`${transactions.length} transactions`, pageWidth - margin, 66, { align: "right" });
  doc.setDrawColor("#1a1a2e");
  doc.setLineWidth(1.5);
  doc.line(margin, 78, pageWidth - margin, 78);

  const summaryY = 96;
  const cardWidth = (pageWidth - margin * 2 - 24) / 3;
  const cards = [
    { label: "TOTAL COST", value: `$${totals.cost.toFixed(2)}`, color: "#2980b9" },
    { label: "GROSS PROFIT", value: `$${totals.gross.toFixed(2)}`, color: "#e67e22" },
    { label: "NET PROFIT", value: `$${totals.net.toFixed(2)}`, color: "#27ae60" },
  ];
  cards.forEach((card, i) => {
    const x = margin + i * (cardWidth + 12);
    doc.setDrawColor("#e0e0e0");
    doc.setLineWidth(0.5);
    doc.roundedRect(x, summaryY, cardWidth, 44, 4, 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor("#888");
    doc.text(card.label, x + 10, summaryY + 14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(card.color);
    doc.text(card.value, x + 10, summaryY + 34);
  });

  const body = transactions.map((t) => {
    const cd = getCardById(t.cardId);
    const ow = getOwnerById(t.ownerId);
    return [
      t.date || "-",
      cd?.type || "",
      cd?.number || "",
      ow?.name || "",
      parseFloat(t.buyRate).toFixed(2),
      `$${parseFloat(t.buyAmount).toFixed(2)}`,
      parseFloat(t.sellRate).toFixed(2),
      `$${parseFloat(t.sellAmount).toFixed(2)}`,
      `$${t.cost.toFixed(2)}`,
      `$${t.grossProfit.toFixed(2)}`,
      `$${t.netProfit.toFixed(2)}`,
      `${t.profitMargin.toFixed(1)}%`,
    ];
  });

  body.push([
    { content: "TOTALS", colSpan: 5, styles: { fontStyle: "bold", fillColor: [240, 240, 240] } },
    { content: `$${totals.buyAmt.toFixed(2)}`, styles: { fontStyle: "bold", halign: "right", fillColor: [240, 240, 240] } },
    { content: "", styles: { fillColor: [240, 240, 240] } },
    { content: `$${totals.sellAmt.toFixed(2)}`, styles: { fontStyle: "bold", halign: "right", fillColor: [240, 240, 240] } },
    { content: `$${totals.cost.toFixed(2)}`, styles: { fontStyle: "bold", halign: "right", fillColor: [240, 240, 240] } },
    { content: `$${totals.gross.toFixed(2)}`, styles: { fontStyle: "bold", halign: "right", fillColor: [240, 240, 240], textColor: [230, 126, 34] } },
    { content: `$${totals.net.toFixed(2)}`, styles: { fontStyle: "bold", halign: "right", fillColor: [240, 240, 240], textColor: [39, 174, 96] } },
    { content: "", styles: { fillColor: [240, 240, 240] } },
  ]);

  autoTable(doc, {
    startY: summaryY + 60,
    head: [["Date", "Card Type", "Card #", "Owner", "Buy Rate", "Buy Amt", "Sell Rate", "Sell Amt", "Cost", "Gross", "Net", "Margin"]],
    body,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [248, 249, 250], textColor: [85, 85, 85], fontStyle: "bold", fontSize: 7 },
    alternateRowStyles: { fillColor: [250, 251, 252] },
    columnStyles: {
      4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" },
      7: { halign: "right" }, 8: { halign: "right" }, 9: { halign: "right", textColor: [230, 126, 34] },
      10: { halign: "right", fontStyle: "bold" }, 11: { halign: "right" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 10 && data.row.index < transactions.length) {
        const t = transactions[data.row.index];
        data.cell.styles.textColor = t.netProfit >= 0 ? [39, 174, 96] : [231, 76, 60];
      }
    },
    margin: { left: margin, right: margin },
  });

  doc.save(`transactions_${today.replace(/\//g, "-")}.pdf`);
};

export const exportMonthlyPDF = async (monthly) => {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const today = getTodayDate();
  const total = monthly.reduce((s, m) => s + m.profit, 0);

  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor("#1a1a2e");
  doc.text("Sales Dashboard", margin, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#888");
  doc.text("Monthly Profit Report", margin, 66);
  doc.text(`Generated: ${today}`, pageWidth - margin, 50, { align: "right" });
  doc.text(`${monthly.length} months`, pageWidth - margin, 66, { align: "right" });
  doc.setDrawColor("#1a1a2e");
  doc.setLineWidth(1.5);
  doc.line(margin, 78, pageWidth - margin, 78);

  const heroY = 100;
  const heroHeight = 80;
  doc.setDrawColor("#27ae60");
  doc.setLineWidth(1.5);
  doc.roundedRect(margin, heroY, pageWidth - margin * 2, heroHeight, 8, 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#888");
  doc.text("ALL TIME NET PROFIT", pageWidth / 2, heroY + 22, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor("#27ae60");
  doc.text(`$${total.toFixed(2)}`, pageWidth / 2, heroY + 54, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#999");
  doc.text(`Total from ${monthly.length} months`, pageWidth / 2, heroY + 70, { align: "center" });

  const body = monthly.map((m) => [m.month, `$${m.profit.toFixed(2)}`]);
  body.push([
    { content: "TOTAL", styles: { fontStyle: "bold", fillColor: [240, 240, 240] } },
    { content: `$${total.toFixed(2)}`, styles: { fontStyle: "bold", halign: "right", fillColor: [240, 240, 240], textColor: [39, 174, 96] } },
  ]);

  autoTable(doc, {
    startY: heroY + heroHeight + 24,
    head: [["Month", "Profit"]],
    body,
    styles: { fontSize: 10, cellPadding: 8 },
    headStyles: { fillColor: [248, 249, 250], textColor: [85, 85, 85], fontStyle: "bold", fontSize: 9 },
    columnStyles: {
      0: { fontStyle: "bold" },
      1: { halign: "right", textColor: [39, 174, 96], fontStyle: "bold" },
    },
    margin: { left: margin + 40, right: margin + 40 },
  });

  doc.save(`monthly_${today.replace(/\//g, "-")}.pdf`);
};