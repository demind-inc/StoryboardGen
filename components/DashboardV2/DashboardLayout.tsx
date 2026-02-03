import React, { useEffect, useState } from "react";
import { ReferenceImage, SceneResult } from "../../types";
import Results from "../Results/Results";
import styles from "./DashboardLayout.module.scss";

interface DashboardLayoutProps {
  projectName: string;
  references: ReferenceImage[];
  onUpload: () => void;
  onOpenLibrary: () => void;
  promptList: string[];
  activeSceneIndex: number;
  onSceneSelect: (index: number) => void;
  onAddScene: () => void;
  onSavePrompt: (index: number, value: string) => void;
  previewImageUrl?: string;
  isGenerating: boolean;
  disableGenerate: boolean;
  onGenerateAll: () => void;
  onRegenerateActive: () => void;
  rules: {
    tiktok: string[];
    instagram: string[];
  };
  guidelines: string[];
  captions: {
    tiktok: string;
    instagram: string;
  };
  results: SceneResult[];
  onRegenerateResult: (index: number) => void;
}

const PencilIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
);

const LibraryIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
  </svg>
);

const Header: React.FC<{
  projectName: string;
  onAddScene: () => void;
}> = ({ projectName, onAddScene }) => {
  return (
    <header className={styles.header}>
      <div className={styles.titleArea}>
        <span className={styles.projectLabel}>Project</span>
        <div className={styles.projectRow}>
          <h1 className={styles.projectTitle}>{projectName}</h1>
          <span className={styles.editIcon} title="Editable">
            <PencilIcon />
          </span>
        </div>
      </div>
    </header>
  );
};

