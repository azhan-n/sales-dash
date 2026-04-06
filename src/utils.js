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

// --- Export Transactions to PDF ---
export const exportTransactionsPDF = (transactions, getCardById, getOwnerById, title = "Transactions Report") => {
  const today = getTodayDate();
  const totals = {
    cost: transactions.reduce((s, t) => s + (t.cost || 0), 0),
    gross: transactions.reduce((s, t) => s + (t.grossProfit || 0), 0),
    net: transactions.reduce((s, t) => s + (t.netProfit || 0), 0),
    buyAmt: transactions.reduce((s, t) => s + (parseFloat(t.buyAmount) || 0), 0),
    sellAmt: transactions.reduce((s, t) => s + (parseFloat(t.sellAmount) || 0), 0),
  };

  const rows = transactions.map((t) => {
    const cd = getCardById(t.cardId);
    const ow = getOwnerById(t.ownerId);
    return `<tr>
      <td>${t.date || "-"}</td>
      <td>${cd?.type || ""}</td>
      <td>${cd?.number || ""}</td>
      <td>${ow?.name || ""}</td>
      <td class="r">${parseFloat(t.buyRate).toFixed(2)}</td>
      <td class="r">$${parseFloat(t.buyAmount).toFixed(2)}</td>
      <td class="r">${parseFloat(t.sellRate).toFixed(2)}</td>
      <td class="r">$${parseFloat(t.sellAmount).toFixed(2)}</td>
      <td class="r">$${t.cost.toFixed(2)}</td>
      <td class="r" style="color:#e67e22">$${t.grossProfit.toFixed(2)}</td>
      <td class="r" style="color:${t.netProfit >= 0 ? '#27ae60' : '#e74c3c'};font-weight:700">$${t.netProfit.toFixed(2)}</td>
      <td class="r">${t.profitMargin.toFixed(1)}%</td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>${title}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 40px; font-size: 11px; }
      .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #1a1a2e; padding-bottom: 16px; margin-bottom: 24px; }
      .header h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
      .header .meta { text-align: right; color: #666; font-size: 10px; line-height: 1.6; }
      .summary { display: flex; gap: 16px; margin-bottom: 24px; }
      .summary .card { flex: 1; padding: 12px 16px; border: 1px solid #e0e0e0; border-radius: 6px; }
      .summary .card .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 4px; }
      .summary .card .value { font-size: 18px; font-weight: 800; }
      .green { color: #27ae60; } .orange { color: #e67e22; } .blue { color: #2980b9; }
      table { width: 100%; border-collapse: collapse; font-size: 10px; }
      th { background: #f8f9fa; border: 1px solid #e0e0e0; padding: 8px 6px; text-align: left; font-size: 8px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; color: #555; }
      td { border: 1px solid #e8e8e8; padding: 6px; }
      tr:nth-child(even) { background: #fafbfc; }
      .r { text-align: right; }
      .totals td { background: #f0f0f0; font-weight: 700; border-top: 2px solid #1a1a2e; }
      .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #e0e0e0; font-size: 9px; color: #999; display: flex; justify-content: space-between; }
      @media print { body { padding: 20px; } @page { margin: 15mm; size: landscape; } }
    </style>
  </head><body>
    <div class="header">
      <div><h1>Sales Dashboard</h1><div style="color:#888;font-size:11px;margin-top:4px">${title}</div></div>
      <div class="meta">Generated: ${today}<br>${transactions.length} transactions</div>
    </div>
    <div class="summary">
      <div class="card"><div class="label">Total Cost</div><div class="value blue">$${totals.cost.toFixed(2)}</div></div>
      <div class="card"><div class="label">Gross Profit</div><div class="value orange">$${totals.gross.toFixed(2)}</div></div>
      <div class="card"><div class="label">Net Profit</div><div class="value green">$${totals.net.toFixed(2)}</div></div>
    </div>
    <table>
      <thead><tr><th>Date</th><th>Card Type</th><th>Card #</th><th>Owner</th><th class="r">Buy Rate</th><th class="r">Buy Amt</th><th class="r">Sell Rate</th><th class="r">Sell Amt</th><th class="r">Cost</th><th class="r">Gross</th><th class="r">Net</th><th class="r">Margin</th></tr></thead>
      <tbody>${rows}
        <tr class="totals">
          <td colspan="5">TOTALS</td>
          <td class="r">$${totals.buyAmt.toFixed(2)}</td>
          <td></td>
          <td class="r">$${totals.sellAmt.toFixed(2)}</td>
          <td class="r">$${totals.cost.toFixed(2)}</td>
          <td class="r" style="color:#e67e22">$${totals.gross.toFixed(2)}</td>
          <td class="r" style="color:#27ae60">$${totals.net.toFixed(2)}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
    <div class="footer"><span>Sales Dashboard Report</span><span>${today}</span></div>
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script>
  </body></html>`;

  const win = window.open("", "_blank");
  if (!win) { alert("Please allow pop-ups to export PDF."); return; }
  win.document.write(html);
  win.document.close();
};
export const exportMonthlyPDF = (monthly) => {
  const today = getTodayDate();
  const total = monthly.reduce((s, m) => s + m.profit, 0);

  const rows = monthly.map((m, i) => `<tr${i % 2 === 0 ? '' : ' style="background:#fafbfc"'}>
    <td style="font-weight:600">${m.month}</td>
    <td class="r" style="color:#27ae60;font-weight:700">$${m.profit.toFixed(2)}</td>
  </tr>`).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Monthly Profit Report</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 40px; font-size: 12px; }
      .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #1a1a2e; padding-bottom: 16px; margin-bottom: 32px; }
      .header h1 { font-size: 22px; font-weight: 800; }
      .header .meta { text-align: right; color: #666; font-size: 10px; line-height: 1.6; }
      .hero { text-align: center; padding: 32px; border: 2px solid #27ae60; border-radius: 12px; margin-bottom: 32px; }
      .hero .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #888; margin-bottom: 8px; }
      .hero .value { font-size: 36px; font-weight: 800; color: #27ae60; }
      .hero .sub { font-size: 11px; color: #999; margin-top: 8px; }
      table { width: 100%; max-width: 500px; margin: 0 auto; border-collapse: collapse; }
      th { background: #f8f9fa; border: 1px solid #e0e0e0; padding: 10px 16px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; color: #555; }
      td { border: 1px solid #e8e8e8; padding: 10px 16px; }
      .r { text-align: right; }
      .totals td { background: #f0f0f0; font-weight: 700; border-top: 2px solid #1a1a2e; font-size: 13px; }
      .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e0e0e0; font-size: 9px; color: #999; display: flex; justify-content: space-between; }
      @media print { body { padding: 20px; } @page { margin: 20mm; } }
    </style>
  </head><body>
    <div class="header">
      <div><h1>Sales Dashboard</h1><div style="color:#888;font-size:11px;margin-top:4px">Monthly Profit Report</div></div>
      <div class="meta">Generated: ${today}<br>${monthly.length} months</div>
    </div>
    <div class="hero">
      <div class="label">All Time Net Profit</div>
      <div class="value">$${total.toFixed(2)}</div>
      <div class="sub">Total from ${monthly.length} months</div>
    </div>
    <table>
      <thead><tr><th>Month</th><th class="r">Profit</th></tr></thead>
      <tbody>${rows}
        <tr class="totals"><td>TOTAL</td><td class="r" style="color:#27ae60">$${total.toFixed(2)}</td></tr>
      </tbody>
    </table>
    <div class="footer"><span>Sales Dashboard Report</span><span>${today}</span></div>
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script>
  </body></html>`;

  const win = window.open("", "_blank");
  if (!win) { alert("Please allow pop-ups to export PDF."); return; }
  win.document.write(html);
  win.document.close();
};