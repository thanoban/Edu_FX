"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PageShell } from "@/components/page-shell";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { error, loading, profile, session, signInWithGoogle } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !session || !profile) {
      return;
    }

    if (profile.diagnostic_completed) {
      router.replace("/dashboard");
      return;
    }

    router.replace("/diagnostic");
  }, [loading, profile, router, session]);

  async function handleLogin() {
    setSubmitting(true);
    setLocalError(null);
    try {
      await signInWithGoogle();
    } catch (signInError) {
      setLocalError(
        signInError instanceof Error
          ? signInError.message
          : "Unable to start Google sign-in"
      );
      setSubmitting(false);
    }
  }

  return (
    <PageShell
      layout="landing"
      title="Welcome to EduFX"
      subtitle="Adaptive chemistry practice with personalized quizzes, guided study sessions, and on-device behaviour intelligence."
    >
      <section className="auth-hero-grid">
        <article className="hero-card auth-showcase-card">
          <span className="pill-tag">Student workspace</span>
          <div>
            <h2>Sign in to unlock your adaptive study journey</h2>
            <p className="student-note">
              EduFX combines guided chemistry revision, adaptive quiz difficulty,
              and local behaviour insights to help learners focus and improve.
            </p>
          </div>

          <div className="auth-feature-grid">
            <div className="auth-feature-card">
              <strong>Adaptive quizzes</strong>
              <p className="metric-note">
                Each session adjusts around your current mastery level.
              </p>
            </div>
            <div className="auth-feature-card">
              <strong>Local webcam analysis</strong>
              <p className="metric-note">
                Video stays on-device while EduFX records only focus signals.
              </p>
            </div>
            <div className="auth-feature-card">
              <strong>Actionable reports</strong>
              <p className="metric-note">
                Review quiz accuracy, distraction flags, and improvement tips.
              </p>
            </div>
          </div>
        </article>

        <article className="hero-card auth-login-card">
          <div>
            <span className="metric-note">Secure access</span>
            <h2>Continue with Google</h2>
            <p className="student-note">
              Sign in to start your diagnostic assessment and open your full
              EduFX dashboard.
            </p>
          </div>

          {error || localError ? (
            <div className="error-banner">{localError ?? error}</div>
          ) : null}

          <button
            className="primary-button auth-google-button"
            onClick={() => void handleLogin()}
            disabled={submitting}
          >
            <span className="google-dot" aria-hidden="true" />
            {submitting ? "Redirecting..." : "Continue with Google"}
          </button>

          <div className="summary-strip auth-strip">
            <span className="summary-item">Supabase OAuth</span>
            <span className="summary-item">Local tracking</span>
            <span className="summary-item">Private session reports</span>
          </div>
        </article>
      </section>
    </PageShell>
  );
}
