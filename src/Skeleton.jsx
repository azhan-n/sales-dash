// =============================================
// Skeleton.jsx — Loading skeleton components
// =============================================
import React from "react";

function SkeletonBox({ width = "100%", height = "1rem", borderRadius = "0.375rem", style = {} }) {
  return (
    <div
      className="skeleton-shimmer"
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: "var(--sk-base, rgba(128,128,128,0.12))",
        backgroundImage: "linear-gradient(90deg, transparent 0%, var(--sk-shine, rgba(255,255,255,0.15)) 50%, transparent 100%)",
        backgroundSize: "200% 100%",
        animation: "skeletonShimmer 1.5s infinite linear",
        ...style,
      }}
    />
  );
}

export function StatCardsSkeleton({ count = 8, isMobile, isCompact }) {
  const cols = isMobile ? "1fr" : (isCompact ? "repeat(2, 1fr)" : "repeat(4, 1fr)");
  return (
    <div style={{ display: "grid", gridTemplateColumns: cols, gap: isMobile ? "0.625rem" : (isCompact ? "0.75rem" : "1.5rem"), marginBottom: isCompact ? "1rem" : "2rem" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ padding: isCompact ? "0.875rem" : "2rem", borderRadius: "0.75rem", backgroundColor: "rgba(128,128,128,0.08)", border: "1px solid rgba(128,128,128,0.1)" }}>
          <SkeletonBox height="0.75rem" width="55%" style={{ marginBottom: "0.75rem" }} />
          <SkeletonBox height="2.25rem" width="70%" style={{ marginBottom: "0.5rem" }} />
          <SkeletonBox height="0.625rem" width="45%" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ isMobile, isCompact, c }) {
  const chartH = isMobile ? 180 : (isCompact ? 220 : 300);
  return (
    <div style={{ backgroundColor: c?.surface || "#fff", borderRadius: "0.75rem", padding: isCompact ? "1rem" : "2rem", border: `1px solid ${c?.border || "#e2e8f0"}`, marginBottom: isCompact ? "1rem" : "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <SkeletonBox height="1.25rem" width="160px" />
        <SkeletonBox height="2rem" width="100px" borderRadius="999px" />
      </div>
      <div style={{ height: `${chartH}px`, display: "flex", alignItems: "flex-end", gap: "8px", paddingLeft: "3rem" }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem" }}>
            <SkeletonBox
              height={`${Math.random() * 60 + 30}%`}
              borderRadius="4px 4px 0 0"
              style={{ width: "100%", maxWidth: "48px" }}
            />
            <SkeletonBox height="0.625rem" width="80%" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6, isCompact, c }) {
  return (
    <div style={{ backgroundColor: c?.surface || "#fff", borderRadius: "0.75rem", padding: isCompact ? "1rem" : "2rem", border: `1px solid ${c?.border || "#e2e8f0"}` }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Date", "Card Type", "Card No.", "Owner", "Buy Rate", "Buy Amt", "Sell Rate", "Sell Amt", "Cost", "Gross", "Net", "Margin"].map((h) => (
                <th key={h} style={{ padding: isCompact ? "0.5rem 0.625rem" : "0.75rem 1rem", textAlign: "left", borderBottom: `1px solid ${c?.border || "#e2e8f0"}` }}>
                  <SkeletonBox height="0.625rem" width="60px" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 12 }).map((__, j) => (
                  <td key={j} style={{ padding: isCompact ? "0.375rem 0.625rem" : "0.75rem 1rem", borderBottom: `1px solid ${c?.border || "#e2e8f0"}` }}>
                    <SkeletonBox height="0.75rem" width={j < 4 ? "80px" : "50px"} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const SKELETON_CSS = `
  @keyframes skeletonShimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
  }
`;
