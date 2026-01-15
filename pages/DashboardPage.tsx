import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  AppMode,
  ImageSize,
  SubscriptionPlan,
  PromptPreset,
  ReferenceSet,
} from "../types";
import { useAuth } from "../providers/AuthProvider";
import {
  DEFAULT_MONTHLY_CREDITS,
  PLAN_CREDITS,
} from "../services/usageService";
import {
  fetchPromptLibrary,
  fetchReferenceLibrary,
  saveReferenceImages,
  savePromptPreset,
} from "../services/libraryService";
import PaymentModal from "../components/PaymentModal/PaymentModal";
import Sidebar, { PanelKey } from "../components/Sidebar/Sidebar";
import Results from "../components/Results/Results";
import ReferenceLibraryModal from "../components/DatasetModal/ReferenceLibraryModal";
import PromptLibraryModal from "../components/DatasetModal/PromptLibraryModal";
import NameCaptureModal from "../components/DatasetModal/NameCaptureModal";
import SavedImagesPanel from "../components/Library/SavedImagesPanel";
import SavedPromptsPanel from "../components/Library/SavedPromptsPanel";
import DashboardSummary from "../components/Dashboard/DashboardSummary";
import ReferencesSection from "../components/Dashboard/ReferencesSection";
import PromptsSection from "../components/Dashboard/PromptsSection";
import { useReferences } from "../hooks/useReferences";
import { usePrompts } from "../hooks/usePrompts";
import { useImageGeneration } from "../hooks/useImageGeneration";
import { useModals } from "../hooks/useModals";
import { useUsage } from "../hooks/useUsage";

