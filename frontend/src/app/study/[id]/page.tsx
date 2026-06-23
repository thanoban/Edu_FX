"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { UIEvent, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";

import { fetchContent } from "@/lib/api";
import type { ContentRecord } from "@/lib/types";
import { PageShell } from "@/components/page-shell";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";

export default function StudyPage() {
  const params = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [content, setContent] = useState<ContentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [atBottom, setAtBottom] = useState(false);

  const subtopicId = useMemo(() => Number(params.id), [params.id]);

  useEffect(() => {
    if (!profile || Number.isNaN(subtopicId)) {
      return;
    }
    const studentId = profile.student_id;

    async function loadContent() {
      try {
        const data = await fetchContent(subtopicId, studentId);
        setContent(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load study content"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadContent();
  }, [profile, subtopicId]);

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    const nearBottom =
      element.scrollTop + element.clientHeight >= element.scrollHeight - 20;
    if (nearBottom) {
      setAtBottom(true);
    }
  }

  return (
    <RequireAuth>
      <PageShell
        title={content?.subtopic_title ?? "Study Session"}
        subtitle={
          content
            ? `${content.group_name} · ${content.level} notes selected for your current level`
            : "Loading your personalized notes"
        }
        actions={
          <>
            <Link href="/progress" className="secondary-button">
              View Progress
            </Link>
            <Link href="/dashboard" className="secondary-button">
              Back to Dashboard
            </Link>
          </>
        }
      >
        {error ? <div className="error-banner">{error}</div> : null}
        {loading ? <div className="panel">Loading chemistry notes...</div> : null}

        {content ? (
          <>
            <section className="metrics-grid dashboard-metrics diagnostic-metrics">
              <article className="metric-card">
                <div>
                  <div className="metric-label">Current Level</div>
                  <div className="metric-value study-metric-text">{content.level}</div>
                  <p className="metric-note">Content is tailored to your present mastery</p>
                </div>
                <div className="metric-dot blue" />
              </article>
              <article className="metric-card">
                <div>
                  <div className="metric-label">Focus Flow</div>
                  <div className="metric-value">Read</div>
                  <p className="metric-note">Finish the notes to unlock your adaptive quiz</p>
                </div>
                <div className="metric-dot green" />
              </article>
              <article className="metric-card">
                <div>
                  <div className="metric-label">Next Step</div>
                  <div className="metric-value">Quiz</div>
                  <p className="metric-note">Camera tracking is optional before you begin</p>
                </div>
                <div className="metric-dot purple" />
              </article>
            </section>

            <section className="panel study-panel">
              <div className="study-content" onScroll={handleScroll}>
                <ReactMarkdown>{content.body}</ReactMarkdown>
              </div>
            </section>

            <div className="button-row study-actions">
              <Link
                href={`/webcam-check?subtopicId=${subtopicId}`}
                className={atBottom ? "primary-button" : "secondary-button"}
                aria-disabled={!atBottom}
                onClick={(event) => {
                  if (!atBottom) {
                    event.preventDefault();
                  }
                }}
              >
                {atBottom
                  ? "Finish Reading"
                  : "Scroll to the bottom to unlock quiz"}
              </Link>
            </div>
          </>
        ) : null}
      </PageShell>
    </RequireAuth>
  );
}
