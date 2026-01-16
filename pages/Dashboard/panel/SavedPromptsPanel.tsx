import React, { useState, useEffect, useMemo } from "react";
import { PromptPreset } from "../../../types";
import { useAuth } from "../../../providers/AuthProvider";
import {
  fetchPromptLibrary,
  savePromptPreset,
  updatePromptPreset,
  deletePromptPreset,
} from "../../../services/libraryService";
import styles from "./SavedPromptsPanel.module.scss";

interface SavedPromptsPanelProps {
  sortDirection: "newest" | "oldest";
  onSortChange: (value: "newest" | "oldest") => void;
  onSelectPromptPreset: (preset: PromptPreset) => void;
}

const SavedPromptsPanel: React.FC<SavedPromptsPanelProps> = ({
  sortDirection,
  onSortChange,
  onSelectPromptPreset,
}) => {
  const { session, authStatus } = useAuth();
  const [promptLibrary, setPromptLibrary] = useState<PromptPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingNewPrompt, setIsAddingNewPrompt] = useState(false);
  const [newPromptContent, setNewPromptContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editingPromptContent, setEditingPromptContent] = useState("");
  const [isUpdatingPrompt, setIsUpdatingPrompt] = useState(false);

  const loadPromptLibrary = async (userId: string) => {
    setIsLoading(true);
    try {
      const prompts = await fetchPromptLibrary(userId);
      setPromptLibrary(prompts);
    } catch (error) {
      console.error("Failed to load prompt library:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const userId = session?.user?.id;
    if (authStatus === "signed_in" && userId) {
      loadPromptLibrary(userId);
    }
  }, [authStatus, session?.user?.id]);

  const sortedPrompts = useMemo(() => {
    return [...promptLibrary].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortDirection === "newest" ? bTime - aTime : aTime - bTime;
    });
  }, [promptLibrary, sortDirection]);

  const handleSaveNewPrompt = async () => {
    if (!newPromptContent.trim()) {
      alert("Please enter prompt content.");
      return;
    }
    const userId = session?.user?.id;
    if (!userId) {
      alert("Unable to verify your account. Please sign in again.");
      return;
    }
    setIsSaving(true);
    try {
      // Use the prompt content as the title (truncated if too long)
      const title =
        newPromptContent.trim().length > 50
          ? `${newPromptContent.trim().substring(0, 50)}...`
          : newPromptContent.trim();

      await savePromptPreset(userId, newPromptContent.trim(), title);
      setIsAddingNewPrompt(false);
      setNewPromptContent("");
      await loadPromptLibrary(userId);
    } catch (error) {
      console.error("Failed to save new prompt:", error);
      alert("Could not save prompt. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelNewPrompt = () => {
    setIsAddingNewPrompt(false);
    setNewPromptContent("");
  };

  const startEditingPrompt = (preset: PromptPreset) => {
    setEditingPromptId(preset.id);
    setEditingPromptContent(preset.content);
  };

  const handleSaveEditedPrompt = async () => {
    if (!editingPromptId) return;
    if (!editingPromptContent.trim()) {
      alert("Please enter prompt content.");
      return;
    }
    const userId = session?.user?.id;
    if (!userId) {
      alert("Unable to verify your account. Please sign in again.");
      return;
    }
    setIsUpdatingPrompt(true);
    try {
      await updatePromptPreset(
        userId,
        editingPromptId,
        editingPromptContent,
        editingPromptContent
      );
      setEditingPromptId(null);
      setEditingPromptContent("");
      await loadPromptLibrary(userId);
    } catch (error) {
      console.error("Failed to update prompt preset:", error);
      alert("Could not update prompt. Please try again.");
    } finally {
      setIsUpdatingPrompt(false);
    }
  };

  const handleCancelEditPrompt = () => {
    setEditingPromptId(null);
    setEditingPromptContent("");
  };

  const handleDeletePrompt = async (presetId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this prompt? This action cannot be undone."
      )
    ) {
      return;
    }

    const userId = session?.user?.id;
    if (!userId) {
      alert("Unable to verify your account. Please sign in again.");
      return;
    }

    try {
      await deletePromptPreset(userId, presetId);
      await loadPromptLibrary(userId);
    } catch (error) {
      console.error("Failed to delete prompt:", error);
      alert("Could not delete this prompt. Please try again.");
    }
  };

  const handleUploadClick = () => {
    if (!isAddingNewPrompt) {
      setIsAddingNewPrompt(true);
      setNewPromptContent("");
    }
  };

  return (
    <section className="card">
      <div className="card__header">
        <h3 className="card__title">Saved prompts</h3>
        <div className="card__actions">
          <div className="libraryFilter">
            <label htmlFor="prompt-sort" className="libraryFilter__label">
              Sort
            </label>
            <select
              id="prompt-sort"
              className="libraryFilter__select"
              value={sortDirection}
              onChange={(e) =>
                onSortChange(e.target.value as "newest" | "oldest")
              }
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
      </div>
      {isLoading ? (
        <p className={styles.empty}>Loading prompts...</p>
      ) : (
        <>
          <div className={`${styles.libraryPrompt__list} custom-scrollbar`}>
            {isAddingNewPrompt && (
              <div className={`${styles.libraryPrompt__item} ${styles["libraryPrompt__item--new"]}`}>
                <textarea
                  className={styles.libraryPrompt__contentInput}
                  placeholder="Enter prompt..."
                  value={newPromptContent}
                  onChange={(e) => setNewPromptContent(e.target.value)}
                  rows={3}
                  autoFocus
                  required
                />
                <div className={styles.libraryPrompt__actions}>
                  <button
                    onClick={handleSaveNewPrompt}
                    disabled={isSaving || !newPromptContent.trim()}
                    className={`${styles.libraryPrompt__actionBtn} ${styles["libraryPrompt__actionBtn--save"]}`}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={handleCancelNewPrompt}
                    disabled={isSaving}
                    className={`${styles.libraryPrompt__actionBtn} ${styles["libraryPrompt__actionBtn--cancel"]}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {sortedPrompts.length === 0 && !isAddingNewPrompt ? (
              <p className={styles.empty}>No saved prompts.</p>
            ) : (
              sortedPrompts.map((preset) => {
                const isEditing = editingPromptId === preset.id;
                return isEditing ? (
                  <div
                    key={preset.id}
                    className={`${styles.libraryPrompt__item} ${styles["libraryPrompt__item--editing"]}`}
                  >
                    <textarea
                      className={styles.libraryPrompt__contentInput}
                      placeholder="Enter prompt..."
                      value={editingPromptContent}
                      onChange={(e) => setEditingPromptContent(e.target.value)}
                      rows={3}
                      disabled={isUpdatingPrompt}
                      autoFocus
                      required
                    />
                    <div className={styles.libraryPrompt__actions}>
                      <button
                        onClick={handleSaveEditedPrompt}
                        disabled={
                          isUpdatingPrompt || !editingPromptContent.trim()
                        }
                        className={`${styles.libraryPrompt__actionBtn} ${styles["libraryPrompt__actionBtn--save"]}`}
                      >
                        {isUpdatingPrompt ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={handleCancelEditPrompt}
                        disabled={isUpdatingPrompt}
                        className={`${styles.libraryPrompt__actionBtn} ${styles["libraryPrompt__actionBtn--cancel"]}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    key={preset.id}
                    className={styles.libraryPrompt__item}
                    onClick={() => onSelectPromptPreset(preset)}
                  >
                    <div className={styles.libraryPrompt__header}>
                      <div className={styles.libraryPrompt__title}>{preset.title}</div>
                      <div className={styles.libraryPrompt__meta}>
                        {preset.createdAt && (
                          <span>
                            {new Date(preset.createdAt).toLocaleDateString()}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditingPrompt(preset);
                          }}
                          className={styles.libraryPrompt__actionBtn}
                          disabled={isSaving || isUpdatingPrompt}
                          title="Edit prompt"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePrompt(preset.id);
                          }}
                          className={`${styles.libraryPrompt__actionBtn} ${styles["libraryPrompt__actionBtn--delete"]}`}
                          disabled={isSaving || isUpdatingPrompt}
                          title="Delete prompt"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <div className="librarySet__actions">
            <button
              onClick={handleUploadClick}
              className="primary-button primary-button--full"
              disabled={isSaving}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
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
              {isAddingNewPrompt ? "Add more prompts" : "Upload new prompt"}
            </button>
          </div>
        </>
      )}
    </section>
  );
};

export default SavedPromptsPanel;