const DashboardPage: React.FC = () => {
  const { session, authStatus, displayEmail, signOut } = useAuth();
  const router = useRouter();

  const FREE_CREDIT_CAP = 3;
  const PLAN_PRICE_LABEL: Record<SubscriptionPlan, string> = {
    basic: "$15/mo",
    pro: "$29/mo",
    business: "$79/mo",
  };

  const [activePanel, setActivePanel] = useState<PanelKey>("manual");
  const [referenceLibrary, setReferenceLibrary] = useState<ReferenceSet[]>([]);
  const [promptLibrary, setPromptLibrary] = useState<PromptPreset[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [size, setSize] = useState<ImageSize>("1K");
  const [librarySort, setLibrarySort] = useState<"newest" | "oldest">("newest");
  const mode: AppMode = "manual";

  // Initialize hooks
  const usageHook = useUsage(session?.user?.id, authStatus);
  const {
    usage,
    isUsageLoading,
    usageError,
    hasGeneratedFreeImage,
    isPaymentUnlocked,
    planType,
    subscription,
    setUsage,
    setUsageError,
    setHasGeneratedFreeImage,
    setPlanType,
    refreshUsage,
    refreshSubscription,
    refreshHasGeneratedFreeImage,
  } = usageHook;

  const refreshReferenceLibrary = async (userId: string) => {
    try {
      const refs = await fetchReferenceLibrary(userId);
      setReferenceLibrary(refs);
    } catch (error) {
      console.error("Failed to refresh reference library:", error);
    }
  };

  const referencesHook = useReferences(
    session?.user?.id,
    refreshReferenceLibrary
  );
  const {
    references,
    fileInputRef,
    isSavingReferences,
    setReferences,
    triggerUpload,
    handleFileUpload,
    removeReference,
    handleSaveReferences,
    handleAddReferencesFromLibrary,
    handleUpdateReferenceSetLabel,
  } = referencesHook;

  const promptsHook = usePrompts(session?.user?.id, setPromptLibrary);
  const {
    manualPrompts,
    isAddingNewPrompt,
    editingPromptIndex,
    savingPromptIndex,
    setManualPrompts,
    handleAddPrompt,
    handleRemovePrompt,
    handleStartEditPrompt,
    handleSavePrompt,
    handleCancelEdit,
    handleSaveIndividualPrompt,
    handleSavePromptPreset,
    handleUpdatePromptPreset,
    handleUsePromptPreset,
  } = promptsHook;

  const modalsHook = useModals();
  const {
    isReferenceLibraryOpen,
    isPromptLibraryOpen,
    isPaymentModalOpen,
    nameModal,
    setIsReferenceLibraryOpen,
    setIsPromptLibraryOpen,
    setIsPaymentModalOpen,
    openReferenceNameModal,
    openPromptNameModal,
    closeNameModal,
    handleNameModalSave,
  } = modalsHook;

  const openPaymentModal = () => {
    setIsPaymentModalOpen(true);
  };

  const imageGenerationHook = useImageGeneration({
    mode,
    userId: session?.user?.id,
    references,
    manualPrompts,
    size,
    planType,
    hasGeneratedFreeImage,
    isPaymentUnlocked,
    usage,
    setUsage,
    setUsageError,
    setHasGeneratedFreeImage,
    openPaymentModal,
    refreshUsage,
  });
  const {
    manualResults,
    isGenerating,
    setManualResults,
    startGeneration,
    handleRegenerate,
  } = imageGenerationHook;

  // Build payment links with client_reference_id (user_id) as query parameter
  const getStripePlanLinks = (): Partial<Record<SubscriptionPlan, string>> => {
    const userId = session?.user?.id;
    if (!userId) {
      return {
        basic: process.env.STRIPE_LINK_BASIC || "",
        pro: process.env.STRIPE_LINK_PRO || "",
        business: process.env.STRIPE_LINK_BUSINESS || "",
      };
    }

    const baseLinks = {
      basic: process.env.STRIPE_LINK_BASIC || "",
      pro: process.env.STRIPE_LINK_PRO || "",
      business: process.env.STRIPE_LINK_BUSINESS || "",
    };

    // Add client_reference_id to each payment link
    const links: Partial<Record<SubscriptionPlan, string>> = {};
    for (const [plan, baseUrl] of Object.entries(baseLinks)) {
      if (baseUrl) {
        try {
          const url = new URL(baseUrl);
          url.searchParams.set("client_reference_id", userId);
          links[plan as SubscriptionPlan] = url.toString();
        } catch (error) {
          // If URL is invalid, use base URL as-is
          console.warn(`Invalid Stripe payment link URL for ${plan}:`, baseUrl);
          links[plan as SubscriptionPlan] = baseUrl;
        }
      }
    }
    return links;
  };

  const stripePlanLinks = getStripePlanLinks();

  // Redirect to auth page if not authenticated
  useEffect(() => {
    if (authStatus === "signed_out") {
      router.replace("/auth");
    }
  }, [authStatus, router]);

  const loadLibraries = async (userId: string) => {
    setIsLibraryLoading(true);
    try {
      const [refs, prompts] = await Promise.all([
        fetchReferenceLibrary(userId),
        fetchPromptLibrary(userId),
      ]);
      setReferenceLibrary(refs);
      setPromptLibrary(prompts);
    } catch (error) {
      console.error("Failed to load saved datasets:", error);
    } finally {
      setIsLibraryLoading(false);
    }
  };

  useEffect(() => {
    const userId = session?.user?.id;
    if (authStatus === "signed_in" && userId) {
      refreshUsage(userId);
      refreshSubscription(userId);
      refreshHasGeneratedFreeImage(userId);
      loadLibraries(userId);
    }
  }, [authStatus, session?.user?.id]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (authStatus === "signed_in" && userId) {
      refreshUsage(userId);
    }
  }, [planType]);

  // Warn user before refreshing during image generation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check if generation is in progress
      const hasLoadingResults = manualResults.some((r) => r.isLoading);

      if (isGenerating || hasLoadingResults) {
        // Modern browsers ignore custom messages, but we still need to set returnValue
        e.preventDefault();
        e.returnValue = ""; // Required for Chrome
        // Show alert as requested
        window.alert(
          "Image generation is in progress. Are you sure you want to leave?"
        );
        return ""; // Required for some browsers
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isGenerating, manualResults]);

  useEffect(() => {
    if (typeof window === "undefined" || !session?.user?.id) return;
    const params = new URLSearchParams(window.location.search);
    const openPaymentFlag =
      params.get("openPayment") === "1" || params.get("openPayment") === "true";

    if (openPaymentFlag && !isPaymentUnlocked) {
      setIsPaymentModalOpen(true);
      params.delete("openPayment");
      const newSearch = params.toString();
      const newUrl = `${window.location.pathname}${
        newSearch ? `?${newSearch}` : ""
      }`;
      window.history.replaceState(null, "", newUrl);
    }
  }, [isPaymentUnlocked, session?.user?.id, setIsPaymentModalOpen]);

  // All hooks must be called before any conditional returns
  const sortedPrompts = useMemo(() => {
    return [...promptLibrary].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return librarySort === "newest" ? bTime - aTime : aTime - bTime;
    });
  }, [promptLibrary, librarySort]);

  // Show loading state while checking auth
  if (authStatus === "checking") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <p>Checking your session...</p>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (authStatus !== "signed_in") {
    return null;
  }

  const results = manualResults;
  const generatedCount = results.filter((item) => item.imageUrl).length;
  const totalScenes = results.length;
  const hasSubscription = isPaymentUnlocked;
  const usedCredits = usage?.used ?? 0;
  const freeCreditsRemaining = Math.max(FREE_CREDIT_CAP - usedCredits, 0);
  const disableGenerate =
    isGenerating ||
    references.length === 0 ||
    (!!usage && usage.remaining <= 0) ||
    !!usageError;
  const planCreditLimit = PLAN_CREDITS[planType] ?? DEFAULT_MONTHLY_CREDITS;
  const displayUsageLimit = hasSubscription
    ? usage?.monthlyLimit ?? planCreditLimit
    : undefined;
  const displayUsageRemaining = hasSubscription
    ? usage?.remaining ?? planCreditLimit
    : undefined;

  return (
    <div className="app">
      <main className="app__body">
        <div className="app__content">
          <Sidebar
            mode={mode}
            onModeChange={() => {}}
            activePanel={activePanel}
            onPanelChange={(panel) => {
              setActivePanel(panel);
            }}
            onOpenSettings={() => setIsPaymentModalOpen(true)}
            displayEmail={displayEmail}
            isSubscribed={hasSubscription}
            subscriptionLabel={
              hasSubscription ? `Plan: ${planType.toUpperCase()}` : "Free"
            }
            subscriptionPrice={
              hasSubscription ? PLAN_PRICE_LABEL[planType] : null
            }
            planType={hasSubscription ? planType : undefined}
            remainingCredits={
              hasSubscription ? displayUsageRemaining : freeCreditsRemaining
            }
            totalCredits={hasSubscription ? displayUsageLimit : undefined}
            expiredAt={subscription?.expiredAt || null}
            unsubscribedAt={subscription?.unsubscribedAt || null}
            subscriptionStatus={subscription?.status || null}
            onOpenBilling={() => setIsPaymentModalOpen(true)}
            onCancelSubscription={async () => {
              const userId = session?.user?.id;
              if (!userId) return;

              // Confirm cancellation
              if (
                !confirm(
                  "Are you sure you want to cancel your subscription? You'll lose access at the end of your billing period."
                )
              ) {
                return;
              }

              try {
                const response = await fetch("/api/subscription/cancel", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ userId }),
                });

                if (!response.ok) {
                  const error = await response.json();
                  throw new Error(
                    error.error || "Failed to cancel subscription"
                  );
                }

                const result = await response.json();

                // Update local state - handled by useUsage hook
                await refreshUsage(userId);
                await refreshSubscription(userId);

                alert(result.message || "Subscription canceled successfully");
              } catch (error) {
                console.error("Failed to cancel subscription:", error);
                alert(
                  error instanceof Error
                    ? error.message
                    : "Could not cancel subscription. Please try again."
                );
              }
            }}
            onSignOut={signOut}
          />

          <div className="app__main">
            <input
              type="file"
              ref={fileInputRef}
              multiple
              className="hidden-input"
              accept="image/*"
              onChange={handleFileUpload}
            />
            <DashboardSummary
              isUsageLoading={isUsageLoading}
              hasSubscription={hasSubscription}
              displayUsageLimit={displayUsageLimit}
              displayUsageRemaining={displayUsageRemaining}
              freeCreditsRemaining={freeCreditsRemaining}
              referencesCount={references.length}
              totalScenes={totalScenes}
              generatedCount={generatedCount}
              size={size}
            />

            {activePanel === "saved" && (
              <SavedImagesPanel
                referenceLibrary={referenceLibrary}
                isLoading={isLibraryLoading}
                sortDirection={librarySort}
                onSortChange={setLibrarySort}
                onSelectReferenceSet={handleAddReferencesFromLibrary}
                onSaveNewSet={async (images, label) => {
                  const userId = session?.user?.id;
                  if (!userId) {
                    alert(
                      "Unable to verify your account. Please sign in again."
                    );
                    return;
                  }
                  await saveReferenceImages(userId, images, label);
                  await refreshReferenceLibrary(userId);
                }}
                onUpdateReferenceSet={(setId, label) =>
                  handleUpdateReferenceSetLabel(
                    setId,
                    label,
                    setReferenceLibrary
                  )
                }
              />
            )}

            {activePanel === "references" && (
              <SavedPromptsPanel
                promptLibrary={promptLibrary}
                isLoading={isLibraryLoading}
                sortedPrompts={sortedPrompts}
                sortDirection={librarySort}
                onSortChange={setLibrarySort}
                onSelectPromptPreset={handleUsePromptPreset}
                onSaveNewPrompt={async (title, content) => {
                  const userId = session?.user?.id;
                  if (!userId) {
                    alert(
                      "Unable to verify your account. Please sign in again."
                    );
                    return;
                  }
                  const saved = await savePromptPreset(userId, content, title);
                  setPromptLibrary((prev) => [saved, ...prev]);
                }}
                onUpdatePromptPreset={handleUpdatePromptPreset}
              />
            )}

            {activePanel === "manual" && (
              <ReferencesSection
                references={references}
                isSavingReferences={isSavingReferences}
                onUpload={triggerUpload}
                onRemove={removeReference}
                onOpenLibrary={() => setIsReferenceLibraryOpen(true)}
                onSave={openReferenceNameModal}
              />
            )}

            {activePanel === "manual" && (
              <PromptsSection
                prompts={manualPrompts}
                isAddingNewPrompt={isAddingNewPrompt}
                editingPromptIndex={editingPromptIndex}
                savingPromptIndex={savingPromptIndex}
                onAddPrompt={handleAddPrompt}
                onRemovePrompt={handleRemovePrompt}
                onStartEdit={handleStartEditPrompt}
                onSavePrompt={handleSavePrompt}
                onCancelEdit={handleCancelEdit}
                onSaveIndividualPrompt={handleSaveIndividualPrompt}
                onOpenLibrary={() => setIsPromptLibraryOpen(true)}
              />
            )}

            {activePanel !== "saved" && activePanel !== "references" && (
              <>
                {results.length > 0 || isGenerating ? (
                  <Results
                    mode={mode}
                    results={results}
                    isGenerating={isGenerating}
                    onRegenerate={handleRegenerate}
                  />
                ) : (
                  <button
                    onClick={startGeneration}
                    disabled={disableGenerate}
                    className="primary-button primary-button--full"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    Generate
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <ReferenceLibraryModal
        isOpen={isReferenceLibraryOpen}
        items={referenceLibrary}
        isLoading={isLibraryLoading}
        onClose={() => setIsReferenceLibraryOpen(false)}
        onSelect={handleAddReferencesFromLibrary}
      />

      <PromptLibraryModal
        isOpen={isPromptLibraryOpen}
        items={promptLibrary}
        isLoading={isLibraryLoading}
        onClose={() => setIsPromptLibraryOpen(false)}
        onSelect={handleUsePromptPreset}
      />

      <NameCaptureModal
        isOpen={nameModal.type !== null}
        title={
          nameModal.type === "reference"
            ? "Name this reference set"
            : "Name this prompt preset"
        }
        defaultValue={nameModal.defaultValue}
        onSave={(value) =>
          handleNameModalSave(
            value,
            handleSaveReferences,
            handleSavePromptPreset
          )
        }
        onCancel={closeNameModal}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        planType={planType}
        paymentUrls={stripePlanLinks}
        onPlanSelect={(plan) => setPlanType(plan)}
        userId={session?.user?.id}
      />
    </div>
  );
};

export default DashboardPage;
