// Pure aggregation helpers shared across modern views.
import { parseDate } from "../utils";

export function aggregateByMonth(txs) {
  const map = new Map();
  txs.forEach((tx) => {
    const d = parseDate(tx.date);
    if (!d) return;
    const key = d.getFullYear() + "-" + d.getMonth();
    if (!map.has(key)) map.set(key, {
      key, date: new Date(d.getFullYear(), d.getMonth(), 1),
      label: d.toLocaleDateString("en-US", { month: "short" }),
      gross: 0, cost: 0, net: 0, count: 0, sellRates: [],
    });
    const m = map.get(key);
    m.gross += Number(tx.grossProfit) || 0;
    m.cost += Number(tx.cost) || 0;
    m.net += Number(tx.netProfit) || 0;
    m.count++;
    m.sellRates.push(Number(tx.sellRate) || 0);
  });
  const arr = [...map.values()].sort((a, b) => a.date - b.date);
  arr.forEach((m) => { m.avgSellRate = m.sellRates.length ? m.sellRates.reduce((s, v) => s + v, 0) / m.sellRates.length : 0; });
  return arr;
}

export function aggregateByCardType(txs, getCard) {
  const map = new Map();
  txs.forEach((tx) => {
    const type = getCard(tx.cardId)?.type || "UNKNOWN";
    if (!map.has(type)) map.set(type, { label: type, value: 0 });
    map.get(type).value += Number(tx.sellAmount) || 0;
  });
  return [...map.values()].sort((a, b) => b.value - a.value);
}

export function computeStats(txs) {
  if (!txs.length) return {
    totalNet: 0, totalGross: 0, totalCost: 0, avgMargin: 0, momPct: 0, avgSellRate: 0,
    thisMonthNet: 0, prevMonthNet: 0, thisMonthCount: 0, bestMonth: { label: "—", net: 0 }, trendPct: 0,
  };
  const totalNet = txs.reduce((s, t) => s + (Number(t.netProfit) || 0), 0);
  const totalGross = txs.reduce((s, t) => s + (Number(t.grossProfit) || 0), 0);
  const totalCost = txs.reduce((s, t) => s + (Number(t.cost) || 0), 0);
  const totalSellAmount = txs.reduce((s, t) => s + (Number(t.sellAmount) || 0), 0);
  const totalBuyAmount = txs.reduce((s, t) => s + (Number(t.buyAmount) || 0), 0);
  const avgMargin = txs.reduce((s, t) => s + (Number(t.profitMargin) || 0), 0) / txs.length;
  const avgSellRate = txs.reduce((s, t) => s + (Number(t.sellRate) || 0), 0) / txs.length;
  const avgNetProfit = totalNet / txs.length;
  const avgBuyRate = totalSellAmount > 0 ? totalCost / totalSellAmount : 0;

  const monthly = aggregateByMonth(txs);
  const last = monthly[monthly.length - 1] || { net: 0, count: 0, label: "—" };
  const prev = monthly[monthly.length - 2] || { net: 0 };
  const momPct = prev.net ? ((last.net - prev.net) / Math.abs(prev.net)) * 100 : 0;
  const bestMonth = monthly.reduce((a, b) => (b.net > a.net ? b : a), { net: -Infinity, label: "—" });
  const half = Math.floor(monthly.length / 2);
  const firstHalf = monthly.slice(0, half).reduce((s, m) => s + m.net, 0);
  const secondHalf = monthly.slice(half).reduce((s, m) => s + m.net, 0);
  const trendPct = firstHalf ? ((secondHalf - firstHalf) / Math.abs(firstHalf)) * 100 : 0;
  return {
    totalNet, totalGross, totalCost, totalSellAmount, totalBuyAmount,
    avgMargin, avgSellRate, avgNetProfit, avgBuyRate, momPct,
    thisMonthNet: last.net, prevMonthNet: prev.net, thisMonthCount: last.count,
    bestMonth, trendPct,
  };
}
