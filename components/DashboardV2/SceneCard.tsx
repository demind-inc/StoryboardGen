import React from "react";
import {
  SceneIcon,
  AIIcon,
  PlusIcon,
  SpinnerIcon,
} from "./DashboardIcons";
import SceneItem from "./SceneItem";
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
  isTopicGenerating?: boolean;
}

const SceneCard: React.FC<SceneCardProps> = ({
  promptList,
  activeSceneIndex,
  onSceneSelect,
  onAddScene,
  onRemoveScene,
  onSavePrompt,
  onOpenAutoGenerate,
  isTopicGenerating = false,
}) => {
  const canRemove = onRemoveScene != null;
  const hasScenes = promptList.some((p) => p.trim().length > 0);

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
                disabled={isTopicGenerating}
              >
                {isTopicGenerating ? <SpinnerIcon /> : <AIIcon />}
                <span>
                  {isTopicGenerating ? "Generating..." : "Auto-Generate"}
                </span>
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
                disabled={isTopicGenerating}
              >
                <span className={styles.emptyActionIcon}>
                  {isTopicGenerating ? <SpinnerIcon /> : <AIIcon />}
                </span>
                <span className={styles.emptyActionLabel}>
                  {isTopicGenerating ? "Generating..." : "Auto-Generate Scenes"}
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
              {promptList.map((prompt, idx) => (
                <SceneItem
                  key={`${idx}-${prompt.substring(0, 50)}`}
                  prompt={prompt}
                  index={idx}
                  isActive={idx === activeSceneIndex}
                  canRemove={canRemove}
                  onSelect={() => onSceneSelect(idx)}
                  onRemove={() => onRemoveScene?.(idx)}
                  onSave={(newPrompt) => onSavePrompt(idx, newPrompt)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default SceneCard;
