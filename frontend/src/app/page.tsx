"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { LoadingState } from "@/components/loading-state";
import { useAuth } from "@/components/auth-provider";

export default function HomePage() {
  const router = useRouter();
  const { loading, session, profile } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!session) {
      router.replace("/login");
      return;
    }

    if (profile?.diagnostic_completed) {
      router.replace("/dashboard");
      return;
    }

    router.replace("/diagnostic");
  }, [loading, profile?.diagnostic_completed, router, session]);

  return <LoadingState detail="Opening your adaptive study workspace..." />;
}
