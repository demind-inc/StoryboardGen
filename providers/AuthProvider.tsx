import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/router";
import { Session, User } from "@supabase/supabase-js";
import { AuthStatus } from "../types";
import { signOut, upsertProfile } from "../services/authService";
import { ensureCaptionSettings } from "../services/captionSettingsService";
import { getSupabaseClient } from "../services/supabaseClient";

interface AuthContextType {
  session: Session | null;
  profile: User | null;
  authStatus: AuthStatus;
  authEmail: string;
  authPassword: string;
  authName: string;
  authMessage: string | null;
  authError: string | null;
  isLoading: boolean;
  isResettingPassword: boolean;
  isSignUpMode: boolean;
  setAuthEmail: (email: string) => void;
  setAuthPassword: (password: string) => void;
  setAuthName: (name: string) => void;
  toggleAuthMode: () => void;
  requestPasswordReset: () => Promise<void>;
  requestPasswordResetForEmail: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  signIn: (e: React.FormEvent) => Promise<void>;
  signUp: (e: React.FormEvent) => Promise<void>;
  signOut: () => Promise<void>;
  displayEmail: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(true); // Default to signup

  const displayEmail = profile?.email || session?.user?.email || "";

  const isEmailVerified = (user: User | null | undefined) =>
    Boolean(user?.email_confirmed_at);

  // Redirect to /auth when signed out, except on auth and landing pages
  useEffect(() => {
    if (authStatus !== "signed_out" || !router.isReady) return;
    const path = router.pathname;
    if (path === "/" || path.startsWith("/auth")) return;
    router.replace("/auth");
  }, [authStatus, router]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initialize = async () => {
      try {
        const supabase = getSupabaseClient();

        // Promise to track when initial session is handled
        let resolveInitialSession: (() => void) | null = null;
        let initializationComplete = false;
        const initialSessionPromise = new Promise<void>((resolve) => {
          resolveInitialSession = resolve;
        });

        // Set up auth state change listener - this will fire immediately with current session
        // and handle auto-signin for persisted sessions. Supabase automatically restores
        // sessions from localStorage when persistSession is enabled.
        // It also fires when a user clicks the magic link and gets redirected back.
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            // Handle initial session restoration and subsequent auth changes
            if (newSession?.user) {
              if (!isEmailVerified(newSession.user)) {
                setSession(null);
                setProfile(newSession.user);
                setAuthStatus("signed_out");
                setAuthMessage(
                  "Please verify your email before accessing your dashboard."
                );
                setAuthError(null);
                return;
              }

              setSession(newSession);
              setProfile(newSession.user);
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
              // Set to signed_out if no session
              // For INITIAL_SESSION with no user, we should set signed_out immediately
              if (
                initializationComplete ||
                event === "SIGNED_OUT" ||
                event === "INITIAL_SESSION"
              ) {
                setSession(null);
                setProfile(null);
                setAuthStatus("signed_out");
              }
            }

            // Mark initialization as complete after handling INITIAL_SESSION or first event
            if (
              !initializationComplete &&
              (event === "INITIAL_SESSION" ||
                event === "SIGNED_IN" ||
                event === "SIGNED_OUT")
            ) {
              initializationComplete = true;
              resolveInitialSession?.();
            }
          }
        );
        unsubscribe = () => authListener?.subscription.unsubscribe();

        // Wait for initial session to be handled (with timeout as fallback)
        await Promise.race([
          initialSessionPromise,
          new Promise((resolve) => setTimeout(resolve, 500)),
        ]);
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

    if (!authPassword.trim()) {
      setAuthError("Please enter your password.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword,
      });

      if (error) {
        throw error;
      }

      // Update auth state immediately after successful sign in
      if (data.session?.user) {
        if (!isEmailVerified(data.session.user)) {
          await supabase.auth.signOut();
          setSession(null);
          setProfile(data.session.user);
          setAuthStatus("signed_out");
          setAuthMessage(
            "Please verify your email before signing in. Check your inbox for the verification link."
          );
          setAuthError(null);
          return;
        }

        setSession(data.session);
        setProfile(data.session.user);
        setAuthStatus("signed_in");
        setAuthMessage(null);
        setAuthError(null);

        // Update profile in database
        try {
          await upsertProfile({
            id: data.session.user.id,
            email: data.session.user.email,
            user_metadata: data.session.user.user_metadata,
          });
        } catch (profileError) {
          console.error("Failed to update profile:", profileError);
          // Don't fail the sign in if profile update fails
        }
      }
      window.location.href = "/dashboard";
    } catch (error: any) {
      console.error("Sign-in error:", error);
      setAuthError(
        error.message || "Failed to sign in. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage(null);
    setAuthError(null);

    if (!authEmail.trim()) {
      setAuthError("Please enter a valid email address.");
      return;
    }

    if (!authPassword.trim()) {
      setAuthError("Please enter a password.");
      return;
    }

    if (authPassword.length < 6) {
      setAuthError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      // RPC enforces normalized-email uniqueness (e.g. user+tag@domain = user@domain)
      const { data: available, error: checkError } = await (
        supabase as any
      ).rpc("is_normalized_email_available", { raw_email: authEmail.trim() });
      if (checkError) {
        console.warn(
          "Normalized email check failed, proceeding with sign-up:",
          checkError
        );
      } else if (available === false) {
        setAuthError(
          "This email address matches an existing account. Please sign in instead."
        );
        setIsLoading(false);
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            full_name: authName.trim() || undefined,
          },
        },
      });

