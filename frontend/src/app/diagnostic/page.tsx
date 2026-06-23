"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { fetchDiagnosticQuestions, submitDiagnostic } from "@/lib/api";
import type { DiagnosticQuestion } from "@/lib/types";
import { PageShell } from "@/components/page-shell";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";

const optionKeys = ["A", "B", "C", "D"] as const;

export default function DiagnosticPage() {
  const router = useRouter();
  const { profile, refreshStudentStatus } = useAuth();
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const data = await fetchDiagnosticQuestions();
        setQuestions(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load diagnostic questions"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadQuestions();
  }, []);

  const answeredCount = useMemo(
    () => Object.keys(answers).length,
    [answers]
  );

  async function handleSubmit() {
    if (!profile) {
      return;
    }
    const studentId = profile.student_id;

    if (answeredCount !== questions.length) {
      setError("Please answer all questions before submitting the diagnostic.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = questions.map((question) => ({
        question_id: question.id,
        subtopic_id: question.subtopic_id,
        student_answer: answers[question.id]
      }));

      const response = await submitDiagnostic(studentId, payload);
      sessionStorage.setItem(
        "diagnosticResults",
        JSON.stringify(response.results)
      );
      await refreshStudentStatus();
      router.push("/diagnostic/results");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit the diagnostic"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <RequireAuth requireDiagnostic={false}>
      <PageShell
        title="Diagnostic Assessment"
        subtitle="40 questions, 4 per subtopic. Your score sets the starting difficulty level for each area."
      >
        <section className="summary-strip">
          <div className="summary-item">
            Answered {answeredCount} of {questions.length || 40}
          </div>
          <div className="summary-item">Levels: beginner, intermediate, advanced</div>
        </section>

        {error ? <div className="error-banner">{error}</div> : null}
        {loading ? <div className="panel">Loading diagnostic questions...</div> : null}

        {!loading ? (
          <section className="question-list">
            {questions.map((question, index) => (
              <article className="question-card" key={question.id}>
                <div className="question-meta">
                  Question {index + 1} · Subtopic {question.subtopic_id}
                </div>
                <h3>{question.question_text}</h3>
                <div className="options-grid">
                  {optionKeys.map((optionKey) => {
                    const optionText =
                      question[
                        `option_${optionKey.toLowerCase()}` as
                          | "option_a"
                          | "option_b"
                          | "option_c"
                          | "option_d"
                      ];

                    return (
                      <label className="option-label" key={optionKey}>
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          checked={answers[question.id] === optionKey}
                          onChange={() =>
                            setAnswers((current) => ({
                              ...current,
                              [question.id]: optionKey
                            }))
                          }
                        />
                        <span>
                          <strong>{optionKey}.</strong> {optionText}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </article>
            ))}
          </section>
        ) : null}

        <div className="button-row" style={{ marginTop: 20 }}>
          <button
            className="primary-button"
            onClick={() => void handleSubmit()}
            disabled={loading || submitting}
          >
            {submitting ? "Submitting..." : "Submit Diagnostic"}
          </button>
        </div>
      </PageShell>
    </RequireAuth>
  );
}
