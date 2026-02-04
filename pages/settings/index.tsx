import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { AppMode, SubscriptionPlan } from "../../types";
import { useAuth } from "../../providers/AuthProvider";
import { useUsage } from "../../hooks/useUsage";
import Sidebar from "../../components/Sidebar/Sidebar";
import styles from "./SettingsPage.module.scss";

const PLAN_PRICE_LABEL: Record<SubscriptionPlan, string> = {
  basic: "$15/mo",
  pro: "$29/mo",
  business: "$79/mo",
};

function formatRenewalDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

const SettingsPage: React.FC = () => {
  const {
    authStatus,
    displayEmail,
    signOut,
    session,
    requestPasswordResetForEmail,
    authMessage,
    authError,
    isResettingPassword,
  } = useAuth();
  const router = useRouter();
  const mode: AppMode = "manual";
  const [isCanceling, setIsCanceling] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const userId = session?.user?.id;
  const {
    usage,
    subscription,
    planType,
    isSubscriptionLoading,
    isUsageLoading,
    refreshUsage,
    refreshSubscription,
  } = useUsage(userId, authStatus);

  useEffect(() => {
    if (authStatus === "signed_out") {
      router.replace("/auth");
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus === "signed_in" && userId) {
      refreshSubscription(userId);
      refreshUsage(userId);
    }
  }, [authStatus, userId, refreshSubscription, refreshUsage]);

  const displayName = useMemo(() => {
    const metadata = session?.user?.user_metadata ?? {};
    return metadata.full_name || metadata.name || "Not set";
  }, [session?.user?.user_metadata]);

  const handleCancelSubscription = async () => {
    if (!userId) return;
    setIsCancelConfirmOpen(false);
    setCancelMessage(null);
    setIsCanceling(true);
    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCancelMessage({
          type: "error",
          text: data?.error ?? "Failed to cancel subscription",
        });
        return;
      }
      setCancelMessage({
        type: "success",
        text: data?.message ?? "Subscription canceled.",
      });
      await refreshSubscription(userId);
      await refreshUsage(userId);
    } catch (e) {
      setCancelMessage({
        type: "error",
        text: "Failed to cancel subscription. Please try again.",
      });
    } finally {
      setIsCanceling(false);
    }
  };

  if (authStatus === "checking") {
    return (
      <div className={styles.loading}>
        <p>Checking your session...</p>
      </div>
    );
  }

  if (authStatus !== "signed_in") {
    return null;
  }

  return (
    <div className="app">
      <main className={`app__body ${styles.body}`}>
        <div className="app__content">
          <Sidebar
            mode={mode}
            onModeChange={() => {}}
            activePanel="settings"
            onPanelChange={() => {}}
            onOpenSettings={() => router.push("/settings")}
            displayEmail={displayEmail}
            isSubscribed={subscription?.isActive ?? false}
            subscriptionLabel={
              subscription?.planType
                ? subscription.planType.charAt(0).toUpperCase() +
                  subscription.planType.slice(1)
                : "Free"
            }
            subscriptionPrice={
              subscription?.planType
                ? PLAN_PRICE_LABEL[subscription.planType]
                : "—"
            }
            planType={planType}
            remainingCredits={usage?.remaining}
            totalCredits={usage?.monthlyLimit}
            expiredAt={subscription?.expiredAt ?? null}
            unsubscribedAt={subscription?.unsubscribedAt ?? null}
            subscriptionStatus={subscription?.status ?? null}
            onOpenBilling={() => router.push("/dashboard?openBilling=1")}
            onCancelSubscription={() => {}}
            onSignOut={signOut}
          />

          <div className={styles.main}>
            <header className={styles.header}>
              <p className={styles.eyebrow}>Account</p>
              <p className={styles.subtitle}>
                Manage your account, plan, and preferences
              </p>
            </header>

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Account</h2>
              </div>
              <div className={styles.accountGrid}>
                <div>
                  <span className={styles.label}>Email</span>
                  <span className={styles.value}>{displayEmail}</span>
                </div>
                <div>
                  <span className={styles.label}>Name</span>
                  <span className={styles.value}>{displayName}</span>
                </div>
              </div>
              <div className={styles.cardActions}>
                <button
                  className={styles.actionButton}
                  onClick={() => requestPasswordResetForEmail(displayEmail)}
                  disabled={isResettingPassword}
                >
                  {isResettingPassword ? "Sending link..." : "Change Password"}
                </button>
                {authMessage ? (
                  <span className={styles.statusMessage}>{authMessage}</span>
                ) : null}
                {authError ? (
                  <span className={styles.statusError}>{authError}</span>
                ) : null}
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Subscription</h2>
              </div>
              <div className={styles.subscriptionGrid}>
                <div>
                  <span className={styles.label}>Current Plan</span>
                  <span className={styles.value}>
                    {isSubscriptionLoading
                      ? "Loading..."
                      : subscription?.planType
                      ? `${subscription.planType
                          .charAt(0)
                          .toUpperCase()}${subscription.planType.slice(1)} Plan`
                      : "Free Plan"}
                  </span>
                </div>
                <div>
                  <span className={styles.label}>Renewal</span>
                  <span className={styles.value}>
                    {isSubscriptionLoading
                      ? "Loading..."
                      : subscription?.currentPeriodEnd
                      ? `Monthly · Renews ${formatRenewalDate(
                          subscription.currentPeriodEnd
                        )}`
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className={styles.label}>Usage</span>
                  <span className={styles.value}>
                    {isUsageLoading
                      ? "Loading..."
                      : usage != null
                      ? `${usage.used} / ${usage.monthlyLimit} credits used this month`
                      : "—"}
                  </span>
                </div>
              </div>
              <div className={styles.cardActions}>
                {subscription?.isActive ? (
                  <>
                    <button
                        type="button"
                        className={styles.actionButton}
                        onClick={() => setIsCancelConfirmOpen(true)}
                        disabled={isCanceling}
                      >
                        {isCanceling ? "Canceling..." : "Cancel subscription"}
                      </button>
                    {cancelMessage && (
                      <span
                        className={
                          cancelMessage.type === "success"
                            ? styles.statusMessage
                            : styles.statusError
                        }
                      >
                        {cancelMessage.text}
                      </span>
                    )}
                  </>
                ) : null}
              </div>
            </section>

            {/* <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Preferences</h2>
              </div>
              <div className={styles.preferences}>
                <div className={styles.prefRow}>
                  <span className={styles.prefLabel}>Email notifications</span>
                  <button
                    type="button"
                    className={`${styles.toggle} ${
                      emailNotifications ? styles.toggleOn : styles.toggleOff
                    }`}
                    onClick={() =>
                      setEmailNotifications((value) => !value)
                    }
                    aria-pressed={emailNotifications}
                  >
                    <span className={styles.toggleKnob} />
                  </button>
                </div>
                <div className={styles.prefRow}>
                  <span className={styles.prefLabel}>Product updates</span>
                  <button
                    type="button"
                    className={`${styles.toggle} ${
                      productUpdates ? styles.toggleOn : styles.toggleOff
                    }`}
                    onClick={() => setProductUpdates((value) => !value)}
                    aria-pressed={productUpdates}
                  >
                    <span className={styles.toggleKnob} />
                  </button>
                </div>
                <div className={styles.prefRow}>
                  <span className={styles.prefLabel}>Weekly tips</span>
                  <button
                    type="button"
                    className={`${styles.toggle} ${
                      weeklyTips ? styles.toggleOn : styles.toggleOff
                    }`}
                    onClick={() => setWeeklyTips((value) => !value)}
                    aria-pressed={weeklyTips}
                  >
                    <span className={styles.toggleKnob} />
                  </button>
                </div>
              </div>
            </section> */}

            {/* <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Billing &amp; invoices</h2>
              </div>
              <div className={styles.billingRow}>
                <div>
                  <span className={styles.label}>
                    Download past invoices and update payment method
                  </span>
                </div>
                <div className={styles.cardActions}>
                  <button className={styles.actionButton}>View Billing</button>
                </div>
              </div>
            </section> */}
          </div>
        </div>
      </main>

      {isCancelConfirmOpen && (
        <div
          className={styles.confirmOverlay}
          onClick={() => setIsCancelConfirmOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-cancel-title"
        >
          <div
            className={styles.confirmModal}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-cancel-title" className={styles.confirmTitle}>
              Cancel subscription?
            </h2>
            <p className={styles.confirmMessage}>
              Are you sure you want to cancel your subscription? You will keep
              access until the end of your billing period.
            </p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => setIsCancelConfirmOpen(false)}
              >
                Keep subscription
              </button>
              <button
                type="button"
                className={styles.actionButtonDanger}
                onClick={handleCancelSubscription}
                disabled={isCanceling}
              >
                {isCanceling ? "Canceling..." : "Cancel subscription"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
