"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { fetchProgress } from "@/lib/api";
import type { DiagnosticResult } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { PageShell } from "@/components/page-shell";
import { RequireAuth } from "@/components/require-auth";

function fallbackScore(level: DiagnosticResult["assigned_level"], score: number) {
  if (score > 0) {
    return score;
  }

  if (level === "advanced") {
    return 85;
  }

  if (level === "intermediate") {
    return 70;
  }

  return 55;
}

export default function DiagnosticResultsPage() {
  const { profile } = useAuth();
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("diagnosticResults");
      if (stored) {
        setResults(JSON.parse(stored) as DiagnosticResult[]);
        setLoading(false);
        return;
      }
    }

    if (!profile) {
      return;
    }
    const studentId = profile.student_id;

    async function hydrateFromProgress() {
      try {
        const response = await fetchProgress(studentId);
        const derived = response.progress.map((entry) => ({
          subtopic_id: entry.subtopic_id,
          subtopic_title: entry.subtopics.title,
          assigned_level: entry.current_level as DiagnosticResult["assigned_level"],
          score_percent: fallbackScore(
            entry.current_level as DiagnosticResult["assigned_level"],
            entry.last_quiz_score
          )
        }));
        setResults(derived);
      } finally {
        setLoading(false);
      }
    }

    void hydrateFromProgress();
  }, [profile]);

  const strongestLevel = useMemo(() => {
    if (results.some((result) => result.assigned_level === "advanced")) {
      return "Adv";
    }

    if (results.some((result) => result.assigned_level === "intermediate")) {
      return "Int";
    }

    return "Beg";
  }, [results]);

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
        {loading ? <div className="panel">Loading your starting levels...</div> : null}

        {results.length ? (
          <>
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
                  <div className="metric-value">{strongestLevel}</div>
                  <p className="metric-note">Highest assigned starting tier</p>
                </div>
                <div className="metric-dot purple" />
              </article>
            </section>

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
                    <span
                      className={`status-pill ${
                        result.assigned_level === "advanced"
                          ? "success"
                          : result.assigned_level === "intermediate"
                            ? "warning"
                            : ""
                      }`}
                    >
                      {result.assigned_level}
                    </span>
                  </div>
                </article>
              ))}
            </section>
          </>
        ) : null}

        {!loading && results.length === 0 ? (
          <div className="panel empty-copy">
            No diagnostic result snapshot is available yet. Complete your first
            diagnostic to generate adaptive starting levels for every topic.
          </div>
        ) : null}
      </PageShell>
    </RequireAuth>
  );
}
