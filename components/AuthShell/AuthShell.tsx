import React, { useMemo, useState } from "react";
import { AuthStatus } from "../../types";
import styles from "./AuthShell.module.scss";

interface AuthShellProps {
  authEmail: string;
  authPassword: string;
  authName: string;
  authMessage: string | null;
  authError: string | null;
  authStatus: AuthStatus;
  isLoading: boolean;
  isResettingPassword: boolean;
  isSignUpMode: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onToggleAuthMode: () => void;
  onRequestPasswordReset: () => void;
  onSignIn: (event: React.FormEvent<HTMLFormElement>) => void;
  onSignUp: (event: React.FormEvent<HTMLFormElement>) => void;
}

const AuthShell: React.FC<AuthShellProps> = ({
  authEmail,
  authPassword,
  authName,
  authMessage,
  authError,
  authStatus,
  isLoading,
  isResettingPassword,
  isSignUpMode,
  onEmailChange,
  onPasswordChange,
  onNameChange,
  onToggleAuthMode,
  onRequestPasswordReset,
  onSignIn,
  onSignUp,
}) => {
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const subtitle = useMemo(() => {
    if (isSignUpMode) {
      return "Sign up with your email and password. We will save your account details into the profiles table when you sign up.";
    }
    return "Enter your email and password to sign in. We will save your account details into the profiles table when you sign in.";
  }, [isSignUpMode]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (isSignUpMode) {
      if (confirmPassword.trim() !== authPassword.trim()) {
        event.preventDefault();
        setLocalError("Passwords do not match.");
        return;
      }
    }

    setLocalError(null);
    if (isSignUpMode) {
      onSignUp(event);
    } else {
      onSignIn(event);
    }
  };

  const handleToggleMode = () => {
    setLocalError(null);
    setConfirmPassword("");
    onToggleAuthMode();
  };

  return (
    // <div className={styles["auth-shell"]}>
    <div className={styles["auth-card"]}>
      <div className={styles["brand"]}>
        <div className={styles["brand__mark"]}>
          <img
            src="/assets/images/logo.png"
            alt="StoryboardGen Logo"
            className={styles["brand__logo"]}
          />
        </div>
        <span className={styles["brand__text"]}>StoryboardGen</span>
      </div>

      <h2 className={styles["auth-card__title"]}>
        {isSignUpMode ? "Create your account" : "Sign in to your account"}
      </h2>
      <p className={styles["auth-card__subtitle"]}>{subtitle}</p>

      <form className={styles["auth-form"]} onSubmit={handleSubmit}>
        {isSignUpMode && (
          <>
            <label className={styles["auth-label"]} htmlFor="auth-name">
              FULL NAME
            </label>
            <input
              id="auth-name"
              type="text"
              value={authName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Your name"
              className={styles["auth-input"]}
              autoComplete="name"
            />
          </>
        )}
        <label className={styles["auth-label"]} htmlFor="auth-email">
          EMAIL
        </label>
        <input
          id="auth-email"
          type="email"
          value={authEmail}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="you@example.com"
          className={styles["auth-input"]}
          required
          autoComplete="email"
        />
        <label className={styles["auth-label"]} htmlFor="auth-password">
          PASSWORD
        </label>
        <input
          id="auth-password"
          type="password"
          value={authPassword}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="Enter your password"
          className={styles["auth-input"]}
          required
          autoComplete={isSignUpMode ? "new-password" : "current-password"}
          minLength={6}
        />

        {isSignUpMode && (
          <>
            <label className={styles["auth-label"]} htmlFor="auth-confirm">
              CONFIRM PASSWORD
            </label>
            <input
              id="auth-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className={styles["auth-input"]}
              required
              autoComplete="new-password"
              minLength={6}
            />
          </>
        )}

        {!isSignUpMode && (
          <div className={styles["auth-forgot"]}>
            <button
              type="button"
              onClick={onRequestPasswordReset}
              disabled={isResettingPassword}
              className={styles["auth-link"]}
            >
              {isResettingPassword
                ? "Sending reset email..."
                : "Forgot password?"}
            </button>
          </div>
        )}

        <button
          type="submit"
          className={styles["auth-submit"]}
          disabled={isLoading}
        >
          {isLoading
            ? isSignUpMode
              ? "Creating account..."
              : "Signing in..."
            : isSignUpMode
            ? "Create account"
            : "Sign in"}
        </button>
        {isSignUpMode && (
          <p className={styles["auth-terms"]}>
            By creating an account, you agree to the Terms.
          </p>
        )}
      </form>

      <div className={styles["auth-footer"]}>
        {isSignUpMode ? (
          <>
            <span className={styles["auth-footer__label"]}>
              ALREADY HAVE AN ACCOUNT?
            </span>
            <button
              type="button"
              onClick={handleToggleMode}
              className={styles["auth-footer__link"]}
            >
              Sign in
            </button>
          </>
        ) : (
          <>
            <span className={styles["auth-footer__label"]}>
              DON'T HAVE AN ACCOUNT?
            </span>
            <button
              type="button"
              onClick={handleToggleMode}
              className={styles["auth-footer__link"]}
            >
              Sign up
            </button>
          </>
        )}
      </div>

      {authMessage && (
        <div
          className={`${styles["auth-alert"]} ${styles["auth-alert--success"]}`}
        >
          {authMessage}
        </div>
      )}
      {authError && (
        <div
          className={`${styles["auth-alert"]} ${styles["auth-alert--error"]}`}
        >
          {authError}
        </div>
      )}
      {localError && (
        <div
          className={`${styles["auth-alert"]} ${styles["auth-alert--error"]}`}
        >
          {localError}
        </div>
      )}
      {authStatus === "checking" && !authError && (
        <p className={styles["auth-helper"]}>Checking your session...</p>
      )}
    </div>
    // </div>
  );
};

export default AuthShell;
