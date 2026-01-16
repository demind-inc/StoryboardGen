import React, { useEffect } from "react";
import ReferencesSection from "../../../components/Dashboard/ReferencesSection";
import PromptsSection from "../../../components/Dashboard/PromptsSection";
import Results from "../../../components/Results/Results";
import DashboardSummary from "../../../components/Dashboard/DashboardSummary";
import ReferenceLibraryModal from "../../../components/DatasetModal/ReferenceLibraryModal";
import PromptLibraryModal from "../../../components/DatasetModal/PromptLibraryModal";
import NameCaptureModal from "../../../components/DatasetModal/NameCaptureModal";
import PaymentModal from "../../../components/PaymentModal/PaymentModal";
import { useAuth } from "../../../providers/AuthProvider";
import { useReferences } from "../../../hooks/useReferences";
import { usePrompts } from "../../../hooks/usePrompts";
import { useImageGeneration } from "../../../hooks/useImageGeneration";
import { useModals } from "../../../hooks/useModals";
import { useUsage } from "../../../hooks/useUsage";
import { fetchReferenceLibrary } from "../../../services/libraryService";
import { SubscriptionPlan, ReferenceSet, PromptPreset } from "../../../types";
import { DEFAULT_MONTHLY_CREDITS, PLAN_CREDITS } from "@/services/usageService";
const ManualPanel: React.FC = () => {
  const { session, authStatus } = useAuth();

  const usageHook = useUsage(session?.user?.id, authStatus);
  const {
    usage,
    isUsageLoading,
    usageError,
    hasGeneratedFreeImage,
    isPaymentUnlocked,
    planType,
    setUsage,
    setUsageError,
    setHasGeneratedFreeImage,
    setPlanType,
    refreshUsage,
    refreshSubscription,
    refreshHasGeneratedFreeImage,
  } = usageHook;

  const refreshReferenceLibrary = async (userId: string) => {
    await fetchReferenceLibrary(userId);
  };

  const referencesHook = useReferences(
    session?.user?.id,
    refreshReferenceLibrary
  );
  const {
    references,
    fileInputRef,
    isSavingReferences,
    triggerUpload,
    handleFileUpload,
    removeReference,
    handleSaveReferences,
    handleAddReferencesFromLibrary,
  } = referencesHook;

  const promptsHook = usePrompts(session?.user?.id, () => {});
  const {
    manualPrompts,
    isAddingNewPrompt,
    editingPromptIndex,
    savingPromptIndex,
    handleAddPrompt,
    handleRemovePrompt,
    handleReorderPrompt,
    handleStartEditPrompt,
    handleSavePrompt,
    handleCancelEdit,
    handleSaveIndividualPrompt,
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

  const openPaymentModal = () => setIsPaymentModalOpen(true);

  const imageGenerationHook = useImageGeneration({
    mode: "manual",
    userId: session?.user?.id,
    references,
    manualPrompts,
    size: "1K",
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

  useEffect(() => {
    const userId = session?.user?.id;
    if (authStatus === "signed_in" && userId) {
      refreshUsage(userId);
      refreshSubscription(userId);
      refreshHasGeneratedFreeImage(userId);
    }
    // Deliberately omit function dependencies to avoid new references re-triggering
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, session?.user?.id]);

  const usedCredits = usage?.used ?? 0;
  const freeCreditsRemaining = Math.max(3 - usedCredits, 0);
  const planCreditLimit = PLAN_CREDITS[planType] ?? DEFAULT_MONTHLY_CREDITS;
  const displayUsageLimit = isPaymentUnlocked
    ? usage?.monthlyLimit ?? planCreditLimit
    : undefined;
  const displayUsageRemaining = isPaymentUnlocked
    ? usage?.remaining ?? planCreditLimit
    : undefined;

  const disableGenerate =
    isGenerating ||
    references.length === 0 ||
    (!!usage && usage.remaining <= 0) ||
    !!usageError;

  const stripePlanLinks = (() => {
    const userId = session?.user?.id;
    const baseLinks = {
      basic: process.env.STRIPE_LINK_BASIC || "",
      pro: process.env.STRIPE_LINK_PRO || "",
      business: process.env.STRIPE_LINK_BUSINESS || "",
    };
    if (!userId) return baseLinks;
    const links: Partial<Record<SubscriptionPlan, string>> = {};
    for (const [plan, baseUrl] of Object.entries(baseLinks)) {
      if (baseUrl) {
        try {
          const url = new URL(baseUrl);
          url.searchParams.set("client_reference_id", userId);
          links[plan as SubscriptionPlan] = url.toString();
        } catch {
          links[plan as SubscriptionPlan] = baseUrl;
        }
      }
    }
    return links;
  })();

  const promptCount = manualPrompts
    .split("\n")
    .filter((p) => p.trim() !== "").length;

  if (isGenerating && manualResults.length === 0) {
    return (
      <div className="loadingScreen">
        <div className="loadingScreen__spinner" />
        <p className="loadingScreen__text">Generating your scenes...</p>
      </div>
    );
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        multiple
        className="hidden-input"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        onChange={handleFileUpload}
      />
      <DashboardSummary
        isUsageLoading={isUsageLoading}
        hasSubscription={isPaymentUnlocked}
        displayUsageLimit={displayUsageLimit}
        displayUsageRemaining={displayUsageRemaining}
        freeCreditsRemaining={freeCreditsRemaining}
        referencesCount={references.length}
        totalScenes={manualResults.length}
        generatedCount={manualResults.filter((item) => item.imageUrl).length}
        size={"1K"}
      />
      <ReferencesSection
        references={references}
        isSavingReferences={isSavingReferences}
        onUpload={triggerUpload}
        onRemove={removeReference}
        onOpenLibrary={() => setIsReferenceLibraryOpen(true)}
        onSave={openReferenceNameModal}
      />

      <PromptsSection
        prompts={manualPrompts}
        isAddingNewPrompt={isAddingNewPrompt}
        editingPromptIndex={editingPromptIndex}
        savingPromptIndex={savingPromptIndex}
        references={references}
        onAddPrompt={handleAddPrompt}
        onRemovePrompt={handleRemovePrompt}
        onReorderPrompt={handleReorderPrompt}
        onStartEdit={handleStartEditPrompt}
        onSavePrompt={handleSavePrompt}
        onCancelEdit={handleCancelEdit}
        onSaveIndividualPrompt={handleSaveIndividualPrompt}
        onOpenLibrary={() => setIsPromptLibraryOpen(true)}
      />
      {manualResults.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3 className="card__title">Results</h3>
          <Results
            mode="manual"
            results={manualResults}
            isGenerating={isGenerating}
            onRegenerate={handleRegenerate}
          />
        </div>
      )}
      <div className="app__generateBar">
        <button
          onClick={startGeneration}
          disabled={disableGenerate}
          className="primary-button"
        >
          {isGenerating ? "Generating..." : `Generate`}
        </button>
      </div>

      <ReferenceLibraryModal
        isOpen={isReferenceLibraryOpen}
        onClose={() => setIsReferenceLibraryOpen(false)}
        onSelect={(sets: ReferenceSet[]) => {
          handleAddReferencesFromLibrary(sets);
          setManualResults([]);
        }}
      />

      <PromptLibraryModal
        isOpen={isPromptLibraryOpen}
        onClose={() => setIsPromptLibraryOpen(false)}
        onSelect={(preset: PromptPreset) => {
          handleUsePromptPreset(preset);
          setIsPromptLibraryOpen(false);
        }}
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
          handleNameModalSave(value, handleSaveReferences, () =>
            Promise.resolve()
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
    </>
  );
};

export default ManualPanel;
