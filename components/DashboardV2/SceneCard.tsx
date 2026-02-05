import React, { useEffect, useState } from "react";
import styles from "./SceneCard.module.scss";

export interface SceneCardProps {
  promptList: string[];
  activeSceneIndex: number;
  onSceneSelect: (index: number) => void;
  onAddScene: () => void;
  onRemoveScene?: (index: number) => void;
  onSavePrompt: (index: number, value: string) => void;
  previewImageUrl?: string;
}

const SceneCard: React.FC<SceneCardProps> = ({
  promptList,
  activeSceneIndex,
  onSceneSelect,
  onAddScene,
  onRemoveScene,
  onSavePrompt,
}) => {
  const canRemove = onRemoveScene != null && promptList.length > 1;
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
          <h2 className={styles.cardTitle}>3. Scene Prompts</h2>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.sceneTabs}>
          {promptList.map((_, idx) => (
            <span key={`scene-${idx}`} className={styles.sceneTabWrap}>
              <button
                type="button"
                className={`${styles.sceneTab} ${
                  idx === activeSceneIndex ? styles.sceneTabActive : ""
                }`}
                onClick={() => onSceneSelect(idx)}
              >
                Scene {idx + 1}
              </button>
              {canRemove && (
                <button
                  type="button"
                  className={styles.sceneTabRemove}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveScene?.(idx);
                  }}
                  title="Remove scene"
                  aria-label={`Remove scene ${idx + 1}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
          <button
            type="button"
            className={styles.sceneTab}
            onClick={onAddScene}
          >
            +
          </button>
        </div>

        <div>
          <div className={styles.promptBox}>
            <textarea
              className={styles.promptTextarea}
              placeholder="e.g. Boy studying at a cafe"
              value={draftPrompt}
              onChange={(event) => setDraftPrompt(event.target.value)}
              onBlur={handleBlur}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SceneCard;
