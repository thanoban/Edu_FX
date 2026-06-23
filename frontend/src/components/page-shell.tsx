"use client";

import Link from "next/link";
import { ReactNode } from "react";

import { useAuth } from "@/components/auth-provider";

type PageShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function PageShell({
  title,
  subtitle,
  children,
  actions
}: PageShellProps) {
  const { profile, signOut } = useAuth();

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <Link href="/" className="brand">
            EduFX
          </Link>
          <p className="brand-subtitle">
            Adaptive S-Block Inorganic Chemistry demo
          </p>
        </div>
        <div className="topbar-actions">
          {profile ? (
            <>
              <span className="student-pill">{profile.name}</span>
              <button className="ghost-button" onClick={() => void signOut()}>
                Sign out
              </button>
            </>
          ) : null}
        </div>
      </header>

      <section className="page-header">
        <div>
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions ? <div>{actions}</div> : null}
      </section>

      {children}
    </main>
  );
}
