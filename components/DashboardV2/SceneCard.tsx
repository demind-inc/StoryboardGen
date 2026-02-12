import React, { useEffect, useState } from "react";
import { SceneIcon, AIIcon, PlusIcon } from "./DashboardIcons";
import styles from "./SceneCard.module.scss";

export interface SceneCardProps {
  promptList: string[];
  activeSceneIndex: number;
  onSceneSelect: (index: number) => void;
  onAddScene: () => void;
  onRemoveScene?: (index: number) => void;
  onSavePrompt: (index: number, value: string) => void;
  previewImageUrl?: string;
  onOpenAutoGenerate?: () => void;
}

const SceneCard: React.FC<SceneCardProps> = ({
  promptList,
  activeSceneIndex,
  onSceneSelect,
  onAddScene,
  onRemoveScene,
  onSavePrompt,
  onOpenAutoGenerate,
}) => {
  const canRemove = onRemoveScene != null && promptList.length > 1;
  const [draftPrompt, setDraftPrompt] = useState(
    promptList[activeSceneIndex] || ""
  );
  const hasScenes = promptList.some((p) => p.trim().length > 0);

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
        <div className={styles.cardTitleRow}>
          <span className={styles.cardIcon}>
            <SceneIcon />
          </span>
          <div>
            <h2 className={styles.cardTitle}>Scenes</h2>
            <p className={styles.cardDescription}>
              {hasScenes
                ? "Edit scene prompts below"
                : "Add scenes manually or auto-generate from a topic"}
            </p>
          </div>
        </div>
        {hasScenes && (
          <div className={styles.headerActions}>
            {onOpenAutoGenerate && (
              <button
                type="button"
                className={styles.autoGenerateBtn}
                onClick={onOpenAutoGenerate}
              >
                <AIIcon />
                <span>Auto-Generate</span>
              </button>
            )}
            <button
              type="button"
              className={styles.addSceneBtn}
              onClick={onAddScene}
            >
              <PlusIcon />
              <span>Add Scene</span>
            </button>
          </div>
        )}
      </div>

      <div className={styles.cardBody}>
        {!hasScenes ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyActions}>
              <button
                type="button"
                className={styles.emptyActionPrimary}
                onClick={onOpenAutoGenerate}
              >
                <span className={styles.emptyActionIcon}>
                  <AIIcon />
                </span>
                <span className={styles.emptyActionLabel}>Auto-Generate Scenes</span>
              </button>
              <button
                type="button"
                className={styles.emptyActionSecondary}
                onClick={onAddScene}
              >
                <span className={styles.emptyActionIconSecondary}>
                  <PlusIcon />
                </span>
                <span className={styles.emptyActionLabel}>Add Scene</span>
              </button>
            </div>
            <p className={styles.emptyHint}>
              Generate from topic and guidelines, or add scenes manually one by one.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.sceneList}>
              {promptList.map((prompt, idx) => (
                <div
                  key={`scene-${idx}`}
                  className={`${styles.sceneItem} ${
                    idx === activeSceneIndex ? styles.sceneItemActive : ""
                  }`}
                  onClick={() => onSceneSelect(idx)}
                >
                  <div className={styles.sceneItemContent}>
                    <span className={styles.sceneItemTitle}>Scene {idx + 1}</span>
                    <span className={styles.sceneItemDesc}>
                      {prompt.trim() || "No description yet"}
                    </span>
                  </div>
                  {canRemove && (
                    <button
                      type="button"
                      className={styles.sceneItemRemove}
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
                </div>
              ))}
            </div>

            <div className={styles.promptSection}>
              <label className={styles.promptLabel}>
                Scene {activeSceneIndex + 1} Prompt
              </label>
              <div className={styles.promptBox}>
                <textarea
                  className={styles.promptTextarea}
                  placeholder="Describe this scene... e.g. Boy studying at a cafe"
                  value={draftPrompt}
                  onChange={(event) => setDraftPrompt(event.target.value)}
                  onBlur={handleBlur}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default SceneCard;
