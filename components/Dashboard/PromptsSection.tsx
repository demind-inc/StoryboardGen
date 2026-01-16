import React from "react";
import styles from "./PromptsSection.module.scss";
import { ReferenceImage } from "../../types";

interface PromptsSectionProps {
  prompts: string;
  isAddingNewPrompt: boolean;
  editingPromptIndex: number | null;
  savingPromptIndex: number | null;
  references: ReferenceImage[];
  onAddPrompt: () => void;
  onRemovePrompt: (index: number) => void;
  onReorderPrompt: (fromIndex: number, toIndex: number) => void;
  onStartEdit: (index: number) => void;
  onSavePrompt: (index: number | null, value: string) => void;
  onCancelEdit: () => void;
  onSaveIndividualPrompt: (index: number) => void;
  onOpenLibrary: () => void;
}

const PromptsSection: React.FC<PromptsSectionProps> = ({
  prompts,
  isAddingNewPrompt,
  editingPromptIndex,
  savingPromptIndex,
  references,
  onAddPrompt,
  onRemovePrompt,
  onReorderPrompt,
  onStartEdit,
  onSavePrompt,
  onCancelEdit,
  onSaveIndividualPrompt,
  onOpenLibrary,
}) => {
  const promptList = prompts.split("\n").filter((p) => p.trim() !== "");
  const visibleReferences = references.slice(0, 3);

  return (
    <section className="card sidebar__panel">
      <div className="card__header">
        <h3 className="card__title">2. Scene Prompts</h3>
        <div className="card__actions">
          <button
            onClick={onOpenLibrary}
            className="card__action card__action--ghost"
          >
            Use saved prompt
          </button>
        </div>
      </div>
      <div className={styles.promptsSection__container}>
        <ul className={styles.promptsSection__list}>
          {isAddingNewPrompt && (
            <li
              className={`${styles.promptsSection__item} ${styles["promptsSection__item--editing"]}`}
            >
              <div className={styles.promptsSection__itemHead}>
                <div className={styles.promptsSection__sceneTag}>Scene</div>
              </div>
              <textarea
                className={styles.promptsSection__itemInput}
                placeholder="Describe what happens in this scene..."
                autoFocus
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    onSavePrompt(null, e.target.value);
                  } else {
                    onCancelEdit();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.currentTarget.blur();
                  } else if (e.key === "Escape") {
                    onCancelEdit();
                  }
                }}
              />
              <div className={styles.promptsSection__itemActions}>
                <button
                  onClick={onCancelEdit}
                  className={styles.promptsSection__itemButton}
                  title="Cancel"
                >
                  Cancel
                </button>
              </div>
            </li>
          )}
          {promptList.map((prompt, idx) => (
            <li
              key={idx}
              className={`${styles.promptsSection__item} ${
                editingPromptIndex === idx
                  ? styles["promptsSection__item--editing"]
                  : ""
              }`}
            >
              <div className={styles.promptsSection__itemHead}>
                <div className={styles.promptsSection__sceneTag}>
                  Scene {idx + 1}
                </div>
              </div>

              {editingPromptIndex === idx ? (
                <textarea
                  className={styles.promptsSection__itemInput}
                  defaultValue={prompt.trim()}
                  autoFocus
                  onBlur={(e) => {
                    onSavePrompt(idx, e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.currentTarget.blur();
                    } else if (e.key === "Escape") {
                      onCancelEdit();
                    }
                  }}
                />
              ) : (
                <span
                  className={styles.promptsSection__itemText}
                  onClick={() => onStartEdit(idx)}
                  title="Click to edit"
                >
                  {prompt.trim()}
                </span>
              )}

              <div className={styles.promptsSection__itemActions}>
                <div className={styles.promptsSection__reorder}>
                  <button
                    onClick={() => onReorderPrompt(idx, Math.max(0, idx - 1))}
                    disabled={idx === 0}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() =>
                      onReorderPrompt(
                        idx,
                        Math.min(promptList.length - 1, idx + 1)
                      )
                    }
                    disabled={idx === promptList.length - 1}
                    title="Move down"
                  >
                    ↓
                  </button>
                </div>
                <div className={styles.promptsSection__ctaGroup}>
                  <button
                    onClick={() => onSaveIndividualPrompt(idx)}
                    disabled={savingPromptIndex === idx}
                    className={styles.promptsSection__itemButton}
                    title="Save"
                  >
                    {savingPromptIndex === idx ? "Saving..." : "Save scene"}
                  </button>
                  <button
                    onClick={() => onRemovePrompt(idx)}
                    className={styles.promptsSection__itemButton}
                    title="Delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
          {promptList.length === 0 && !isAddingNewPrompt && (
            <div className={styles.promptsSection__empty}>
              <p className="text text--helper">
                No prompts yet. Start with a single scene to preview the flow.
              </p>
            </div>
          )}
        </ul>
        {!isAddingNewPrompt && (
          <button
            onClick={onAddPrompt}
            className={styles.promptsSection__addButton}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Scene
          </button>
        )}
      </div>
      <p className="text text--helper">
        Describe what’s happening in this scene.
      </p>
    </section>
  );
};

export default PromptsSection;
