import React, { useMemo, useState, useRef } from "react";
import { ReferenceSet, ReferenceImage } from "../../types";
import styles from "./SavedImagesPanel.module.scss";

interface ImageExpandModalProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
}

const ImageExpandModal: React.FC<ImageExpandModalProps> = ({
  isOpen,
  imageUrl,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={styles.imageExpandModal__backdrop}
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      <div className={styles.imageExpandModal}>
        <button
          className={styles.imageExpandModal__close}
          onClick={onClose}
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <img
          src={imageUrl}
          alt="Expanded view"
          className={styles.imageExpandModal__image}
        />
      </div>
    </div>
  );
};

interface SavedImagesPanelProps {
  referenceLibrary: ReferenceSet[];
  isLoading?: boolean;
  sortDirection: "newest" | "oldest";
  onSortChange: (value: "newest" | "oldest") => void;
  onSelectReferenceSet: (sets: ReferenceSet[]) => void;
  onSaveNewSet: (images: ReferenceImage[], label?: string) => Promise<void>;
  onUpdateReferenceSet: (setId: string, label: string) => Promise<void>;
  onDeleteReferenceSet: (setId: string) => Promise<void>;
}

const SavedImagesPanel: React.FC<SavedImagesPanelProps> = ({
  referenceLibrary,
  isLoading,
  sortDirection,
  onSortChange,
  onSelectReferenceSet,
  onSaveNewSet,
  onUpdateReferenceSet,
  onDeleteReferenceSet,
}) => {
  const [isAddingNewSet, setIsAddingNewSet] = useState(false);
  const [newSetImages, setNewSetImages] = useState<ReferenceImage[]>([]);
  const [newSetLabel, setNewSetLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editingSetLabel, setEditingSetLabel] = useState("");
  const [isUpdatingSet, setIsUpdatingSet] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedSets = useMemo(() => {
    return [...referenceLibrary].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortDirection === "newest" ? bTime - aTime : aTime - bTime;
    });
  }, [referenceLibrary, sortDirection]);

  const handleUploadClick = () => {
    if (!isAddingNewSet) {
      setIsAddingNewSet(true);
      setNewSetImages([]);
      setNewSetLabel("");
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewSetImages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substr(2, 9),
            data: reader.result as string,
            mimeType: file.type,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeNewSetImage = (id: string) => {
    setNewSetImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSaveNewSet = async () => {
    if (newSetImages.length === 0) {
      alert("Please upload at least one image.");
      return;
    }
    if (!newSetLabel.trim()) {
      alert("Please enter a name for the set.");
      return;
    }
    setIsSaving(true);
    try {
      await onSaveNewSet(newSetImages, newSetLabel.trim());
      setIsAddingNewSet(false);
      setNewSetImages([]);
      setNewSetLabel("");
    } catch (error) {
      console.error("Failed to save new set:", error);
      alert("Could not save images. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelNewSet = () => {
    setIsAddingNewSet(false);
    setNewSetImages([]);
    setNewSetLabel("");
  };

  const startEditingSet = (set: ReferenceSet) => {
    setEditingSetId(set.setId);
    setEditingSetLabel(set.label || "");
  };

  const handleSaveEditedSet = async () => {
    if (!editingSetId) return;
    if (!editingSetLabel.trim()) {
      alert("Please enter a name for the set.");
      return;
    }
    setIsUpdatingSet(true);
    try {
      await onUpdateReferenceSet(editingSetId, editingSetLabel.trim());
      setEditingSetId(null);
      setEditingSetLabel("");
    } catch (error) {
      console.error("Failed to update reference set:", error);
      alert("Could not update this set. Please try again.");
    } finally {
      setIsUpdatingSet(false);
    }
  };

  const handleCancelEditSet = () => {
    setEditingSetId(null);
    setEditingSetLabel("");
  };

  const handleDeleteSet = async (setId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this reference set? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await onDeleteReferenceSet(setId);
    } catch (error) {
      console.error("Failed to delete reference set:", error);
      alert("Could not delete this set. Please try again.");
    }
  };

  return (
    <section className="card">
      <div className="card__header">
        <h3 className="card__title">Saved images</h3>
        <div className="card__actions">
          <div className="libraryFilter">
            <label htmlFor="library-sort" className="libraryFilter__label">
              Sort
            </label>
            <select
              id="library-sort"
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
        <p className={styles.empty}>Loading saved images...</p>
      ) : (
        <>
          <div className={`${styles.librarySet__list} custom-scrollbar`}>
            {isAddingNewSet && (
              <div
                className={`${styles.librarySet__item} ${styles["librarySet__item--new"]}`}
              >
                <div className={styles.librarySet__header}>
                  <input
                    type="text"
                    className={styles.librarySet__titleInput}
                    placeholder="Set name (required)"
                    value={newSetLabel}
                    onChange={(e) => setNewSetLabel(e.target.value)}
                    required
                  />
                  <div className={styles.librarySet__actions}>
                    <button
                      onClick={handleSaveNewSet}
                      disabled={
                        isSaving ||
                        newSetImages.length === 0 ||
                        !newSetLabel.trim()
                      }
                      className={`${styles.librarySet__actionBtn} ${styles["librarySet__actionBtn--save"]}`}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={handleCancelNewSet}
                      disabled={isSaving}
                      className={`${styles.librarySet__actionBtn} ${styles["librarySet__actionBtn--cancel"]}`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                <div className={styles.librarySet__images}>
                  {newSetImages.map((img) => (
                    <div
                      key={img.id}
                      className={`${styles.librarySetImage__thumb} ${styles["librarySetImage__thumb--new"]}`}
                    >
                      <img src={img.data} alt="New reference" />
                      <button
                        onClick={() => removeNewSetImage(img.id)}
                        className={styles.librarySetImage__remove}
                        aria-label="Remove image"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={handleUploadClick}
                    className={styles.librarySetImage__uploadPlaceholder}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span>Add images</span>
                  </button>
                </div>
              </div>
            )}
            {sortedSets.length === 0 && !isAddingNewSet ? (
              <p className={styles.empty}>No saved reference images.</p>
            ) : (
              sortedSets.map((set) => {
                const isEditing = editingSetId === set.setId;
                return (
                  <div key={set.setId} className={styles.librarySet__item}>
                    <div className={styles.librarySet__header}>
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            className={styles.librarySet__titleInput}
                            placeholder="Set name"
                            value={editingSetLabel}
                            onChange={(e) => setEditingSetLabel(e.target.value)}
                            disabled={isUpdatingSet}
                          />
                          <div className={styles.librarySet__actions}>
                            <button
                              onClick={handleSaveEditedSet}
                              disabled={
                                isUpdatingSet || !editingSetLabel.trim()
                              }
                              className={`${styles.librarySet__actionBtn} ${styles["librarySet__actionBtn--save"]}`}
                            >
                              {isUpdatingSet ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={handleCancelEditSet}
                              disabled={isUpdatingSet}
                              className={`${styles.librarySet__actionBtn} ${styles["librarySet__actionBtn--cancel"]}`}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <h4 className={styles.librarySet__title}>
                            {set.label ||
                              `Reference set (${new Date(
                                set.createdAt || Date.now()
                              ).toLocaleDateString()})`}
                          </h4>
                          <div className={styles.librarySet__actions}>
                            {set.createdAt && (
                              <span className={styles.librarySet__date}>
                                {new Date(set.createdAt).toLocaleDateString()}
                              </span>
                            )}
                            <button
                              onClick={() => startEditingSet(set)}
                              className={styles.librarySet__actionBtn}
                              disabled={
                                isSaving || isUpdatingSet || isAddingNewSet
                              }
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteSet(set.setId)}
                              className={`${styles.librarySet__actionBtn} ${styles["librarySet__actionBtn--delete"]}`}
                              disabled={
                                isSaving || isUpdatingSet || isAddingNewSet
                              }
                              title="Delete set"
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
                        </>
                      )}
                    </div>
                    <div className={styles.librarySet__images}>
                      {set.images.map((img) => (
                        <div
                          key={img.id}
                          className={styles.librarySetImage__thumbWrapper}
                        >
                          <button
                            className={styles.librarySetImage__thumb}
                            onClick={() => {
                              if (isEditing) return;
                              onSelectReferenceSet([set]);
                            }}
                            title={set.label || "Reference set"}
                          >
                            <img src={img.url} alt={set.label || "Reference"} />
                          </button>
                          <button
                            className={styles.librarySetImage__expand}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedImage(img.url);
                            }}
                            title="Expand image"
                            aria-label="Expand image"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className={styles.librarySet__actions}>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              className="hidden-input"
              accept="image/*"
              onChange={handleFileUpload}
            />
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
              {isAddingNewSet ? "Add more images" : "Upload new set"}
            </button>
          </div>
        </>
      )}
      <ImageExpandModal
        isOpen={expandedImage !== null}
        imageUrl={expandedImage || ""}
        onClose={() => setExpandedImage(null)}
      />
    </section>
  );
};

export default SavedImagesPanel;
