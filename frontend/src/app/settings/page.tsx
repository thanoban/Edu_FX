"use client";

import { PageShell } from "@/components/page-shell";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";

export default function SettingsPage() {
  const { profile } = useAuth();

  return (
    <RequireAuth>
      <PageShell
        title="Settings"
        subtitle="Manage your EduFX study identity, quiz preferences, and privacy defaults."
      >
        <section className="settings-grid">
          <article className="panel settings-card">
            <h2>Student Profile</h2>
            <div className="settings-field">
              <span className="metric-note">Name</span>
              <strong>{profile?.name ?? "Student"}</strong>
            </div>
            <div className="settings-field">
              <span className="metric-note">Email</span>
              <strong>{profile?.email ?? "Not available"}</strong>
            </div>
            <div className="settings-field">
              <span className="metric-note">Diagnostic</span>
              <strong>
                {profile?.diagnostic_completed ? "Completed" : "Not completed"}
              </strong>
            </div>
          </article>

          <article className="panel settings-card">
            <h2>Quiz Preferences</h2>
            <div className="settings-toggle-row">
              <div>
                <strong>Behaviour tracking prompt</strong>
                <p className="metric-note">
                  EduFX asks before enabling webcam analysis on each quiz.
                </p>
              </div>
              <span className="status-pill success">Enabled</span>
            </div>
            <div className="settings-toggle-row">
              <div>
                <strong>Google sign-in</strong>
                <p className="metric-note">
                  Authentication is powered by Supabase Google OAuth.
                </p>
              </div>
              <span className="status-pill success">Connected</span>
            </div>
          </article>

          <article className="panel settings-card">
            <h2>Privacy</h2>
            <p className="metric-note">
              Video frames stay on your device. EduFX stores only computed focus and
              distraction metrics for session summaries.
            </p>
            <div className="summary-strip">
              <span className="summary-item">Local processing</span>
              <span className="summary-item">Google OAuth</span>
              <span className="summary-item">Supabase backend</span>
            </div>
          </article>
        </section>
      </PageShell>
    </RequireAuth>
  );
}
