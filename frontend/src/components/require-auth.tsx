"use client";

import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

import { LoadingState } from "@/components/loading-state";
import { useAuth } from "@/components/auth-provider";

type RequireAuthProps = {
  children: ReactNode;
  requireDiagnostic?: boolean;
};

export function RequireAuth({
  children,
  requireDiagnostic = true
}: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!session) {
      router.replace("/login");
      return;
    }

    if (requireDiagnostic && profile && !profile.diagnostic_completed) {
      router.replace("/diagnostic");
      return;
    }

    if (!requireDiagnostic && pathname === "/login" && profile?.diagnostic_completed) {
      router.replace("/dashboard");
    }
  }, [loading, pathname, profile, requireDiagnostic, router, session]);

  if (loading || !session || !profile) {
    return <LoadingState />;
  }

  if (requireDiagnostic && !profile.diagnostic_completed) {
    return <LoadingState detail="Redirecting to your diagnostic assessment..." />;
  }

  return <>{children}</>;
}
