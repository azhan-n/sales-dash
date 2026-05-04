// Modern Monthly view — hero card + saved records + KPI tiles + trend chart + bar list
import React, { useState } from "react";
import { Card, Btn, fmtFull, useIcons } from "./ui";
import { TrendChart } from "./charts";
import { aggregateByMonth, computeStats } from "./aggregations";
import { exportMonthlyPDF } from "../utils";

export function ModernMonthly({
  theme,
  transactions,
  monthly = [],
  chartStyle,
  isMobile,
  editModeMonthly = false,
  setEditModeMonthly,
  setMonthlyForm,
  setShowMonthlyForm,
  setEditingMonthlyId,
  onDeleteMonthly,
  onRequestArchive,
  archiveCount = 0,
}) {
  const t = theme;
  const I = useIcons();
  const stats = computeStats(transactions);
  const txMonthly = aggregateByMonth(transactions);
  const max = Math.max(...txMonthly.map((m) => Math.abs(m.net)), 1);

  // All-time stats from saved Supabase monthly records
  const totalAllTime = monthly.reduce((s, m) => s + (Number(m.profit) || 0), 0);
  const avgMonthly = monthly.length ? totalAllTime / monthly.length : 0;
  const bestSaved = monthly.reduce(
    (a, b) => (Number(b.profit) > Number(a.profit) ? b : a),
    { profit: -Infinity, month: "—" }
  );

  // Trend chart data: prefer saved monthly records (full history) over computed from current txs
  const trendData = monthly.length > 0
    ? monthly.map((m) => ({ label: m.month, value: Number(m.profit) || 0 }))
    : txMonthly.map((m) => ({ label: m.label, value: m.net }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Monthly</div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", color: t.text }}>Monthly performance</h1>
          <div style={{ fontSize: 13, color: t.textSec, marginTop: 4 }}>{txMonthly.length} months from transactions · {monthly.length} saved records</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {onRequestArchive && (
            <Btn theme={t} size="sm" onClick={onRequestArchive} disabled={archiveCount === 0} title={archiveCount === 0 ? "Nothing to archive" : `Archive ${archiveCount} transactions`}>
              {I.download(13)} Archive period
            </Btn>
          )}
          <Btn theme={t} size="sm" onClick={() => exportMonthlyPDF(monthly)} disabled={!monthly.length}>{I.download(13)} Export PDF</Btn>
          {setEditModeMonthly && (
            <Btn theme={t} size="sm" variant={editModeMonthly ? "primary" : "secondary"} onClick={() => setEditModeMonthly(!editModeMonthly)}>
              {editModeMonthly ? "Done" : "Edit"}
            </Btn>
          )}
          {editModeMonthly && setShowMonthlyForm && (
            <Btn theme={t} size="sm" variant="primary" onClick={() => { setEditingMonthlyId?.(null); setMonthlyForm({ month: "", profit: "" }); setShowMonthlyForm(true); }}>
              {I.plus(13)} Add month
            </Btn>
          )}
        </div>
      </div>

      {/* Hero card — all-time profit from saved records */}
      {monthly.length > 0 && (
        <Card theme={t} pad={isMobile ? 16 : 20} style={{
          background: `linear-gradient(135deg, ${t.accent}, ${t.chartB})`,
          border: "none", color: "#fff",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(400px 200px at 100% 0%, rgba(255,255,255,0.25), transparent 60%)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.85 }}>All-time net profit</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
              <div style={{ fontSize: isMobile ? "clamp(22px, 8vw, 30px)" : "clamp(28px, 3.5vw, 40px)", fontWeight: 600, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", lineHeight: 1.1, wordBreak: "break-all" }}>
                {fmtFull(totalAllTime)}
              </div>
              <div style={{ fontSize: 14, opacity: 0.85 }}>MVR</div>
            </div>
            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 12, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.18)" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Months saved</div>
                <div style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: "tabular-nums", marginTop: 4 }}>{monthly.length}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Avg / month</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtFull(avgMonthly)}</span>
                  <span style={{ fontSize: 10, opacity: 0.75 }}>MVR</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Best month</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtFull(Number(bestSaved.profit))}</span>
                  <span style={{ fontSize: 10, opacity: 0.75 }}>{bestSaved.month}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Saved monthly records — shown right after hero card */}
      {monthly.length > 0 && (
        <Card theme={t} pad={0} style={{ overflow: "hidden" }}>
          <div style={{ padding: isMobile ? "14px 16px" : "16px 20px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Saved monthly records</div>
              <div style={{ fontSize: 11, color: t.textMuted }}>Archived profit per period</div>
            </div>
            {!editModeMonthly && (
              <div style={{ fontSize: 11, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>MVR</div>
            )}
          </div>
          <div>
            {monthly.map((m, i) => {
              const profit = Number(m.profit) || 0;
              const pos = profit >= 0;
              const prev = monthly[i - 1];
              const prevProfit = prev ? Number(prev.profit) || 0 : null;
              const momPct = prevProfit !== null && prevProfit !== 0
                ? ((profit - prevProfit) / Math.abs(prevProfit)) * 100
                : null;
              return (
                <div key={m.id} style={{ padding: isMobile ? "10px 16px" : "12px 20px", borderTop: `1px solid ${t.border}`, display: "grid", gridTemplateColumns: editModeMonthly ? "1fr auto auto auto" : "1fr auto auto", gap: 10, alignItems: "center" }}>
                  <div style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>{m.month}</div>
                  {/* MoM % badge */}
                  <div style={{ minWidth: 56, textAlign: "right" }}>
                    {momPct !== null ? (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 2,
                        fontSize: 11, fontWeight: 600,
                        color: momPct >= 0 ? t.positive : t.negative,
                        padding: "2px 6px", borderRadius: 999,
                        background: momPct >= 0 ? `${t.positive}18` : `${t.negative}18`,
                      }}>
                        {momPct >= 0 ? "↑" : "↓"} {Math.abs(momPct).toFixed(1)}%
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: t.textMuted }}>—</span>
                    )}
                  </div>
                  <div style={{ textAlign: "right", color: pos ? t.positive : t.negative, fontWeight: 600, fontVariantNumeric: "tabular-nums", fontSize: 13, minWidth: 90 }}>{pos ? "+" : ""}{fmtFull(profit)}</div>
                  {editModeMonthly && (
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      <button onClick={() => { setEditingMonthlyId?.(m.id); setMonthlyForm({ month: m.month, profit: String(m.profit) }); setShowMonthlyForm?.(true); }} style={{ padding: 6, background: "transparent", border: `1px solid ${t.border}`, color: t.textSec, cursor: "pointer", borderRadius: 6, display: "inline-flex", alignItems: "center" }}>{I.edit(13)}</button>
                      <button onClick={() => onDeleteMonthly?.(m)} style={{ padding: 6, background: "transparent", border: `1px solid ${t.border}`, color: t.textSec, cursor: "pointer", borderRadius: 6, display: "inline-flex", alignItems: "center" }}>{I.trash(13)}</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* KPI tiles from current transactions */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12 }}>
        <Card theme={t} pad={16}>
          <div style={{ fontSize: 11, fontWeight: 500, color: t.textMuted }}>Current period net</div>
          <div style={{ fontSize: "clamp(14px, 4cqi, 20px)", fontWeight: 600, color: t.text, marginTop: 2, fontVariantNumeric: "tabular-nums", lineHeight: 1.15, wordBreak: "break-all" }}>{fmtFull(stats.totalNet)}</div>
          <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>MVR</div>
        </Card>
        <Card theme={t} pad={16}>
          <div style={{ fontSize: 11, fontWeight: 500, color: t.textMuted }}>Avg / month</div>
          <div style={{ fontSize: "clamp(14px, 4cqi, 20px)", fontWeight: 600, color: t.text, marginTop: 2, fontVariantNumeric: "tabular-nums", lineHeight: 1.15, wordBreak: "break-all" }}>{fmtFull(txMonthly.length ? stats.totalNet / txMonthly.length : 0)}</div>
          <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>MVR</div>
        </Card>
        <Card theme={t} pad={16}>
          <div style={{ fontSize: 11, fontWeight: 500, color: t.textMuted }}>Best month</div>
          <div style={{ fontSize: "clamp(14px, 4cqi, 20px)", fontWeight: 600, color: t.positive, marginTop: 2, fontVariantNumeric: "tabular-nums", lineHeight: 1.15, wordBreak: "break-all" }}>{fmtFull(stats.bestMonth.net)}</div>
          <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>{stats.bestMonth.label}</div>
        </Card>
        <Card theme={t} pad={16}>
          <div style={{ fontSize: 11, fontWeight: 500, color: t.textMuted }}>Trend</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: stats.trendPct >= 0 ? t.positive : t.negative, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{stats.trendPct >= 0 ? "+" : ""}{stats.trendPct.toFixed(1)}%</div>
          <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>vs first half</div>
        </Card>
      </div>

      {/* Trend chart — uses saved monthly records when available, falls back to transaction-derived data */}
      <Card theme={t} pad={isMobile ? 14 : 20}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Net profit trend</div>
          <div style={{ fontSize: 11, color: t.textMuted }}>
            {monthly.length > 0 ? "From saved monthly records (all-time)" : "Derived from current transactions"}
          </div>
        </div>
        <TrendChart data={trendData} theme={t} mode={chartStyle} height={isMobile ? 180 : 240} />
      </Card>

      {/* Current-period breakdown from transactions */}
      <Card theme={t} pad={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: isMobile ? "14px 16px" : "16px 20px", borderBottom: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Current period breakdown</div>
          <div style={{ fontSize: 11, color: t.textMuted }}>Net profit by month, from active transactions</div>
        </div>
        <div>
          {txMonthly.length === 0 && (
            <div style={{ padding: 32, textAlign: "center", color: t.textMuted, fontSize: 12 }}>No transactions yet.</div>
          )}
          {txMonthly.map((m) => {
            const pos = m.net >= 0;
            const w = Math.max(2, Math.abs(m.net) / max * 100);
            return (
              <div key={m.key} style={{ padding: isMobile ? "10px 16px" : "12px 20px", borderTop: `1px solid ${t.border}`, display: "grid", gridTemplateColumns: isMobile ? "minmax(0, 1fr) 90px" : "minmax(0, 80px) 1fr 110px", gap: 12, alignItems: "center" }}>
                <div style={{ fontSize: 12, color: t.textSec, fontWeight: 500 }}>{m.label} {m.date.getFullYear()}</div>
                {!isMobile && (
                  <div style={{ height: 8, background: t.surfaceDeep, borderRadius: 4, overflow: "hidden", position: "relative" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${w}%`, background: pos ? t.positive : t.negative, borderRadius: 4, transition: "width .3s" }} />
                  </div>
                )}
                <div style={{ textAlign: "right", color: pos ? t.positive : t.negative, fontWeight: 600, fontVariantNumeric: "tabular-nums", fontSize: 13 }}>{pos ? "+" : ""}{fmtFull(m.net)}</div>
                {isMobile && (
                  <div style={{ gridColumn: "1 / -1", height: 6, background: t.surfaceDeep, borderRadius: 3, overflow: "hidden", position: "relative", marginTop: -4 }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${w}%`, background: pos ? t.positive : t.negative, borderRadius: 3 }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
