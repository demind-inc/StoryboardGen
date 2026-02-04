import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { AppMode, SubscriptionPlan } from "../../types";
import { useAuth } from "../../providers/AuthProvider";
import Sidebar from "../../components/Sidebar/Sidebar";
import {
  DEFAULT_CUSTOM_GUIDELINES,
  getCaptionSettings,
  updateCustomGuidelines,
} from "../../services/captionSettingsService";
import styles from "./CustomGuidelines.module.scss";

const PLAN_PRICE_LABEL: Record<SubscriptionPlan, string> = {
  basic: "$15/mo",
  pro: "$29/mo",
  business: "$79/mo",
};

const CustomGuidelinesPage: React.FC = () => {
  const { authStatus, displayEmail, signOut, session } = useAuth();
  const router = useRouter();
  const mode: AppMode = "manual";
  const [guidelines, setGuidelines] = useState<string[]>(
    DEFAULT_CUSTOM_GUIDELINES
  );
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
        setGuidelines(settings.guidelines);
        setDirtyIndices(new Set());
        setIsListDirty(false);
      })
      .catch((error) => {
        console.error("Failed to load custom guidelines:", error);
      });
    return () => {
      isMounted = false;
    };
  }, [authStatus, session?.user?.id]);

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
    setDirtyIndices((prev) => new Set(prev).add(index));
  };

  const persistGuidelines = async (nextGuidelines: string[]) => {
    if (!session?.user?.id) return;
    const previousDirty = new Set(dirtyIndices);
    const previousIsListDirty = isListDirty;
    setIsSaving(true);
    setDirtyIndices(new Set());
    setIsListDirty(false);
    try {
      await updateCustomGuidelines(
        session.user.id,
        nextGuidelines
          .map((rule) => rule.trim())
          .filter((rule) => rule.length > 0)
      );
    } catch (error) {
      console.error("Failed to save custom guidelines:", error);
      setDirtyIndices(previousDirty);
      setIsListDirty(previousIsListDirty);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGuideline = (index: number) => {
    const nextGuidelines = guidelines.filter((_, i) => i !== index);
    setGuidelines(nextGuidelines);
    setDirtyIndices((prev) => {
      const next = new Set<number>();
      prev.forEach((dirtyIndex) => {
        if (dirtyIndex < index) next.add(dirtyIndex);
        if (dirtyIndex > index) next.add(dirtyIndex - 1);
      });
      return next;
    });
    void persistGuidelines(nextGuidelines);
  };

  const handleAddGuideline = () => {
    setGuidelines((prev) => {
      const next = [...prev, ""];
      setDirtyIndices((current) => new Set(current).add(next.length - 1));
      return next;
    });
    shouldFocusLastRef.current = true;
    setIsListDirty(true);
  };

  const handleSaveGuidelines = async () => {
    if (!session?.user?.id || (dirtyIndices.size === 0 && !isListDirty)) return;
    await persistGuidelines(guidelines);
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
              <div className={`${styles.rulesList} custom-scrollbar`}>
                {guidelines.map((rule, index) => (
                  <div key={index} className={styles.ruleRow}>
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
                    {!isSaving && (
                      <button
                        type="button"
                        className={styles.deleteRule}
                        onClick={() => handleDeleteGuideline(index)}
                        aria-label={`Delete guideline ${index + 1}`}
                      >
                        Delete
                      </button>
                    )}
                    {dirtyIndices.has(index) && !isSaving && (
                      <button
                        type="button"
                        className={styles.saveRule}
                        onClick={handleSaveGuidelines}
                        aria-label="Save guidelines"
                      >
                        Save
                      </button>
                    )}
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
