"use client";

type LoadingStateProps = {
  title?: string;
  detail?: string;
};

export function LoadingState({
  title = "Loading…",
  detail = "Preparing your study session",
}: LoadingStateProps) {
  return (
    <div className="loading-panel">
      <div className="pulse-dot" />
      <div>
        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9375rem", color: "var(--text)" }}>
          {title}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: "0.8125rem", color: "var(--muted)" }}>
          {detail}
        </p>
      </div>
    </div>
  );
}

/* Skeleton building blocks for inline loading states */
export function SkeletonCard({ height = 120 }: { height?: number }) {
  return (
    <div
      className="skeleton"
      style={{ height, borderRadius: "var(--r-lg)", border: "1px solid var(--line)" }}
    />
  );
}

export function SkeletonMetrics() {
  return (
    <section className="metrics-grid dashboard-metrics">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="metric-card"
          style={{ gap: 10 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="skeleton skeleton-line narrow" />
            <div className="skeleton" style={{ width: 38, height: 38, borderRadius: "var(--r-md)", flexShrink: 0 }} />
          </div>
          <div className="skeleton" style={{ width: 72, height: 36, borderRadius: 8 }} />
          <div className="skeleton skeleton-line medium" />
        </div>
      ))}
    </section>
  );
}
