// Modern Transactions — filterable table with totals footer, mobile cards,
// archive history selector, bulk select + delete, working PDF export.
import React, { useState, useMemo } from "react";
import { Card, Btn, CardTypeBadge, SelectChip, I, fmtFull, fmtUSD, fmtDate } from "./ui";
import { exportTransactionsPDF, parseDate } from "../utils";

function Checkbox({ checked, indeterminate, onChange, theme, ariaLabel }) {
  const t = theme;
  const ref = React.useRef(null);
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate; }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={ariaLabel}
      onClick={(e) => e.stopPropagation()}
      style={{ width: 14, height: 14, accentColor: t.accent, cursor: "pointer" }}
    />
  );
}

export function ModernTransactions({
  theme,
  transactions,
  getCard, getOwner,
  owners, cards,
  onAdd, onEdit, onDelete,
  isMobile,
  // archive history
  historyPeriods = [],
  selectedPeriod = "current",
  setSelectedPeriod,
  loadingHistory = false,
  // bulk select
  selectedTxIds, setSelectedTxIds,
  onBulkDelete,
}) {
  const t = theme;
  const isHistory = selectedPeriod !== "current";
  const [viewMode, setViewMode] = useState(() => {
    try { return localStorage.getItem("modern_txViewMode") || (isMobile ? "cards" : "table"); } catch { return isMobile ? "cards" : "table"; }
  });
  React.useEffect(() => { try { localStorage.setItem("modern_txViewMode", viewMode); } catch {} }, [viewMode]);
  const useCards = isMobile && viewMode === "cards";
  const [q, setQ] = useState("");
  const [cardFilter, setCardFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [sort, setSort] = useState({ key: "date", dir: "desc" });

  const filtered = useMemo(() => {
    let out = transactions.filter((tx) => {
      const card = getCard(tx.cardId);
      const owner = getOwner(tx.ownerId);
      if (cardFilter !== "all" && card?.type !== cardFilter) return false;
      if (ownerFilter !== "all" && owner?.id !== ownerFilter) return false;
      if (q) {
        const s = q.toLowerCase();
        if (!(card?.number?.toLowerCase().includes(s) || owner?.name?.toLowerCase().includes(s) || card?.type?.toLowerCase().includes(s))) return false;
      }
      return true;
    });
    out = [...out].sort((a, b) => {
      let av = a[sort.key], bv = b[sort.key];
      if (sort.key === "date") {
        const ad = parseDate(a.date);
        const bd = parseDate(b.date);
        av = ad ? ad.getTime() : 0; bv = bd ? bd.getTime() : 0;
      } else {
        av = Number(av) || 0; bv = Number(bv) || 0;
      }
      return sort.dir === "asc" ? av - bv : bv - av;
    });
    return out;
  }, [transactions, q, cardFilter, ownerFilter, sort, getCard, getOwner]);

  const totals = {
    cost: filtered.reduce((s, t) => s + (Number(t.cost) || 0), 0),
    gross: filtered.reduce((s, t) => s + (Number(t.grossProfit) || 0), 0),
    net: filtered.reduce((s, t) => s + (Number(t.netProfit) || 0), 0),
    buyAmt: filtered.reduce((s, t) => s + (Number(t.buyAmount) || 0), 0),
    sellAmt: filtered.reduce((s, t) => s + (Number(t.sellAmount) || 0), 0),
    avgBuyRate: filtered.length ? filtered.reduce((s, t) => s + (Number(t.buyRate) || 0), 0) / filtered.length : 0,
    avgSellRate: filtered.length ? filtered.reduce((s, t) => s + (Number(t.sellRate) || 0), 0) / filtered.length : 0,
    avgMargin: filtered.length ? filtered.reduce((s, t) => s + (Number(t.profitMargin) || 0), 0) / filtered.length : 0,
  };

  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
  const cardTypeOptions = ["all", ...new Set(cards.map((c) => c.type).filter(Boolean))];

  // Bulk select helpers
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

  const periodOptions = [{ key: "current", label: "Current period" }, ...historyPeriods.map((p) => ({ key: p, label: p }))];

  const handleExport = () => {
    exportTransactionsPDF(filtered, getCard, getOwner, isHistory ? `Transactions Report — ${selectedPeriod}` : "Transactions Report");
  };

  const th = (label, key, align = "left") => (
    <th style={{
      textAlign: align, padding: "10px 12px", fontSize: 11, fontWeight: 500,
      color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em",
      borderBottom: `1px solid ${t.border}`,
      cursor: key ? "pointer" : "default", userSelect: "none",
      position: "sticky", top: 0, background: t.surface, zIndex: 2,
    }} onClick={() => key && toggleSort(key)}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: sort.key === key ? t.text : "inherit" }}>
        {label}
        {sort.key === key && (sort.dir === "asc" ? I.arrowUp(10) : I.arrowDown(10))}
      </span>
    </th>
  );

  const showActions = !isHistory;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Ledger</div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", color: t.text }}>Transactions</h1>
          <div style={{ fontSize: 13, color: t.textSec, marginTop: 4 }}>
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
        <div style={{ padding: "10px 14px", background: t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: t.radius, fontSize: 12, color: t.textSec }}>
          Viewing archived period <strong style={{ color: t.text }}>{selectedPeriod}</strong>. Editing and bulk actions are disabled.
          {loadingHistory && <span style={{ marginLeft: 8, color: t.textMuted }}>Loading…</span>}
        </div>
      )}

      <Card theme={t} pad={12} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: 6, padding: "4px 10px", flex: "1 1 240px", minWidth: 180 }}>
          <span style={{ color: t.textMuted, display: "flex" }}>{I.search(13)}</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search owner, card number, type…" style={{ border: "none", background: "transparent", outline: "none", fontSize: 12, color: t.text, flex: 1, fontFamily: "inherit" }} />
        </div>
        <SelectChip theme={t} value={cardFilter} options={cardTypeOptions.map((c) => ({ key: c, label: c === "all" ? "All card types" : c }))} onChange={setCardFilter} />
        <SelectChip theme={t} value={ownerFilter} options={[{ key: "all", label: "All owners" }, ...owners.map((o) => ({ key: o.id, label: o.name }))]} onChange={setOwnerFilter} />
        {isMobile && (
          <div style={{ display: "inline-flex", borderRadius: 6, border: `1px solid ${t.border}`, overflow: "hidden", background: t.surfaceAlt }}>
            {["table", "cards"].map((m) => (
              <button key={m} onClick={() => setViewMode(m)} style={{
                padding: "6px 10px", fontSize: 12, fontWeight: 500,
                background: viewMode === m ? t.accentSoft : "transparent",
                color: viewMode === m ? t.accent : t.textSec,
                border: "none", cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize",
              }}>{m}</button>
            ))}
          </div>
        )}
        {(q || cardFilter !== "all" || ownerFilter !== "all") && (
          <Btn theme={t} size="sm" variant="ghost" onClick={() => { setQ(""); setCardFilter("all"); setOwnerFilter("all"); }}>{I.x(12)} Clear</Btn>
        )}
      </Card>

      {showActions && selectedInFiltered.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px",
          background: t.accentSoft, border: `1px solid ${t.borderStrong || t.border}`,
          borderRadius: t.radius, gap: 12, flexWrap: "wrap",
        }}>
          <div style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>
            {selectedInFiltered.length} selected
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn theme={t} size="sm" variant="ghost" onClick={clearSelection}>Clear</Btn>
            <button onClick={() => onBulkDelete?.()} style={{
              padding: "6px 12px", fontSize: 12, fontWeight: 500,
              background: t.negative || "#e11d48", color: "#fff",
              border: `1px solid ${t.negative || "#e11d48"}`, borderRadius: t.radius,
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
              fontFamily: "inherit",
            }}>{I.trash(13)} Delete {selectedInFiltered.length}</button>
          </div>
        </div>
      )}

      {useCards ? (
        <Card theme={t} pad={0} style={{ overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: t.surfaceAlt }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sort</div>
            <SelectChip theme={t} value={sort.key + ":" + sort.dir} onChange={(v) => { const [key, dir] = v.split(":"); setSort({ key, dir }); }}
              options={[
                { key: "date:desc", label: "Newest first" },
                { key: "date:asc", label: "Oldest first" },
                { key: "netProfit:desc", label: "Highest net" },
                { key: "netProfit:asc", label: "Lowest net" },
                { key: "profitMargin:desc", label: "Best margin" },
                { key: "sellAmount:desc", label: "Largest sell" },
              ]} />
          </div>
          <div>
            {filtered.map((tx) => {
              const card = getCard(tx.cardId);
              const owner = getOwner(tx.ownerId);
              const pos = (Number(tx.netProfit) || 0) >= 0;
              const isSelected = selectedTxIds?.has(tx.id);
              return (
                <div key={tx.id} style={{ padding: "14px 16px", borderBottom: `1px solid ${t.border}`, display: "flex", flexDirection: "column", gap: 8, background: isSelected ? t.accentSoft : "transparent" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, minWidth: 0, flex: 1 }}>
                      {showActions && <Checkbox theme={t} checked={!!isSelected} onChange={() => toggleOne(tx.id)} ariaLabel="Select transaction" />}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                          <CardTypeBadge type={card?.type} theme={t} />
                          <span style={{ color: t.textSec, fontFamily: "ui-monospace, monospace", fontSize: 11 }}>••{card?.number}</span>
                        </div>
                        <div style={{ fontSize: 13, color: t.text, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{owner?.name}</div>
                        <div style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>{fmtDate(tx.date)}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ color: pos ? t.positive : t.negative, fontWeight: 600, fontVariantNumeric: "tabular-nums", fontSize: 15, whiteSpace: "nowrap" }}>{pos ? "+" : ""}{fmtFull(tx.netProfit)}</div>
                      <div style={{ color: pos ? t.positive : t.negative, fontSize: 11, fontVariantNumeric: "tabular-nums", opacity: 0.8 }}>{(Number(tx.profitMargin) || 0).toFixed(1)}%</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11, color: t.textMuted, paddingTop: 8, borderTop: `1px dashed ${t.border}` }}>
                    <div><span style={{ opacity: 0.7 }}>Buy</span> <span style={{ color: t.textSec, fontVariantNumeric: "tabular-nums" }}>{fmtUSD(tx.buyAmount)} @ {(Number(tx.buyRate) || 0).toFixed(2)}</span></div>
                    <div><span style={{ opacity: 0.7 }}>Sell</span> <span style={{ color: t.textSec, fontVariantNumeric: "tabular-nums" }}>{fmtUSD(tx.sellAmount)} @ {(Number(tx.sellRate) || 0).toFixed(2)}</span></div>
                    <div><span style={{ opacity: 0.7 }}>Cost</span> <span style={{ color: t.textSec, fontVariantNumeric: "tabular-nums" }}>{fmtFull(tx.cost)} MVR</span></div>
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
            {filtered.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: t.textMuted, fontSize: 13 }}>No transactions match your filters.</div>
            )}
          </div>
          {filtered.length > 0 && (
            <div style={{ background: t.surfaceAlt, padding: "12px 16px", borderTop: `1px solid ${t.border}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 11 }}>
              <div>
                <div style={{ color: t.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Net · {filtered.length} rows</div>
                <div style={{ color: totals.net >= 0 ? t.positive : t.negative, fontWeight: 600, fontSize: 15, fontVariantNumeric: "tabular-nums" }}>{totals.net >= 0 ? "+" : ""}{fmtFull(totals.net)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: t.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Avg margin</div>
                <div style={{ color: totals.avgMargin >= 0 ? t.positive : t.negative, fontWeight: 600, fontSize: 15, fontVariantNumeric: "tabular-nums" }}>{totals.avgMargin.toFixed(1)}%</div>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card theme={t} pad={0} style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: isMobile ? 12 : 13, color: t.text, minWidth: isMobile ? 900 : undefined }}>
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
                  {th("Cost", "cost", "right")}
                  {th("Net", "netProfit", "right")}
                  {th("Margin", "profitMargin", "right")}
                  {showActions && <th style={{ borderBottom: `1px solid ${t.border}`, padding: "10px 12px", position: "sticky", top: 0, background: t.surface }}></th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => {
                  const card = getCard(tx.cardId);
                  const owner = getOwner(tx.ownerId);
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
                      <td style={{ padding: "10px 12px", color: t.textSec, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{fmtDate(tx.date)}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <CardTypeBadge type={card?.type} theme={t} />
                          <span style={{ color: t.textSec, fontFamily: "ui-monospace, monospace", fontSize: 12 }}>••{card?.number}</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", color: t.text }}>{owner?.name}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: t.textSec, fontVariantNumeric: "tabular-nums" }}>{(Number(tx.buyRate) || 0).toFixed(2)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: t.textSec, fontVariantNumeric: "tabular-nums" }}>{fmtUSD(tx.buyAmount)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: t.textSec, fontVariantNumeric: "tabular-nums" }}>{(Number(tx.sellRate) || 0).toFixed(2)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: t.textSec, fontVariantNumeric: "tabular-nums" }}>{fmtUSD(tx.sellAmount)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: t.textSec, fontVariantNumeric: "tabular-nums" }}>{fmtFull(tx.cost)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: pos ? t.positive : t.negative, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{pos ? "+" : ""}{fmtFull(tx.netProfit)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        <span style={{ color: pos ? t.positive : t.negative }}>{(Number(tx.profitMargin) || 0).toFixed(1)}%</span>
                      </td>
                      {showActions && (
                        <td style={{ padding: "6px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <button onClick={() => onEdit(tx)} style={{ padding: 6, background: "transparent", border: "none", color: t.textMuted, cursor: "pointer", borderRadius: 4 }} onMouseEnter={(e) => (e.currentTarget.style.color = t.text)} onMouseLeave={(e) => (e.currentTarget.style.color = t.textMuted)}>{I.edit(14)}</button>
                          <button onClick={() => onDelete(tx)} style={{ padding: 6, background: "transparent", border: "none", color: t.textMuted, cursor: "pointer", borderRadius: 4 }} onMouseEnter={(e) => (e.currentTarget.style.color = t.negative)} onMouseLeave={(e) => (e.currentTarget.style.color = t.textMuted)}>{I.trash(14)}</button>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={showActions ? 12 : 10} style={{ padding: 40, textAlign: "center", color: t.textMuted, fontSize: 13 }}>No transactions match your filters.</td></tr>
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr style={{ background: t.surfaceAlt }}>
                    {showActions && <td></td>}
                    <td colSpan={3} style={{ padding: "10px 12px", fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      <div>Summary · {filtered.length} rows</div>
                      <div style={{ fontSize: 9, color: t.textMuted, opacity: 0.7, marginTop: 2, textTransform: "none", letterSpacing: 0 }}>avg for rates/margin · total for amounts</div>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: t.text, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{totals.avgBuyRate.toFixed(2)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: t.text, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtUSD(totals.buyAmt)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: t.text, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{totals.avgSellRate.toFixed(2)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: t.text, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtUSD(totals.sellAmt)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: t.text, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtFull(totals.cost)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: totals.net >= 0 ? t.positive : t.negative, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{totals.net >= 0 ? "+" : ""}{fmtFull(totals.net)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: totals.avgMargin >= 0 ? t.positive : t.negative, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{totals.avgMargin.toFixed(1)}%</td>
                    {showActions && <td></td>}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
