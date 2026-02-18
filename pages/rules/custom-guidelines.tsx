import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { AppMode, RuleGroup, SubscriptionPlan } from "../../types";
import { useAuth } from "../../providers/AuthProvider";
import { useSubscription } from "../../providers/SubscriptionProvider";
import Sidebar from "../../components/Sidebar/Sidebar";
import { DEFAULT_CUSTOM_GUIDELINES } from "../../services/captionSettingsService";
import {
  useCaptionSettings,
  useUpdateCustomGuidelines,
} from "../../hooks/useCaptionSettingsService";
import styles from "./CustomGuidelines.module.scss";

const PLAN_PRICE_LABEL: Record<SubscriptionPlan, string> = {
  free: "Free",
  basic: "$15/mo",
  pro: "$29/mo",
  business: "$79/mo",
};

const DEFAULT_GUIDELINES = DEFAULT_CUSTOM_GUIDELINES;

const getNextCustomIndex = (rules: RuleGroup[]) => {
  const existing = rules
    .map((rule) => rule.name)
    .filter((name) => name.toLowerCase().startsWith("custom"))
    .map((name) => Number(name.replace(/[^0-9]/g, "")))
    .filter((value) => Number.isFinite(value));
  const maxIndex = existing.length ? Math.max(...existing) : 0;
  return maxIndex + 1;
};

