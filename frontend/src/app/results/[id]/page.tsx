"use client";

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
        const [sessionResults, behaviourSession] = await Promise.all([
          fetchSessionResults(sessionId, studentId),
          fetchBehaviourSession(sessionId)
        ]);
        setResults(sessionResults);
        setBehaviour(behaviourSession);
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

  return (
    <RequireAuth>
      <PageShell
        title="Session Results"
        subtitle="Review your score, level movement, focus summary, and AI explanations."
        actions={
          <Link href="/dashboard" className="primary-button">
            Back to Dashboard
          </Link>
        }
      >
        {error ? <div className="error-banner">{error}</div> : null}
        {loading ? <div className="panel">Loading results...</div> : null}

        {results ? (
          <>
            <section className="summary-strip">
              <div className="summary-item">Quiz score: {results.quiz_score}%</div>
              <div className="summary-item">
                Correct: {results.correct_answers}/{results.total_questions}
              </div>
              <div className="summary-item">
                Focus score: {results.focus_score ?? 0}%
              </div>
              <div className="summary-item">
                Webcam: {results.webcam_enabled ? "enabled" : "skipped"}
              </div>
            </section>

            {behaviour ? (
              <section className="metrics-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 20 }}>
                <article className="metric-card">
                  <div className="metric-label">Phone detected</div>
                  <div className="metric-value">{behaviour.phone_percent}%</div>
                </article>
                <article className="metric-card">
                  <div className="metric-label">Looking away</div>
                  <div className="metric-value">{behaviour.away_percent}%</div>
                </article>
                <article className="metric-card">
                  <div className="metric-label">Drowsy</div>
                  <div className="metric-value">{behaviour.drowsy_percent}%</div>
                </article>
                <article className="metric-card">
                  <div className="metric-label">Talking</div>
                  <div className="metric-value">{behaviour.talking_percent}%</div>
                </article>
                <article className="metric-card">
                  <div className="metric-label">Absent</div>
                  <div className="metric-value">{behaviour.absent_percent}%</div>
                </article>
              </section>
            ) : null}

            <section className="question-list">
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
                    <div className="panel" style={{ marginTop: 14 }}>
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
