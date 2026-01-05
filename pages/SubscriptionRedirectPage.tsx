import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../providers/AuthProvider";
import { SubscriptionPlan } from "../types";
import {
  activateSubscription,
  getSubscription,
} from "../services/subscriptionService";
import { getMonthlyUsage } from "../services/usageService";

const SubscriptionRedirectPage: React.FC = () => {
  const { session, authStatus } = useAuth();
  const router = useRouter();
  const { paid, plan: urlPlan, session_id } = router.query;
  const [status, setStatus] = useState<
    "processing" | "success" | "error" | "unauthorized"
  >("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [planType, setPlanType] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    // Redirect to auth if not signed in
    if (authStatus === "signed_out") {
      router.replace("/auth");
      return;
    }

    // Wait for auth check or router to be ready
    if (authStatus === "checking" || !session?.user?.id || !router.isReady) {
      return;
    }

    const processSubscription = async () => {
      try {
        // Check for payment confirmation parameters
        const paidFlag = paid === "1" || paid === "true" || session_id;

        if (!paidFlag) {
          setStatus("error");
          setErrorMessage("No payment confirmation found.");
          setTimeout(() => {
            router.replace("/dashboard");
          }, 3000);
          return;
        }

        // Get plan from URL or default to basic
        const plan: SubscriptionPlan =
          urlPlan &&
          typeof urlPlan === "string" &&
          ["basic", "pro", "business"].includes(urlPlan)
            ? (urlPlan as SubscriptionPlan)
            : "basic";

        setPlanType(plan);

        // Get session ID if available
        const sessionId =
          typeof session_id === "string" ? session_id : undefined;

        // Call backend API to activate subscription
        const response = await fetch("/api/subscription/redirect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: session.user.id,
            plan,
            sessionId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to activate subscription");
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error("Subscription activation failed");
        }

        // Verify subscription was activated
        const subscription = await getSubscription(session.user.id);
        if (!subscription?.isActive) {
          throw new Error("Subscription activation failed verification");
        }

        // Refresh usage to reflect new subscription
        await getMonthlyUsage(session.user.id, plan);

        setStatus("success");

        // Redirect to dashboard after showing success message
        setTimeout(() => {
          router.replace("/dashboard");
        }, 3000);
      } catch (error: any) {
        console.error("Failed to activate subscription:", error);
        setStatus("error");
        setErrorMessage(
          error.message ||
            "Failed to activate subscription. Please contact support."
        );
        setTimeout(() => {
          router.replace("/dashboard");
        }, 5000);
      }
    };

    processSubscription();
  }, [authStatus, session?.user?.id, router, paid, urlPlan, session_id]);

  // Show loading state while checking auth
  if (authStatus === "checking") {
    return (
      <div className="subscription-redirect">
        <div className="subscription-redirect__content">
          <div className="subscription-redirect__spinner" />
          <p>Checking your session...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized state
  if (authStatus === "signed_out") {
    return (
      <div className="subscription-redirect">
        <div className="subscription-redirect__content">
          <div className="subscription-redirect__icon subscription-redirect__icon--error">
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
    <div className="subscription-redirect">
      <div className="subscription-redirect__content">
        {status === "processing" && (
          <>
            <div className="subscription-redirect__spinner" />
            <h2>Activating Your Subscription</h2>
            <p>Please wait while we activate your subscription...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="subscription-redirect__icon subscription-redirect__icon--success">
              ✓
            </div>
            <h2>Subscription Activated!</h2>
            <p>
              Your {planType ? planType.toUpperCase() : ""} plan has been
              successfully activated.
            </p>
            <p className="subscription-redirect__redirect">
              Redirecting to dashboard...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="subscription-redirect__icon subscription-redirect__icon--error">
              ✕
            </div>
            <h2>Activation Failed</h2>
            <p>
              {errorMessage ||
                "An error occurred while activating your subscription."}
            </p>
            <p className="subscription-redirect__redirect">
              Redirecting to dashboard...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionRedirectPage;
