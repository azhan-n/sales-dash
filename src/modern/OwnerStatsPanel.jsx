// Per-owner breakdown panel for Modern Overview.
// Donut by net profit + per-owner cards with expandable recent transactions.
import React, { useState } from "react";
import { Card, CardTypeBadge, fmtFull, fmtUSD, fmtDate, useIcons } from "./ui";
import { Donut } from "./charts";

function ownerInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function OwnerStatsPanel({ theme, ownerStats, owners, transactions, getCard, isMobile }) {
  const t = theme;
  const I = useIcons();
  const [expandedId, setExpandedId] = useState(null);

  const rows = (owners || [])
    .map((o) => ({ owner: o, stats: ownerStats?.[o.id] || { count: 0, totalCost: 0, totalGrossProfit: 0, totalNetProfit: 0 } }))
    .filter((r) => r.stats.count > 0)
    .sort((a, b) => b.stats.totalNetProfit - a.stats.totalNetProfit);

  const donutData = rows.map((r, i) => ({ label: r.owner.name, value: Math.max(r.stats.totalNetProfit, 0) }));

  if (rows.length === 0) return null;

  return (
    <Card theme={t} pad={0} style={{ overflow: "hidden" }}>
      <div style={{ padding: isMobile ? "14px 16px" : "16px 20px", borderBottom: `1px solid ${t.border}` }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Per-owner breakdown</div>
        <div style={{ fontSize: 11, color: t.textMuted }}>Net profit share + recent activity</div>
      </div>

      {!isMobile && rows.length > 1 && (
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${t.border}` }}>
          <Donut data={donutData} theme={t} size={160} thickness={22} />
        </div>
      )}

      <div>
        {rows.map((r) => {
          const expanded = expandedId === r.owner.id;
          const recent = transactions
            .filter((tx) => tx.ownerId === r.owner.id)
            .slice(0, 5);
          const pos = r.stats.totalNetProfit >= 0;
          return (
            <div key={r.owner.id} style={{ borderTop: `1px solid ${t.border}` }}>
              <button
                onClick={() => setExpandedId(expanded ? null : r.owner.id)}
                style={{
                  width: "100%",
                  display: "grid",
                  gridTemplateColumns: isMobile ? "auto 1fr auto" : "auto 1fr repeat(3, minmax(0, 100px)) auto",
                  alignItems: "center",
                  gap: 12,
                  padding: isMobile ? "12px 16px" : "14px 20px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  color: t.text,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = t.surfaceAlt)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: t.surfaceDeep, color: t.textSec,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 600, flexShrink: 0,
                }}>{ownerInitials(r.owner.name)}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.owner.name}</div>
                  <div style={{ fontSize: 11, color: t.textMuted }}>{r.stats.count} transactions</div>
                </div>
                {!isMobile && (
                  <>
                    <Stat label="Cost" value={fmtFull(r.stats.totalCost)} t={t} />
                    <Stat label="Gross" value={fmtFull(r.stats.totalGrossProfit)} t={t} />
                    <Stat label="Net" value={(pos ? "+" : "") + fmtFull(r.stats.totalNetProfit)} t={t} color={pos ? t.positive : t.negative} />
                  </>
                )}
                {isMobile && (
                  <div style={{ textAlign: "right", color: pos ? t.positive : t.negative, fontWeight: 600, fontVariantNumeric: "tabular-nums", fontSize: 13, whiteSpace: "nowrap" }}>{pos ? "+" : ""}{fmtFull(r.stats.totalNetProfit)}</div>
                )}
                <span style={{ display: "flex", color: t.textMuted, transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.15s" }}>{I.chevron(14)}</span>
              </button>
              {expanded && (
                <div style={{ background: t.surfaceAlt, borderTop: `1px solid ${t.border}` }}>
                  {recent.length === 0 && (
                    <div style={{ padding: "16px 20px", fontSize: 12, color: t.textMuted }}>No transactions for this owner.</div>
                  )}
                  {recent.map((tx) => {
                    const card = getCard(tx.cardId);
                    const cardType = card?.type   ?? tx.cardType   ?? "";
                    const cardNum  = card?.number ?? tx.cardNumber ?? "";
                    const txPos = (Number(tx.netProfit) || 0) >= 0;
                    return (
                      <div key={tx.id} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr auto" : "70px 1fr 100px 100px", gap: 10, alignItems: "center", padding: isMobile ? "10px 16px 10px 56px" : "10px 20px 10px 64px", borderTop: `1px dashed ${t.border}`, fontSize: 12 }}>
                        {!isMobile && <div style={{ color: t.textMuted, fontVariantNumeric: "tabular-nums" }}>{fmtDate(tx.date)}</div>}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                          <CardTypeBadge type={cardType} theme={t} />
                          <span style={{ color: t.textSec, fontVariantNumeric: "tabular-nums" }}>••{cardNum}</span>
                          {isMobile && <span style={{ color: t.textMuted, fontSize: 11, marginLeft: "auto" }}>{fmtDate(tx.date)}</span>}
                        </div>
                        {!isMobile && <div style={{ textAlign: "right", color: t.textSec, fontVariantNumeric: "tabular-nums" }}>{fmtUSD(tx.sellAmount)}</div>}
                        <div style={{ textAlign: "right", color: txPos ? t.positive : t.negative, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{txPos ? "+" : ""}{fmtFull(tx.netProfit)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Stat({ label, value, t, color }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: color || t.text, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
}
