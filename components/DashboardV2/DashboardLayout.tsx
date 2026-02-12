import React, { useState } from "react";
import type { DashboardLayoutProps } from "./dashboardLayout.types";
import DashboardHeader from "./DashboardHeader";
import ReferenceCard from "./ReferenceCard";
import SceneCard from "./SceneCard";
import GuidelinesCard from "./GuidelinesCard";
import FooterBar from "./FooterBar";
import ResultsCard from "./ResultsCard";
import AutoGenerateSceneModal from "./AutoGenerateSceneModal";
import styles from "./DashboardLayout.module.scss";

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  projectName,
  references,
  onUpload,
  onOpenLibrary,
  onRemoveReference,
  topic,
  onTopicChange,
  onGenerateTopicScenes,
  isTopicGenerating,
  topicError,
  promptList,
  activeSceneIndex,
  onSceneSelect,
  onAddScene,
  onRemoveScene,
  onSavePrompt,
  previewImageUrl,
  isGenerating,
  disableGenerate,
  onGenerateAll,
  onRegenerateActive,
  transparentBackground,
  onTransparentBackgroundChange,
  rules,
  hashtags,
  selectedHashtags,
  onSelectedHashtagsChange,
  guidelines,
  onGuidelinesChange,
  captions,
  results,
  onRegenerateResult,
  allowRegenerate,
  onProjectNameChange,
  onBackToEditor,
}) => {
  const [isAutoGenerateOpen, setIsAutoGenerateOpen] = useState(false);

  const handleAutoGenerate = (topic: string, guideline?: string) => {
    onTopicChange(topic);
    setIsAutoGenerateOpen(false);
    onGenerateTopicScenes();
    // TODO: Use guideline if needed in the future
  };

  if (results.length) {
    return (
      <div className={styles.dashboard}>
        <ResultsCard
          results={results}
          isGenerating={isGenerating}
          onRegenerateResult={onRegenerateResult}
          onRegenerateAll={onGenerateAll}
          captions={captions}
          projectName={projectName}
          allowRegenerate={allowRegenerate}
          onBack={onBackToEditor}
        />
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.scrollArea}>
        <DashboardHeader
          projectName={projectName}
          onProjectNameChange={onProjectNameChange}
        />
        <SceneCard
          promptList={promptList}
          activeSceneIndex={activeSceneIndex}
          onSceneSelect={onSceneSelect}
          onAddScene={onAddScene}
          onRemoveScene={onRemoveScene}
          onSavePrompt={onSavePrompt}
          previewImageUrl={previewImageUrl}
          onOpenAutoGenerate={() => setIsAutoGenerateOpen(true)}
          isTopicGenerating={isTopicGenerating}
        />
        <div className={styles.contentRow}>
          <div className={styles.leftColumn}>
            <ReferenceCard
              references={references}
              onUpload={onUpload}
              onOpenLibrary={onOpenLibrary}
              onRemoveReference={onRemoveReference}
            />
          </div>
          <div className={styles.rightColumn}>
            <GuidelinesCard
              guidelines={guidelines}
              onGuidelinesChange={onGuidelinesChange}
            />
          </div>
        </div>
      </div>
      <FooterBar
        disableGenerate={disableGenerate}
        isGenerating={isGenerating}
        onGenerateAll={onGenerateAll}
        projectName={projectName}
        transparentBackground={transparentBackground}
        onTransparentBackgroundChange={onTransparentBackgroundChange}
      />

      {/* Auto-Generate Scenes Modal */}
      <AutoGenerateSceneModal
        isOpen={isAutoGenerateOpen}
        onClose={() => setIsAutoGenerateOpen(false)}
        initialTopic={topic}
        onGenerate={handleAutoGenerate}
        isGenerating={isTopicGenerating}
        error={topicError ?? undefined}
      />
    </div>
  );
};

export default DashboardLayout;
