"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchProgress, fetchStudyPlan } from "@/lib/api";
import type { ProgressRecord, StudyPlanItem } from "@/lib/types";
import { PageShell } from "@/components/page-shell";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function durationForLevel(level: string) {
  if (level === "advanced") {
    return "15 min";
  }
  if (level === "intermediate") {
    return "20 min";
  }
  return "25 min";
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [plan, setPlan] = useState<StudyPlanItem[]>([]);
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }
    const studentId = profile.student_id;

    async function loadPlan() {
      try {
        const [planData, progressData] = await Promise.all([
          fetchStudyPlan(studentId),
          fetchProgress(studentId)
        ]);
        setPlan(planData);
        setProgress(progressData.progress);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to fetch today's plan"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadPlan();
  }, [profile]);

  const firstName = profile?.name.split(" ")[0] ?? "there";
  const sessionsDone = progress.reduce(
    (total, entry) => total + entry.total_sessions,
    0
  );
  const studiedScores = progress
    .map((entry) => entry.last_quiz_score)
    .filter((score) => score > 0);
  const averageScore = average(studiedScores);
  const bestScore = studiedScores.length ? Math.max(...studiedScores) : 0;
  const alertItems = [
    ...plan
      .filter((item) => item.is_overdue)
      .map((item) => `Revision overdue for ${item.subtopic_title}`),
    ...progress
      .filter((entry) => entry.last_quiz_score > 0 && entry.last_quiz_score < 60)
      .map((entry) => `Low score detected in ${entry.subtopics.title}`)
  ].slice(0, 3);
  return (
    <RequireAuth>
      <PageShell
        title="Dashboard"
        subtitle={`Welcome back, ${firstName}. Here is your EduFX study overview for today.`}
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
        {loading ? <div className="panel">Calculating today's study plan...</div> : null}

        {!loading ? (
          <>
            <section className="metrics-grid dashboard-metrics">
              <article className="metric-card">
                <div>
                  <div className="metric-label">Sessions Done</div>
                  <div className="metric-value">{sessionsDone}</div>
                  <p className="metric-note">Completed across your tracked topics</p>
                </div>
                <div className="metric-dot blue" />
              </article>
              <article className="metric-card">
                <div>
                  <div className="metric-label">Avg Quiz Score</div>
                  <div className="metric-value">{averageScore}%</div>
                  <p className="metric-note">Average from completed quiz sessions</p>
                </div>
                <div className="metric-dot green" />
              </article>
              <article className="metric-card">
                <div>
                  <div className="metric-label">Quizzes Left</div>
                  <div className="metric-value">{plan.length}</div>
                  <p className="metric-note">Recommended by EduFX for today</p>
                </div>
                <div className="metric-dot amber" />
              </article>
              <article className="metric-card">
                <div>
                  <div className="metric-label">Best Score</div>
                  <div className="metric-value">{bestScore}%</div>
                  <p className="metric-note">Highest recent subtopic result</p>
                </div>
                <div className="metric-dot purple" />
              </article>
            </section>

            <section className="dashboard-grid">
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
                            {item.group_name} · {durationForLevel(item.current_level)} ·
                            {item.is_overdue ? " revision overdue" : " behaviour tracked"}
                          </p>
                        </div>
                        <div className="quiz-preview-side">
                          <div className="status-summary">
                            <span className="status-label">
                              {item.last_quiz_score > 0
                                ? `Last ${item.last_quiz_score}%`
                                : "New topic"}
                            </span>
                            <span
                              className={`status-pill ${
                                item.last_quiz_score >= 80 ? "success" : "warning"
                              }`}
                            >
                              {item.last_quiz_score >= 80 ? "Ready" : "Focus"}
                            </span>
                          </div>
                          <div className="button-row">
                            <Link
                              href={`/study/${item.subtopic_id}`}
                              className="secondary-button"
                            >
                              Study
                            </Link>
                            <Link
                              href={`/webcam-check?subtopicId=${item.subtopic_id}`}
                              className="primary-button"
                            >
                              Start
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <article className="panel empty-copy">
                    No study plan is available yet. Complete your diagnostic to unlock
                    today&apos;s recommendations.
                  </article>
                )}
              </div>

              <div className="dashboard-column dashboard-side">
                <article className="panel">
                  <div className="section-row">
                    <h2>Mastery Snapshot</h2>
                    <span className="metric-note">Latest scores</span>
                  </div>
                  <div className="mastery-stack">
                    {progress.slice(0, 4).map((entry) => (
                      <div className="mastery-row" key={entry.id}>
                        <div>
                          <strong>{entry.subtopics.title}</strong>
                          <p className="metric-note">{entry.current_level}</p>
                        </div>
                        <div className="mastery-bar">
                          <span
                            style={{ width: `${Math.max(entry.last_quiz_score, 8)}%` }}
                          />
                        </div>
                        <strong>{entry.last_quiz_score}%</strong>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel">
                  <h2>Webcam Ready</h2>
                  <p className="metric-note">
                    Behaviour tracking stays on-device and starts only when you
                    enable it for a quiz session.
                  </p>
                  <div className="summary-strip">
                    <span className="summary-item">Camera OK</span>
                    <span className="summary-item">Single person</span>
                    <span className="summary-item">Local processing</span>
                  </div>
                </article>

                <article className="panel">
                  <h2>Recent Alerts</h2>
                  {alertItems.length ? (
                    <div className="alert-list">
                      {alertItems.map((item) => (
                        <div className="alert-row" key={item}>
                          <span className="alert-icon">!</span>
                          <div>
                            <strong>{item}</strong>
                            <p className="metric-note">Review this area in your next session</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="metric-note">
                      No active alerts. Your current plan is balanced and ready.
                    </p>
                  )}
                </article>
              </div>
            </section>
          </>
        ) : null}
      </PageShell>
    </RequireAuth>
  );
}
