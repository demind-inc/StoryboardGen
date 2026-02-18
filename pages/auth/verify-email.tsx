import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../providers/AuthProvider";
import styles from "./VerifyEmailPage.module.scss";

const VerifyEmailPage: React.FC = () => {
  const router = useRouter();
  const { authStatus, profile } = useAuth();

  useEffect(() => {
    if (authStatus === "signed_in") {
      router.replace("/dashboard");
    }
  }, [authStatus, router]);

  if (authStatus === "checking") {
    return (
      <div className={styles["verify-email-page"]}>
        <div
          className={`${styles["verify-email-card"]} card card--gradient`}
          style={{ textAlign: "center" }}
        >
          <p className="text text--helper">Checking your session...</p>
        </div>
      </div>
    );
  }

  const displayEmail = profile?.email ?? "";

  return (
    <div className={styles["verify-email-page"]}>
      <div className={`${styles["verify-email-card"]} card card--gradient`}>
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="brand__title">StoryboardGen</h1>
        </div>

        <h2 className={styles["verify-email-card__title"]}>
          Check your email
        </h2>
        <p className={styles["verify-email-card__subtitle"]}>
          {displayEmail
            ? `We sent a verification link to ${displayEmail}. Click the link in that email to verify your account and sign in.`
            : "We sent a verification link to your email address. Click the link in that email to verify your account and sign in."}
        </p>
        <p className="text text--helper" style={{ marginTop: 0 }}>
          You can close this page after checking your email. Once verified, sign
          in on the auth page to access your dashboard.
        </p>
        <div className={styles["verify-email-actions"]}>
          <button
            type="button"
            onClick={() => router.push("/auth")}
            className="primary-button"
            style={{ width: "100%" }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
