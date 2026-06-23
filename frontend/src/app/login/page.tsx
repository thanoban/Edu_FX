"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PageShell } from "@/components/page-shell";
import { useAuth } from "@/components/auth-provider";

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1.5" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    title: "Adaptive Quizzes",
    body: "Every session adjusts to your current mastery level per subtopic.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    ),
    title: "On-device Tracking",
    body: "Video stays local. EduFX only records focus signals — no uploads.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
        <path d="M3 3v18h18" />
        <path d="m7 16 4-4 4 4 5-5" />
      </svg>
    ),
    title: "Actionable Reports",
    body: "See quiz accuracy, distraction flags, and improvement tips after every session.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { error, loading, profile, session, signInWithGoogle } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !session || !profile) return;
    router.replace(profile.diagnostic_completed ? "/dashboard" : "/diagnostic");
  }, [loading, profile, router, session]);

  async function handleLogin() {
    setSubmitting(true);
    setLocalError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Unable to start Google sign-in");
      setSubmitting(false);
    }
  }

  return (
    <PageShell
      layout="landing"
      title="Welcome to EduFX"
      subtitle="Personalised A-Level Chemistry revision with adaptive quizzes and on-device behaviour intelligence."
    >
      <section className="auth-hero-grid">
        {/* Left — showcase */}
        <article className="hero-card auth-showcase-card">
          <div style={{ marginBottom: 8 }}>
            <span className="pill-tag">For A-Level Chemistry students</span>
          </div>

          <div style={{ margin: "20px 0 24px" }}>
            <h2 style={{ margin: "0 0 10px", fontSize: "1.375rem", fontWeight: 700, letterSpacing: "-0.025em" }}>
              Adaptive revision that learns as you do
            </h2>
            <p className="student-note">
              EduFX combines guided chemistry notes, adaptive quiz difficulty based on
              your diagnostic, and local webcam focus tracking — so every session is
              precisely calibrated to where you need it most.
            </p>
          </div>

          <div className="auth-feature-grid">
            {features.map((f) => (
              <div className="auth-feature-card" key={f.title}>
                <div style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 36, height: 36, borderRadius: 10,
                  background: "var(--blue-soft)", color: "var(--blue)",
                  marginBottom: 10, border: "1px solid var(--blue-border)"
                }}>
                  {f.icon}
                </div>
                <strong>{f.title}</strong>
                <p className="metric-note" style={{ marginTop: 4 }}>{f.body}</p>
              </div>
            ))}
          </div>

          {/* Stats strip */}
          <div className="summary-strip" style={{ marginTop: 20 }}>
            <span className="summary-item">S-Block Chemistry</span>
            <span className="summary-item">CIE / AQA aligned</span>
            <span className="summary-item">Zero data uploads</span>
          </div>
        </article>

        {/* Right — login card */}
        <article className="hero-card auth-login-card">
          <div>
            <p className="metric-note" style={{ marginBottom: 6 }}>Secure access</p>
            <h2 style={{ margin: "0 0 10px", fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
              Sign in to get started
            </h2>
            <p className="student-note">
              Start your diagnostic assessment and unlock your personalised
              EduFX dashboard in seconds.
            </p>
          </div>

          {error || localError ? (
            <div className="error-banner">{localError ?? error}</div>
          ) : null}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              className="primary-button auth-google-button"
              onClick={() => void handleLogin()}
              disabled={submitting || loading}
            >
              <span className="google-dot" aria-hidden="true" />
              {submitting ? "Redirecting…" : "Continue with Google"}
            </button>

            <p style={{
              margin: 0, fontSize: "0.75rem", color: "var(--muted)",
              textAlign: "center", lineHeight: 1.5
            }}>
              By continuing you agree to your institution&apos;s academic
              use policy. No exam content is stored externally.
            </p>
          </div>

          <div className="summary-strip auth-strip">
            <span className="summary-item">Supabase OAuth</span>
            <span className="summary-item">Local tracking</span>
            <span className="summary-item">Private reports</span>
          </div>
        </article>
      </section>
    </PageShell>
  );
}
