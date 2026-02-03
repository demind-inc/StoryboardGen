import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { AppMode, SubscriptionPlan } from "../../types";
import { useAuth } from "../../providers/AuthProvider";
import Sidebar from "../../components/Sidebar/Sidebar";
import styles from "./TikTokRules.module.scss";

const PLAN_PRICE_LABEL: Record<SubscriptionPlan, string> = {
  basic: "$15/mo",
  pro: "$29/mo",
  business: "$79/mo",
};

const DEFAULT_RULES = [
  "Slightly long captions with line breaks",
  "Natural brand mention integration",
  "Exactly 5 approved hashtags",
];

const TikTokRulesPage: React.FC = () => {
  const { authStatus, displayEmail, signOut } = useAuth();
  const router = useRouter();
  const mode: AppMode = "manual";
  const [rules, setRules] = useState<string[]>(DEFAULT_RULES);
  const lastInputRef = useRef<HTMLInputElement>(null);
  const shouldFocusLastRef = useRef(false);

  useEffect(() => {
    if (authStatus === "signed_out") {
      router.replace("/auth");
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (shouldFocusLastRef.current && rules.length > 0) {
      lastInputRef.current?.focus();
      shouldFocusLastRef.current = false;
    }
  }, [rules]);

  const handleRuleChange = (index: number, value: string) => {
    setRules((prev) => prev.map((rule, idx) => (idx === index ? value : rule)));
  };

  const handleDeleteRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddRule = () => {
    setRules((prev) => [...prev, "New rule"]);
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
            activePanel="tiktok"
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
              <p className={styles.eyebrow}>TikTok Rules</p>
              <p className={styles.subtitle}>
                Edit rules that govern TikTok caption generation
              </p>
            </header>

            <section className={styles.rulesCard}>
              <h2>Caption Rules</h2>
              <div className={styles.rulesList}>
                {rules.map((rule, index) => (
                  <div key={`${rule}-${index}`} className={styles.ruleRow}>
                    <input
                      ref={
                        index === rules.length - 1 ? lastInputRef : undefined
                      }
                      value={rule}
                      onChange={(event) =>
                        handleRuleChange(index, event.target.value)
                      }
                      readOnly={false}
                      className={styles.ruleInput}
                      aria-label={`Rule ${index + 1}`}
                    />
                    <button
                      type="button"
                      className={styles.deleteRule}
                      onClick={() => handleDeleteRule(index)}
                      aria-label={`Delete rule ${index + 1}`}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={styles.addRule}
                onClick={handleAddRule}
              >
                Add Rule
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TikTokRulesPage;
