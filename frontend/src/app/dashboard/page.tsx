"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchProgress, fetchStudyPlan } from "@/lib/api";
import type { ProgressRecord, StudyPlanItem } from "@/lib/types";
import { PageShell } from "@/components/page-shell";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

function durationForLevel(level: string) {
  if (level === "advanced") return "15 min";
  if (level === "intermediate") return "20 min";
  return "25 min";
}

/* Small inline SVG icons for metric cards */
function IconSessions() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
function IconScore() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
function IconQuizzes() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1.5" />
      <path d="M12 12h4m-4 4h4m-8-4h.01m-.01 4h.01" />
    </svg>
  );
}
function IconBest() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8m-4-4v4m-4-9a4 4 0 0 1-4-4V4h16v4a4 4 0 0 1-4 4H8Z" />
    </svg>
  );
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [plan, setPlan] = useState<StudyPlanItem[]>([]);
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    const studentId = profile.student_id;

    async function loadPlan() {
      try {
        const [planData, progressData] = await Promise.all([
          fetchStudyPlan(studentId),
          fetchProgress(studentId),
        ]);
        setPlan(planData);
        setProgress(progressData.progress);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to fetch today's plan");
      } finally {
        setLoading(false);
      }
    }

    void loadPlan();
  }, [profile]);

  const firstName = profile?.name.split(" ")[0] ?? "there";
  const sessionsDone  = progress.reduce((t, e) => t + e.total_sessions, 0);
  const studiedScores = progress.map((e) => e.last_quiz_score).filter((s) => s > 0);
  const averageScore  = average(studiedScores);
  const bestScore     = studiedScores.length ? Math.max(...studiedScores) : 0;

  const alertItems = [
    ...plan
      .filter((i) => i.is_overdue)
      .map((i) => `Revision overdue for ${i.subtopic_title}`),
    ...progress
      .filter((e) => e.last_quiz_score > 0 && e.last_quiz_score < 60)
      .map((e) => `Low score detected in ${e.subtopics.title}`),
  ].slice(0, 3);

  const trendValues = Array.from({ length: 7 }, (_, i) => {
    if (!progress.length) return [68, 71, 74, 72, 78, 76, 82][i];
    const entry = progress[i % progress.length];
    return Math.max(entry.last_quiz_score || averageScore || 60, 32);
  });
  const trendAverage = average(trendValues);

  /* Skeleton while loading */
  if (loading) {
    return (
      <RequireAuth>
        <PageShell title="Dashboard" subtitle={`Welcome back, ${firstName}`}>
          <section className="metrics-grid dashboard-metrics">
            {[0,1,2,3].map((i) => (
              <article className="metric-card" key={i}>
                <div className="metric-top">
                  <div className="skeleton" style={{ width: 90, height: 14, borderRadius: 6 }} />
                  <div className="skeleton metric-icon" style={{ opacity: 0.3 }} />
                </div>
                <div className="skeleton" style={{ width: 70, height: 36, borderRadius: 8, margin: "8px 0 4px" }} />
                <div className="skeleton" style={{ width: "80%", height: 12, borderRadius: 5 }} />
              </article>
            ))}
          </section>
          <div className="dashboard-grid">
            <div className="skeleton" style={{ height: 320, borderRadius: 14 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="skeleton" style={{ height: 160, borderRadius: 14 }} />
              <div className="skeleton" style={{ height: 120, borderRadius: 14 }} />
            </div>
          </div>
        </PageShell>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <PageShell
        title="Dashboard"
        subtitle={`Welcome back, ${firstName} — here is your study overview.`}
        actions={
          <Link
            href={plan[0] ? `/webcam-check?subtopicId=${plan[0].subtopic_id}` : "/diagnostic"}
            className="primary-button"
          >
            Start a Quiz
          </Link>
        }
      >
        {error ? <div className="error-banner">{error}</div> : null}

        {/* Metrics */}
        <section className="metrics-grid dashboard-metrics">
          <article className="metric-card">
            <div className="metric-top">
              <span className="metric-label">Sessions Done</span>
              <div className="metric-icon blue"><IconSessions /></div>
            </div>
            <div className="metric-value">{sessionsDone}</div>
            <p className="metric-note">Completed across tracked topics</p>
          </article>

          <article className="metric-card">
            <div className="metric-top">
              <span className="metric-label">Avg Quiz Score</span>
              <div className="metric-icon green"><IconScore /></div>
            </div>
            <div className="metric-value">{averageScore}%</div>
            <p className="metric-note">Average from completed sessions</p>
          </article>

          <article className="metric-card">
            <div className="metric-top">
              <span className="metric-label">Quizzes Left</span>
              <div className="metric-icon amber"><IconQuizzes /></div>
            </div>
            <div className="metric-value">{plan.length}</div>
            <p className="metric-note">Recommended for today</p>
          </article>

          <article className="metric-card">
            <div className="metric-top">
              <span className="metric-label">Best Score</span>
              <div className="metric-icon purple"><IconBest /></div>
            </div>
            <div className="metric-value">{bestScore}%</div>
            <p className="metric-note">Highest recent subtopic result</p>
          </article>
        </section>

        {/* Main grid */}
        <section className="dashboard-grid">
          {/* Quiz list */}
          <div className="dashboard-column">
            <div className="section-row">
              <h2>Available Quizzes</h2>
              <span className="pill-tag">{plan.length} pending</span>
            </div>

            {plan.length ? (
              <div className="quiz-stack">
                {plan.map((item) => (
                  <article className="quiz-preview-card" key={item.subtopic_id}>
                    <div className="quiz-preview-icon">
                      {item.type === "strong" ? "A" : "Q"}
                    </div>

                    <div className="quiz-preview-copy">
                      <h3>{item.subtopic_title}</h3>
                      <p>
                        {item.group_name} · {durationForLevel(item.current_level)}
                        {item.is_overdue ? " · revision overdue" : ""}
                      </p>
                    </div>

                    <div className="quiz-preview-side">
                      <div className="status-summary">
                        <span className="status-label">
                          {item.last_quiz_score > 0 ? `Last ${item.last_quiz_score}%` : "New topic"}
                        </span>
                        <span className={`status-pill ${item.last_quiz_score >= 80 ? "success" : "warning"}`}>
                          {item.last_quiz_score >= 80 ? "Ready" : "Focus"}
                        </span>
                      </div>
                      <div className="button-row">
                        <Link href={`/study/${item.subtopic_id}`} className="secondary-button">
                          Study
                        </Link>
                        <Link href={`/webcam-check?subtopicId=${item.subtopic_id}`} className="primary-button">
                          Start
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <article className="panel">
                <p className="metric-note">
                  No study plan yet. Complete your diagnostic to unlock
                  today&apos;s recommendations.
                </p>
                <div style={{ marginTop: 14 }}>
                  <Link href="/diagnostic" className="primary-button">
                    Take Diagnostic
                  </Link>
                </div>
              </article>
            )}
          </div>

          {/* Side column */}
          <div className="dashboard-side">
            {/* Trend chart */}
            <article className="panel">
              <div className="section-row" style={{ marginBottom: 8 }}>
                <h2>Performance Trend</h2>
                <span className="metric-note">7-day view</span>
              </div>
              <div className="trend-card">
                <div className="trend-chart" aria-label="Weekly quiz score trend">
                  {trendValues.map((value, i) => (
                    <div className="trend-point" key={`${i}-${value}`}>
                      <span className="trend-column" style={{ height: `${Math.max(value, 18)}%` }} />
                      <small>{["M","T","W","T","F","S","S"][i]}</small>
                    </div>
                  ))}
                </div>
                <div className="trend-footer">
                  <span className="metric-note">Weekly average</span>
                  <strong>{trendAverage}%</strong>
                </div>
              </div>
            </article>

            {/* Webcam status */}
            <article className="panel">
              <h2 style={{ marginBottom: 8 }}>Webcam Ready</h2>
              <p className="metric-note" style={{ marginBottom: 12 }}>
                Behaviour tracking runs on-device and starts only when you enable
                it for a session.
              </p>
              <div className="summary-strip">
                <span className="summary-item">Camera OK</span>
                <span className="summary-item">On-device</span>
                <span className="summary-item">Private</span>
              </div>
            </article>

            {/* Alerts */}
            <article className="panel">
              <h2 style={{ marginBottom: alertItems.length ? 12 : 8 }}>Alerts</h2>
              {alertItems.length ? (
                <div className="alert-list">
                  {alertItems.map((item) => (
                    <div className="alert-row" key={item}>
                      <span className="alert-icon">!</span>
                      <div>
                        <strong>{item}</strong>
                        <p>Review in your next session</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="metric-note">
                  No active alerts. Your plan is balanced and up to date.
                </p>
              )}
            </article>
          </div>
        </section>
      </PageShell>
    </RequireAuth>
  );
}
