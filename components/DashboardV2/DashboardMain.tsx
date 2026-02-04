import React from "react";
import ReferenceLibraryModal from "../DatasetModal/ReferenceLibraryModal";
import NameCaptureModal from "../DatasetModal/NameCaptureModal";
import DashboardLayout from "./DashboardLayout";
import { ReferenceSet } from "../../types";
import type { DashboardManualState } from "../../hooks/useDashboardManual";

function getDefaultProjectName(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
}

interface DashboardMainProps {
  dashboard: DashboardManualState;
}

const DashboardMain: React.FC<DashboardMainProps> = ({ dashboard }) => {
  const [projectName, setProjectName] = React.useState(getDefaultProjectName);

  const {
    fileInputRef,
    references,
    triggerUpload,
    handleFileUpload,
    removeReference,
    manualResults,
    promptList,
    displayPromptList,
    activeSceneIndex,
    setActiveSceneIndex,
    addScene,
    removeScene,
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
    guidelines,
    setGuidelines,
    rules,
    captions,
  } = dashboard;

  const activePreviewUrl = manualResults[activeSceneIndex]?.imageUrl;

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
        onRemoveReference={removeReference}
        promptList={displayPromptList}
        activeSceneIndex={activeSceneIndex}
        onSceneSelect={setActiveSceneIndex}
        onAddScene={addScene}
        onRemoveScene={removeScene}
        onSavePrompt={handleSavePrompt}
        previewImageUrl={activePreviewUrl}
        isGenerating={isGenerating}
        disableGenerate={disableGenerate}
        onGenerateAll={startGeneration}
        onRegenerateActive={() => handleRegenerate(activeSceneIndex)}
        rules={rules}
        guidelines={guidelines}
        onGuidelinesChange={setGuidelines}
        captions={captions}
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
    </>
  );
};

export default DashboardMain;
