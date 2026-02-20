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
    scenes,
    activeSceneIndex,
    setActiveSceneIndex,
    addScene,
    removeScene,
    saveScene,
    isGenerating,
    disableGenerate,
    generateDisabledTooltip,
    generateErrorMessage,
    startGeneration,
    handleRegenerate,
    handleGenerateCaption,
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
    selectedHashtags,
    setSelectedHashtags,
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
        scenes={scenes}
        activeSceneIndex={activeSceneIndex}
        onSceneSelect={setActiveSceneIndex}
        onAddScene={addScene}
        onRemoveScene={removeScene}
        onSaveScene={saveScene}
        previewImageUrl={activePreviewUrl}
        transparentBackground={transparentBackground}
        onTransparentBackgroundChange={setTransparentBackground}
        isGenerating={isGenerating}
        disableGenerate={disableGenerate}
        generateDisabledTooltip={generateDisabledTooltip}
        generateErrorMessage={generateErrorMessage}
        onGenerateAll={startGeneration}
        onRegenerateActive={() => handleRegenerate(activeSceneIndex)}
        rules={rules}
        hashtags={hashtags}
        selectedHashtags={selectedHashtags}
        onSelectedHashtagsChange={setSelectedHashtags}
        guidelines={guidelines}
        onGuidelinesChange={setGuidelines}
        captions={captions}
        onGenerateCaption={handleGenerateCaption}
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
