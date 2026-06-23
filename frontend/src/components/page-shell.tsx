"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import { useAuth } from "@/components/auth-provider";

type NavId = "dashboard" | "quizzes" | "diagnostic" | "progress" | "settings";

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
  { id: "dashboard", label: "Dashboard", href: "/dashboard" },
  { id: "quizzes", label: "My Quizzes", href: "/dashboard" },
  { id: "diagnostic", label: "Diagnostic", href: "/diagnostic" },
  { id: "progress", label: "Progress", href: "/progress" },
  { id: "settings", label: "Settings" }
];

function AppIcon({ type }: { type: NavId }) {
  const paths: Record<NavId, ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    quizzes: (
      <>
        <path d="M7 6.5h10.5a1.5 1.5 0 0 1 1.5 1.5v11a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V8A1.5 1.5 0 0 1 7 6.5Z" />
        <path d="m9 12 2.3 2.4L16 9.8" />
      </>
    ),
    diagnostic: (
      <>
        <path d="M12 4v8" />
        <path d="M8 12h8" />
        <path d="M6 20h12" />
        <path d="M8 20v-2a4 4 0 0 1 8 0v2" />
      </>
    ),
    progress: (
      <>
        <path d="M4 16h4l2-6 4 10 2-5h4" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 2.7v2.4" />
        <path d="M12 18.9v2.4" />
        <path d="m4.9 4.9 1.7 1.7" />
        <path d="m17.4 17.4 1.7 1.7" />
        <path d="M2.7 12h2.4" />
        <path d="M18.9 12h2.4" />
        <path d="m4.9 19.1 1.7-1.7" />
        <path d="m17.4 6.6 1.7-1.7" />
      </>
    )
  };

  return (
    <svg
      aria-hidden="true"
      className="nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[type]}
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4a4 4 0 0 0-4 4v2.5c0 1.2-.4 2.4-1.2 3.3L5.5 15h13l-1.3-1.2A4.8 4.8 0 0 1 16 10.5V8a4 4 0 0 0-4-4Z" />
      <path d="M10 18a2.2 2.2 0 0 0 4 0" />
    </svg>
  );
}

function resolveActiveSection(pathname: string) {
  if (
    pathname.startsWith("/study") ||
    pathname.startsWith("/webcam-check") ||
    pathname.startsWith("/quiz") ||
    pathname.startsWith("/results")
  ) {
    return "quizzes";
  }

  if (pathname.startsWith("/progress")) {
    return "progress";
  }

  if (pathname.startsWith("/diagnostic")) {
    return "diagnostic";
  }

  return "dashboard";
}

export function PageShell({
  title,
  subtitle,
  children,
  actions,
  layout = "app"
}: PageShellProps) {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const activeSection = resolveActiveSection(pathname);
  const initials = profile?.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (layout === "landing") {
    return (
      <main className="landing-shell">
        <header className="landing-topbar">
          <div>
            <Link href="/" className="brand brand-large">
              EduFX
            </Link>
            <p className="brand-subtitle">Adaptive Education Platform</p>
          </div>
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

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <Link href="/dashboard" className="brand brand-large">
            EduFX
          </Link>
          <p className="brand-subtitle">Adaptive Education Platform</p>
        </div>

        <div className="sidebar-section-label">Menu</div>
        <nav className="sidebar-nav" aria-label="Primary">
          {navItems.map((item) => {
            const itemClassName = `sidebar-link${
              activeSection === item.id ? " active" : ""
            }${item.href ? "" : " disabled"}`;

            if (!item.href) {
              return (
                <span className={itemClassName} key={item.id}>
                  <AppIcon type={item.id} />
                  {item.label}
                </span>
              );
            }

            return (
              <Link className={itemClassName} href={item.href} key={item.id}>
                <AppIcon type={item.id} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-profile">
          <div className="profile-avatar">{initials ?? "EF"}</div>
          <div className="profile-meta">
            <strong>{profile?.name ?? "EduFX Student"}</strong>
            <span>{profile?.email ?? "Adaptive learner"}</span>
          </div>
          {profile ? (
            <button className="sidebar-signout" onClick={() => void signOut()}>
              Sign out
            </button>
          ) : null}
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="topbar-actions">
            <button className="notification-button" type="button">
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
