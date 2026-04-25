// Modern Overview — hero KPI + sparkline tiles + charts + recent activity
import React from "react";
import { Card, Btn, CardTypeBadge, I, fmtCompact, fmtUSD, fmtDate, cardColors } from "./ui";
import { TrendChart, Donut, Scatter, Histogram, Sparkline, StackedBars } from "./charts";
import { aggregateByMonth, aggregateByCardType, computeStats } from "./aggregations";

function HeroStat({ label, value, suffix }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 4 }}>
        <span style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{value}</span>
        {suffix && <span style={{ fontSize: 10, opacity: 0.75 }}>{suffix}</span>}
      </div>
    </div>
  );
}

function StatTile({ theme: t, label, value, sub, spark, positive }) {
  return (
    <Card theme={t} pad={16}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: t.textMuted }}>{label}</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: t.text, letterSpacing: "-0.02em", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{value}</div>
          <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>{sub}</div>
        </div>
        {spark && <Sparkline values={spark} theme={t} positive={positive} w={70} h={30} />}
      </div>
    </Card>
  );
}

function LegendDot({ color, label, t }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: t.textSec, fontSize: 11 }}>
    <span style={{ width: 10, height: 10, borderRadius: 2, background: color }} />{label}
  </span>;
}

export function ModernDashboard({ theme, transactions, getCard, getOwner, setRoute, chartStyle, isMobile }) {
  const t = theme;
  const stats = computeStats(transactions);
  const monthly = aggregateByMonth(transactions);
  const trendData = monthly.map((m) => ({ label: m.label, value: m.net }));
  const profitCostData = monthly.map((m) => ({ label: m.label, gross: m.gross, cost: m.cost, net: m.net }));
  const cardTypeBreakdown = aggregateByCardType(transactions, getCard);
  const scatterData = transactions.slice(0, 80).map((tx) => ({
    x: Number(tx.buyRate) || 0, y: Number(tx.sellRate) || 0,
    color: cardColors[getCard(tx.cardId)?.type] || t.accent,
  }));
  const margins = transactions.map((tx) => Number(tx.profitMargin) || 0);
  const recent = transactions.slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 16 : 24 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Overview</div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 28, fontWeight: 600, letterSpacing: "-0.02em", color: t.text }}>Welcome back.</h1>
          <div style={{ fontSize: 13, color: t.textSec, marginTop: 4 }}>Here's how your book looks.</div>
        </div>
        {!isMobile && (
          <div style={{ display: "flex", gap: 8 }}>
            <Btn theme={t} size="sm">{I.filter(13)} Last 12 months</Btn>
            <Btn theme={t} size="sm">{I.download(13)} Export</Btn>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 2fr) minmax(0, 3fr)", gap: isMobile ? 12 : 16 }}>
        <Card theme={t} pad={isMobile ? 16 : 20} style={{
          background: `linear-gradient(135deg, ${t.accent}, ${t.chartB})`,
          border: "none", color: "#fff",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(400px 200px at 100% 0%, rgba(255,255,255,0.25), transparent 60%)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.85 }}>All-time net profit</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
              <div style={{ fontSize: isMobile ? 34 : 44, fontWeight: 600, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
                {fmtCompact(stats.totalNet)}
              </div>
              <div style={{ fontSize: 14, opacity: 0.85 }}>MVR</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 12, opacity: 0.95, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 6px", background: "rgba(255,255,255,0.2)", borderRadius: 999 }}>
                {stats.momPct >= 0 ? I.arrowUp(11) : I.arrowDown(11)} {Math.abs(stats.momPct).toFixed(1)}%
              </span>
              <span>vs previous month ({fmtCompact(stats.prevMonthNet)} MVR)</span>
            </div>
            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.18)" }}>
              <HeroStat label="Gross profit" value={fmtCompact(stats.totalGross)} suffix="MVR" />
              <HeroStat label="Cost basis" value={fmtCompact(stats.totalCost)} suffix="MVR" />
              <HeroStat label="Margin" value={stats.avgMargin.toFixed(1) + "%"} />
            </div>
          </div>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: isMobile ? 8 : 12 }}>
          <StatTile theme={t} label="Transactions" value={transactions.length.toString()} sub="12-month window" spark={monthly.map((m) => m.count)} positive />
          <StatTile theme={t} label="Avg. sell rate" value={stats.avgSellRate.toFixed(2)} sub="MVR / USD" spark={monthly.map((m) => m.avgSellRate)} positive />
          <StatTile theme={t} label="This month" value={fmtCompact(stats.thisMonthNet)} sub={`${stats.thisMonthCount} transactions`} spark={monthly.slice(-6).map((m) => m.net)} positive={stats.thisMonthNet >= 0} />
          <StatTile theme={t} label="Best month" value={fmtCompact(stats.bestMonth.net)} sub={stats.bestMonth.label} spark={monthly.map((m) => m.net)} positive />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 3fr) minmax(0, 2fr)", gap: isMobile ? 12 : 16 }}>
        <Card theme={t} pad={isMobile ? 14 : 20}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, gap: 8, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Net profit trend</div>
              <div style={{ fontSize: 11, color: t.textMuted }}>Monthly</div>
            </div>
          </div>
          <TrendChart data={trendData} theme={t} mode={chartStyle} height={isMobile ? 180 : 240} />
        </Card>

        <Card theme={t} pad={isMobile ? 14 : 20}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Cards by volume</div>
            <div style={{ fontSize: 11, color: t.textMuted }}>Share of sell amount (USD)</div>
          </div>
          <Donut data={cardTypeBreakdown} theme={t} size={isMobile ? 160 : 180} thickness={24} />
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)", gap: isMobile ? 12 : 16 }}>
        <Card theme={t} pad={isMobile ? 14 : 20}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Gross vs cost</div>
            <div style={{ fontSize: 11, color: t.textMuted }}>Stacked monthly flows</div>
          </div>
          <StackedBars data={profitCostData} theme={t} height={isMobile ? 160 : 200} />
          <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 11, flexWrap: "wrap" }}>
            <LegendDot color={t.accent} label="Gross" t={t} />
            <LegendDot color={t.textMuted} label="Cost" t={t} />
            <LegendDot color={t.positive} label="Net" t={t} />
          </div>
        </Card>
        <Card theme={t} pad={isMobile ? 14 : 20}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Rate dispersion</div>
            <div style={{ fontSize: 11, color: t.textMuted }}>Each dot = one transaction</div>
          </div>
          <Scatter data={scatterData} theme={t} height={isMobile ? 160 : 200} xLabel="Buy rate (MVR/USD)" yLabel="Sell rate" />
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1.6fr)", gap: isMobile ? 12 : 16 }}>
        <Card theme={t} pad={isMobile ? 14 : 20}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Margin distribution</div>
            <div style={{ fontSize: 11, color: t.textMuted }}>Across all transactions</div>
          </div>
          <Histogram data={margins} theme={t} height={isMobile ? 140 : 180} />
        </Card>
        <Card theme={t} pad={0} style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: isMobile ? "14px 16px" : "16px 20px", borderBottom: `1px solid ${t.border}` }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Recent activity</div>
              <div style={{ fontSize: 11, color: t.textMuted }}>Latest 5 transactions</div>
            </div>
            <Btn theme={t} variant="ghost" size="sm" onClick={() => setRoute("transactions")}>View all →</Btn>
          </div>
          <div>
            {recent.map((tx) => {
              const card = getCard(tx.cardId);
              const owner = getOwner(tx.ownerId);
              const pos = (Number(tx.netProfit) || 0) >= 0;
              if (isMobile) {
                return (
                  <div key={tx.id} style={{ padding: "12px 16px", borderTop: `1px solid ${t.border}`, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                        <CardTypeBadge type={card?.type} theme={t} />
                        <span style={{ color: t.textSec, fontSize: 11, fontVariantNumeric: "tabular-nums" }}>••{card?.number}</span>
                      </div>
                      <div style={{ color: pos ? t.positive : t.negative, fontWeight: 600, fontVariantNumeric: "tabular-nums", fontSize: 13, whiteSpace: "nowrap" }}>{pos ? "+" : ""}{fmtCompact(tx.netProfit)}</div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: t.textMuted }}>
                      <span>{owner?.name} · {fmtDate(tx.date)}</span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmtUSD(tx.sellAmount)}</span>
                    </div>
                  </div>
                );
              }
              return (
                <div key={tx.id} style={{ display: "grid", gridTemplateColumns: "70px 1fr 120px 100px", alignItems: "center", gap: 12, padding: "12px 20px", borderTop: `1px solid ${t.border}`, fontSize: 12 }}>
                  <div style={{ color: t.textMuted, fontVariantNumeric: "tabular-nums" }}>{fmtDate(tx.date)}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <CardTypeBadge type={card?.type} theme={t} />
                    <span style={{ color: t.textSec, fontVariantNumeric: "tabular-nums" }}>••{card?.number}</span>
                    <span style={{ color: t.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>· {owner?.name}</span>
                  </div>
                  <div style={{ color: t.textSec, fontVariantNumeric: "tabular-nums", textAlign: "right" }}>{fmtUSD(tx.sellAmount)}</div>
                  <div style={{ color: pos ? t.positive : t.negative, fontWeight: 600, fontVariantNumeric: "tabular-nums", textAlign: "right" }}>{pos ? "+" : ""}{fmtCompact(tx.netProfit)}</div>
                </div>
              );
            })}
            {recent.length === 0 && (
              <div style={{ padding: 32, textAlign: "center", color: t.textMuted, fontSize: 12 }}>No transactions yet.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
