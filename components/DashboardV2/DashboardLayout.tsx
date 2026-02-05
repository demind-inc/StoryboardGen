import React from "react";
import type { DashboardLayoutProps } from "./dashboardLayout.types";
import DashboardHeader from "./DashboardHeader";
import ReferenceCard from "./ReferenceCard";
import TopicCard from "./TopicCard";
import SceneCard from "./SceneCard";
import RulesCard from "./RulesCard";
import GuidelinesCard from "./GuidelinesCard";
import FooterBar from "./FooterBar";
import ResultsCard from "./ResultsCard";
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
  guidelines,
  onGuidelinesChange,
  captions,
  results,
  onRegenerateResult,
  allowRegenerate,
  onProjectNameChange,
  onBackToEditor,
}) => {
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
        <div className={styles.contentRow}>
          <div className={styles.leftColumn}>
            <ReferenceCard
              references={references}
              onUpload={onUpload}
              onOpenLibrary={onOpenLibrary}
              onRemoveReference={onRemoveReference}
            />
            <TopicCard
              topic={topic}
              onTopicChange={onTopicChange}
              onGenerate={onGenerateTopicScenes}
              isGenerating={isTopicGenerating}
              error={topicError}
            />
            <SceneCard
              promptList={promptList}
              activeSceneIndex={activeSceneIndex}
              onSceneSelect={onSceneSelect}
              onAddScene={onAddScene}
              onRemoveScene={onRemoveScene}
              onSavePrompt={onSavePrompt}
              previewImageUrl={previewImageUrl}
            />
          </div>
          <div className={styles.rightColumn}>
            <RulesCard rules={rules} />
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
    </div>
  );
};

export default DashboardLayout;
