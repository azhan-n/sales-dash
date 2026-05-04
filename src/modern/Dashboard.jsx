// Modern Overview — hero KPI + sparkline tiles + charts + recent activity
import React from "react";
import { Card, Btn, CardTypeBadge, fmtFull, fmtUSD, fmtDate, cardColors, useIcons } from "./ui";
import { TrendChart, Donut, Scatter, Histogram, Sparkline } from "./charts";
import { aggregateByMonth, aggregateByCardType, computeStats } from "./aggregations";
import { OwnerStatsPanel } from "./OwnerStatsPanel";

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

function StatTile({ theme: t, label, value, sub, spark, positive, icon }) {
  return (
    <Card theme={t} pad={16} style={{ borderTop: `3px solid ${t.accent}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
            {icon && <span style={{ color: t.accent, display: "flex", flexShrink: 0 }}>{icon(13)}</span>}
            <div style={{ fontSize: 11, fontWeight: t.fw?.label ?? 500, color: t.textMuted }}>{label}</div>
          </div>
          <div style={{ fontSize: "clamp(14px, 4cqi, 20px)", fontWeight: t.fw?.value ?? 600, color: t.text, letterSpacing: "-0.02em", marginTop: 2, fontVariantNumeric: "tabular-nums", lineHeight: 1.15, wordBreak: "break-all" }}>{value}</div>
          <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>{sub}</div>
        </div>
        {spark && <Sparkline values={spark} theme={t} positive={positive} w={70} h={30} />}
      </div>
    </Card>
  );
}

function DualStatTile({ theme: t, labelA, valueA, subA, labelB, valueB, subB }) {
  return (
    <Card theme={t} pad={16} style={{ borderTop: `3px solid ${t.accent}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: t.textMuted }}>{labelA}</div>
          <div style={{ fontSize: "clamp(13px, 3.5cqi, 18px)", fontWeight: 600, color: t.text, marginTop: 2, fontVariantNumeric: "tabular-nums", lineHeight: 1.2 }}>{valueA}</div>
          <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>{subA}</div>
        </div>
        <div style={{ width: 1, background: t.border, alignSelf: "stretch", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: t.textMuted }}>{labelB}</div>
          <div style={{ fontSize: "clamp(13px, 3.5cqi, 18px)", fontWeight: 600, color: t.text, marginTop: 2, fontVariantNumeric: "tabular-nums", lineHeight: 1.2 }}>{valueB}</div>
          <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>{subB}</div>
        </div>
      </div>
    </Card>
  );
}


