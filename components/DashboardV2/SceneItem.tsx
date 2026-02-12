import React, { useState, useEffect, useRef, useCallback } from "react";
import { CloseIcon } from "./DashboardIcons";
import styles from "./SceneCard.module.scss";

interface SceneItemProps {
  prompt: string;
  index: number;
  isActive: boolean;
  canRemove: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onSave: (prompt: string) => void;
}

// Parse the prompt to extract title and description
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

const SceneItem: React.FC<SceneItemProps> = ({
  prompt,
  index,
  isActive,
  canRemove,
  onSelect,
  onRemove,
  onSave,
}) => {
  const parsedItem = parsePrompt(prompt);
  const [draftTitle, setDraftTitle] = useState(parsedItem.title);
  const [draftDescription, setDraftDescription] = useState(parsedItem.description);
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
      // Save directly without using the callback
      const title = draftTitleRef.current.trim();
      const description = draftDescriptionRef.current.trim();
      const newPrompt =
        title && description
          ? `${title}: ${description}`
          : title || description;
      if (newPrompt) {
        onSave(newPrompt);
      }
    }
    prevIsActiveRef.current = isActive;
  }, [isActive, onSave]);

  // Update drafts when prompt changes from external source (not during typing)
  const promptRef = useRef(prompt);
  useEffect(() => {
    // Only update if this is a new prompt (e.g., from scene switch or removal)
    if (promptRef.current !== prompt) {
      const parsed = parsePrompt(prompt);
      setDraftTitle(parsed.title);
      setDraftDescription(parsed.description);
      promptRef.current = prompt;
    }
  }, [prompt]);

  // Auto-save function that always uses latest values
  const saveCurrentPrompt = useCallback(() => {
    const title = draftTitleRef.current.trim();
    const description = draftDescriptionRef.current.trim();
    const newPrompt =
      title && description
        ? `${title}: ${description}`
        : title || description;

    if (newPrompt) {
      onSave(newPrompt);
    }
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

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
            value={isActive ? draftTitle : parsedItem.title}
            onChange={handleTitleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onClick={(e) => e.stopPropagation()}
          />
          <textarea
            className={styles.sceneItemDescInput}
            placeholder="Scene description"
            value={
              isActive ? draftDescription : parsedItem.description
            }
            onChange={handleDescriptionChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onClick={(e) => e.stopPropagation()}
            rows={1}
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
