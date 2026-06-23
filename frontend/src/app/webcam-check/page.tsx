"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

import { LoadingState } from "@/components/loading-state";
import { PageShell } from "@/components/page-shell";
import { RequireAuth } from "@/components/require-auth";

function WebcamCheckContent() {
  const searchParams = useSearchParams();
  const subtopicId = searchParams.get("subtopicId");
  const checklist = useMemo(
    () => [
      "Face detected",
      "Good lighting",
      "Single person in frame",
      "Camera permission granted"
    ],
    []
  );
  const trackedSignals = useMemo(
    () => [
      ["Eye openness", "Detects possible drowsiness signals locally"],
      ["Phone detection", "Flags visible handheld devices during the quiz"],
      ["Head pose", "Checks when you are looking away for extended periods"],
      ["Multiple persons", "Detects if more than one person appears in frame"],
      ["Mouth movement", "Tracks sustained talking during quiz time"],
      ["Absence detection", "Flags when no face is visible for a while"]
    ],
    []
  );

  return (
    <RequireAuth>
      <PageShell
        title="Before You Begin"
        subtitle="Prepare your camera, review what EduFX tracks locally, and choose how you want this quiz session to run."
      >
        <section className="before-grid">
          <article className="panel camera-card">
            <div className="camera-label-row">
              <h2>Camera Preview</h2>
              <span className="status-pill success">Ready</span>
            </div>

            <div className="camera-preview">
              <span className="preview-chip">Face detected</span>
              <div className="camera-avatar" aria-hidden="true">
                <div className="camera-avatar-ring" />
                <div className="camera-avatar-head" />
                <div className="camera-avatar-body" />
              </div>
            </div>

            <div className="check-list">
              {checklist.map((item) => (
                <div className="check-row" key={item}>
                  <span className="check-icon">✓</span>
                  <span>{item}</span>
                  <span className="status-pill success">OK</span>
                </div>
              ))}
            </div>

            <div className="success-banner success-card">
              <strong>All checks passed</strong>
              <p>You are ready to start the quiz.</p>
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
                className="primary-button large-button"
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