      if (error) {
        throw error;
      }

      // Update auth state immediately after successful sign up
      if (data.session?.user) {
        // Store user info in profiles table
        try {
          await upsertProfile({
            id: data.session.user.id,
            email: data.session.user.email,
            user_metadata: data.session.user.user_metadata,
          });
          await ensureCaptionSettings(data.session.user.id);
        } catch (profileError) {
          console.error("Failed to create profile:", profileError);
          // Don't fail the sign up if profile creation fails
        }

        if (!isEmailVerified(data.session.user)) {
          await supabase.auth.signOut();
          setSession(null);
          setProfile(data.session.user);
          setAuthStatus("signed_out");
          setAuthMessage(
            "Account created! Please verify your email before accessing the dashboard."
          );
          setAuthError(null);
          setIsSignUpMode(false);
          router.push("/auth/verify-email");
          return;
        }

        setSession(data.session);
        setProfile(data.session.user);
        setAuthStatus("signed_in");
        setAuthMessage("Account created successfully! You are now signed in.");
        setAuthError(null);

        // Redirect to dashboard after successful sign up
        window.location.href = "/dashboard";
      } else if (data.user) {
        // If session is null but user exists (email confirmation required)
        // Still set the user but keep status as signed_out until confirmed
        setProfile(data.user);
        setAuthStatus("signed_out");
        setAuthMessage(
          "Account created! Please check your email to verify your account before signing in."
        );
        setAuthError(null);
        setIsSignUpMode(false);

        // Store user info in profiles table even if email confirmation is required
        try {
          await upsertProfile({
            id: data.user.id,
            email: data.user.email,
            user_metadata: data.user.user_metadata,
          });
          await ensureCaptionSettings(data.user.id);
        } catch (profileError) {
          console.error("Failed to create profile:", profileError);
          // Don't fail the sign up if profile creation fails
        }

        router.push("/auth/verify-email");
      }
    } catch (error: any) {
      console.error("Sign-up error:", error);
      const errorMessage = String(error?.message || "");
      if (
        errorMessage.includes("email_normalized_unique_idx") ||
        errorMessage.includes("already exists")
      ) {
        setAuthError(
          "This email address matches an existing account. Please sign in instead."
        );
      } else {
        setAuthError(
          error.message || "Failed to create account. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUpMode(!isSignUpMode);
    setAuthMessage(null);
    setAuthError(null);
    setAuthName("");
  };

  const requestPasswordResetForEmail = async (email: string) => {
    setAuthMessage(null);
    setAuthError(null);

    if (!email.trim()) {
      setAuthError("Enter your email address to reset your password.");
      return;
    }

    setIsResettingPassword(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (error) {
        throw error;
      }

      setAuthMessage(
        "Password reset email sent. Check your inbox for the reset link."
      );
    } catch (error: any) {
      console.error("Password reset error:", error);
      setAuthError(
        error.message || "Failed to send password reset email. Try again."
      );
    } finally {
      setIsResettingPassword(false);
    }
  };

  const requestPasswordReset = async () => {
    await requestPasswordResetForEmail(authEmail);
  };

  const handleUpdatePassword = async (newPassword: string) => {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("Password update error:", error);
      throw new Error(
        error.message || "Failed to update password. Please try again."
      );
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
    authPassword,
    authName,
    setAuthName,
    authMessage,
    authError,
    isLoading,
    isResettingPassword,
    isSignUpMode,
    setAuthEmail,
    setAuthPassword,
    toggleAuthMode,
    requestPasswordReset,
    requestPasswordResetForEmail,
    updatePassword: handleUpdatePassword,
    signIn: handleSignIn,
    signUp: handleSignUp,
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
