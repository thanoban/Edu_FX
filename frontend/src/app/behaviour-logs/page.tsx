"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchBehaviourHistory } from "@/lib/api";
import type { BehaviourHistoryItem } from "@/lib/types";
import { PageShell } from "@/components/page-shell";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";

function strongestFlag(session: BehaviourHistoryItem) {
  const items = [
    { label: "Phone", value: session.phone_percent },
    { label: "Drowsy", value: session.drowsy_percent },
    { label: "Away", value: session.away_percent },
    { label: "Talking", value: session.talking_percent },
    { label: "Absent", value: session.absent_percent }
  ].sort((left, right) => right.value - left.value);

  return items[0];
}

export default function BehaviourLogsPage() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<BehaviourHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }
    const studentId = profile.student_id;

    async function loadData() {
      try {
        const response = await fetchBehaviourHistory(studentId);
        setSessions(response.sessions);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load behaviour logs"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [profile]);

  const trackedSessions = sessions.filter((session) => session.webcam_enabled);
  const avgFocus = trackedSessions.length
    ? Math.round(
        trackedSessions.reduce(
          (sum, session) => sum + (session.focus_score ?? 0),
          0
        ) / trackedSessions.length
      )
    : 0;

  return (
    <RequireAuth>
      <PageShell
        title="Behaviour Logs"
        subtitle="Review focus trends, distraction signals, and tracked quiz sessions across your EduFX history."
        actions={
          <Link href="/progress" className="secondary-button">
            View Progress
          </Link>
        }
      >
        {error ? <div className="error-banner">{error}</div> : null}
        {loading ? <div className="panel">Loading behaviour history...</div> : null}

        {!loading ? (
          <>
            <section className="metrics-grid dashboard-metrics">
              <article className="metric-card">
                <div>
                  <div className="metric-label">Tracked Sessions</div>
                  <div className="metric-value">{trackedSessions.length}</div>
                  <p className="metric-note">Sessions with webcam behaviour capture</p>
                </div>
                <div className="metric-dot blue" />
              </article>
              <article className="metric-card">
                <div>
                  <div className="metric-label">Average Focus</div>
                  <div className="metric-value">{avgFocus}%</div>
                  <p className="metric-note">Across all tracked sessions</p>
                </div>
                <div className="metric-dot green" />
              </article>
              <article className="metric-card">
                <div>
                  <div className="metric-label">Reports</div>
                  <div className="metric-value">{sessions.length}</div>
                  <p className="metric-note">Session summaries available to review</p>
                </div>
                <div className="metric-dot amber" />
              </article>
              <article className="metric-card">
                <div>
                  <div className="metric-label">Mode</div>
                  <div className="metric-value">Local</div>
                  <p className="metric-note">Video stays on-device during tracking</p>
                </div>
                <div className="metric-dot purple" />
              </article>
            </section>

            <section className="logs-list">
              {sessions.map((session) => {
                const strongest = strongestFlag(session);

                return (
                  <article className="panel log-card" key={session.id}>
                    <div className="section-row">
                      <div>
                        <h2>{session.subtopics?.title ?? `Session #${session.id}`}</h2>
                        <p className="metric-note">
                          {session.subtopics?.group_name ?? "General"} ·{" "}
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="button-row">
                        <span className={`status-pill ${session.webcam_enabled ? "success" : "warning"}`}>
                          {session.webcam_enabled ? "Tracked" : "Skipped"}
                        </span>
                        <Link href={`/results/${session.id}`} className="secondary-button">
                          Open Report
                        </Link>
                      </div>
                    </div>

                    <div className="log-stats-grid">
                      <div className="summary-item">Quiz {session.quiz_score ?? 0}%</div>
                      <div className="summary-item">Focus {session.focus_score ?? 0}%</div>
                      <div className="summary-item">
                        Strongest flag: {strongest.label} {strongest.value}%
                      </div>
                    </div>

                    <div className="mini-breakdown-grid">
                      {[
                        ["Phone", session.phone_percent],
                        ["Drowsy", session.drowsy_percent],
                        ["Away", session.away_percent],
                        ["Talking", session.talking_percent],
                        ["Absent", session.absent_percent]
                      ].map(([label, value]) => (
                        <div className="mini-breakdown-card" key={String(label)}>
                          <span className="metric-note">{label}</span>
                          <strong>{value}%</strong>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}

              {!sessions.length ? (
                <article className="panel empty-copy">
                  No behaviour sessions have been recorded yet. Start a tracked quiz to
                  generate your first log.
                </article>
              ) : null}
            </section>
          </>
        ) : null}
      </PageShell>
    </RequireAuth>
  );
}