const ReferenceCard: React.FC<{
  references: ReferenceImage[];
  onUpload: () => void;
  onOpenLibrary: () => void;
}> = ({ references, onUpload, onOpenLibrary }) => {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>Reference Images</h2>
          <p className={styles.cardDescription}>
            Subject + style anchors for consistency
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.iconButtonSecondary}
            onClick={onOpenLibrary}
            aria-label="Pick from saved images"
            title="Pick from saved images"
          >
            <LibraryIcon />
          </button>
          <button
            className={styles.iconButton}
            onClick={onUpload}
            aria-label="Upload reference images"
            title="Upload reference images"
          >
            +
          </button>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.referenceGrid}>
          <button className={styles.uploadTile} onClick={onUpload}>
            <span>+</span>
            <span>Add Image</span>
          </button>
          {references.map((ref) => (
            <img
              key={ref.id}
              src={ref.data}
              alt="Reference"
              className={styles.referenceThumb}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const SceneCard: React.FC<{
  promptList: string[];
  activeSceneIndex: number;
  onSceneSelect: (index: number) => void;
  onAddScene: () => void;
  onSavePrompt: (index: number, value: string) => void;
  previewImageUrl?: string;
  isGenerating: boolean;
  disableGenerate: boolean;
  onGenerateAll: () => void;
  onRegenerateActive: () => void;
}> = ({
  promptList,
  activeSceneIndex,
  onSceneSelect,
  onAddScene,
  onSavePrompt,
  previewImageUrl,
  isGenerating,
  disableGenerate,
  onGenerateAll,
  onRegenerateActive,
}) => {
  const [draftPrompt, setDraftPrompt] = useState(
    promptList[activeSceneIndex] || ""
  );
  const [useGlobalRef, setUseGlobalRef] = useState(true);
  const [transparentBg, setTransparentBg] = useState(false);

  useEffect(() => {
    setDraftPrompt(promptList[activeSceneIndex] || "");
  }, [promptList, activeSceneIndex]);

  const handleBlur = () => {
    if (draftPrompt.trim()) {
      onSavePrompt(activeSceneIndex, draftPrompt);
    }
  };

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>Scene Prompts</h2>
          <p className={styles.cardDescription}>
            One moment per slide - Medium detail
          </p>
        </div>
        <button className={styles.buttonGhost} onClick={onAddScene}>
          Add Scene
        </button>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.sceneTabs}>
          {promptList.map((_, idx) => (
            <button
              key={`scene-${idx}`}
              className={`${styles.sceneTab} ${
                idx === activeSceneIndex ? styles.sceneTabActive : ""
              }`}
              onClick={() => onSceneSelect(idx)}
            >
              Scene {idx + 1}
            </button>
          ))}
          <button className={styles.sceneTab} onClick={onAddScene}>
            +
          </button>
        </div>

        <div>
          <p className={styles.promptLabel}>
            Scene {activeSceneIndex + 1} Prompt
          </p>
          <div className={styles.promptBox}>
            <textarea
              className={styles.promptTextarea}
              value={draftPrompt}
              onChange={(event) => setDraftPrompt(event.target.value)}
              onBlur={handleBlur}
            />
          </div>
          <p className={styles.promptHint}>
            Tips: One person, one concrete moment, one clear environment, one
            visible emotion
          </p>
        </div>

        <div className={styles.optionRow}>
          <label>
            <input
              type="checkbox"
              checked={useGlobalRef}
              onChange={(event) => setUseGlobalRef(event.target.checked)}
            />
            Use global reference
          </label>
          <label>
            <input
              type="checkbox"
              checked={transparentBg}
              onChange={(event) => setTransparentBg(event.target.checked)}
            />
            Transparent background (title slide)
          </label>
        </div>
      </div>
    </section>
  );
};

const RulesCard: React.FC<{
  rules: { tiktok: string[]; instagram: string[] };
}> = ({ rules }) => {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardTitleRow}>
            <h2 className={styles.cardTitle}>Platform Rules</h2>
            <span className={styles.editIcon} title="Editable">
              <PencilIcon />
            </span>
          </div>
          <p className={styles.cardDescription}>
            Rule-locked generation active
          </p>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.ruleList}>
          <strong>TikTok Caption Rules</strong>
          {rules.tiktok.map((rule) => (
            <div key={rule} className={styles.ruleItem}>
              <span className={styles.checkDot} />
              <span>{rule}</span>
            </div>
          ))}
        </div>
        <div className={styles.ruleList}>
          <strong>Instagram Caption Rules</strong>
          {rules.instagram.map((rule) => (
            <div key={rule} className={styles.ruleItem}>
              <span className={styles.checkDot} />
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const GuidelinesCard: React.FC<{ guidelines: string[] }> = ({ guidelines }) => {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardTitleRow}>
            <h2 className={styles.cardTitle}>Custom Guidelines</h2>
            <span className={styles.editIcon} title="Editable">
              <PencilIcon />
            </span>
          </div>
          <p className={styles.cardDescription}>Brand-specific constraints</p>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.guidelineList}>
          {guidelines.map((item) => (
            <div key={item} className={styles.ruleItem}>
              <span className={styles.checkDot} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CaptionsCard: React.FC<{
  captions: { tiktok: string; instagram: string };
}> = ({ captions }) => {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>Generated Captions</h2>
          <p className={styles.cardDescription}>Platform-optimized copy</p>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div>
          <div className={styles.captionHeader}>
            <span>TikTok</span>
            <span>Copy</span>
          </div>
          <div className={styles.captionBox}>{captions.tiktok}</div>
        </div>
        <div>
          <div className={styles.captionHeader}>
            <span>Instagram</span>
            <span>Copy</span>
          </div>
          <div className={styles.captionBox}>{captions.instagram}</div>
        </div>
      </div>
    </section>
  );
};

const ResultsCard: React.FC<{
  results: SceneResult[];
  isGenerating: boolean;
  onRegenerateResult: (index: number) => void;
  onRegenerateAll: () => void;
  captions: {
    tiktok: string;
    instagram: string;
  };
  projectName: string;
}> = ({
  results,
  isGenerating,
  onRegenerateResult,
  onRegenerateAll,
  captions,
  projectName,
}) => {
  return (
    <Results
      mode="manual"
      results={results}
      isGenerating={isGenerating}
      onRegenerate={onRegenerateResult}
      onRegenerateAll={onRegenerateAll}
      captions={captions}
      projectName={projectName}
    />
  );
};

const FooterBar: React.FC<{
  disableGenerate: boolean;
  isGenerating: boolean;
  onGenerateAll: () => void;
}> = ({ disableGenerate, isGenerating, onGenerateAll }) => {
  return (
    <div className={styles.footerBar}>
      <span className={styles.footerMeta}>Project: Coffee Brand Campaign</span>
      <button
        className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
        onClick={onGenerateAll}
        disabled={disableGenerate}
      >
        {isGenerating ? "Generating..." : "Generate All Scenes"}
      </button>
    </div>
  );
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  projectName,
  references,
  onUpload,
  onOpenLibrary,
  promptList,
  activeSceneIndex,
  onSceneSelect,
  onAddScene,
  onSavePrompt,
  previewImageUrl,
  isGenerating,
  disableGenerate,
  onGenerateAll,
  onRegenerateActive,
  rules,
  guidelines,
  captions,
  results,
  onRegenerateResult,
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
        <Header projectName={projectName} onAddScene={onAddScene} />
        <div className={styles.contentRow}>
          <div className={styles.leftColumn}>
            <ReferenceCard
              references={references}
              onUpload={onUpload}
              onOpenLibrary={onOpenLibrary}
            />
            <SceneCard
              promptList={promptList}
              activeSceneIndex={activeSceneIndex}
              onSceneSelect={onSceneSelect}
              onAddScene={onAddScene}
              onSavePrompt={onSavePrompt}
              previewImageUrl={previewImageUrl}
              isGenerating={isGenerating}
              disableGenerate={disableGenerate}
              onGenerateAll={onGenerateAll}
              onRegenerateActive={onRegenerateActive}
            />
          </div>
          <div className={styles.rightColumn}>
            <RulesCard rules={rules} />
            <GuidelinesCard guidelines={guidelines} />
          </div>
        </div>
      </div>
      <FooterBar
        disableGenerate={disableGenerate}
        isGenerating={isGenerating}
        onGenerateAll={onGenerateAll}
      />
    </div>
  );
};

export default DashboardLayout;
