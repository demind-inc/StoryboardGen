import React, { useMemo, useState, useRef, useEffect } from "react";
import { ReferenceSet, ReferenceImage } from "../../types";
import { useAuth } from "../../providers/AuthProvider";
import {
  fetchReferenceLibrary,
  saveReferenceImages,
  updateReferenceSetLabel,
  deleteReferenceSet,
} from "../../services/libraryService";
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
  sortDirection: "newest" | "oldest";
  onSortChange: (value: "newest" | "oldest") => void;
  onSelectReferenceSet: (sets: ReferenceSet[]) => void;
}

const SavedImagesPanel: React.FC<SavedImagesPanelProps> = ({
  sortDirection,
  onSortChange,
  onSelectReferenceSet,
}) => {
  const { session, authStatus } = useAuth();
  const [referenceLibrary, setReferenceLibrary] = useState<ReferenceSet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingNewSet, setIsAddingNewSet] = useState(false);
  const [newSetImages, setNewSetImages] = useState<ReferenceImage[]>([]);
  const [newSetLabel, setNewSetLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editingSetLabel, setEditingSetLabel] = useState("");
  const [isUpdatingSet, setIsUpdatingSet] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadReferenceLibrary = async (userId: string) => {
    setIsLoading(true);
    try {
      const refs = await fetchReferenceLibrary(userId);
      setReferenceLibrary(refs);
    } catch (error) {
      console.error("Failed to load reference library:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const userId = session?.user?.id;
    if (authStatus === "signed_in" && userId) {
      loadReferenceLibrary(userId);
    }
  }, [authStatus, session?.user?.id]);

  const sortedSets = useMemo(() => {
    return [...referenceLibrary].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortDirection === "newest" ? bTime - aTime : aTime - bTime;
    });
  }, [referenceLibrary, sortDirection]);

  const flatImages = useMemo(() => {
    return sortedSets.flatMap((set) =>
      set.images.map((image, index) => ({
        image,
        index,
        set,
      }))
    );
  }, [sortedSets]);

  const formatSetDate = (set: ReferenceSet) =>
    set.createdAt ? new Date(set.createdAt).toLocaleDateString() : "";

  const formatSetTitle = (set: ReferenceSet) => {
    if (set.label) return set.label;
    const dateLabel = formatSetDate(set);
    return dateLabel ? `Reference set (${dateLabel})` : "Reference set";
  };

  const formatImageCaption = (set: ReferenceSet) => {
    if (set.label) return set.label;
    const dateLabel = formatSetDate(set);
    return dateLabel ? `Reference set • ${dateLabel}` : "Reference set";
  };

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
    const userId = session?.user?.id;
    if (!userId) {
      alert("Unable to verify your account. Please sign in again.");
      return;
    }
    setIsSaving(true);
    try {
      await saveReferenceImages(userId, newSetImages, newSetLabel.trim());
      setIsAddingNewSet(false);
      setNewSetImages([]);
      setNewSetLabel("");
      await loadReferenceLibrary(userId);
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
    const userId = session?.user?.id;
    if (!userId) {
      alert("Unable to verify your account. Please sign in again.");
      return;
    }
    setIsUpdatingSet(true);
    try {
      await updateReferenceSetLabel(userId, editingSetId, editingSetLabel.trim());
      setEditingSetId(null);
      setEditingSetLabel("");
      await loadReferenceLibrary(userId);
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

    const userId = session?.user?.id;
    if (!userId) {
      alert("Unable to verify your account. Please sign in again.");
      return;
    }

    try {
      await deleteReferenceSet(userId, setId);
      await loadReferenceLibrary(userId);
    } catch (error) {
      console.error("Failed to delete reference set:", error);
      alert("Could not delete this set. Please try again.");
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.eyebrow}>Saved Reference Images</p>
          <p className={styles.subtitle}>Project: Coffee Brand Campaign</p>
        </div>
        <div className={styles.headerActions}>
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
            className={styles.addButton}
            disabled={isSaving}
          >
            Add Image
          </button>
        </div>
      </div>
      <div className={styles.toolbar}>
        <div className={styles.filterPill}>All • Style • Subject • Product</div>
        <label className={styles.sortControl} htmlFor="library-sort">
          Sort
          <select
            id="library-sort"
            className={styles.sortSelect}
            value={sortDirection}
            onChange={(e) =>
              onSortChange(e.target.value as "newest" | "oldest")
            }
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </label>
      </div>
      <div className={`${styles.gridShell} custom-scrollbar`}>
        {isLoading ? (
          <p className={styles.empty}>Loading saved images...</p>
        ) : (
          <>
            <div className={styles.grid}>
              {isAddingNewSet && (
                <div className={styles.newSetCard}>
                  <div className={styles.newSetHeader}>
                    <input
                      type="text"
                      className={styles.newSetInput}
                      placeholder="Set name (required)"
                      value={newSetLabel}
                      onChange={(e) => setNewSetLabel(e.target.value)}
                      required
                    />
                    <div className={styles.newSetActions}>
                      <button
                        onClick={handleSaveNewSet}
                        disabled={
                          isSaving ||
                          newSetImages.length === 0 ||
                          !newSetLabel.trim()
                        }
                        className={styles.newSetActionPrimary}
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={handleCancelNewSet}
                        disabled={isSaving}
                        className={styles.newSetActionGhost}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                  <div className={styles.newSetGrid}>
                    {newSetImages.map((img) => (
                      <div key={img.id} className={styles.newSetThumb}>
                        <img src={img.data} alt="New reference" />
                        <button
                          onClick={() => removeNewSetImage(img.id)}
                          className={styles.newSetRemove}
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
                      className={styles.newSetUpload}
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
              {flatImages.length === 0 && !isAddingNewSet ? (
                <p className={styles.empty}>No saved reference images.</p>
              ) : (
                flatImages.map(({ image, set, index }) => (
                  <div key={image.id} className={styles.tile}>
                    <button
                      className={styles.tileButton}
                      onClick={() => {
                        if (editingSetId === set.setId) return;
                        onSelectReferenceSet([set]);
                      }}
                      title={set.label || "Reference set"}
                    >
                      <img
                        src={image.url}
                        alt={set.label || "Reference"}
                        className={styles.tileImage}
                      />
                      <span className={styles.tileOverlay} />
                    </button>
                    <button
                      className={styles.expandButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedImage(image.url);
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
                    <div className={styles.captionRow}>
                      {editingSetId === set.setId ? (
                        <>
                          <input
                            type="text"
                            className={styles.captionInput}
                            placeholder="Set name"
                            value={editingSetLabel}
                            onChange={(event) =>
                              setEditingSetLabel(event.target.value)
                            }
                            disabled={isUpdatingSet}
                          />
                          <div className={styles.captionActions}>
                            <button
                              type="button"
                              className={styles.captionActionPrimary}
                              onClick={handleSaveEditedSet}
                              disabled={
                                isUpdatingSet || !editingSetLabel.trim()
                              }
                            >
                              {isUpdatingSet ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              className={styles.captionAction}
                              onClick={handleCancelEditSet}
                              disabled={isUpdatingSet}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className={styles.caption}>
                            {formatImageCaption(set)}
                          </p>
                          <div className={styles.captionActions}>
                            <button
                              type="button"
                              className={styles.captionAction}
                              onClick={() => startEditingSet(set)}
                              disabled={
                                isSaving || isUpdatingSet || isAddingNewSet
                              }
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className={`${styles.captionAction} ${styles.captionActionDelete}`}
                              onClick={() => handleDeleteSet(set.setId)}
                              disabled={
                                isSaving || isUpdatingSet || isAddingNewSet
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
      <ImageExpandModal
        isOpen={expandedImage !== null}
        imageUrl={expandedImage || ""}
        onClose={() => setExpandedImage(null)}
      />
    </section>
  );
};

export default SavedImagesPanel;
