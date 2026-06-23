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
        subtitle="Each subtopic now has its own starting level based on your diagnostic performance."
        actions={
          <Link href="/dashboard" className="primary-button">
            Start Learning
          </Link>
        }
      >
        <section className="progress-grid">
          {results.map((result) => (
            <article className="result-card" key={result.subtopic_id}>
              <div className="badge">Subtopic {result.subtopic_id}</div>
              <h3>{result.subtopic_title}</h3>
              <p>Score: {result.score_percent}%</p>
              <p>Assigned level: {result.assigned_level}</p>
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
