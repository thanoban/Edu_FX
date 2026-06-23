"use client";

import { useEffect, useState } from "react";

import { fetchProgress } from "@/lib/api";
import type { ProgressRecord } from "@/lib/types";
import { PageShell } from "@/components/page-shell";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";

export default function ProgressPage() {
  const { profile } = useAuth();
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }
    const studentId = profile.student_id;

    async function loadProgress() {
      try {
        const response = await fetchProgress(studentId);
        setProgress(response.progress);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load progress"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProgress();
  }, [profile]);

  return (
    <RequireAuth>
      <PageShell
        title="Progress Overview"
        subtitle="Track level, recent score, and revision frequency across all subtopics."
      >
        {error ? <div className="error-banner">{error}</div> : null}
        {loading ? <div className="panel">Loading progress...</div> : null}

        <section className="progress-grid">
          {progress.map((entry) => (
            <article className="result-card" key={entry.id}>
              <div className="badge">{entry.subtopics.group_name}</div>
              <h3>{entry.subtopics.title}</h3>
              <p>Current level: {entry.current_level}</p>
              <p>Last score: {entry.last_quiz_score}%</p>
              <p>Total sessions: {entry.total_sessions}</p>
              <p>
                Last studied: {entry.last_studied_date ?? "Not yet studied"}
              </p>
            </article>
          ))}
        </section>
      </PageShell>
    </RequireAuth>
  );
}
