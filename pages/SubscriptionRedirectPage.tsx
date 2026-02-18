import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../providers/AuthProvider";
import { SubscriptionPlan } from "../types";
import { getMonthlyUsage } from "../services/usageService";
import { trackSubscriptionCompleted } from "../lib/analytics";
import { useSyncSubscription } from "../hooks/useSubscriptionApi";
import styles from "./SubscriptionRedirectPage.module.scss";

const SubscriptionRedirectPage: React.FC = () => {
  const { session, authStatus } = useAuth();
  const router = useRouter();
  const { paid, plan: urlPlan, session_id } = router.query;
  const [status, setStatus] = useState<
    "processing" | "success" | "error" | "unauthorized"
  >("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [planType, setPlanType] = useState<SubscriptionPlan | null>(null);
  const syncSubscriptionMutation = useSyncSubscription();

  useEffect(() => {
    if (
      authStatus === "checking" ||
      authStatus === "signed_out" ||
      !session?.user?.id ||
      !router.isReady
    ) {
      return;
    }

    const paidFlag = paid === "1" || paid === "true" || session_id;

    if (!paidFlag) {
      setStatus("error");
      setErrorMessage("No payment confirmation found.");
      setTimeout(() => router.replace("/dashboard"), 3000);
      return;
    }

    const plan: SubscriptionPlan | null =
      urlPlan &&
      typeof urlPlan === "string" &&
      ["basic", "pro", "business"].includes(urlPlan)
        ? (urlPlan as SubscriptionPlan)
        : null;

    if (plan) {
      setPlanType(plan);
    }

    if (!session_id || typeof session_id !== "string") {
      setStatus("error");
      setErrorMessage("Invalid session ID.");
      setTimeout(() => router.replace("/dashboard"), 3000);
      return;
    }

    const runSync = async () => {
      try {
        const result = await syncSubscriptionMutation.mutateAsync({
          sessionId: session_id,
          userId: session.user.id,
        });
        const syncedSubscription = result.subscription;
        const finalPlan = syncedSubscription.plan_type || plan;
        setPlanType(finalPlan ?? null);
        setStatus("success");

        if (finalPlan) {
          const planPrices: Record<SubscriptionPlan, number> = {
            free: 0,
            basic: 15,
            pro: 29,
            business: 79,
          };
          trackSubscriptionCompleted(
            finalPlan as SubscriptionPlan,
            planPrices[finalPlan as SubscriptionPlan]
          );
        }

        if (syncedSubscription.plan_type) {
          await getMonthlyUsage(
            session.user.id,
            syncedSubscription.plan_type as SubscriptionPlan
          );
        }

        setTimeout(() => router.replace("/dashboard"), 3000);
      } catch (error) {
        console.error("Error syncing subscription:", error);
        setStatus("error");
        setErrorMessage(
          (error as Error)?.message ??
            "Failed to sync subscription. Please contact support."
        );
        setTimeout(() => router.replace("/dashboard"), 5000);
      }
    };

    runSync();
  }, [authStatus, session?.user?.id, router, paid, urlPlan, session_id]);

  // Show loading state while checking auth
  if (authStatus === "checking") {
    return (
      <div className={styles["subscription-redirect"]}>
        <div className={styles["subscription-redirect__content"]}>
          <div className={styles["subscription-redirect__spinner"]} />
          <p>Checking your session...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized state
  if (authStatus === "signed_out") {
    return (
      <div className={styles["subscription-redirect"]}>
        <div className={styles["subscription-redirect__content"]}>
          <div
            className={`${styles["subscription-redirect__icon"]} ${styles["subscription-redirect__icon--error"]}`}
          >
            ⚠️
          </div>
          <h2>Authentication Required</h2>
          <p>Please sign in to complete your subscription.</p>
          <button
            className="primary-button"
            onClick={() => router.replace("/auth")}
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles["subscription-redirect"]}>
      <div className={styles["subscription-redirect__content"]}>
        {status === "processing" && (
          <>
            <div className={styles["subscription-redirect__spinner"]} />
            <h2>Activating Your Subscription</h2>
            <p>Please wait while we activate your subscription...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div
              className={`${styles["subscription-redirect__icon"]} ${styles["subscription-redirect__icon--success"]}`}
            >
              ✓
            </div>
            <h2>Subscription Activated!</h2>
            <p>
              Your {planType ? planType.toUpperCase() : ""} plan has been
              successfully activated.
            </p>
            <p className={styles["subscription-redirect__redirect"]}>
              Redirecting to dashboard...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div
              className={`${styles["subscription-redirect__icon"]} ${styles["subscription-redirect__icon--error"]}`}
            >
              ✕
            </div>
            <h2>Activation Failed</h2>
            <p>
              {errorMessage ||
                "An error occurred while activating your subscription."}
            </p>
            <p className={styles["subscription-redirect__redirect"]}>
              Redirecting to dashboard...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionRedirectPage;