const CustomGuidelinesPage: React.FC = () => {
  const { authStatus, displayEmail, signOut, session } = useAuth();
  const subscription = useSubscription();
  const router = useRouter();
  const mode: AppMode = "manual";
  const userId = session?.user?.id;
  const { data: captionSettings, isLoading: isCaptionSettingsLoading } = useCaptionSettings(userId);
  const updateGuidelinesMutation = useUpdateCustomGuidelines();
  const [guidelines, setGuidelines] =
    useState<RuleGroup[]>(DEFAULT_GUIDELINES);
  const [dirtyIndices, setDirtyIndices] = useState<Set<number>>(new Set());
  const lastInputRef = useRef<HTMLTextAreaElement>(null);
  const shouldFocusLastRef = useRef(false);
  const cancelSnapshotRef = useRef<{
    isNew?: boolean;
    name: string;
    rule: string;
  } | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const isSaving = updateGuidelinesMutation.isPending;

  useEffect(() => {
    if (captionSettings) {
      setGuidelines(captionSettings.guidelines);
      setDirtyIndices(new Set());
      setEditingIndex(null);
    }
  }, [captionSettings]);

  useEffect(() => {
    if (shouldFocusLastRef.current && guidelines.length > 0) {
      lastInputRef.current?.focus();
      shouldFocusLastRef.current = false;
    }
  }, [guidelines]);

  const handleGuidelineChange = (index: number, value: string) => {
    setGuidelines((prev) =>
      prev.map((rule, idx) =>
        idx === index ? { ...rule, rule: value } : rule
      )
    );
    setDirtyIndices((prev) => new Set(prev).add(index));
  };

  const handleGuidelineNameChange = (index: number, name: string) => {
    setGuidelines((prev) =>
      prev.map((rule, idx) => (idx === index ? { ...rule, name } : rule))
    );
    setDirtyIndices((prev) => new Set(prev).add(index));
  };

  const persistGuidelines = async (nextGuidelines: RuleGroup[]) => {
    if (!userId) return;
    try {
      await updateGuidelinesMutation.mutateAsync({
        userId,
        guidelines: nextGuidelines
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
      console.error("Failed to save custom guidelines:", error);
    }
  };

  const handleDeleteGuideline = (index: number) => {
    if (guidelines[index]?.isDefault) return;
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
    setEditingIndex((current) => {
      if (current === null) return null;
      if (current === index) return null;
      if (current > index) return current - 1;
      return current;
    });
    void persistGuidelines(nextGuidelines);
  };

  const handleAddGuideline = () => {
    cancelSnapshotRef.current = { isNew: true, name: "", rule: "" };
    setGuidelines((prev) => {
      const nextIndex = getNextCustomIndex(prev);
      const next = [
        ...prev,
        { name: `Custom ${nextIndex}`, rule: "", isDefault: false },
      ];
      setDirtyIndices((current) => new Set(current).add(next.length - 1));
      return next;
    });
    shouldFocusLastRef.current = true;
    setEditingIndex(guidelines.length);
  };

  const handleSaveGuideline = async (index: number) => {
    if (!session?.user?.id || !dirtyIndices.has(index)) return;
    await persistGuidelines(guidelines);
  };

  const handleEditGuideline = (index: number) => {
    if (guidelines[index]?.isDefault) return;
    cancelSnapshotRef.current = {
      name: guidelines[index].name ?? "",
      rule: guidelines[index].rule ?? "",
    };
    setEditingIndex(index);
  };

  const handleCancelGuideline = (index: number) => {
    const snap = cancelSnapshotRef.current;
    if (snap?.isNew) {
      setGuidelines((prev) => prev.filter((_, i) => i !== index));
      setDirtyIndices((prev) => {
        const next = new Set<number>();
        prev.forEach((dirtyIndex) => {
          if (dirtyIndex < index) next.add(dirtyIndex);
          if (dirtyIndex > index) next.add(dirtyIndex - 1);
        });
        return next;
      });
    } else if (snap) {
      setGuidelines((prev) =>
        prev.map((rule, i) =>
          i === index ? { ...rule, name: snap.name, rule: snap.rule } : rule
        )
      );
      setDirtyIndices((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
    cancelSnapshotRef.current = null;
    setEditingIndex(null);
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
        <p>Loading guidelines...</p>
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
            activePanel="customGuidelines"
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
              <p className={styles.eyebrow}>Custom Guidelines</p>
              <p className={styles.subtitle}>
                Manage brand-specific constraints and creative guardrails
              </p>
            </header>

            <section className={styles.rulesCard}>
              <h2>Guidelines</h2>
              <div className={`${styles.rulesList} custom-scrollbar`}>
                {guidelines.map((rule, index) => {
                  const isDefault = !!rule.isDefault;
                  const isEditing = editingIndex === index;
                  return (
                    <div key={index} className={styles.ruleRow}>
                      <div className={styles.ruleContent}>
                        {isDefault ? (
                          <p className={styles.ruleName}>{rule.name}</p>
                        ) : isEditing ? (
                          <input
                            type="text"
                            className={styles.ruleNameInput}
                            value={rule.name}
                            onChange={(e) =>
                              handleGuidelineNameChange(index, e.target.value)
                            }
                            aria-label={`Guideline ${index + 1} name`}
                            placeholder="Guideline name"
                          />
                        ) : (
                          <p className={styles.ruleName}>{rule.name}</p>
                        )}
                        <textarea
                          ref={
                            index === guidelines.length - 1
                              ? lastInputRef
                              : undefined
                          }
                          value={rule.rule}
                          onChange={(event) =>
                            handleGuidelineChange(index, event.target.value)
                          }
                          readOnly={!isEditing}
                          className={`${styles.ruleInput} ${
                            !isEditing ? styles.ruleInputReadonly : ""
                          }`}
                          aria-label={`Guideline ${index + 1}`}
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
                                onClick={() => handleEditGuideline(index)}
                                aria-label={`Edit guideline ${index + 1}`}
                                disabled={isSaving}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className={styles.deleteRule}
                                onClick={() => handleDeleteGuideline(index)}
                                aria-label={`Delete guideline ${index + 1}`}
                                disabled={isSaving}
                              >
                                Delete
                              </button>
                            </>
                          )}
                          {isEditing && (
                            <>
                              <button
                                type="button"
                                className={styles.cancelRule}
                                onClick={() => handleCancelGuideline(index)}
                                aria-label="Cancel editing"
                                disabled={isSaving}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className={styles.saveRule}
                                onClick={() => handleSaveGuideline(index)}
                                aria-label={isSaving ? "Saving guidelines" : "Save guidelines"}
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
                            </>
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
                onClick={handleAddGuideline}
                disabled={isSaving}
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
