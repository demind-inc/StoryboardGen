import React from "react";
import ReferenceLibraryModal from "../DatasetModal/ReferenceLibraryModal";
import NameCaptureModal from "../DatasetModal/NameCaptureModal";
import DashboardLayout from "./DashboardLayout";
import { ReferenceSet } from "../../types";
import type { DashboardManualState } from "../../hooks/useDashboardManual";

interface DashboardMainProps {
  dashboard: DashboardManualState;
}

const DashboardMain: React.FC<DashboardMainProps> = ({ dashboard }) => {
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
    hashtags,
    captions,
    setManualResults,
    projectName,
    setProjectName,
    topic,
    setTopic,
    generateTopicScenes,
    isTopicGenerating,
    topicError,
    transparentBackground,
    setTransparentBackground,
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
        topic={topic}
        onTopicChange={setTopic}
        onGenerateTopicScenes={generateTopicScenes}
        isTopicGenerating={isTopicGenerating}
        topicError={topicError}
        promptList={displayPromptList}
        activeSceneIndex={activeSceneIndex}
        onSceneSelect={setActiveSceneIndex}
        onAddScene={addScene}
        onRemoveScene={removeScene}
        onSavePrompt={handleSavePrompt}
        previewImageUrl={activePreviewUrl}
        transparentBackground={transparentBackground}
        onTransparentBackgroundChange={setTransparentBackground}
        isGenerating={isGenerating}
        disableGenerate={disableGenerate}
        onGenerateAll={startGeneration}
        onRegenerateActive={() => handleRegenerate(activeSceneIndex)}
        rules={rules}
        hashtags={hashtags}
        guidelines={guidelines}
        onGuidelinesChange={setGuidelines}
        captions={captions}
        results={manualResults}
        onRegenerateResult={handleRegenerate}
        onBackToEditor={() => setManualResults([])}
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
