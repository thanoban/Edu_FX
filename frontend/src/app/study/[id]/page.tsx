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
          <Link href="/dashboard" className="secondary-button">
            Back to Dashboard
          </Link>
        }
      >
        {error ? <div className="error-banner">{error}</div> : null}
        {loading ? <div className="panel">Loading chemistry notes...</div> : null}

        {content ? (
          <>
            <section className="panel">
              <div className="study-content" onScroll={handleScroll}>
                <ReactMarkdown>{content.body}</ReactMarkdown>
              </div>
            </section>

            <div className="button-row" style={{ marginTop: 20 }}>
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
