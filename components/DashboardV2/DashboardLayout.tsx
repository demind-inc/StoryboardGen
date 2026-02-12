import React, { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import type { DashboardLayoutProps } from "./dashboardLayout.types";
import DashboardHeader from "./DashboardHeader";
import ReferenceCard from "./ReferenceCard";
import SceneCard from "./SceneCard";
import GuidelinesCard from "./GuidelinesCard";
import FooterBar from "./FooterBar";
import ResultsCard from "./ResultsCard";
import { TopicIcon, CustomGuidelinesIcon, CloseIcon, AIIcon } from "./DashboardIcons";
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
  const [autoTopic, setAutoTopic] = useState(topic || "");
  const [autoGuideline, setAutoGuideline] = useState("");

  const handleAutoGenerate = () => {
    if (autoTopic.trim()) {
      onTopicChange(autoTopic);
      setIsAutoGenerateOpen(false);
      onGenerateTopicScenes();
    }
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
      <Dialog
        open={isAutoGenerateOpen}
        onClose={() => setIsAutoGenerateOpen(false)}
        className="relative z-[1000]"
      >
        <div className={styles.modalOverlay} aria-hidden="true" />
        <div className={styles.modalContainer}>
          <DialogPanel className={styles.modalPanel}>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setIsAutoGenerateOpen(false)}
              aria-label="Close"
            >
              <CloseIcon />
            </button>

            <DialogTitle className={styles.modalTitle}>
              Auto-Generate Scenes
            </DialogTitle>
            <p className={styles.modalSubtitle}>
              Enter a topic and optional guidelines to generate scenes automatically.
            </p>

            <div className={styles.modalBody}>
              <div className={styles.modalField}>
                <div className={styles.modalFieldHeader}>
                  <span className={styles.modalFieldIcon}>
                    <TopicIcon />
                  </span>
                  <label className={styles.modalFieldLabel}>Topic</label>
                </div>
                <input
                  type="text"
                  className={styles.modalInput}
                  placeholder="e.g. Coffee morning routine for Gen Z"
                  value={autoTopic}
                  onChange={(e) => setAutoTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && autoTopic.trim()) {
                      handleAutoGenerate();
                    }
                  }}
                />
              </div>

              <div className={styles.modalField}>
                <div className={styles.modalFieldHeader}>
                  <span className={styles.modalFieldIcon}>
                    <CustomGuidelinesIcon />
                  </span>
                  <label className={styles.modalFieldLabel}>
                    Custom Guideline (optional)
                  </label>
                </div>
                <textarea
                  className={styles.modalTextarea}
                  placeholder="Add custom instructions for scene titles, descriptions, tone, or structure..."
                  value={autoGuideline}
                  onChange={(e) => setAutoGuideline(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setIsAutoGenerateOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalGenerateBtn}
                onClick={handleAutoGenerate}
                disabled={!autoTopic.trim() || isTopicGenerating}
              >
                <AIIcon />
                <span>{isTopicGenerating ? "Generating..." : "Generate"}</span>
              </button>
            </div>

            {topicError && <p className={styles.modalError}>{topicError}</p>}
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
};

export default DashboardLayout;
