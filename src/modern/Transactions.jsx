// Modern Transactions — filterable table with date range, card number filter,
// pagination, bulk select, archive history selector, and PDF export.
import React, { useState, useMemo } from "react";
import { Card, Btn, CardTypeBadge, CardNumBadge, NetBadge, GrossBadge, CostBadge, UsdBadge, RateBadge, MarginBadge, CountBadge, OwnerBadge, SelectChip, fmtFull, fmtUSD, fmtDate, useIcons } from "./ui";
import { exportTransactionsPDF, parseDate, dateSortKey } from "../utils";

const PAGE_SIZE = 50;

function Checkbox({ checked, indeterminate, onChange, theme, ariaLabel }) {
  const t = theme;
  const ref = React.useRef(null);
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate; }, [indeterminate]);
  return (
    <input ref={ref} type="checkbox" checked={checked} onChange={onChange} aria-label={ariaLabel}
      onClick={(e) => e.stopPropagation()}
      style={{ width: 14, height: 14, accentColor: t.accent, cursor: "pointer" }} />
  );
}

export function ModernTransactions({
  theme, transactions, getCard, getOwner, owners, cards,
  onAdd, onEdit, onDelete, isMobile,
  historyPeriods = [], selectedPeriod = "current", setSelectedPeriod, loadingHistory = false,
  selectedTxIds, setSelectedTxIds, onBulkDelete,
}) {
  const t = theme;
  const I = useIcons();
  const isHistory = selectedPeriod !== "current";
  const [viewMode, setViewMode] = useState(() => {
    try { return localStorage.getItem("modern_txViewMode") || (isMobile ? "cards" : "table"); } catch { return isMobile ? "cards" : "table"; }
  });
  React.useEffect(() => { try { localStorage.setItem("modern_txViewMode", viewMode); } catch {} }, [viewMode]);
  const useCards = isMobile && viewMode === "cards";

  const [q, setQ] = useState("");
  const [cardFilter, setCardFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [filterCardNumber, setFilterCardNumber] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [sort, setSort] = useState({ key: "date", dir: "desc" });
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => { setCurrentPage(1); }, [q, cardFilter, ownerFilter, filterCardNumber, filterDateFrom, filterDateTo]);
  React.useEffect(() => { setFilterCardNumber("all"); }, [ownerFilter]);

  const filtered = useMemo(() => {
    let out = transactions.filter((tx) => {
      const card = getCard(tx.cardId);
      const owner = getOwner(tx.ownerId);
      const cardType  = card?.type   ?? tx.cardType   ?? "";
      const cardNum   = card?.number ?? tx.cardNumber ?? "";
      const ownerName = owner?.name  ?? tx.owner      ?? "";

      if (cardFilter !== "all" && cardType !== cardFilter) return false;
      if (ownerFilter !== "all" && ownerName !== ownerFilter) return false;
      if (filterCardNumber !== "all" && cardNum !== filterCardNumber) return false;
      if (filterDateFrom || filterDateTo) {
        const k = tx.date instanceof Date ? tx.date.toISOString().split("T")[0] : dateSortKey(tx.date);
        if (filterDateFrom && k < filterDateFrom) return false;
        if (filterDateTo && k > filterDateTo) return false;
      }
      if (q) {
        const s = q.toLowerCase();
        const datePart = tx.date instanceof Date ? fmtDate(tx.date) : (tx.date || "");
        const haystack = [cardType, cardNum, ownerName, datePart].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(s)) return false;
      }
      return true;
    });
    out = [...out].sort((a, b) => {
      let av, bv;
      if (sort.key === "date") {
        const ad = parseDate(a.date); const bd = parseDate(b.date);
        av = ad ? ad.getTime() : 0; bv = bd ? bd.getTime() : 0;
      } else {
        av = Number(a[sort.key]) || 0; bv = Number(b[sort.key]) || 0;
      }
      return sort.dir === "asc" ? av - bv : bv - av;
    });
    return out;
  }, [transactions, q, cardFilter, ownerFilter, filterCardNumber, filterDateFrom, filterDateTo, sort, getCard, getOwner]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totals = {
    cost:       filtered.reduce((s, tx) => s + (Number(tx.cost) || 0), 0),
    gross:      filtered.reduce((s, tx) => s + (Number(tx.grossProfit) || 0), 0),
    net:        filtered.reduce((s, tx) => s + (Number(tx.netProfit) || 0), 0),
    buyAmt:     filtered.reduce((s, tx) => s + (Number(tx.buyAmount) || 0), 0),
    sellAmt:    filtered.reduce((s, tx) => s + (Number(tx.sellAmount) || 0), 0),
    avgBuyRate:  filtered.length ? filtered.reduce((s, tx) => s + (Number(tx.buyRate) || 0), 0) / filtered.length : 0,
    avgSellRate: filtered.length ? filtered.reduce((s, tx) => s + (Number(tx.sellRate) || 0), 0) / filtered.length : 0,
    avgMargin:   filtered.length ? filtered.reduce((s, tx) => s + (Number(tx.profitMargin) || 0), 0) / filtered.length : 0,
  };

  const toggleSort = (key) => setSort((s) => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" });

  const cardTypeOptions = ["all", ...new Set(transactions.map((tx) => {
    const c = getCard(tx.cardId); return c?.type ?? tx.cardType ?? "";
  }).filter(Boolean))];

  const cardNumberOptions = useMemo(() => {
    const nums = transactions.filter((tx) => {
      if (ownerFilter === "all") return true;
      const owner = getOwner(tx.ownerId);
      return (owner?.name ?? tx.owner ?? "") === ownerFilter;
    }).map((tx) => {
      const c = getCard(tx.cardId); return c?.number ?? tx.cardNumber ?? "";
    }).filter(Boolean);
    return ["all", ...new Set(nums)];
  }, [transactions, ownerFilter, getCard, getOwner]);

  const filteredIds = filtered.map((tx) => tx.id);
  const selectedInFiltered = filteredIds.filter((id) => selectedTxIds?.has(id));
  const allSelected = filteredIds.length > 0 && selectedInFiltered.length === filteredIds.length;
  const someSelected = selectedInFiltered.length > 0 && !allSelected;
  const toggleAll = () => {
    const next = new Set(selectedTxIds || new Set());
    if (allSelected) filteredIds.forEach((id) => next.delete(id));
    else filteredIds.forEach((id) => next.add(id));
    setSelectedTxIds?.(next);
  };
  const toggleOne = (id) => {
    const next = new Set(selectedTxIds || new Set());
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedTxIds?.(next);
  };
  const clearSelection = () => setSelectedTxIds?.(new Set());
  const clearFilters = () => { setQ(""); setCardFilter("all"); setOwnerFilter("all"); setFilterCardNumber("all"); setFilterDateFrom(""); setFilterDateTo(""); };
  const hasFilters = !!(q || cardFilter !== "all" || ownerFilter !== "all" || filterCardNumber !== "all" || filterDateFrom || filterDateTo);

  const periodOptions = [{ key: "current", label: "Current period" }, ...historyPeriods.map((p) => ({ key: p, label: p }))];
  const handleExport = () => exportTransactionsPDF(filtered, getCard, getOwner, isHistory ? `Transactions Report — ${selectedPeriod}` : "Transactions Report");

  const th = (label, key, align = "left") => (
    <th style={{ textAlign: align, padding: "10px 12px", fontSize: t.fz(11), fontWeight: 500, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${t.border}`, cursor: key ? "pointer" : "default", userSelect: "none", position: "sticky", top: 0, background: t.surface, zIndex: 2 }}
      onClick={() => key && toggleSort(key)}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: sort.key === key ? t.text : "inherit" }}>
        {label}{sort.key === key && (sort.dir === "asc" ? I.arrowUp(10) : I.arrowDown(10))}
      </span>
    </th>
  );

  const showActions = !isHistory;

  const PaginationBar = () => totalPages <= 1 ? null : (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderTop: `1px solid ${t.border}`, background: t.surfaceAlt, fontSize: t.fz(12), color: t.textSec, gap: 8, flexWrap: "wrap" }}>
      <span>{filtered.length} total · page {currentPage} of {totalPages}</span>
      <div style={{ display: "flex", gap: 4 }}>
        <Btn theme={t} size="sm" variant="ghost" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</Btn>
        <Btn theme={t} size="sm" variant="ghost" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>‹ Prev</Btn>
        <Btn theme={t} size="sm" variant="ghost" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next ›</Btn>
        <Btn theme={t} size="sm" variant="ghost" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</Btn>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: t.fz(11), fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Ledger</div>
          <h1 style={{ margin: 0, fontSize: t.fz(26), fontWeight: 600, letterSpacing: "-0.02em", color: t.text }}>Transactions</h1>
          <div style={{ fontSize: t.fz(13), color: t.textSec, marginTop: 4 }}>
            {filtered.length} of {transactions.length} shown · net {fmtFull(totals.net)} MVR
            {isHistory && <span style={{ marginLeft: 8, color: t.textMuted }}>· read-only ({selectedPeriod})</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {historyPeriods.length > 0 && setSelectedPeriod && (
            <SelectChip theme={t} value={selectedPeriod} options={periodOptions} onChange={setSelectedPeriod} />
          )}
          <Btn theme={t} size="sm" onClick={handleExport}>{I.download(13)} Export PDF</Btn>
          {showActions && <Btn theme={t} variant="primary" size="sm" onClick={onAdd}>{I.plus(13)} New</Btn>}
        </div>
      </div>

      {isHistory && (
        <div style={{ padding: "10px 14px", background: t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: t.radius, fontSize: t.fz(12), color: t.textSec }}>
          Viewing archived period <strong style={{ color: t.text }}>{selectedPeriod}</strong>. Editing and bulk actions are disabled.
          {loadingHistory && <span style={{ marginLeft: 8, color: t.textMuted }}>Loading…</span>}
        </div>
      )}

      {/* Filter panel */}
      <Card theme={t} pad={12} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Row 1: search + view toggle + clear */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: 6, padding: "4px 10px", flex: "1 1 200px", minWidth: 160 }}>
            <span style={{ color: t.textMuted, display: "flex" }}>{I.search(13)}</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search owner, card, type, date…"
              style={{ border: "none", background: "transparent", outline: "none", fontSize: t.fz(12), color: t.text, flex: 1, fontFamily: "inherit" }} />
            {q && <button onClick={() => setQ("")} style={{ background: "none", border: "none", color: t.textMuted, cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>{I.x(11)}</button>}
          </div>
          {isMobile && (
            <div style={{ display: "inline-flex", borderRadius: 6, border: `1px solid ${t.border}`, overflow: "hidden", background: t.surfaceAlt }}>
              {["table", "cards"].map((m) => (
                <button key={m} onClick={() => setViewMode(m)} style={{ padding: "6px 10px", fontSize: t.fz(12), fontWeight: 500, background: viewMode === m ? t.accentSoft : "transparent", color: viewMode === m ? t.accent : t.textSec, border: "none", cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>{m}</button>
              ))}
            </div>
          )}
          {hasFilters && <Btn theme={t} size="sm" variant="ghost" onClick={clearFilters}>{I.x(12)} Clear all</Btn>}
        </div>
        {/* Row 2: dropdowns + date range */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <SelectChip theme={t} value={cardFilter}
            options={cardTypeOptions.map((c) => ({ key: c, label: c === "all" ? "All card types" : c }))}
            onChange={setCardFilter} />
          <SelectChip theme={t} value={ownerFilter}
            options={[{ key: "all", label: "All owners" }, ...owners.map((o) => ({ key: o.name, label: o.name }))]}
            onChange={setOwnerFilter} />
          <SelectChip theme={t} value={filterCardNumber}
            options={cardNumberOptions.map((n) => ({ key: n, label: n === "all" ? "All card #" : `••${n}` }))}
            onChange={setFilterCardNumber} />
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} title="From date"
              style={{ padding: "5px 8px", border: `1px solid ${filterDateFrom ? t.accent : t.border}`, borderRadius: 6, fontSize: t.fz(12), background: t.surfaceAlt, color: t.text, outline: "none", colorScheme: "auto", fontFamily: "inherit" }} />
            <span style={{ color: t.textMuted, fontSize: t.fz(11) }}>—</span>
            <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} title="To date"
              style={{ padding: "5px 8px", border: `1px solid ${filterDateTo ? t.accent : t.border}`, borderRadius: 6, fontSize: t.fz(12), background: t.surfaceAlt, color: t.text, outline: "none", colorScheme: "auto", fontFamily: "inherit" }} />
          </div>
        </div>
      </Card>

      {/* Bulk action bar */}
      {showActions && selectedInFiltered.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: t.accentSoft, border: `1px solid ${t.borderStrong || t.border}`, borderRadius: t.radius, gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: t.fz(13), color: t.text, fontWeight: 500 }}>{selectedInFiltered.length} selected</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn theme={t} size="sm" variant="ghost" onClick={clearSelection}>Clear</Btn>
            <button onClick={() => onBulkDelete?.()} style={{ padding: "6px 12px", fontSize: t.fz(12), fontWeight: 500, background: t.negative || "#e11d48", color: "#fff", border: `1px solid ${t.negative || "#e11d48"}`, borderRadius: t.radius, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
              {I.trash(13)} Delete {selectedInFiltered.length}
            </button>
          </div>
        </div>
      )}

      {/* Cards view */}
      {useCards ? (
        <Card theme={t} pad={0} style={{ overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: t.surfaceAlt }}>
            <div style={{ fontSize: t.fz(11), fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sort</div>
            <SelectChip theme={t} value={sort.key + ":" + sort.dir} onChange={(v) => { const [key, dir] = v.split(":"); setSort({ key, dir }); }}
              options={[
                { key: "date:desc", label: "Newest first" }, { key: "date:asc", label: "Oldest first" },
                { key: "netProfit:desc", label: "Highest net" }, { key: "netProfit:asc", label: "Lowest net" },
                { key: "profitMargin:desc", label: "Best margin" }, { key: "sellAmount:desc", label: "Largest sell" },
              ]} />
          </div>
          <div>
            {paged.map((tx) => {
              const card = getCard(tx.cardId);
              const owner = getOwner(tx.ownerId);
              const cardType  = card?.type   ?? tx.cardType   ?? "";
              const cardNum   = card?.number ?? tx.cardNumber ?? "";
              const ownerName = owner?.name  ?? tx.owner      ?? "";
              const pos = (Number(tx.netProfit) || 0) >= 0;
              const isSelected = selectedTxIds?.has(tx.id);
              return (
                <div key={tx.id} style={{ padding: "14px 16px", borderBottom: `1px solid ${t.border}`, display: "flex", flexDirection: "column", gap: 8, background: isSelected ? t.accentSoft : "transparent" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, minWidth: 0, flex: 1 }}>
                      {showActions && <Checkbox theme={t} checked={!!isSelected} onChange={() => toggleOne(tx.id)} ariaLabel="Select transaction" />}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                          <CardTypeBadge type={cardType} theme={t} />
                          <CardNumBadge value={cardNum} theme={t} />
                        </div>
                        <OwnerBadge id={owner?.id ?? tx.ownerId} name={ownerName} theme={t} />
                        <div style={{ fontSize: t.fz(11), color: t.textMuted, marginTop: 1 }}>{fmtDate(tx.date)}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <NetBadge value={tx.netProfit} theme={t} />
                      <MarginBadge value={tx.profitMargin} theme={t} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: t.fz(11), color: t.textMuted, paddingTop: 8, borderTop: `1px dashed ${t.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ opacity: 0.7 }}>Buy</span> <UsdBadge value={tx.buyAmount} theme={t} /> <span style={{ opacity: 0.6 }}>@</span> <RateBadge value={tx.buyRate} theme={t} /></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ opacity: 0.7 }}>Sell</span> <UsdBadge value={tx.sellAmount} theme={t} /> <span style={{ opacity: 0.6 }}>@</span> <RateBadge value={tx.sellRate} theme={t} /></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ opacity: 0.7 }}>Gross</span> <GrossBadge value={tx.grossProfit} theme={t} /></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ opacity: 0.7 }}>Cost</span> <CostBadge value={tx.cost} theme={t} /></div>
                    {showActions && (
                      <div style={{ textAlign: "right", display: "flex", gap: 4, justifyContent: "flex-end" }}>
                        <button onClick={() => onEdit(tx)} style={{ padding: 6, background: "transparent", border: `1px solid ${t.border}`, color: t.textSec, cursor: "pointer", borderRadius: 6, display: "inline-flex", alignItems: "center" }}>{I.edit(13)}</button>
                        <button onClick={() => onDelete(tx)} style={{ padding: 6, background: "transparent", border: `1px solid ${t.border}`, color: t.textSec, cursor: "pointer", borderRadius: 6, display: "inline-flex", alignItems: "center" }}>{I.trash(13)}</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {paged.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: t.textMuted, fontSize: t.fz(13) }}>No transactions match your filters.</div>
            )}
          </div>
          {filtered.length > 0 && (
            <div style={{ background: t.surfaceAlt, padding: "12px 16px", borderTop: `1px solid ${t.border}`, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, fontSize: t.fz(11) }}>
              <div>
                <div style={{ display: "flex", align: "center", gap: 5, color: t.textMuted, fontSize: t.fz(10), textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Gross <CountBadge value={filtered.length} theme={t} label="rows" /></div>
                <GrossBadge value={totals.gross} theme={t} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: t.textMuted, fontSize: t.fz(10), textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Net profit</div>
                <NetBadge value={totals.net} theme={t} />
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: t.textMuted, fontSize: t.fz(10), textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Avg margin</div>
                <MarginBadge value={totals.avgMargin} theme={t} />
              </div>
            </div>
          )}
          <PaginationBar />
        </Card>
      ) : (
        /* Table view */
        <Card theme={t} pad={0} style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: t.fz(isMobile ? 12 : 13), color: t.text, minWidth: isMobile ? 900 : undefined }}>
              <thead>
                <tr>
                  {showActions && (
                    <th style={{ padding: "10px 12px", borderBottom: `1px solid ${t.border}`, position: "sticky", top: 0, background: t.surface, zIndex: 2, width: 36 }}>
                      <Checkbox theme={t} checked={allSelected} indeterminate={someSelected} onChange={toggleAll} ariaLabel="Select all" />
                    </th>
                  )}
                  {th("Date", "date")}
                  {th("Card", null)}
                  {th("Owner", null)}
                  {th("Buy rate", "buyRate", "right")}
                  {th("Buy amt", "buyAmount", "right")}
                  {th("Sell rate", "sellRate", "right")}
                  {th("Sell amt", "sellAmount", "right")}
                  {th("Gross", "grossProfit", "right")}
                  {th("Cost", "cost", "right")}
                  {th("Net", "netProfit", "right")}
                  {th("Margin", "profitMargin", "right")}
                  {showActions && <th style={{ borderBottom: `1px solid ${t.border}`, padding: "10px 12px", position: "sticky", top: 0, background: t.surface }}></th>}
                </tr>
              </thead>
              <tbody>
                {paged.map((tx) => {
                  const card = getCard(tx.cardId);
                  const owner = getOwner(tx.ownerId);
                  const cardType  = card?.type   ?? tx.cardType   ?? "";
                  const cardNum   = card?.number ?? tx.cardNumber ?? "";
                  const ownerName = owner?.name  ?? tx.owner      ?? "";
                  const pos = (Number(tx.netProfit) || 0) >= 0;
                  const isSelected = selectedTxIds?.has(tx.id);
                  return (
                    <tr key={tx.id} style={{ borderBottom: `1px solid ${t.border}`, transition: "background .15s", background: isSelected ? t.accentSoft : "transparent" }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = t.surfaceAlt; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>
                      {showActions && (
                        <td style={{ padding: "10px 12px", width: 36 }}>
                          <Checkbox theme={t} checked={!!isSelected} onChange={() => toggleOne(tx.id)} ariaLabel="Select transaction" />
                        </td>
                      )}
                      <td style={{ padding: "10px 12px", color: t.textMuted, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", fontSize: t.fz(11) }}>{fmtDate(tx.date)}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <CardTypeBadge type={cardType} theme={t} />
                          <CardNumBadge value={cardNum} theme={t} />
                        </div>
                      </td>
                      <td style={{ padding: "8px 12px" }}><OwnerBadge id={owner?.id ?? tx.ownerId} name={ownerName} theme={t} /></td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}><RateBadge value={tx.buyRate} theme={t} /></td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}><UsdBadge value={tx.buyAmount} theme={t} /></td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}><RateBadge value={tx.sellRate} theme={t} /></td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}><UsdBadge value={tx.sellAmount} theme={t} /></td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}><GrossBadge value={tx.grossProfit} theme={t} /></td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}><CostBadge value={tx.cost} theme={t} /></td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}><NetBadge value={tx.netProfit} theme={t} /></td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}><MarginBadge value={tx.profitMargin} theme={t} /></td>
                      {showActions && (
                        <td style={{ padding: "6px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <button onClick={() => onEdit(tx)} style={{ padding: 6, background: "transparent", border: "none", color: t.textMuted, cursor: "pointer", borderRadius: 4 }} onMouseEnter={(e) => (e.currentTarget.style.color = t.text)} onMouseLeave={(e) => (e.currentTarget.style.color = t.textMuted)}>{I.edit(14)}</button>
                          <button onClick={() => onDelete(tx)} style={{ padding: 6, background: "transparent", border: "none", color: t.textMuted, cursor: "pointer", borderRadius: 4 }} onMouseEnter={(e) => (e.currentTarget.style.color = t.negative)} onMouseLeave={(e) => (e.currentTarget.style.color = t.textMuted)}>{I.trash(14)}</button>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {paged.length === 0 && (
                  <tr><td colSpan={showActions ? 13 : 11} style={{ padding: 40, textAlign: "center", color: t.textMuted, fontSize: t.fz(13) }}>No transactions match your filters.</td></tr>
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr style={{ background: t.surfaceAlt }}>
                    {showActions && <td></td>}
                    <td colSpan={3} style={{ padding: "10px 12px", fontSize: t.fz(11), fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>Summary <CountBadge value={filtered.length} theme={t} label="rows" /></div>
                      <div style={{ fontSize: t.fz(9), color: t.textMuted, opacity: 0.7, marginTop: 2, textTransform: "none", letterSpacing: 0 }}>avg for rates/margin · total for amounts</div>
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}><RateBadge value={totals.avgBuyRate} theme={t} /></td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}><UsdBadge value={totals.buyAmt} theme={t} /></td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}><RateBadge value={totals.avgSellRate} theme={t} /></td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}><UsdBadge value={totals.sellAmt} theme={t} /></td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}><GrossBadge value={totals.gross} theme={t} /></td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}><CostBadge value={totals.cost} theme={t} /></td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}><NetBadge value={totals.net} theme={t} /></td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}><MarginBadge value={totals.avgMargin} theme={t} /></td>
                    {showActions && <td></td>}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <PaginationBar />
        </Card>
      )}
    </div>
  );
}
