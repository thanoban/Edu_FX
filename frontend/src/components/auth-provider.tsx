"use client";

import {
  Session,
  SupabaseClient
} from "@supabase/supabase-js";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import { checkDiagnostic, loginStudent } from "@/lib/api";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import type { StudentProfile } from "@/lib/types";

type AuthContextValue = {
  session: Session | null;
  profile: StudentProfile | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshStudentStatus: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const hasSupabaseConfig =
  SUPABASE_URL !== "https://placeholder-project.supabase.co" &&
  SUPABASE_ANON_KEY !== "placeholder-anon-key";

async function syncStudentProfile(
  client: SupabaseClient,
  session: Session
): Promise<StudentProfile> {
  const profile = await loginStudent(session.access_token);

  await client.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token
  });

  return profile;
}

async function resetSessionState(client: SupabaseClient) {
  await client.auth.signOut();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      if (!hasSupabaseConfig) {
        if (active) {
          setError(
            "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env.local before signing in."
          );
          setLoading(false);
        }
        return;
      }

      const {
        data: { session: initialSession }
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      setSession(initialSession);

      if (!initialSession) {
        setLoading(false);
        return;
      }

      try {
        const syncedProfile = await syncStudentProfile(supabase, initialSession);
        if (!active) {
          return;
        }
        setProfile(syncedProfile);
        setError(null);
      } catch (bootstrapError) {
        if (!active) {
          return;
        }
        await resetSessionState(supabase);
        setSession(null);
        setProfile(null);
        setError(
          bootstrapError instanceof Error
            ? "Your previous sign-in expired. Continue with Google to start a fresh session."
            : "Unable to load student profile"
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);

      if (!nextSession) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      void syncStudentProfile(supabase, nextSession)
        .then((syncedProfile) => {
          setProfile(syncedProfile);
          setError(null);
        })
        .catch(async (syncError) => {
          await resetSessionState(supabase);
          setSession(null);
          setProfile(null);
          setError(
            syncError instanceof Error
              ? "Your sign-in session expired. Please continue with Google again."
              : "Unable to sync student profile"
          );
        })
        .finally(() => {
          setLoading(false);
        });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      error,
      async signInWithGoogle() {
        if (!hasSupabaseConfig) {
          throw new Error(
            "Missing frontend Supabase public environment variables."
          );
        }

        setError(null);
        const redirectTo =
          typeof window === "undefined"
            ? undefined
            : `${window.location.origin}/login`;

        const { error: signInError } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo }
        });

        if (signInError) {
          throw signInError;
        }
      },
      async signOut() {
        await supabase.auth.signOut();
        setProfile(null);
      },
      async refreshStudentStatus() {
        if (!session || !profile) {
          return;
        }

        const latest = await checkDiagnostic(session.access_token);
        setProfile({
          ...profile,
          diagnostic_completed: latest.diagnostic_completed
        });
      }
    }),
    [error, loading, profile, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
