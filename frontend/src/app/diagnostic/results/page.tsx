"use client";

import { useMemo } from "react";
import Link from "next/link";

import type { DiagnosticResult } from "@/lib/types";
import { PageShell } from "@/components/page-shell";
import { RequireAuth } from "@/components/require-auth";

export default function DiagnosticResultsPage() {
  const results = useMemo<DiagnosticResult[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const stored = sessionStorage.getItem("diagnosticResults");
    return stored ? (JSON.parse(stored) as DiagnosticResult[]) : [];
  }, []);

  return (
    <RequireAuth requireDiagnostic={false}>
      <PageShell
        title="Diagnostic Results"
        subtitle="EduFX has mapped a starting difficulty for each subtopic based on your diagnostic performance."
        actions={
          <Link href="/dashboard" className="primary-button">
            Start Learning
          </Link>
        }
      >
        {results.length ? (
          <section className="metrics-grid dashboard-metrics diagnostic-metrics">
            <article className="metric-card">
              <div>
                <div className="metric-label">Subtopics Rated</div>
                <div className="metric-value">{results.length}</div>
                <p className="metric-note">Every area now has an initial level</p>
              </div>
              <div className="metric-dot blue" />
            </article>
            <article className="metric-card">
              <div>
                <div className="metric-label">Average Score</div>
                <div className="metric-value">
                  {Math.round(
                    results.reduce((sum, result) => sum + result.score_percent, 0) /
                      results.length
                  )}
                  %
                </div>
                <p className="metric-note">Across your full diagnostic set</p>
              </div>
              <div className="metric-dot green" />
            </article>
            <article className="metric-card">
              <div>
                <div className="metric-label">Strongest Level</div>
                <div className="metric-value">
                  {results.some((result) => result.assigned_level === "advanced")
                    ? "Adv"
                    : "Int"}
                </div>
                <p className="metric-note">Highest assigned starting tier</p>
              </div>
              <div className="metric-dot purple" />
            </article>
          </section>
        ) : null}

        <section className="progress-grid">
          {results.map((result) => (
            <article className="result-card" key={result.subtopic_id}>
              <div className="badge">Subtopic {result.subtopic_id}</div>
              <h3>{result.subtopic_title}</h3>
              <div className="result-stat-row">
                <span className="metric-note">Score</span>
                <strong>{result.score_percent}%</strong>
              </div>
              <div className="result-stat-row">
                <span className="metric-note">Assigned level</span>
                <span className={`status-pill ${result.assigned_level === "advanced" ? "success" : result.assigned_level === "intermediate" ? "warning" : ""}`}>
                  {result.assigned_level}
                </span>
              </div>
            </article>
          ))}
        </section>

        {results.length === 0 ? (
          <div className="panel empty-copy">
            No local diagnostic result snapshot was found. You can continue to
            the dashboard and the stored levels will still be used.
          </div>
        ) : null}
      </PageShell>
    </RequireAuth>
  );
}
