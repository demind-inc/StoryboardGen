import React from "react";
import { SceneIcon, AIIcon, PlusIcon, SpinnerIcon } from "./DashboardIcons";
import SceneItem from "./SceneItem";
import { Scene } from "../../types/scene";
import styles from "./SceneCard.module.scss";

export interface SceneCardProps {
  scenes: Scene[];
  activeSceneIndex: number;
  onSceneSelect: (index: number) => void;
  onAddScene: () => void;
  onRemoveScene?: (index: number) => void;
  onSaveScene: (index: number, title: string, description: string, scenePrompt: string) => void;
  previewImageUrl?: string;
  onOpenAutoGenerate?: () => void;
  isTopicGenerating?: boolean;
}

const SceneCard: React.FC<SceneCardProps> = ({
  scenes,
  activeSceneIndex,
  onSceneSelect,
  onAddScene,
  onRemoveScene,
  onSaveScene,
  onOpenAutoGenerate,
  isTopicGenerating = false,
}) => {
  const canRemove = onRemoveScene != null;
  const hasScenes = scenes.length > 0;

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleRow}>
          <span className={styles.cardIcon}>
            <SceneIcon />
          </span>
          <div>
            <h2 className={styles.cardTitle}>Scenes</h2>
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
              {scenes.map((scene, idx) => (
                <SceneItem
                  key={scene.id}
                  scene={scene}
                  index={idx}
                  isActive={idx === activeSceneIndex}
                  canRemove={canRemove}
                  onSelect={() => onSceneSelect(idx)}
                  onRemove={() => onRemoveScene?.(idx)}
                  onSave={(title, description, scenePrompt) =>
                    onSaveScene(idx, title, description, scenePrompt)
                  }
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
