import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { AppMode, RuleGroup, SubscriptionPlan } from "../../types";
import { useAuth } from "../../providers/AuthProvider";
import { useSubscription } from "../../providers/SubscriptionProvider";
import Sidebar from "../../components/Sidebar/Sidebar";
import { DEFAULT_CAPTION_RULES } from "../../services/captionSettingsService";
import {
  useCaptionSettings,
  useUpdateCaptionRulesForPlatform,
} from "../../hooks/useCaptionSettingsService";
import styles from "./TikTokRules.module.scss";

const PLAN_PRICE_LABEL: Record<SubscriptionPlan, string> = {
  basic: "$15/mo",
  pro: "$29/mo",
  business: "$79/mo",
};

const DEFAULT_RULES = DEFAULT_CAPTION_RULES.tiktok;

const getNextCustomIndex = (rules: RuleGroup[]) => {
  const existing = rules
    .map((rule) => rule.name)
    .filter((name) => name.toLowerCase().startsWith("custom"))
    .map((name) => Number(name.replace(/[^0-9]/g, "")))
    .filter((value) => Number.isFinite(value));
  const maxIndex = existing.length ? Math.max(...existing) : 0;
  return maxIndex + 1;
};

const TikTokRulesPage: React.FC = () => {
  const { authStatus, displayEmail, signOut, session } = useAuth();
  const subscription = useSubscription();
  const router = useRouter();
  const mode: AppMode = "manual";
  const userId = session?.user?.id;
  const { data: captionSettings, isLoading: isCaptionSettingsLoading } = useCaptionSettings(userId);
  const updateRulesMutation = useUpdateCaptionRulesForPlatform();
  const [rules, setRules] = useState<RuleGroup[]>(DEFAULT_RULES);
  const [dirtyIndices, setDirtyIndices] = useState<Set<number>>(new Set());
  const lastInputRef = useRef<HTMLTextAreaElement>(null);
  const shouldFocusLastRef = useRef(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const isSaving = updateRulesMutation.isPending;

  useEffect(() => {
    if (captionSettings) {
      setRules(captionSettings.rules.tiktok);
      setDirtyIndices(new Set());
      setEditingIndex(null);
    }
  }, [captionSettings]);

  useEffect(() => {
    if (shouldFocusLastRef.current && rules.length > 0) {
      lastInputRef.current?.focus();
      shouldFocusLastRef.current = false;
    }
  }, [rules]);

  const handleRuleChange = (index: number, value: string) => {
    setRules((prev) =>
      prev.map((rule, idx) => (idx === index ? { ...rule, rule: value } : rule))
    );
    setDirtyIndices((prev) => new Set(prev).add(index));
  };

  const handleRuleNameChange = (index: number, name: string) => {
    setRules((prev) =>
      prev.map((rule, idx) => (idx === index ? { ...rule, name } : rule))
    );
    setDirtyIndices((prev) => new Set(prev).add(index));
  };

  const persistRules = async (nextRules: RuleGroup[]) => {
    if (!userId) return;
    try {
      await updateRulesMutation.mutateAsync({
        userId,
        platform: "tiktok",
        rules: nextRules
          .map((rule) => ({
            ...rule,
            name: rule.name?.trim() ?? "",
            rule: rule.rule.trim(),
          }))
          .filter((rule) => rule.rule.length > 0),
      });
      setDirtyIndices(new Set());
      setEditingIndex(null);
    } catch (error) {
      console.error("Failed to save caption rules:", error);
    }
  };

  const handleDeleteRule = (index: number) => {
    if (rules[index]?.isDefault) return;
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
    setEditingIndex((current) => {
      if (current === null) return null;
      if (current === index) return null;
      if (current > index) return current - 1;
      return current;
    });
    void persistRules(nextRules);
  };

  const handleAddRule = () => {
    setRules((prev) => {
      const nextIndex = getNextCustomIndex(prev);
      const next = [
        ...prev,
        { name: `Custom ${nextIndex}`, rule: "", isDefault: false },
      ];
      setDirtyIndices((current) => new Set(current).add(next.length - 1));
      return next;
    });
    shouldFocusLastRef.current = true;
    setEditingIndex(rules.length);
  };

  const handleSaveRule = async (index: number) => {
    if (!session?.user?.id || !dirtyIndices.has(index)) return;
    await persistRules(rules);
  };

  const handleEditRule = (index: number) => {
    if (rules[index]?.isDefault) return;
    setEditingIndex(index);
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

  if (userId && isCaptionSettingsLoading && !captionSettings) {
    return (
      <div className={styles.loading}>
        <div className={styles.loading__spinner} aria-hidden />
        <p>Loading rules...</p>
      </div>
    );
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
              } else if (panel === "projects") {
                router.push("/saved/project");
              }
            }}
            onOpenSettings={() => router.push("/settings")}
            displayEmail={displayEmail}
            isSubscribed={subscription.subscription?.isActive ?? false}
            subscriptionLabel={
              subscription.subscription?.planType
                ? subscription.subscription.planType.charAt(0).toUpperCase() +
                  subscription.subscription.planType.slice(1)
                : "Free"
            }
            subscriptionPrice={
              subscription.subscription?.planType
                ? PLAN_PRICE_LABEL[subscription.subscription.planType]
                : "—"
            }
            planType={subscription.planType}
            remainingCredits={subscription.usage?.remaining}
            totalCredits={subscription.usage?.monthlyLimit}
            expiredAt={subscription.subscription?.expiredAt ?? null}
            unsubscribedAt={subscription.subscription?.unsubscribedAt ?? null}
            subscriptionStatus={subscription.subscription?.status ?? null}
            onOpenBilling={() => router.push("/dashboard?openBilling=1")}
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
              <h2>Rules</h2>
              <div className={styles.rulesList}>
                {rules.map((rule, index) => {
                  const isDefault = !!rule.isDefault;
                  const isEditing = editingIndex === index;
                  return (
                    <div key={index} className={styles.ruleRow}>
                      <div className={styles.ruleContent}>
                        {isDefault ? (
                          <p className={styles.ruleName}>{rule.name}</p>
                        ) : (
                          <input
                            type="text"
                            className={styles.ruleNameInput}
                            value={rule.name}
                            onChange={(e) =>
                              handleRuleNameChange(index, e.target.value)
                            }
                            aria-label={`Rule ${index + 1} name`}
                            placeholder="Rule name"
                          />
                        )}
                        <textarea
                          ref={
                            index === rules.length - 1
                              ? lastInputRef
                              : undefined
                          }
                          value={rule.rule}
                          onChange={(event) =>
                            handleRuleChange(index, event.target.value)
                          }
                          readOnly={!isEditing}
                          className={`${styles.ruleInput} ${
                            !isEditing ? styles.ruleInputReadonly : ""
                          }`}
                          aria-label={`Rule ${index + 1}`}
                          rows={4}
                        />
                      </div>
                      {!isDefault && (
                        <div className={styles.ruleActions}>
                          {!isEditing && rule.rule.trim().length > 0 && (
                            <>
                              <button
                                type="button"
                                className={styles.editRule}
                                onClick={() => handleEditRule(index)}
                                aria-label={`Edit rule ${index + 1}`}
                                disabled={isSaving}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className={styles.deleteRule}
                                onClick={() => handleDeleteRule(index)}
                                aria-label={`Delete rule ${index + 1}`}
                                disabled={isSaving}
                              >
                                Delete
                              </button>
                            </>
                          )}
                          {isEditing && (
                            <button
                              type="button"
                              className={styles.saveRule}
                              onClick={() => handleSaveRule(index)}
                              aria-label={isSaving ? "Saving rules" : "Save rules"}
                              disabled={!dirtyIndices.has(index) || isSaving}
                            >
                              {isSaving ? (
                                <>
                                  <span className={styles.saveSpinner} aria-hidden />
                                  Saving
                                </>
                              ) : (
                                "Save"
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                className={styles.addRule}
                onClick={handleAddRule}
                disabled={isSaving}
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
