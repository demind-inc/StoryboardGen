import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { AppMode, SubscriptionPlan } from "../../types";
import { useAuth } from "../../providers/AuthProvider";
import Sidebar from "../../components/Sidebar/Sidebar";
import styles from "./CustomGuidelines.module.scss";

const PLAN_PRICE_LABEL: Record<SubscriptionPlan, string> = {
  basic: "$15/mo",
  pro: "$29/mo",
  business: "$79/mo",
};

const DEFAULT_GUIDELINES = [
  "Always show product in natural use context",
  "Maintain warm, approachable lighting",
  "Include diverse representation in scenes",
  "Avoid cluttered backgrounds",
];

const CustomGuidelinesPage: React.FC = () => {
  const { authStatus, displayEmail, signOut } = useAuth();
  const router = useRouter();
  const mode: AppMode = "manual";
  const [guidelines, setGuidelines] = useState<string[]>(DEFAULT_GUIDELINES);
  const lastInputRef = useRef<HTMLInputElement>(null);
  const shouldFocusLastRef = useRef(false);

  useEffect(() => {
    if (authStatus === "signed_out") {
      router.replace("/auth");
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (shouldFocusLastRef.current && guidelines.length > 0) {
      lastInputRef.current?.focus();
      shouldFocusLastRef.current = false;
    }
  }, [guidelines]);

  const handleGuidelineChange = (index: number, value: string) => {
    setGuidelines((prev) =>
      prev.map((rule, idx) => (idx === index ? value : rule))
    );
  };

  const handleDeleteGuideline = (index: number) => {
    setGuidelines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddGuideline = () => {
    setGuidelines((prev) => [...prev, "New guideline"]);
    shouldFocusLastRef.current = true;
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
            activePanel="customGuidelines"
            onPanelChange={(panel) => {
              if (panel === "manual") {
                router.push("/dashboard");
              } else if (panel === "saved") {
                router.push("/saved/image");
              }
            }}
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
              <p className={styles.eyebrow}>Custom Guidelines</p>
              <p className={styles.subtitle}>
                Manage brand-specific constraints and creative guardrails
              </p>
            </header>

            <section className={styles.rulesCard}>
              <h2>Guidelines</h2>
              <div className={styles.rulesList}>
                {guidelines.map((rule, index) => (
                  <div key={`${rule}-${index}`} className={styles.ruleRow}>
                    <input
                      ref={
                        index === guidelines.length - 1
                          ? lastInputRef
                          : undefined
                      }
                      value={rule}
                      onChange={(event) =>
                        handleGuidelineChange(index, event.target.value)
                      }
                      readOnly={false}
                      className={styles.ruleInput}
                      aria-label={`Guideline ${index + 1}`}
                    />
                    <button
                      type="button"
                      className={styles.deleteRule}
                      onClick={() => handleDeleteGuideline(index)}
                      aria-label={`Delete guideline ${index + 1}`}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={styles.addRule}
                onClick={handleAddGuideline}
              >
                Add Guideline
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomGuidelinesPage;
