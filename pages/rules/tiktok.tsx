import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { AppMode, SubscriptionPlan } from "../../types";
import { useAuth } from "../../providers/AuthProvider";
import Sidebar from "../../components/Sidebar/Sidebar";
import {
  getCaptionSettings,
  updateCaptionRulesForPlatform,
} from "../../services/captionSettingsService";
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
  const { authStatus, displayEmail, signOut, session } = useAuth();
  const router = useRouter();
  const mode: AppMode = "manual";
  const [rules, setRules] = useState<string[]>(DEFAULT_RULES);
  const [dirtyIndices, setDirtyIndices] = useState<Set<number>>(new Set());
  const [isListDirty, setIsListDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const lastInputRef = useRef<HTMLInputElement>(null);
  const shouldFocusLastRef = useRef(false);

  useEffect(() => {
    if (authStatus === "signed_out") {
      router.replace("/auth");
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus !== "signed_in" || !session?.user?.id) return;
    let isMounted = true;
    getCaptionSettings(session.user.id)
      .then((settings) => {
        if (!isMounted) return;
        setRules(settings.rules.tiktok);
        setDirtyIndices(new Set());
        setIsListDirty(false);
      })
      .catch((error) => {
        console.error("Failed to load caption rules:", error);
      });
    return () => {
      isMounted = false;
    };
  }, [authStatus, session?.user?.id]);

  useEffect(() => {
    if (shouldFocusLastRef.current && rules.length > 0) {
      lastInputRef.current?.focus();
      shouldFocusLastRef.current = false;
    }
  }, [rules]);

  const handleRuleChange = (index: number, value: string) => {
    setRules((prev) => prev.map((rule, idx) => (idx === index ? value : rule)));
    setDirtyIndices((prev) => new Set(prev).add(index));
  };

  const persistRules = async (nextRules: string[]) => {
    if (!session?.user?.id) return;
    setIsSaving(true);
    try {
      await updateCaptionRulesForPlatform(
        session.user.id,
        "tiktok",
        nextRules.map((rule) => rule.trim()).filter((rule) => rule.length > 0)
      );
      setDirtyIndices(new Set());
      setIsListDirty(false);
    } catch (error) {
      console.error("Failed to save caption rules:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRule = (index: number) => {
    const nextRules = rules.filter((_, i) => i !== index);
    setRules(nextRules);
    setDirtyIndices((prev) => {
      const next = new Set<number>();
      prev.forEach((dirtyIndex) => {
        if (dirtyIndex < index) next.add(dirtyIndex);
        if (dirtyIndex > index) next.add(dirtyIndex - 1);
      });
      return next;
    });
    void persistRules(nextRules);
  };

  const handleAddRule = () => {
    setRules((prev) => {
      const next = [...prev, ""];
      setDirtyIndices((current) => new Set(current).add(next.length - 1));
      return next;
    });
    shouldFocusLastRef.current = true;
    setIsListDirty(true);
  };

  const handleSaveRules = async () => {
    if (!session?.user?.id || (dirtyIndices.size === 0 && !isListDirty)) return;
    await persistRules(rules);
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
                  <div key={index} className={styles.ruleRow}>
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
                    {!isSaving && (
                      <button
                        type="button"
                        className={styles.deleteRule}
                        onClick={() => handleDeleteRule(index)}
                        aria-label={`Delete rule ${index + 1}`}
                      >
                        Delete
                      </button>
                    )}
                    {dirtyIndices.has(index) && !isSaving && (
                      <button
                        type="button"
                        className={styles.saveRule}
                        onClick={handleSaveRules}
                        aria-label="Save rules"
                      >
                        Save
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {isListDirty && !isSaving && (
                <button
                  type="button"
                  className={styles.saveRule}
                  onClick={handleSaveRules}
                >
                  Save Changes
                </button>
              )}
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
