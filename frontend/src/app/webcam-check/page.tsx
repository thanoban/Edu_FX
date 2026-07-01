"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import {
  BrowserBehaviourTracker,
  type TrackerRealtimeState
} from "@/lib/webcam/analytics";
import { useAuth } from "@/components/auth-provider";
import { LoadingState } from "@/components/loading-state";
import { PageShell } from "@/components/page-shell";
import { RequireAuth } from "@/components/require-auth";

function WebcamCheckContent() {
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const subtopicId = searchParams.get("subtopicId");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [trackerState, setTrackerState] = useState<TrackerRealtimeState | null>(
    null
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const trackerRef = useRef<BrowserBehaviourTracker | null>(null);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    let active = true;

    async function setupPreview() {
      setStarting(true);
      setCameraError(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false
        });

        if (!active || !videoRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        mediaStreamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const tracker = new BrowserBehaviourTracker();
        trackerRef.current = tracker;
        await tracker.start(
          videoRef.current,
          profile?.student_id ?? 0,
          0,
          setTrackerState
        );

        const trackerWarning = tracker.getState().warning;
        if (trackerWarning) {
          setCameraError(trackerWarning);
        }
      } catch (previewError) {
        setCameraError(
          previewError instanceof Error
            ? previewError.message
            : "Unable to start camera preview"
        );
      } finally {
        if (active) {
          setStarting(false);
        }
      }
    }

    void setupPreview();

    return () => {
      active = false;
      trackerRef.current?.stop();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [profile?.student_id]);

  const checklist = useMemo(
    () => [
      {
        label: "Camera permission granted",
        ok: Boolean(mediaStreamRef.current) && !cameraError
      },
      {
        label: "Face detected",
        ok: trackerState?.faceDetected ?? false
      },
      {
        label: "Single person in frame",
        ok: trackerState ? trackerState.faceDetected && !trackerState.multiplePersons : false
      },
      {
        label: "Tracking models ready",
        ok: trackerState?.ready ?? false
      }
    ],
    [cameraError, trackerState]
  );
  const allChecksPassed =
    checklist.every((item) => item.ok) &&
    !cameraError &&
    !starting;
  const trackedSignals = useMemo(
    () => [
      [
        "Eye openness",
        trackerState?.drowsy
          ? "Low eye openness detected. Take a short reset before beginning."
          : "No drowsiness pattern is currently detected."
      ],
      [
        "Phone detection",
        trackerState?.phoneDetected
          ? "A handheld device may be visible in frame."
          : "No handheld device is currently flagged."
      ],
      [
        "Head pose",
        trackerState?.lookingAway
          ? "You appear to be looking away from the screen."
          : "Head pose is centered for a steady start."
      ],
      [
        "Multiple persons",
        trackerState?.multiplePersons
          ? "More than one person may be visible right now."
          : "Only one learner is visible in frame."
      ],
      [
        "Mouth movement",
        trackerState?.talking
          ? "Talking may be detected at the moment."
          : "No sustained talking signal is currently detected."
      ],
      [
        "Absence detection",
        trackerState?.absent
          ? "No face has been visible long enough to begin."
          : "Face presence is stable enough for readiness."
      ]
    ],
    [trackerState]
  );

  return (
    <RequireAuth>
      <PageShell
        title="Before You Begin"
        subtitle="Prepare your camera, review what EduFX tracks locally, and choose how you want this quiz session to run."
      >
        {cameraError ? <div className="error-banner">{cameraError}</div> : null}
        <section className="before-grid">
          <article className="panel camera-card">
            <div className="camera-label-row">
              <h2>Camera Preview</h2>
              <span
                className={`status-pill ${
                  allChecksPassed ? "success" : cameraError ? "negative" : "warning"
                }`}
              >
                {allChecksPassed ? "Ready" : cameraError ? "Needs attention" : "Checking"}
              </span>
            </div>

            <div className="camera-preview">
              <video
                ref={videoRef}
                className={`camera-live-video${mediaStreamRef.current ? "" : " hidden"}`}
                muted
                playsInline
              />
              {!mediaStreamRef.current ? (
                <div className="camera-avatar" aria-hidden="true">
                  <div className="camera-avatar-ring" />
                  <div className="camera-avatar-head" />
                  <div className="camera-avatar-body" />
                </div>
              ) : null}
              <span className="preview-chip">
                {trackerState?.faceDetected ? "Face detected" : "Waiting for face"}
              </span>
              <div className="camera-preview-status">
                <span className="summary-item">
                  Focus {trackerState?.focusScore ?? 100}%
                </span>
                <span className="summary-item">
                  {trackerState?.phoneDetected ? "Phone flagged" : "Phone clear"}
                </span>
              </div>
            </div>

            <div className="check-list">
              {checklist.map((item) => (
                <div className="check-row" key={item.label}>
                  <span className="check-icon">✓</span>
                  <span>{item.label}</span>
                  <span className={`status-pill ${item.ok ? "success" : "warning"}`}>
                    {item.ok ? "OK" : "Pending"}
                  </span>
                </div>
              ))}
            </div>

            <div className="success-banner success-card">
              <strong>
                {allChecksPassed ? "All checks passed" : "Final readiness check in progress"}
              </strong>
              <p>
                {allChecksPassed
                  ? "Your camera and local tracking stack are ready for a professional quiz session."
                  : "Stay centered in frame and allow the preview to finish warming up."}
              </p>
            </div>
          </article>

          <article className="before-side">
            <div className="panel tracking-card">
              <h2>What Will Be Tracked</h2>
              <div className="tracking-list">
                {trackedSignals.map(([label, detail]) => (
                  <div className="tracking-item" key={label}>
                    <div className="tracking-icon" />
                    <div>
                      <strong>{label}</strong>
                      <p className="metric-note">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel privacy-card">
              <h2>Privacy Notice</h2>
              <p className="metric-note">
                Video frames are never uploaded to the server. EduFX processes
                webcam data locally and only saves computed behaviour signals for
                your session summary.
              </p>
            </div>

            <div className="before-actions">
              <Link
                href={subtopicId ? `/quiz/${subtopicId}?webcam=1` : "/dashboard"}
                className={`primary-button large-button${allChecksPassed ? "" : " is-disabled"}`}
                aria-disabled={!allChecksPassed}
                onClick={(event) => {
                  if (!allChecksPassed) {
                    event.preventDefault();
                  }
                }}
              >
                Start Quiz Now
              </Link>
              <Link
                href={subtopicId ? `/quiz/${subtopicId}?webcam=0` : "/dashboard"}
                className="secondary-button large-button"
              >
                Skip tracking
              </Link>
            </div>
          </article>
        </section>
      </PageShell>
    </RequireAuth>
  );
}

export default function WebcamCheckPage() {
  return (
    <Suspense fallback={<LoadingState detail="Loading webcam options..." />}>
      <WebcamCheckContent />
    </Suspense>
  );
}
