"use client";

import { Fragment } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  fetchBehaviourSession,
  fetchExplanations,
  fetchSessionResults
} from "@/lib/api";
import type { BehaviourSession, SessionResults } from "@/lib/types";
import { PageShell } from "@/components/page-shell";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";

function buildImprovementTip(results: SessionResults, behaviour: BehaviourSession | null) {
  const distractors = [
    {
      label: "Phone usage",
      value: behaviour?.phone_percent ?? results.phone_percent,
      advice: "Keep your phone out of view to avoid unnecessary attention shifts."
    },
    {
      label: "Drowsiness",
      value: behaviour?.drowsy_percent ?? results.drowsy_percent,
      advice: "Take a short break and reset before your next quiz session."
    },
    {
      label: "Looking away",
      value: behaviour?.away_percent ?? results.away_percent,
      advice: "Try a distraction-free space to keep your eyes on the task."
    },
    {
      label: "Talking",
      value: behaviour?.talking_percent ?? results.talking_percent,
      advice: "Aim for a quieter environment during assessments."
    },
    {
      label: "Absence",
      value: behaviour?.absent_percent ?? results.absent_percent,
      advice: "Stay within frame for a complete session focus profile."
    }
  ].sort((left, right) => right.value - left.value);

  if (!distractors[0] || distractors[0].value === 0) {
    return "Excellent focus profile. Keep the same study conditions for your next session.";
  }

  return `${distractors[0].label} was your strongest distraction signal at ${distractors[0].value}%. ${distractors[0].advice}`;
}

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [results, setResults] = useState<SessionResults | null>(null);
  const [behaviour, setBehaviour] = useState<BehaviourSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionId = useMemo(() => Number(params.id), [params.id]);

  useEffect(() => {
    if (!profile || Number.isNaN(sessionId)) {
      return;
    }
    const studentId = profile.student_id;

    async function loadResults() {
      try {
        await fetchExplanations(sessionId, studentId);
        const sessionResults = await fetchSessionResults(sessionId, studentId);
        setResults(sessionResults);

        if (sessionResults.webcam_enabled) {
          try {
            const behaviourSession = await fetchBehaviourSession(sessionId);
            setBehaviour(behaviourSession);
          } catch {
            setBehaviour(null);
          }
        } else {
          setBehaviour(null);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load results"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadResults();
  }, [profile, sessionId]);

  const snapshotRows = useMemo(
    () =>
      behaviour?.snapshots
        ?.slice(-5)
        .map((snapshot) => ({
          ...snapshot,
          displayTime: new Date(snapshot.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })
        })) ?? [],
    [behaviour]
  );
  const improvementTip = results ? buildImprovementTip(results, behaviour) : "";

  return (
    <RequireAuth>
      <PageShell
        title="Session Complete"
        subtitle={
          results
            ? `${results.total_questions} questions completed · Session #${results.id}`
            : "Review your score, focus summary, and explanations."
        }
        actions={
          <>
            <Link href="/progress" className="secondary-button">
              View Progress
            </Link>
            <Link href="/dashboard" className="primary-button">
              Back to Dashboard
            </Link>
          </>
        }
      >
        {error ? <div className="error-banner">{error}</div> : null}
        {loading ? <div className="panel">Loading results...</div> : null}

        {results ? (
          <>
            <section className="metrics-grid dashboard-metrics">
              <article className="metric-card">
                <div className="focus-ring small">
                  <div className="focus-ring-inner">
                    <strong>{results.quiz_score}%</strong>
                  </div>
                </div>
                <div>
                  <div className="metric-label">Quiz Score</div>
                  <p className="metric-note">
                    {results.correct_answers} of {results.total_questions} correct
                  </p>
                </div>
              </article>
              <article className="metric-card">
                <div className="focus-ring small blue-ring">
                  <div className="focus-ring-inner">
                    <strong>{results.focus_score ?? 0}%</strong>
                  </div>
                </div>
                <div>
                  <div className="metric-label">Focus Score</div>
                  <p className="metric-note">
                    {snapshotRows.length || 0} snapshots recorded
                  </p>
                </div>
              </article>
              <article className="metric-card">
                <div>
                  <div className="metric-value accent-text">
                    {results.correct_answers}/{results.total_questions}
                  </div>
                  <div className="metric-label">Answer Accuracy</div>
                  <p className="metric-note">Quiz completion summary</p>
                </div>
              </article>
              <article className="metric-card">
                <div>
                  <div className="metric-value accent-orange">
                    {results.webcam_enabled ? "On" : "Off"}
                  </div>
                  <div className="metric-label">Tracking Mode</div>
                  <p className="metric-note">
                    {results.webcam_enabled
                      ? "Behaviour tracking enabled"
                      : "Quiz completed without webcam"}
                  </p>
                </div>
              </article>
            </section>

            <section className="results-grid">
              <article className="panel breakdown-card">
                <h2>Behaviour Breakdown</h2>
                <div className="breakdown-list">
                  {[
                    ["Phone detected", behaviour?.phone_percent ?? results.phone_percent, "red"],
                    ["Drowsy", behaviour?.drowsy_percent ?? results.drowsy_percent, "orange"],
                    ["Looking away", behaviour?.away_percent ?? results.away_percent, "purple"],
                    ["Talking", behaviour?.talking_percent ?? results.talking_percent, "blue"],
                    ["Absent", behaviour?.absent_percent ?? results.absent_percent, "slate"]
                  ].map(([label, value, tone]) => (
                    <div className="breakdown-row" key={String(label)}>
                      <div className="section-row">
                        <strong>{label}</strong>
                        <span>{value}%</span>
                      </div>
                      <div className="breakdown-bar">
                        <span
                          className={String(tone)}
                          style={{ width: `${Math.max(Number(value), 4)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="panel insight-panel">
                  <strong>Improvement tip</strong>
                  <p>{improvementTip}</p>
                </div>
              </article>

              <article className="panel timeline-card">
                <div className="section-row">
                  <h2>Snapshot Timeline</h2>
                  <span className="pill-tag">{snapshotRows.length} snapshots</span>
                </div>

                {snapshotRows.length ? (
                  <div className="timeline-grid">
                    <div className="timeline-head">Time</div>
                    <div className="timeline-head">Focus</div>
                    <div className="timeline-head">Phone</div>
                    <div className="timeline-head">Drowsy</div>
                    <div className="timeline-head">Away</div>
                    <div className="timeline-head">Absent</div>

                    {snapshotRows.map((snapshot) => (
                      <Fragment key={snapshot.id}>
                        <div className="timeline-cell">{snapshot.displayTime}</div>
                        <div className="timeline-cell focus-cell">
                          {snapshot.focus_score}
                        </div>
                        <div className="timeline-cell">
                          <span
                            className={`timeline-pill ${
                              snapshot.phone_detected ? "negative" : "positive"
                            }`}
                          >
                            {snapshot.phone_detected ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="timeline-cell">
                          <span
                            className={`timeline-pill ${
                              snapshot.drowsy ? "negative" : "positive"
                            }`}
                          >
                            {snapshot.drowsy ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="timeline-cell">
                          <span
                            className={`timeline-pill ${
                              snapshot.looking_away ? "negative" : "positive"
                            }`}
                          >
                            {snapshot.looking_away ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="timeline-cell">
                          <span
                            className={`timeline-pill ${
                              snapshot.absent ? "negative" : "positive"
                            }`}
                          >
                            {snapshot.absent ? "Yes" : "No"}
                          </span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                ) : (
                  <p className="metric-note">
                    No behaviour snapshots were recorded for this session.
                  </p>
                )}
              </article>
            </section>

            <section className="question-list explanation-list">
              {results.attempts.map((attempt, index) => (
                <article className="question-card" key={attempt.id}>
                  <div className="question-meta">
                    Question {index + 1} · {attempt.is_correct ? "Correct" : "Incorrect"}
                  </div>
                  <h3>{attempt.questions.question_text}</h3>
                  <p>
                    Your answer: <strong>{attempt.student_answer}</strong> · Correct
                    answer: <strong>{attempt.correct_answer}</strong>
                  </p>
                  {!attempt.is_correct ? (
                    <div className="panel insight-panel" style={{ marginTop: 14 }}>
                      <strong>AI explanation</strong>
                      <p>{attempt.explanation ?? "Generating explanation..."}</p>
                    </div>
                  ) : null}
                </article>
              ))}
            </section>
          </>
        ) : null}
      </PageShell>
    </RequireAuth>
  );
}
