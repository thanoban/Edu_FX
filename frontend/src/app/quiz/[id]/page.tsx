"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import {
  fetchQuiz,
  submitBehaviourSnapshot,
  submitBehaviourSummary,
  submitQuiz
} from "@/lib/api";
import type { QuizPayload } from "@/lib/types";
import {
  BrowserBehaviourTracker,
  type TrackerRealtimeState
} from "@/lib/webcam/analytics";
import { LoadingState } from "@/components/loading-state";
import { PageShell } from "@/components/page-shell";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";

const optionKeys = ["A", "B", "C", "D"] as const;

function QuizPageContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useAuth();
  const [quiz, setQuiz] = useState<QuizPayload | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackerState, setTrackerState] = useState<TrackerRealtimeState | null>(
    null
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const trackerRef = useRef<BrowserBehaviourTracker | null>(null);
  const snapshotTimerRef = useRef<number | null>(null);

  const subtopicId = useMemo(() => Number(params.id), [params.id]);
  const webcamEnabled = searchParams.get("webcam") === "1";

  useEffect(() => {
    if (!profile || Number.isNaN(subtopicId)) {
      return;
    }
    const studentId = profile.student_id;

    async function loadQuiz() {
      try {
        const data = await fetchQuiz(subtopicId, studentId);
        setQuiz(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load quiz"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadQuiz();
  }, [profile, subtopicId]);

  useEffect(() => {
    if (!webcamEnabled || !quiz || !profile || !videoRef.current) {
      return;
    }
    const studentId = profile.student_id;
    const sessionId = quiz.session_id;

    let active = true;

    async function startTracking() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false
        });
        mediaStreamRef.current = stream;

        if (!videoRef.current || !active) {
          return;
        }

        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const tracker = new BrowserBehaviourTracker();
        trackerRef.current = tracker;
        await tracker.start(
          videoRef.current,
          studentId,
          sessionId,
          setTrackerState
        );

        snapshotTimerRef.current = window.setInterval(() => {
          const currentTracker = trackerRef.current;
          if (!currentTracker) {
            return;
          }

          const snapshot = currentTracker.takeSnapshot();
          void submitBehaviourSnapshot(snapshot).catch(() => undefined);
        }, 30_000);
      } catch (trackingError) {
        setError(
          trackingError instanceof Error
            ? trackingError.message
            : "Unable to start webcam tracking"
        );
      }
    }

    void startTracking();

    return () => {
      active = false;
      if (snapshotTimerRef.current) {
        window.clearInterval(snapshotTimerRef.current);
      }
      trackerRef.current?.stop();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [profile, quiz, webcamEnabled]);

  async function handleSubmit() {
    if (!profile || !quiz) {
      return;
    }
    const studentId = profile.student_id;

    if (Object.keys(answers).length !== quiz.questions.length) {
      setError("Please answer all quiz questions before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (webcamEnabled && trackerRef.current) {
        const finalSnapshot = trackerRef.current.takeSnapshot();
        await submitBehaviourSnapshot(finalSnapshot);

        const summary = trackerRef.current.buildSummary(
          subtopicId,
          webcamEnabled
        );
        await submitBehaviourSummary(summary);
      }

      await submitQuiz(
        studentId,
        quiz.session_id,
        subtopicId,
        webcamEnabled,
        quiz.questions.map((question) => ({
          question_id: question.id,
          student_answer: answers[question.id]
        }))
      );

      router.push(`/results/${quiz.session_id}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit quiz"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <RequireAuth>
      <PageShell
        title={quiz?.subtopic_title ?? "Quiz"}
        subtitle={
          quiz
            ? `Stage: ${quiz.stage}. Answer all ${quiz.total_questions} questions.`
            : "Loading quiz..."
        }
      >
        {error ? <div className="error-banner">{error}</div> : null}
        {loading ? <div className="panel">Preparing quiz...</div> : null}

        {webcamEnabled ? (
          <section className="tracker-grid" style={{ marginBottom: 20 }}>
            <div className="panel">
              <video ref={videoRef} className="video-frame" muted playsInline />
            </div>
            <div className="panel">
              <h3>Live behaviour tracking</h3>
              <div className="status-row">
                <span className="status-chip">
                  Face: {trackerState?.faceDetected ? "detected" : "not detected"}
                </span>
                <span
                  className={`status-chip ${
                    trackerState?.phoneDetected ? "alert" : ""
                  }`}
                >
                  Phone: {trackerState?.phoneDetected ? "detected" : "clear"}
                </span>
                <span
                  className={`status-chip ${
                    trackerState?.lookingAway ? "alert" : ""
                  }`}
                >
                  Looking away: {trackerState?.lookingAway ? "yes" : "no"}
                </span>
                <span
                  className={`status-chip ${trackerState?.drowsy ? "alert" : ""}`}
                >
                  Drowsy: {trackerState?.drowsy ? "yes" : "no"}
                </span>
                <span
                  className={`status-chip ${trackerState?.talking ? "alert" : ""}`}
                >
                  Talking: {trackerState?.talking ? "yes" : "no"}
                </span>
              </div>
              <p>
                Current focus score: <strong>{trackerState?.focusScore ?? 100}</strong>
              </p>
              {trackerState?.warning ? (
                <div className="error-banner">{trackerState.warning}</div>
              ) : null}
            </div>
          </section>
        ) : null}

        {quiz ? (
          <section className="question-list">
            {quiz.questions.map((question, index) => (
              <article className="question-card" key={question.id}>
                <div className="question-meta">
                  Question {index + 1} of {quiz.total_questions}
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
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        </div>
      </PageShell>
    </RequireAuth>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<LoadingState detail="Preparing quiz route..." />}>
      <QuizPageContent />
    </Suspense>
  );
}
