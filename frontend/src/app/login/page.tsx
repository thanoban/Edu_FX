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
      <section className="hero-card">
        <div>
          <h2>Sign in to start your diagnostic assessment</h2>
          <p className="student-note">
            This demo uses Supabase Google OAuth and keeps webcam video local to
            your device during quiz sessions.
          </p>
        </div>

        {error || localError ? (
          <div className="error-banner">{localError ?? error}</div>
        ) : null}

        <div className="button-row">
          <button
            className="primary-button"
            onClick={() => void handleLogin()}
            disabled={submitting}
          >
            {submitting ? "Redirecting..." : "Continue with Google"}
          </button>
        </div>
      </section>
    </PageShell>
  );
}
