import React from "react";
import type { DashboardLayoutProps } from "./dashboardLayout.types";
import DashboardHeader from "./DashboardHeader";
import ReferenceCard from "./ReferenceCard";
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
  rules,
  onRulesChange,
  guidelines,
  onGuidelinesChange,
  captions,
  results,
  onRegenerateResult,
  onProjectNameChange,
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
            <SceneCard
              promptList={promptList}
              activeSceneIndex={activeSceneIndex}
              onSceneSelect={onSceneSelect}
              onAddScene={onAddScene}
              onRemoveScene={onRemoveScene}
              onSavePrompt={onSavePrompt}
              previewImageUrl={previewImageUrl}
              isGenerating={isGenerating}
              disableGenerate={disableGenerate}
              onGenerateAll={onGenerateAll}
              onRegenerateActive={onRegenerateActive}
            />
          </div>
          <div className={styles.rightColumn}>
            <RulesCard rules={rules} onRulesChange={onRulesChange} />
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
      />
    </div>
  );
};

export default DashboardLayout;
