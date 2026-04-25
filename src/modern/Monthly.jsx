// Modern Monthly view — KPI tiles + trend chart + month-by-month bar list
// + edit mode (add/edit/delete) + PDF export.
import React, { useState } from "react";
import { Card, Btn, I, fmtCompact } from "./ui";
import { TrendChart } from "./charts";
import { aggregateByMonth, computeStats } from "./aggregations";
import { exportMonthlyPDF } from "../utils";

export function ModernMonthly({
  theme,
  transactions,
  monthly = [],
  chartStyle,
  isMobile,
  // form state passed through from ModernApp
  editModeMonthly = false,
  setEditModeMonthly,
  setMonthlyForm,
  setShowMonthlyForm,
  setEditingMonthlyId,
  onDeleteMonthly,
}) {
  const t = theme;
  const stats = computeStats(transactions);
  const txMonthly = aggregateByMonth(transactions);
  const max = Math.max(...txMonthly.map((m) => Math.abs(m.net)), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Monthly</div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", color: t.text }}>Monthly performance</h1>
          <div style={{ fontSize: 13, color: t.textSec, marginTop: 4 }}>{txMonthly.length} months from transactions · {monthly.length} saved records</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12 }}>
        <Card theme={t} pad={16}>
          <div style={{ fontSize: 11, fontWeight: 500, color: t.textMuted }}>Total net</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: t.text, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{fmtCompact(stats.totalNet)}</div>
          <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>MVR</div>
        </Card>
        <Card theme={t} pad={16}>
          <div style={{ fontSize: 11, fontWeight: 500, color: t.textMuted }}>Avg / month</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: t.text, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{fmtCompact(txMonthly.length ? stats.totalNet / txMonthly.length : 0)}</div>
          <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>MVR</div>
        </Card>
        <Card theme={t} pad={16}>
          <div style={{ fontSize: 11, fontWeight: 500, color: t.textMuted }}>Best month</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: t.positive, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{fmtCompact(stats.bestMonth.net)}</div>
          <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>{stats.bestMonth.label}</div>
        </Card>
        <Card theme={t} pad={16}>
          <div style={{ fontSize: 11, fontWeight: 500, color: t.textMuted }}>Trend</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: stats.trendPct >= 0 ? t.positive : t.negative, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{stats.trendPct >= 0 ? "+" : ""}{stats.trendPct.toFixed(1)}%</div>
          <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>vs first half</div>
        </Card>
      </div>

      <Card theme={t} pad={isMobile ? 14 : 20}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Net profit by month</div>
          <div style={{ fontSize: 11, color: t.textMuted }}>Derived from transactions</div>
        </div>
        <TrendChart data={txMonthly.map((m) => ({ label: m.label, value: m.net }))} theme={t} mode={chartStyle} height={isMobile ? 180 : 240} />
      </Card>

      <Card theme={t} pad={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: isMobile ? "14px 16px" : "16px 20px", borderBottom: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>From transactions</div>
          <div style={{ fontSize: 11, color: t.textMuted }}>Net profit by month, scaled to the best</div>
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
                <div style={{ textAlign: "right", color: pos ? t.positive : t.negative, fontWeight: 600, fontVariantNumeric: "tabular-nums", fontSize: 13 }}>{pos ? "+" : ""}{fmtCompact(m.net)}</div>
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

      {monthly.length > 0 && (
        <Card theme={t} pad={0} style={{ overflow: "hidden" }}>
          <div style={{ padding: isMobile ? "14px 16px" : "16px 20px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Saved monthly records</div>
              <div style={{ fontSize: 11, color: t.textMuted }}>Manually entered profit per month</div>
            </div>
            <div style={{ fontSize: 11, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>USD</div>
          </div>
          <div>
            {monthly.map((m) => {
              const profit = Number(m.profit) || 0;
              const pos = profit >= 0;
              return (
                <div key={m.id} style={{ padding: isMobile ? "10px 16px" : "12px 20px", borderTop: `1px solid ${t.border}`, display: "grid", gridTemplateColumns: editModeMonthly ? "1fr auto auto" : "1fr auto", gap: 10, alignItems: "center" }}>
                  <div style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>{m.month}</div>
                  <div style={{ textAlign: "right", color: pos ? t.positive : t.negative, fontWeight: 600, fontVariantNumeric: "tabular-nums", fontSize: 13, minWidth: 90 }}>${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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
    </div>
  );
}
