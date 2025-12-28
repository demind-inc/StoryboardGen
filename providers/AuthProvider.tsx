import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Session } from "@supabase/supabase-js";
import { AccountProfile, AuthStatus } from "../types";
import {
  getCurrentSession,
  signOut,
  upsertProfile,
} from "../services/authService";
import { getSupabaseClient } from "../services/supabaseClient";

interface AuthContextType {
  session: Session | null;
  profile: AccountProfile | null;
  authStatus: AuthStatus;
  authEmail: string;
  authMessage: string | null;
  authError: string | null;
  isSendingLink: boolean;
  setAuthEmail: (email: string) => void;
  signIn: (e: React.FormEvent) => Promise<void>;
  signOut: () => Promise<void>;
  displayEmail: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [authEmail, setAuthEmail] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSendingLink, setIsSendingLink] = useState(false);

  const displayEmail = profile?.email || session?.user?.email || "";

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initialize = async () => {
      try {
        const supabase = getSupabaseClient();

        // Set up auth state change listener - this will fire immediately with current session
        // and handle auto-signin for persisted sessions. Supabase automatically restores
        // sessions from localStorage when persistSession is enabled.
        // It also fires when a user clicks the magic link and gets redirected back.
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log("Auth state changed:", event, newSession?.user?.email);

            // Handle initial session restoration and subsequent auth changes
            if (newSession?.user) {
              setSession(newSession);
              try {
                const savedProfile = await upsertProfile(newSession.user);
                if (savedProfile) setProfile(savedProfile);
              } catch (error) {
                console.error("Profile upsert error:", error);
              }
              setAuthStatus("signed_in");

              // Clear any auth messages when successfully signed in
              setAuthMessage(null);
              setAuthError(null);

              // Clear URL hash after processing the redirect
              if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                window.history.replaceState(
                  null,
                  "",
                  window.location.pathname + window.location.search
                );
              }
            } else {
              setSession(null);
              setProfile(null);
              setAuthStatus("signed_out");
            }
          }
        );
        unsubscribe = () => authListener?.subscription.unsubscribe();

        // Check for existing session as a fallback
        // The listener should fire immediately, but this ensures we catch the session
        // in case of any edge cases
        // Also check if there's a hash in the URL (from magic link redirect)
        const hasHash =
          window.location.hash.includes("access_token") ||
          window.location.hash.includes("type=recovery");

        // If there's a hash, give Supabase a moment to process it
        if (hasHash) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const currentSession = await getCurrentSession();
        if (currentSession?.user) {
          setSession(currentSession);
          try {
            const savedProfile = await upsertProfile(currentSession.user);
            if (savedProfile) setProfile(savedProfile);
          } catch (error) {
            console.error("Profile upsert error:", error);
          }
          setAuthStatus("signed_in");

          // Clear URL hash if it was from a redirect
          if (hasHash) {
            window.history.replaceState(
              null,
              "",
              window.location.pathname + window.location.search
            );
          }
        } else {
          // Set to signed_out if no session found
          // The listener may have already updated this, but this ensures it's set
          setAuthStatus("signed_out");
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setAuthError(
          "Unable to connect to authentication. Check Supabase keys."
        );
        setAuthStatus("signed_out");
      }
    };

    initialize();

    return () => {
      unsubscribe?.();
    };
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage(null);
    setAuthError(null);

    if (!authEmail.trim()) {
      setAuthError("Please enter a valid email address.");
      return;
    }

    setIsSendingLink(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: authEmail.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        throw error;
      }

      setAuthMessage("Check your email for the magic sign-in link.");
    } catch (error: any) {
      console.error("Sign-in error:", error);
      setAuthError(error.message || "Failed to start sign-in. Try again.");
    } finally {
      setIsSendingLink(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setAuthMessage(null);
    } catch (error: any) {
      console.error("Sign-out error:", error);
      setAuthError(error.message || "Unable to sign out.");
    }
  };

  const value: AuthContextType = {
    session,
    profile,
    authStatus,
    authEmail,
    authMessage,
    authError,
    isSendingLink,
    setAuthEmail,
    signIn: handleSignIn,
    signOut: handleSignOut,
    displayEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
