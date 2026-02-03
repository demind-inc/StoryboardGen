import React from "react";
import ReferenceLibraryModal from "../DatasetModal/ReferenceLibraryModal";
import NameCaptureModal from "../DatasetModal/NameCaptureModal";
import PaymentModal from "../PaymentModal/PaymentModal";
import { useAuth } from "../../providers/AuthProvider";
import DashboardLayout from "./DashboardLayout";
import { useDashboardManual } from "../../hooks/useDashboardManual";
import { ReferenceSet } from "../../types";

export interface Rule {
  tiktok: string;
  instagram: string;
}
const DEFAULT_RULES: Rule = {
  tiktok:
    "・Slightly long captions with line breaks\n・Natural brand mention integration\n・Exactly 5 approved hashtags",
  instagram:
    "・Longer, educational captions\n・Natural brand mention integration\n・More hashtags allowed (no #apps/#iphoneapps)\n・Hashtags at bottom of caption",
};

interface DashboardMainProps {
  openBilling?: boolean;
  onBillingHandled?: () => void;
}

const DashboardMain: React.FC<DashboardMainProps> = ({
  openBilling = false,
  onBillingHandled,
}) => {
  const { session, authStatus } = useAuth();
  const dashboard = useDashboardManual({
    userId: session?.user?.id,
    authStatus,
  });

  const [projectName, setProjectName] = React.useState("Coffee Brand Campaign");
  const [rules, setRules] = React.useState<Rule>(DEFAULT_RULES);

  const {
    fileInputRef,
    references,
    triggerUpload,
    handleFileUpload,
    manualResults,
    promptList,
    activeSceneIndex,
    setActiveSceneIndex,
    addScene,
    handleSavePrompt,
    isGenerating,
    disableGenerate,
    startGeneration,
    handleRegenerate,
    isReferenceLibraryOpen,
    setIsReferenceLibraryOpen,
    handleAddReferencesFromLibrary,
    handleSaveReferences,
    nameModal,
    closeNameModal,
    handleNameModalSave,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    planType,
    setPlanType,
    stripePlanLinks,
    guidelines,
    setGuidelines,
    defaultCaptions,
  } = dashboard;

  const activePreviewUrl = manualResults[activeSceneIndex]?.imageUrl;

  React.useEffect(() => {
    if (openBilling) {
      setIsPaymentModalOpen(true);
      onBillingHandled?.();
    }
  }, [openBilling, onBillingHandled, setIsPaymentModalOpen]);

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

      <DashboardLayout
        projectName={projectName}
        onProjectNameChange={setProjectName}
        references={references}
        onUpload={triggerUpload}
        onOpenLibrary={() => setIsReferenceLibraryOpen(true)}
        promptList={promptList}
        activeSceneIndex={activeSceneIndex}
        onSceneSelect={setActiveSceneIndex}
        onAddScene={addScene}
        onSavePrompt={handleSavePrompt}
        previewImageUrl={activePreviewUrl}
        isGenerating={isGenerating}
        disableGenerate={disableGenerate}
        onGenerateAll={startGeneration}
        onRegenerateActive={() => handleRegenerate(activeSceneIndex)}
        rules={rules}
        onRulesChange={setRules}
        guidelines={guidelines}
        onGuidelinesChange={setGuidelines}
        captions={defaultCaptions}
        results={manualResults}
        onRegenerateResult={handleRegenerate}
      />

      <ReferenceLibraryModal
        isOpen={isReferenceLibraryOpen}
        onClose={() => setIsReferenceLibraryOpen(false)}
        onSelect={(sets: ReferenceSet[]) => {
          handleAddReferencesFromLibrary(sets);
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

export default DashboardMain;
