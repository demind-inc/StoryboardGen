import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AppMode, SubscriptionPlan } from "../../types";
import { useAuth } from "../../providers/AuthProvider";
import Sidebar from "../../components/Sidebar/Sidebar";
import styles from "./InstagramRules.module.scss";

const PLAN_PRICE_LABEL: Record<SubscriptionPlan, string> = {
  basic: "$15/mo",
  pro: "$29/mo",
  business: "$79/mo",
};

const DEFAULT_RULES = [
  "Longer, educational captions",
  "Natural brand mention integration",
  "More hashtags allowed",
  "Hashtags at bottom of caption",
];

const InstagramRulesPage: React.FC = () => {
  const { authStatus, displayEmail, signOut } = useAuth();
  const router = useRouter();
  const mode: AppMode = "manual";
  const [rules, setRules] = useState<string[]>(DEFAULT_RULES);

  useEffect(() => {
    if (authStatus === "signed_out") {
      router.replace("/auth");
    }
  }, [authStatus, router]);

  const handleRuleChange = (index: number, value: string) => {
    setRules((prev) => prev.map((rule, idx) => (idx === index ? value : rule)));
  };

  const handleAddRule = () => {
    setRules((prev) => [...prev, "New rule"]);
  };

  const handleReset = () => {
    setRules(DEFAULT_RULES);
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
            activePanel="instagram"
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
              <p className={styles.eyebrow}>Instagram Rules</p>
              <p className={styles.subtitle}>
                Edit rules that govern Instagram caption generation
              </p>
            </header>

            <section className={styles.rulesCard}>
              <h2>Caption Rules</h2>
              <div className={styles.rulesList}>
                {rules.map((rule, index) => (
                  <div key={`${rule}-${index}`} className={styles.ruleRow}>
                    <input
                      value={rule}
                      onChange={(event) =>
                        handleRuleChange(index, event.target.value)
                      }
                      readOnly={false}
                      className={styles.ruleInput}
                    />
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

            <section className={styles.saveBar}>
              <button
                type="button"
                className={styles.resetButton}
                onClick={handleReset}
              >
                Reset
              </button>
              <button type="button" className={styles.saveButton}>
                Save
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InstagramRulesPage;
