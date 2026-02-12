import React, { useEffect, useState } from "react";
import { SceneIcon, AIIcon, PlusIcon, CloseIcon } from "./DashboardIcons";
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
  const canRemove = onRemoveScene != null;
  const hasScenes = promptList.some((p) => p.trim().length > 0);

  // Parse the current prompt to extract title and description
  const parsePrompt = (
    prompt: string
  ): { title: string; description: string } => {
    if (!prompt) return { title: "", description: "" };

    // Check if prompt has the format "Title: Description"
    const separatorIndex = prompt.indexOf(": ");
    if (separatorIndex > 0) {
      return {
        title: prompt.substring(0, separatorIndex).trim(),
        description: prompt.substring(separatorIndex + 2).trim(),
      };
    }

    // If no separator, treat entire prompt as description
    return { title: "", description: prompt.trim() };
  };

  const currentPrompt = promptList[activeSceneIndex] || "";
  const parsed = parsePrompt(currentPrompt);

  const [draftTitle, setDraftTitle] = useState(parsed.title);
  const [draftDescription, setDraftDescription] = useState(parsed.description);

  useEffect(() => {
    const parsed = parsePrompt(promptList[activeSceneIndex] || "");
    setDraftTitle(parsed.title);
    setDraftDescription(parsed.description);
  }, [promptList, activeSceneIndex]);

  const savePrompt = () => {
    // Combine title and description
    const prompt =
      draftTitle.trim() && draftDescription.trim()
        ? `${draftTitle.trim()}: ${draftDescription.trim()}`
        : draftTitle.trim() || draftDescription.trim();

    if (prompt) {
      onSavePrompt(activeSceneIndex, prompt);
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
              Add scenes manually or auto-generate from a topic
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
                <span className={styles.emptyActionLabel}>
                  Auto-Generate Scenes
                </span>
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
              Generate from topic and guidelines, or add scenes manually one by
              one.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.sceneList}>
              {promptList.map((prompt, idx) => {
                const parsedItem = parsePrompt(prompt);
                const isActive = idx === activeSceneIndex;

                return (
                  <div
                    key={`scene-${idx}`}
                    className={`${styles.sceneItem} ${
                      isActive ? styles.sceneItemActive : ""
                    }`}
                  >
                    <div className={styles.sceneItemHeader}>
                      <div className={styles.sceneItemContent}>
                        <input
                          type="text"
                          className={styles.sceneItemTitleInput}
                          placeholder={`Scene ${idx + 1}`}
                          value={isActive ? draftTitle : parsedItem.title}
                          onChange={(e) => {
                            if (idx !== activeSceneIndex) {
                              onSceneSelect(idx);
                            }
                            setDraftTitle(e.target.value);
                          }}
                          onBlur={savePrompt}
                          onFocus={() => {
                            if (idx !== activeSceneIndex) {
                              onSceneSelect(idx);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <textarea
                          className={styles.sceneItemDescInput}
                          placeholder={`Scene ${idx + 1} prompt`}
                          value={
                            isActive ? draftDescription : parsedItem.description
                          }
                          onChange={(e) => {
                            if (idx !== activeSceneIndex) {
                              onSceneSelect(idx);
                            }
                            setDraftDescription(e.target.value);
                          }}
                          onBlur={savePrompt}
                          onFocus={() => {
                            if (idx !== activeSceneIndex) {
                              onSceneSelect(idx);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          rows={2}
                        />
                      </div>
                      <div className={styles.sceneItemActions}>
                        {canRemove && (
                          <button
                            type="button"
                            className={styles.closeBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveScene?.(idx);
                            }}
                            title="Remove scene"
                            aria-label={`Remove scene ${idx + 1}`}
                          >
                            <CloseIcon />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default SceneCard;