export function ModernDashboard({ theme, transactions, monthly: monthlyProp, owners, ownerStats, getCard, getOwner, setRoute, chartStyle, isMobile }) {
  const t = theme;
  const I = useIcons();
  const stats = computeStats(transactions);
  const localMonthly = aggregateByMonth(transactions);

  // Build combined trend: Supabase monthly records (full history) + current-period computed months.
  // Current period wins on label collision so live data is always fresh.
  const trendMap = new Map((monthlyProp || []).map((m) => [m.month, { label: m.month, value: m.profit }]));
  localMonthly.forEach((m) => trendMap.set(m.label, { label: m.label, value: m.net }));
  const trendData = [...trendMap.values()];

  // Corrected MoM% using Supabase monthly as previous when current period has only 1 month.
  const lastSaved = (monthlyProp || [])[(monthlyProp || []).length - 1];
  const prevMonthNet = localMonthly.length >= 2
    ? localMonthly[localMonthly.length - 2].net
    : (lastSaved ? Number(lastSaved.profit) || 0 : 0);
  const thisMonthNet = localMonthly.length > 0 ? localMonthly[localMonthly.length - 1].net : 0;
  const momPct = prevMonthNet ? ((thisMonthNet - prevMonthNet) / Math.abs(prevMonthNet)) * 100 : 0;
  const cardTypeBreakdown = aggregateByCardType(transactions, getCard);
  const scatterData = transactions.slice(0, 80).map((tx) => {
    const card = getCard(tx.cardId);
    const cardType = card?.type ?? tx.cardType ?? "";
    return { x: Number(tx.buyRate) || 0, y: Number(tx.sellRate) || 0, color: cardColors[cardType] || t.accent };
  });
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
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.85 }}>Profit this month</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
              <div style={{ fontSize: isMobile ? "clamp(22px, 8vw, 30px)" : "clamp(28px, 3.5vw, 40px)", fontWeight: 600, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", lineHeight: 1.1, wordBreak: "break-all" }}>
                {fmtFull(thisMonthNet)}
              </div>
              <div style={{ fontSize: 14, opacity: 0.85 }}>MVR</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 12, opacity: 0.95, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 6px", background: "rgba(255,255,255,0.2)", borderRadius: 999 }}>
                {momPct >= 0 ? I.arrowUp(11) : I.arrowDown(11)} {Math.abs(momPct).toFixed(1)}%
              </span>
              <span>vs previous month ({fmtFull(prevMonthNet)} MVR)</span>
            </div>
            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.18)" }}>
              <HeroStat label="Gross" value={fmtFull(stats.totalGross)} suffix="MVR" />
              <HeroStat label="Cost" value={fmtFull(stats.totalCost)} suffix="MVR" />
              <HeroStat label="Margin" value={stats.avgMargin.toFixed(1) + "%"} />
            </div>
          </div>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: isMobile ? 8 : 12 }}>
          <StatTile theme={t} label="Transactions" value={transactions.length.toString()} sub="current period" spark={localMonthly.map((m) => m.count)} positive icon={I.list} />
          <StatTile theme={t} label="USDT Sold" value={fmtUSD(stats.totalSellAmount)} sub="Total sell volume" positive icon={I.dollar} />
          <StatTile theme={t} label="USD Used" value={fmtUSD(stats.totalBuyAmount)} sub="Total buy volume" positive icon={I.dollar} />
          <StatTile theme={t} label="Avg profit / tx" value={fmtFull(stats.avgNetProfit)} sub="Per transaction" spark={localMonthly.map((m) => m.count ? m.net / m.count : 0)} positive={stats.avgNetProfit >= 0} icon={I.trending} />
          <StatTile theme={t} label="Best month" value={fmtFull(stats.bestMonth.net)} sub={stats.bestMonth.label} spark={localMonthly.map((m) => m.net)} positive icon={I.calendar} />
          <DualStatTile theme={t} labelA="Avg sell rate" valueA={stats.avgSellRate.toFixed(2)} subA="MVR / USD" labelB="Avg buy rate" valueB={stats.avgBuyRate.toFixed(2)} subB="MVR / USD" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 3fr) minmax(0, 2fr)", gap: isMobile ? 12 : 16 }}>
        <Card theme={t} pad={isMobile ? 14 : 20}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, gap: 8, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 3, height: 14, borderRadius: 2, background: t.accent, flexShrink: 0 }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Net profit trend</div>
              </div>
              <div style={{ fontSize: 11, color: t.textMuted }}>Monthly</div>
            </div>
          </div>
          <TrendChart data={trendData} theme={t} mode={chartStyle} height={isMobile ? 180 : 240} />
        </Card>

        <Card theme={t} pad={isMobile ? 14 : 20}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 3, height: 14, borderRadius: 2, background: t.accent, flexShrink: 0 }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Cards by volume</div>
            </div>
            <div style={{ fontSize: 11, color: t.textMuted }}>Share of sell amount (USD)</div>
          </div>
          <Donut data={cardTypeBreakdown} theme={t} size={isMobile ? 160 : 180} thickness={24} />
        </Card>
      </div>

      <Card theme={t} pad={isMobile ? 14 : 20}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 3, height: 14, borderRadius: 2, background: t.accent, flexShrink: 0 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Rate dispersion</div>
          </div>
          <div style={{ fontSize: 11, color: t.textMuted }}>Each dot = one transaction</div>
        </div>
        <Scatter data={scatterData} theme={t} height={isMobile ? 160 : 200} xLabel="Buy rate (MVR/USD)" yLabel="Sell rate" />
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1.6fr)", gap: isMobile ? 12 : 16 }}>
        <Card theme={t} pad={isMobile ? 14 : 20}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 3, height: 14, borderRadius: 2, background: t.accent, flexShrink: 0 }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Margin distribution</div>
            </div>
            <div style={{ fontSize: 11, color: t.textMuted }}>Across all transactions</div>
          </div>
          <Histogram data={margins} theme={t} height={isMobile ? 140 : 180} />
        </Card>
        <Card theme={t} pad={0} style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: isMobile ? "14px 16px" : "16px 20px", borderBottom: `1px solid ${t.border}` }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 3, height: 14, borderRadius: 2, background: t.accent, flexShrink: 0 }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Recent activity</div>
              </div>
              <div style={{ fontSize: 11, color: t.textMuted }}>Latest 5 transactions</div>
            </div>
            <Btn theme={t} variant="ghost" size="sm" onClick={() => setRoute("transactions")}>View all →</Btn>
          </div>
          <div>
            {recent.map((tx) => {
              const card = getCard(tx.cardId);
              const owner = getOwner(tx.ownerId);
              const cardType  = card?.type   ?? tx.cardType   ?? "";
              const cardNum   = card?.number ?? tx.cardNumber ?? "";
              const ownerName = owner?.name  ?? tx.owner      ?? "";
              const pos = (Number(tx.netProfit) || 0) >= 0;
              if (isMobile) {
                return (
                  <div key={tx.id} style={{ padding: "12px 16px", borderTop: `1px solid ${t.border}`, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                        <CardTypeBadge type={cardType} theme={t} />
                        <span style={{ color: t.textSec, fontSize: 11, fontVariantNumeric: "tabular-nums" }}>••{cardNum}</span>
                      </div>
                      <div style={{ color: pos ? t.positive : t.negative, fontWeight: 600, fontVariantNumeric: "tabular-nums", fontSize: 13, whiteSpace: "nowrap" }}>{pos ? "+" : ""}{fmtFull(tx.netProfit)}</div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: t.textMuted }}>
                      <span>{ownerName} · {fmtDate(tx.date)}</span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmtUSD(tx.sellAmount)}</span>
                    </div>
                  </div>
                );
              }
              return (
                <div key={tx.id} style={{ display: "grid", gridTemplateColumns: "70px 1fr 120px 100px", alignItems: "center", gap: 12, padding: "12px 20px", borderTop: `1px solid ${t.border}`, fontSize: 12 }}>
                  <div style={{ color: t.textMuted, fontVariantNumeric: "tabular-nums" }}>{fmtDate(tx.date)}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <CardTypeBadge type={cardType} theme={t} />
                    <span style={{ color: t.textSec, fontVariantNumeric: "tabular-nums" }}>••{cardNum}</span>
                    <span style={{ color: t.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>· {ownerName}</span>
                  </div>
                  <div style={{ color: t.textSec, fontVariantNumeric: "tabular-nums", textAlign: "right" }}>{fmtUSD(tx.sellAmount)}</div>
                  <div style={{ color: pos ? t.positive : t.negative, fontWeight: 600, fontVariantNumeric: "tabular-nums", textAlign: "right" }}>{pos ? "+" : ""}{fmtFull(tx.netProfit)}</div>
                </div>
              );
            })}
            {recent.length === 0 && (
              <div style={{ padding: 32, textAlign: "center", color: t.textMuted, fontSize: 12 }}>No transactions yet.</div>
            )}
          </div>
        </Card>
      </div>

      <OwnerStatsPanel theme={t} ownerStats={ownerStats} owners={owners} transactions={transactions} getCard={getCard} isMobile={isMobile} />
    </div>
  );
}
