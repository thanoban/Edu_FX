"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchStudyPlan } from "@/lib/api";
import type { StudyPlanItem } from "@/lib/types";
import { PageShell } from "@/components/page-shell";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";

export default function DashboardPage() {
  const { profile } = useAuth();
  const [plan, setPlan] = useState<StudyPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }
    const studentId = profile.student_id;

    async function loadPlan() {
      try {
        const data = await fetchStudyPlan(studentId);
        setPlan(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to fetch today's plan"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadPlan();
  }, [profile]);

  return (
    <RequireAuth>
      <PageShell
        title="Today's Adaptive Study Plan"
        subtitle="EduFX selects 3 subtopics automatically: two weaker areas and one stronger area."
        actions={
          <Link href="/progress" className="secondary-button">
            View Progress
          </Link>
        }
      >
        {error ? <div className="error-banner">{error}</div> : null}
        {loading ? <div className="panel">Calculating today's study plan...</div> : null}

        <section className="plan-grid">
          {plan.map((item) => (
            <article className="plan-card" key={item.subtopic_id}>
              <div className="badge">{item.group_name}</div>
              <h3>{item.subtopic_title}</h3>
              <p>Level: {item.current_level}</p>
              <p>Priority: {item.type}</p>
              <p>
                Last score:{" "}
                {typeof item.last_quiz_score === "number"
                  ? `${item.last_quiz_score}%`
                  : "Not yet studied"}
              </p>
              <p>{item.is_overdue ? "Overdue for revision" : "On schedule"}</p>
              <div className="button-row">
                <Link
                  href={`/study/${item.subtopic_id}`}
                  className="primary-button"
                >
                  Study this topic
                </Link>
              </div>
            </article>
          ))}
        </section>
      </PageShell>
    </RequireAuth>
  );
}
