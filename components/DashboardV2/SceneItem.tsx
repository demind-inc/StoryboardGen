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
  onSave: (title: string, description: string) => void;
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
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use refs to always have access to latest values
  const draftTitleRef = useRef(draftTitle);
  const draftDescriptionRef = useRef(draftDescription);

  // Keep refs in sync with state
  useEffect(() => {
    draftTitleRef.current = draftTitle;
    draftDescriptionRef.current = draftDescription;
  }, [draftTitle, draftDescription]);

  // Track previous isActive state
  const prevIsActiveRef = useRef(isActive);

  // Save when becoming inactive (switching to another scene)
  useEffect(() => {
    if (prevIsActiveRef.current && !isActive) {
      // Was active, now inactive - save pending changes immediately
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      // Save directly
      onSave(draftTitleRef.current, draftDescriptionRef.current);
    }
    prevIsActiveRef.current = isActive;
  }, [isActive, onSave]);

  // Update drafts when scene changes from external source
  const sceneIdRef = useRef(scene.id);
  useEffect(() => {
    // Only update if this is a different scene (different ID)
    if (sceneIdRef.current !== scene.id) {
      setDraftTitle(scene.title);
      setDraftDescription(scene.description);
      sceneIdRef.current = scene.id;
    }
  }, [scene.id, scene.title, scene.description]);

  // Auto-save function that always uses latest values
  const saveCurrentPrompt = useCallback(() => {
    onSave(draftTitleRef.current, draftDescriptionRef.current);
  }, [onSave]);

  // Debounced save
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveCurrentPrompt();
    }, 1000);
  }, [saveCurrentPrompt]);

  // Immediate save (cancel pending debounce and save now)
  const handleBlur = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    saveCurrentPrompt();
  }, [saveCurrentPrompt]);

  // Cleanup on unmount - only clear timeout, don't save
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
    setDraftDescription(e.target.value);
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
