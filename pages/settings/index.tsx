import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { AppMode, SubscriptionPlan } from "../../types";
import { useAuth } from "../../providers/AuthProvider";
import Sidebar from "../../components/Sidebar/Sidebar";
import styles from "./SettingsPage.module.scss";

const PLAN_PRICE_LABEL: Record<SubscriptionPlan, string> = {
  basic: "$15/mo",
  pro: "$29/mo",
  business: "$79/mo",
};

const SettingsPage: React.FC = () => {
  const { authStatus, displayEmail, signOut, session } = useAuth();
  const router = useRouter();
  const mode: AppMode = "manual";
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);
  const [weeklyTips, setWeeklyTips] = useState(false);

  useEffect(() => {
    if (authStatus === "signed_out") {
      router.replace("/auth");
    }
  }, [authStatus, router]);

  const displayName = useMemo(() => {
    const metadata = session?.user?.user_metadata ?? {};
    return metadata.full_name || metadata.name || "Not set";
  }, [session?.user?.user_metadata]);

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
            isSubscribed={false}
            subscriptionLabel={"Free"}
            subscriptionPrice={PLAN_PRICE_LABEL.basic}
            planType={undefined}
            remainingCredits={undefined}
            totalCredits={undefined}
            expiredAt={null}
            unsubscribedAt={null}
            subscriptionStatus={null}
            onOpenBilling={() => {}}
            onCancelSubscription={() => {}}
            onSignOut={signOut}
          />

          <div className={styles.main}>
            <header className={styles.header}>
              <p className={styles.eyebrow}>Settings</p>
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
                <div className={styles.cardActions}>
                  <button className={styles.actionButton}>Change Password</button>
                </div>
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Subscription</h2>
              </div>
              <div className={styles.subscriptionGrid}>
                <div>
                  <span className={styles.label}>Current Plan</span>
                  <span className={styles.value}>Free Plan</span>
                </div>
                <div>
                  <span className={styles.label}>Renewal</span>
                  <span className={styles.value}>
                    Monthly · Renews Mar 01, 2026
                  </span>
                </div>
                <div className={styles.cardActions}>
                  <button className={styles.actionButtonPrimary}>
                    Manage Plan
                  </button>
                </div>
                <div>
                  <span className={styles.label}>Usage</span>
                  <span className={styles.value}>
                    0 / 3 images used this month
                  </span>
                </div>
              </div>
            </section>

            <section className={styles.card}>
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
            </section>

            <section className={styles.card}>
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
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
