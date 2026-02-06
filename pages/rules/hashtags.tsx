import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { AppMode, SubscriptionPlan } from "../../types";
import { useAuth } from "../../providers/AuthProvider";
import { useSubscription } from "../../providers/SubscriptionProvider";
import Sidebar from "../../components/Sidebar/Sidebar";
import { DEFAULT_HASHTAGS } from "../../services/captionSettingsService";
import {
  useCaptionSettings,
  useUpdateHashtags,
} from "../../hooks/useCaptionSettingsService";
import styles from "./Hashtags.module.scss";

const PLAN_PRICE_LABEL: Record<SubscriptionPlan, string> = {
  basic: "$15/mo",
  pro: "$29/mo",
  business: "$79/mo",
};

const normalizeTag = (value: string) => {
  const trimmed = value.trim().replace(/\s+/g, "");
  if (!trimmed) return "";
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
};

const HashtagsPage: React.FC = () => {
  const { authStatus, displayEmail, signOut, session } = useAuth();
  const subscription = useSubscription();
  const router = useRouter();
  const mode: AppMode = "manual";
  const userId = session?.user?.id;
  const { data: captionSettings, isLoading: isCaptionSettingsLoading } =
    useCaptionSettings(userId);
  const updateHashtagsMutation = useUpdateHashtags();
  const [hashtags, setHashtags] = useState<string[]>(DEFAULT_HASHTAGS);
  const [inputValue, setInputValue] = useState("");
  const isSaving = updateHashtagsMutation.isPending;

  useEffect(() => {
    if (captionSettings) {
      setHashtags(captionSettings.hashtags);
    }
  }, [captionSettings]);

  const hashtagSet = useMemo(
    () => new Set(hashtags.map((tag) => tag.toLowerCase())),
    [hashtags]
  );

  const persistHashtags = async (next: string[]) => {
    if (!userId) return;
    try {
      await updateHashtagsMutation.mutateAsync({ userId, hashtags: next });
    } catch (error) {
      console.error("Failed to save hashtags:", error);
    }
  };

  const handleAdd = async () => {
    const normalized = normalizeTag(inputValue);
    if (!normalized) return;
    if (hashtagSet.has(normalized.toLowerCase())) {
      setInputValue("");
      return;
    }
    const next = [...hashtags, normalized];
    setHashtags(next);
    setInputValue("");
    await persistHashtags(next);
  };

  const handleRemove = async (index: number) => {
    const next = hashtags.filter((_, i) => i !== index);
    setHashtags(next);
    await persistHashtags(next);
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
        <p>Loading hashtags...</p>
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
            activePanel="hashtags"
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
              <p className={styles.eyebrow}>Hashtags</p>
              <p className={styles.subtitle}>
                Manage the hashtag list used in caption generation
              </p>
            </header>

            <section className={styles.rulesCard}>
              <h2>Hashtags</h2>
              <div className={styles.addRow}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder="Add a hashtag (e.g. BrandStory)"
                  className={styles.addInput}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleAdd();
                    }
                  }}
                  disabled={isSaving}
                />
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={() => void handleAdd()}
                  disabled={!inputValue.trim() || isSaving}
                >
                  Add
                </button>
              </div>

              <div className={`${styles.tagList} custom-scrollbar`}>
                {hashtags.length === 0 ? (
                  <p className={styles.emptyState}>No hashtags yet.</p>
                ) : (
                  hashtags.map((tag, index) => (
                    <div key={`${tag}-${index}`} className={styles.tagRow}>
                      <span className={styles.tagText}>{tag}</span>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => void handleRemove(index)}
                        aria-label={`Delete ${tag}`}
                        disabled={isSaving}
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HashtagsPage;
