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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timeExpired, setTimeExpired] = useState(false);
  const [trackerState, setTrackerState] = useState<TrackerRealtimeState | null>(
    null
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const trackerRef = useRef<BrowserBehaviourTracker | null>(null);
  const snapshotTimerRef = useRef<number | null>(null);

  const subtopicId = useMemo(() => Number(params.id), [params.id]);
  const webcamEnabled = searchParams.get("webcam") === "1";
  const currentQuestion = quiz?.questions[currentIndex] ?? null;
  const allAnswered =
    quiz !== null && Object.keys(answers).length === quiz.questions.length;

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
    if (!quiz) {
      return;
    }

    setTimeRemaining(quiz.total_questions * 150);
  }, [quiz]);

  useEffect(() => {
    if (!timeRemaining || submitting) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeRemaining((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [submitting, timeRemaining]);

  useEffect(() => {
    if (!quiz || submitting || loading || timeRemaining !== 0 || timeExpired) {
      return;
    }

    setTimeExpired(true);
    setError("Time is up. EduFX is submitting your current answers now.");
    void handleSubmit(true);
  }, [loading, quiz, submitting, timeExpired, timeRemaining]);

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

  async function handleSubmit(forceSubmit = false) {
    if (!profile || !quiz) {
      return;
    }
    const studentId = profile.student_id;

    if (!forceSubmit && Object.keys(answers).length !== quiz.questions.length) {
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
          student_answer: answers[question.id] ?? ""
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

  const minutes = String(Math.floor(timeRemaining / 60)).padStart(2, "0");
  const seconds = String(timeRemaining % 60).padStart(2, "0");
  const focusScore = trackerState?.focusScore ?? 100;
  const answeredCount = Object.keys(answers).length;
  const monitorItems = [
    ["Face Detected", trackerState?.faceDetected ?? webcamEnabled, "clear"],
    ["Looking Away", trackerState?.lookingAway ?? false, "warning"],
    ["Phone Detected", trackerState?.phoneDetected ?? false, "warning"],
    ["Drowsy", trackerState?.drowsy ?? false, "warning"],
    ["Talking", trackerState?.talking ?? false, "warning"],
    ["Absent", trackerState?.absent ?? false, "warning"]
  ] as const;

  return (
    <RequireAuth>
      <PageShell
        title={quiz?.subtopic_title ?? "Quiz"}
        subtitle={
          quiz
            ? `Stage: ${quiz.stage}. Answer all ${quiz.total_questions} questions.`
            : "Loading quiz..."
        }
        actions={
          <div className="timer-chip">
            <strong>
              {minutes}:{seconds}
            </strong>
            <span>remaining</span>
          </div>
        }
      >
        {error ? <div className="error-banner">{error}</div> : null}
        {loading ? <div className="panel">Preparing quiz...</div> : null}

        {webcamEnabled ? (
          <div className="quiz-ribbon">
            <span>Behaviour Tracking Active</span>
            <span>Face: {trackerState?.faceDetected ? "OK" : "Waiting"}</span>
            <span>Phone: {trackerState?.phoneDetected ? "Warning" : "OK"}</span>
            <span>Drowsy: {trackerState?.drowsy ? "Warning" : "OK"}</span>
            <span>Away: {trackerState?.lookingAway ? "Warning" : "OK"}</span>
          </div>
        ) : null}

        {quiz && currentQuestion ? (
          <section className="quiz-layout">
            <div className="quiz-main">
              <article className="panel progress-panel">
                <div className="section-row">
                  <strong>Progress</strong>
                  <span>
                    {currentIndex + 1}/{quiz.total_questions}
                  </span>
                </div>
                <div className="progress-rail">
                  {quiz.questions.map((question, index) => {
                    const answered = Boolean(answers[question.id]);
                    const isCurrent = index === currentIndex;
                    return (
                      <span
                        className={`progress-step${
                          answered ? " answered" : ""
                        }${isCurrent ? " current" : ""}`}
                        key={question.id}
                      />
                    );
                  })}
                </div>
                <div className="quiz-progress-meta">
                  <span className="metric-note">{answeredCount} answered</span>
                  <span className="metric-note">
                    {quiz.total_questions - answeredCount} remaining
                  </span>
                </div>
              </article>

              <article className="question-card quiz-question-card">
                <div className="question-meta">
                  Question {currentIndex + 1}
                </div>
                <h3>{currentQuestion.question_text}</h3>
              </article>

              <article className="options-grid quiz-options-grid">
                {optionKeys.map((optionKey) => {
                  const optionText =
                    currentQuestion[
                      `option_${optionKey.toLowerCase()}` as
                        | "option_a"
                        | "option_b"
                        | "option_c"
                        | "option_d"
                    ];
                  const selected = answers[currentQuestion.id] === optionKey;

                  return (
                    <label
                      className={`option-label choice-card${
                        selected ? " selected" : ""
                      }`}
                      key={optionKey}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        checked={selected}
                        onChange={() =>
                          setAnswers((current) => ({
                            ...current,
                            [currentQuestion.id]: optionKey
                          }))
                        }
                      />
                      <span className="choice-letter">{optionKey}</span>
                      <span className="choice-text">{optionText}</span>
                    </label>
                  );
                })}
              </article>

              <div className="button-row quiz-actions">
                <button
                  className="secondary-button"
                  onClick={() =>
                    setCurrentIndex((current) => Math.max(current - 1, 0))
                  }
                  disabled={currentIndex === 0}
                >
                  Previous
                </button>

                {currentIndex < quiz.questions.length - 1 ? (
                  <button
                    className="primary-button"
                    onClick={() =>
                      setCurrentIndex((current) =>
                        Math.min(current + 1, quiz.questions.length - 1)
                      )
                    }
                    disabled={!answers[currentQuestion.id]}
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    className="primary-button"
                    onClick={() => void handleSubmit()}
                    disabled={loading || submitting || !allAnswered}
                  >
                    {submitting ? "Submitting..." : "Submit Quiz"}
                  </button>
                )}
              </div>
            </div>

            <aside className="quiz-side">
              <article className="panel monitor-panel">
                <div className="section-row">
                  <h2>Live Feed</h2>
                  <span className="status-pill success">
                    {webcamEnabled ? "Live" : "Skipped"}
                  </span>
                </div>
                {webcamEnabled ? (
                  <video ref={videoRef} className="video-frame" muted playsInline />
                ) : (
                  <div className="video-frame video-placeholder">
                    Behaviour tracking was skipped for this session.
                  </div>
                )}

                <div className="monitor-status-list">
                  {monitorItems.map(([label, active, tone]) => (
                    <div className="monitor-status-row" key={label}>
                      <span>{label}</span>
                      <span
                        className={`status-pill ${
                          active && tone === "warning" ? "warning" : "success"
                        }`}
                      >
                        {active && tone === "warning" ? "Flagged" : "Clear"}
                      </span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel focus-card">
                <div className="focus-ring">
                  <div className="focus-ring-inner">
                    <strong>{focusScore}%</strong>
                    <span>focus</span>
                  </div>
                </div>
                <p className="focus-caption">
                  {focusScore >= 80
                    ? "Great concentration so far."
                    : "Stay centered and reduce distractions."}
                </p>
                {trackerState?.warning ? (
                  <div className="error-banner">{trackerState.warning}</div>
                ) : null}
              </article>
            </aside>
          </section>
        ) : null}
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
