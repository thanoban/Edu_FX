"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchProgress } from "@/lib/api";
import type { ProgressRecord } from "@/lib/types";
import { PageShell } from "@/components/page-shell";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";

export default function ProgressPage() {
  const { profile } = useAuth();
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }
    const studentId = profile.student_id;

    async function loadProgress() {
      try {
        const response = await fetchProgress(studentId);
        setProgress(response.progress);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load progress"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProgress();
  }, [profile]);

  return (
    <RequireAuth>
      <PageShell
        title="Progress"
        subtitle="Track mastery, revision momentum, and quiz performance across every EduFX chemistry topic."
      >
        {error ? <div className="error-banner">{error}</div> : null}
        {loading ? <div className="panel">Loading progress...</div> : null}

        {!loading ? (
          <>
            <section className="metrics-grid dashboard-metrics diagnostic-metrics">
              <article className="metric-card">
                <div>
                  <div className="metric-label">Tracked Topics</div>
                  <div className="metric-value">{progress.length}</div>
                  <p className="metric-note">Subtopics currently in your plan</p>
                </div>
                <div className="metric-dot blue" />
              </article>
              <article className="metric-card">
                <div>
                  <div className="metric-label">Average Score</div>
                  <div className="metric-value">
                    {progress.length
                      ? Math.round(
                          progress.reduce(
                            (sum, entry) => sum + entry.last_quiz_score,
                            0
                          ) / progress.length
                        )
                      : 0}
                    %
                  </div>
                  <p className="metric-note">Based on latest quiz attempts</p>
                </div>
                <div className="metric-dot green" />
              </article>
              <article className="metric-card">
                <div>
                  <div className="metric-label">Sessions Logged</div>
                  <div className="metric-value">
                    {progress.reduce((sum, entry) => sum + entry.total_sessions, 0)}
                  </div>
                  <p className="metric-note">Total learning sessions recorded</p>
                </div>
                <div className="metric-dot amber" />
              </article>
            </section>

            <section className="progress-grid progress-card-grid">
              {progress.map((entry) => (
                <article className="result-card progress-card" key={entry.id}>
                  <div className="section-row">
                    <div className="badge">{entry.subtopics.group_name}</div>
                    <span
                      className={`status-pill ${
                        entry.current_level === "advanced"
                          ? "success"
                          : entry.current_level === "intermediate"
                            ? "warning"
                            : ""
                      }`}
                    >
                      {entry.current_level}
                    </span>
                  </div>
                  <h3>{entry.subtopics.title}</h3>
                  <div className="mastery-row progress-inline-row">
                    <span className="metric-note">Mastery</span>
                    <div className="mastery-bar">
                      <span style={{ width: `${Math.max(entry.last_quiz_score, 8)}%` }} />
                    </div>
                    <strong>{entry.last_quiz_score}%</strong>
                  </div>
                  <div className="progress-meta-grid">
                    <div>
                      <span className="metric-note">Sessions</span>
                      <strong>{entry.total_sessions}</strong>
                    </div>
                    <div>
                      <span className="metric-note">Last studied</span>
                      <strong>{entry.last_studied_date ?? "Not yet"}</strong>
                    </div>
                  </div>
                  <div className="button-row">
                    <Link href={`/study/${entry.subtopic_id}`} className="secondary-button">
                      Review Notes
                    </Link>
                    <Link
                      href={`/webcam-check?subtopicId=${entry.subtopic_id}`}
                      className="primary-button"
                    >
                      Start Quiz
                    </Link>
                  </div>
                </article>
              ))}
            </section>

            {!progress.length ? (
              <article className="panel empty-copy">
                Your progress overview will appear here after you complete the
                diagnostic and begin studying.
              </article>
            ) : null}
          </>
        ) : null}
      </PageShell>
    </RequireAuth>
  );
}
