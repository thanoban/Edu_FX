"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import { useAuth } from "@/components/auth-provider";

type NavId = "dashboard" | "quizzes" | "behaviour" | "progress" | "settings";

type PageShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  layout?: "app" | "landing";
};

type NavItem = {
  id: NavId;
  label: string;
  href?: Route;
};

const navItems: NavItem[] = [
  { id: "dashboard",  label: "Dashboard",      href: "/dashboard" },
  { id: "quizzes",    label: "My Quizzes",     href: "/quizzes" },
  { id: "behaviour",  label: "Behaviour Logs", href: "/behaviour-logs" },
  { id: "progress",   label: "Progress",       href: "/progress" },
  { id: "settings",   label: "Settings",       href: "/settings" },
];

function NavIcon({ id }: { id: NavId }) {
  const icons: Record<NavId, ReactNode> = {
    dashboard: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
    quizzes: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1.5" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    behaviour: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    ),
    progress: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17h2l2-6 4 10 2-5h2l2-4h2" />
      </svg>
    ),
    settings: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v3m0 16v3M4.22 4.22l2.12 2.12m11.32 11.32 2.12 2.12M1 12h3m16 0h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
      </svg>
    ),
  };

  return (
    <span className="nav-icon" aria-hidden="true">
      {icons[id]}
    </span>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4a4 4 0 0 0-4 4v2.5c0 1.2-.4 2.4-1.2 3.3L5.5 15h13l-1.3-1.2A4.8 4.8 0 0 1 16 10.5V8a4 4 0 0 0-4-4Z" />
      <path d="M10 18a2.2 2.2 0 0 0 4 0" />
    </svg>
  );
}

function resolveActiveSection(pathname: string): NavId {
  if (pathname.startsWith("/study") || pathname.startsWith("/quizzes") ||
      pathname.startsWith("/webcam-check") || pathname.startsWith("/quiz") ||
      pathname.startsWith("/results")) return "quizzes";
  if (pathname.startsWith("/behaviour-logs")) return "behaviour";
  if (pathname.startsWith("/progress")) return "progress";
  if (pathname.startsWith("/settings")) return "settings";
  return "dashboard";
}

export function PageShell({
  title,
  subtitle,
  children,
  actions,
  layout = "app",
}: PageShellProps) {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const active = resolveActiveSection(pathname);

  const initials = profile?.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  /* ── Landing layout (login / diagnostic) ── */
  if (layout === "landing") {
    return (
      <main className="landing-shell">
        <header className="landing-topbar">
          <Link href="/" className="brand brand-large">EduFX</Link>
          {profile ? (
            <button className="ghost-button" onClick={() => void signOut()}>
              Sign out
            </button>
          ) : null}
        </header>

        <section className="page-header landing-header">
          <div>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {actions ? <div className="topbar-actions">{actions}</div> : null}
        </section>

        {children}
      </main>
    );
  }

  /* ── App layout ── */
  return (
    <main className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="brand-wrap">
          <Link href="/dashboard" className="brand-logo" aria-label="EduFX home">
            EF
          </Link>
          <div>
            <div className="brand-name">EduFX</div>
            <div className="brand-sub">Adaptive Chemistry</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const cls = [
              "sidebar-link",
              active === item.id ? "active" : "",
              item.href ? "" : "disabled",
            ].filter(Boolean).join(" ");

            if (!item.href) {
              return (
                <span className={cls} key={item.id}>
                  <NavIcon id={item.id} />
                  {item.label}
                </span>
              );
            }

            return (
              <Link className={cls} href={item.href} key={item.id}>
                <NavIcon id={item.id} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />

        {/* Profile */}
        <div className="sidebar-profile">
          <div className="profile-avatar" aria-hidden="true">
            {initials ?? "EF"}
          </div>
          <div className="profile-meta">
            <strong>{profile?.name ?? "Student"}</strong>
            <span>A-Level Chemistry</span>
          </div>
          {profile ? (
            <button className="sidebar-signout" onClick={() => void signOut()}>
              Sign&nbsp;out
            </button>
          ) : null}
        </div>
      </aside>

      {/* Main content */}
      <section className="main-panel">
        <header className="topbar">
          <div className="topbar-actions">
            <button className="notification-button" type="button" aria-label="Notifications">
              <BellIcon />
            </button>
            {actions}
          </div>
        </header>

        <section className="page-header">
          <div>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        </section>

        <section className="page-body">{children}</section>
      </section>
    </main>
  );
}
