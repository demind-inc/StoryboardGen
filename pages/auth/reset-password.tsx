import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../providers/AuthProvider";
import styles from "./ResetPasswordPage.module.scss";

const ResetPasswordPage: React.FC = () => {
  const router = useRouter();
  const { authStatus, session, updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth status to be determined
    if (authStatus === "checking") {
      return;
    }

    // If user is not authenticated (no valid reset token), show error
    // Note: Supabase will automatically process the reset token from the URL
    // and establish a session via detectSessionInUrl
    if (authStatus === "signed_out" && !session) {
      // Give it a moment for Supabase to process the URL token
      const timer = setTimeout(() => {
        if (!session) {
          setError(
            "Invalid or expired reset link. Please request a new password reset."
          );
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [authStatus, session]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!newPassword.trim()) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await updatePassword(newPassword);
      setMessage(
        "Password updated successfully! Please sign in with your new password."
      );

      // Sign out the user for security (they should sign in with new password)
      // Redirect to auth page after a short delay
      setTimeout(() => {
        router.push("/auth");
      }, 2000);
    } catch (err: any) {
      console.error("Password update error:", err);
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking auth or waiting for session
  if (
    authStatus === "checking" ||
    (authStatus === "signed_out" && !session && !error)
  ) {
    return (
      <div className={styles["reset-password-page"]}>
        <div className={`${styles["reset-password-card"]} card card--gradient`}>
          <p className="text text--helper">Validating reset link...</p>
        </div>
      </div>
    );
  }

  // If no session and we've determined it's invalid, show error with link to request new reset
  if (authStatus === "signed_out" && !session && error) {
    return (
      <div className={styles["reset-password-page"]}>
        <div className={`${styles["reset-password-card"]} card card--gradient`}>
          <div className="brand">
            <div className="brand__icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2 1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="brand__title">StoryboardGen</h1>
          </div>
          <div
            className={`${styles["reset-password-alert"]} ${styles["reset-password-alert--error"]}`}
          >
            {error}
          </div>
          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <button
              type="button"
              onClick={() => router.push("/auth")}
              className="primary-button"
              style={{ width: "100%" }}
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles["reset-password-page"]}>
      <div className={`${styles["reset-password-card"]} card card--gradient`}>
        <div className="brand">
          <div className="brand__icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2 1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="brand__title">StoryboardGen</h1>
        </div>

        <h2 className={styles["reset-password-card__title"]}>
          Reset your password
        </h2>
        <p className={styles["reset-password-card__subtitle"]}>
          Enter your new password below. Make sure it's at least 6 characters
          long.
        </p>

        <form className={styles["reset-password-form"]} onSubmit={handleSubmit}>
          <label className="label" htmlFor="new-password">
            New Password
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password (min. 6 characters)"
            className="input"
            required
            autoComplete="new-password"
            minLength={6}
          />
          <label
            className="label"
            htmlFor="confirm-password"
            style={{ marginTop: "16px" }}
          >
            Confirm Password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="input"
            required
            autoComplete="new-password"
            minLength={6}
          />
          <button
            type="submit"
            className="primary-button"
            disabled={isLoading}
            style={{ width: "100%", marginTop: "16px" }}
          >
            {isLoading ? "Updating password..." : "Update Password"}
          </button>
        </form>

        {message && (
          <div
            className={`${styles["reset-password-alert"]} ${styles["reset-password-alert--success"]}`}
          >
            {message}
          </div>
        )}
        {error && (
          <div
            className={`${styles["reset-password-alert"]} ${styles["reset-password-alert--error"]}`}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
