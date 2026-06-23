"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchProgress, fetchStudyPlan } from "@/lib/api";
import type { ProgressRecord, StudyPlanItem } from "@/lib/types";
import { PageShell } from "@/components/page-shell";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";

function estimatedMinutes(level: string) {
  if (level === "advanced") {
    return 15;
  }
  if (level === "intermediate") {
    return 20;
  }
  return 25;
}

export default function QuizzesPage() {
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

    async function loadData() {
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
            : "Unable to load quizzes"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [profile]);

  const readyCount = progress.filter((entry) => entry.last_quiz_score >= 70).length;
  const trackedCount = progress.filter((entry) => entry.total_sessions > 0).length;

  return (
    <RequireAuth>
      <PageShell
        title="My Quizzes"
        subtitle="Prepare, launch, and review adaptive quiz sessions with EduFX attention tracking."
        actions={
          <Link
            href={plan[0] ? `/webcam-check?subtopicId=${plan[0].subtopic_id}` : "/dashboard"}
            className="primary-button"
          >
            Start Next Quiz
          </Link>
        }
      >
        {error ? <div className="error-banner">{error}</div> : null}
        {loading ? <div className="panel">Loading quiz workspace...</div> : null}

        {!loading ? (
          <>
            <section className="metrics-grid dashboard-metrics">
              <article className="metric-card">
                <div>
                  <div className="metric-label">Queued Quizzes</div>
                  <div className="metric-value">{plan.length}</div>
                  <p className="metric-note">Recommended for your current study cycle</p>
                </div>
                <div className="metric-dot blue" />
              </article>
              <article className="metric-card">
                <div>
                  <div className="metric-label">Ready Topics</div>
                  <div className="metric-value">{readyCount}</div>
                  <p className="metric-note">Topics scoring 70% or above recently</p>
                </div>
                <div className="metric-dot green" />
              </article>
              <article className="metric-card">
                <div>
                  <div className="metric-label">Tracked Sessions</div>
                  <div className="metric-value">{trackedCount}</div>
                  <p className="metric-note">Topics with recorded practice sessions</p>
                </div>
                <div className="metric-dot amber" />
              </article>
              <article className="metric-card">
                <div>
                  <div className="metric-label">Mode</div>
                  <div className="metric-value">Live</div>
                  <p className="metric-note">Camera preview and behaviour analytics available</p>
                </div>
                <div className="metric-dot purple" />
              </article>
            </section>

            <section className="dashboard-grid quizzes-layout">
              <div className="dashboard-column">
                <div className="section-row">
                  <h2>Available Quizzes</h2>
                  <span className="pill-tag">{plan.length} available</span>
                </div>

                {plan.length ? (
                  <div className="quiz-stack">
                    {plan.map((item) => (
                      <article className="quiz-preview-card quiz-launch-card" key={item.subtopic_id}>
                        <div className="quiz-preview-icon">
                          {item.type === "strong" ? "A" : "Q"}
                        </div>
                        <div className="quiz-preview-copy">
                          <h3>{item.subtopic_title}</h3>
                          <p>
                            {item.group_name} · {estimatedMinutes(item.current_level)} minutes ·
                            {" "}behaviour tracked
                          </p>
                        </div>
                        <div className="quiz-preview-side">
                          <div className="status-summary">
                            <span className="status-label">
                              {item.last_quiz_score > 0
                                ? `Last score ${item.last_quiz_score}%`
                                : "Not attempted yet"}
                            </span>
                            <span className={`status-pill ${item.is_overdue ? "warning" : "success"}`}>
                              {item.is_overdue ? "Priority" : "Ready"}
                            </span>
                          </div>
                          <div className="button-row">
                            <Link href={`/study/${item.subtopic_id}`} className="secondary-button">
                              Review
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
                    Complete more study sessions to let EduFX queue targeted quizzes.
                  </article>
                )}
              </div>

              <div className="dashboard-column dashboard-side">
                <article className="panel">
                  <h2>Before You Start</h2>
                  <div className="check-list compact-check-list">
                    {[
                      "Camera permissions granted",
                      "Single learner in frame",
                      "Good lighting available",
                      "Phone placed out of view"
                    ].map((item) => (
                      <div className="check-row compact" key={item}>
                        <span className="check-icon">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel">
                  <h2>Quiz Modes</h2>
                  <div className="mode-grid">
                    <div className="mode-card">
                      <strong>Tracked</strong>
                      <p className="metric-note">
                        Enables live webcam analytics and adds focus insights to your report.
                      </p>
                    </div>
                    <div className="mode-card">
                      <strong>Skip Tracking</strong>
                      <p className="metric-note">
                        Continue with the quiz only and still receive answer explanations.
                      </p>
                    </div>
                  </div>
                </article>
              </div>
            </section>
          </>
        ) : null}
      </PageShell>
    </RequireAuth>
  );
}
