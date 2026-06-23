"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { LoadingState } from "@/components/loading-state";
import { PageShell } from "@/components/page-shell";
import { RequireAuth } from "@/components/require-auth";

function WebcamCheckContent() {
  const searchParams = useSearchParams();
  const subtopicId = searchParams.get("subtopicId");

  return (
    <RequireAuth>
      <PageShell
        title="Webcam Tracking Choice"
        subtitle="The quiz can continue with or without webcam tracking. Raw video stays on your device."
      >
        <section className="plan-grid">
          <article className="plan-card">
            <h3>Enable webcam tracking</h3>
            <p>
              EduFX will monitor attention signals locally and send only
              behaviour scores to the backend every 30 seconds.
            </p>
            <Link
              href={`/quiz/${subtopicId}?webcam=1`}
              className="primary-button"
            >
              Enable webcam and start quiz
            </Link>
          </article>

          <article className="plan-card">
            <h3>Skip webcam tracking</h3>
            <p>
              You can continue the quiz without focus analytics. The results
              page will still show your quiz explanations and level change.
            </p>
            <Link
              href={`/quiz/${subtopicId}?webcam=0`}
              className="secondary-button"
            >
              Skip webcam and start quiz
            </Link>
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
