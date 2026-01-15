import React from "react";
import styles from "./PromptsSection.module.scss";

interface PromptsSectionProps {
  prompts: string;
  isAddingNewPrompt: boolean;
  editingPromptIndex: number | null;
  savingPromptIndex: number | null;
  onAddPrompt: () => void;
  onRemovePrompt: (index: number) => void;
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
  onAddPrompt,
  onRemovePrompt,
  onStartEdit,
  onSavePrompt,
  onCancelEdit,
  onSaveIndividualPrompt,
  onOpenLibrary,
}) => {
  const promptList = prompts.split("\n").filter((p) => p.trim() !== "");

  return (
    <section className="card sidebar__panel">
      <div className="card__header">
        <h3 className="card__title">2. Manual Scenarios</h3>
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
              <input
                type="text"
                className={styles.promptsSection__itemInput}
                placeholder="Enter a new prompt..."
                autoFocus
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    onSavePrompt(null, e.target.value);
                  } else {
                    onCancelEdit();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
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
              {editingPromptIndex === idx ? (
                <input
                  type="text"
                  className={styles.promptsSection__itemInput}
                  defaultValue={prompt.trim()}
                  autoFocus
                  onBlur={(e) => {
                    onSavePrompt(idx, e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
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
              {editingPromptIndex !== idx && (
                <div className={styles.promptsSection__itemActions}>
                  <button
                    onClick={() => onSaveIndividualPrompt(idx)}
                    disabled={savingPromptIndex === idx}
                    className={styles.promptsSection__itemButton}
                    title="Save"
                  >
                    {savingPromptIndex === idx ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        className={styles.promptsSection__spinner}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                        />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => onRemovePrompt(idx)}
                    className={styles.promptsSection__itemButton}
                    title="Delete"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </li>
          ))}
          {promptList.length === 0 && !isAddingNewPrompt && (
            <div className={styles.promptsSection__empty}>
              <p className="text text--helper">
                No prompts yet. Click "Add prompt for scene" to get started.
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
            Add prompt for scene
          </button>
        )}
      </div>
      <p className="text text--helper">
        Describe actions, emotions, and props.
      </p>
    </section>
  );
};

export default PromptsSection;
