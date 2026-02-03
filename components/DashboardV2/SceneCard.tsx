import React, { useEffect, useState } from "react";
import styles from "./SceneCard.module.scss";

export interface SceneCardProps {
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
}

const SceneCard: React.FC<SceneCardProps> = ({
  promptList,
  activeSceneIndex,
  onSceneSelect,
  onAddScene,
  onSavePrompt,
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

export default SceneCard;
