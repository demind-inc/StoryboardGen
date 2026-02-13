import React, { useState, useEffect, useRef, useCallback } from "react";
import { CloseIcon } from "./DashboardIcons";
import { Scene } from "../../types/scene";
import styles from "./SceneCard.module.scss";

interface SceneItemProps {
  scene: Scene;
  index: number;
  isActive: boolean;
  canRemove: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onSave: (title: string, description: string, scenePrompt: string) => void;
}

const SceneItem: React.FC<SceneItemProps> = ({
  scene,
  index,
  isActive,
  canRemove,
  onSelect,
  onRemove,
  onSave,
}) => {
  const [draftTitle, setDraftTitle] = useState(scene.title);
  const [draftDescription, setDraftDescription] = useState(scene.description);
  const [draftScenePrompt, setDraftScenePrompt] = useState(scene.scenePrompt);
  const [isScenePromptOpen, setIsScenePromptOpen] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const draftTitleRef = useRef(draftTitle);
  const draftDescriptionRef = useRef(draftDescription);
  const draftScenePromptRef = useRef(draftScenePrompt);

  useEffect(() => {
    draftTitleRef.current = draftTitle;
    draftDescriptionRef.current = draftDescription;
    draftScenePromptRef.current = draftScenePrompt;
  }, [draftTitle, draftDescription, draftScenePrompt]);

  const prevIsActiveRef = useRef(isActive);

  useEffect(() => {
    if (prevIsActiveRef.current && !isActive) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      onSave(
        draftTitleRef.current,
        draftDescriptionRef.current,
        draftScenePromptRef.current
      );
    }
    prevIsActiveRef.current = isActive;
  }, [isActive, onSave]);

  const sceneIdRef = useRef(scene.id);
  useEffect(() => {
    if (sceneIdRef.current !== scene.id) {
      setDraftTitle(scene.title);
      setDraftDescription(scene.description);
      setDraftScenePrompt(scene.scenePrompt);
      setIsScenePromptOpen(false);
      sceneIdRef.current = scene.id;
    }
  }, [scene.id, scene.title, scene.description, scene.scenePrompt]);

  const saveCurrentPrompt = useCallback(() => {
    onSave(
      draftTitleRef.current,
      draftDescriptionRef.current,
      draftScenePromptRef.current
    );
  }, [onSave]);

  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveCurrentPrompt();
    }, 1000);
  }, [saveCurrentPrompt]);

  const handleBlur = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    saveCurrentPrompt();
  }, [saveCurrentPrompt]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isActive) {
      onSelect();
    }
    setDraftTitle(e.target.value);
    debouncedSave();
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    if (!isActive) {
      onSelect();
    }

    const nextDescription = e.target.value;
    const previousDescription = draftDescriptionRef.current;
    const previousScenePrompt = draftScenePromptRef.current;

    setDraftDescription(nextDescription);

    if (!previousScenePrompt || previousScenePrompt === previousDescription) {
      setDraftScenePrompt(nextDescription);
    }

    debouncedSave();
  };

  const handleScenePromptChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    if (!isActive) {
      onSelect();
    }
    setDraftScenePrompt(e.target.value);
    debouncedSave();
  };

  const handleFocus = () => {
    if (!isActive) {
      onSelect();
    }
  };

  return (
    <div
      className={`${styles.sceneItem} ${
        isActive ? styles.sceneItemActive : ""
      }`}
    >
      <div className={styles.sceneItemHeader}>
        <div className={styles.sceneItemContent}>
          <input
            type="text"
            className={styles.sceneItemTitleInput}
            placeholder="Scene title"
            value={isActive ? draftTitle : scene.title}
            onChange={handleTitleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onClick={(e) => e.stopPropagation()}
          />
          <textarea
            className={styles.sceneItemDescInput}
            placeholder="Scene description"
            value={isActive ? draftDescription : scene.description}
            onChange={handleDescriptionChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onClick={(e) => e.stopPropagation()}
            rows={2}
          />

          <details
            className={styles.scenePromptCollapse}
            open={isScenePromptOpen}
            onToggle={(e) =>
              setIsScenePromptOpen((e.currentTarget as HTMLDetailsElement).open)
            }
          >
            <summary className={styles.scenePromptSummary}>Scene prompt</summary>
            <textarea
              className={styles.scenePromptInput}
              placeholder="Scene prompt used for image generation"
              value={isActive ? draftScenePrompt : scene.scenePrompt}
              onChange={handleScenePromptChange}
              onBlur={handleBlur}
              onFocus={handleFocus}
              onClick={(e) => e.stopPropagation()}
              rows={3}
            />
          </details>
        </div>
        <div className={styles.sceneItemActions}>
          {canRemove && (
            <button
              type="button"
              className={styles.closeBtn}
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              title="Remove scene"
              aria-label={`Remove scene ${index + 1}`}
            >
              <CloseIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SceneItem;
