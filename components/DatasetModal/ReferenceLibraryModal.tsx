import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { ReferenceSet } from "../../types";
import { useAuth } from "../../providers/AuthProvider";
import { useReferenceLibrary } from "../../hooks/useLibraryService";
import styles from "./DatasetModal.module.scss";

interface ReferenceLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (sets: ReferenceSet[]) => void;
}

const ReferenceLibraryModal: React.FC<ReferenceLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const router = useRouter();
  const { session, authStatus } = useAuth();
  const userId = session?.user?.id;
  const { data: items = [], isLoading, refetch } = useReferenceLibrary(userId);
  const [selectedSetIds, setSelectedSetIds] = useState<Set<string>>(new Set());

  const handleOpenSettings = () => {
    onClose();
    router.push("/saved/image");
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectedSetIds(new Set());
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && authStatus === "signed_in" && userId) {
      refetch();
    }
  }, [isOpen, authStatus, userId, refetch]);

  const toggleSelection = (setId: string) => {
    setSelectedSetIds((prev) => {
      const next = new Set(prev);
      if (next.has(setId)) {
        next.delete(setId);
      } else {
        next.add(setId);
      }
      return next;
    });
  };

  const selectedSets = useMemo(
    () => items.filter((set) => selectedSetIds.has(set.setId)),
    [items, selectedSetIds]
  );

  const totalSelectedImages = useMemo(
    () => selectedSets.reduce((sum, set) => sum + set.images.length, 0),
    [selectedSets]
  );

  const handleApply = () => {
    if (!selectedSets.length) return;
    onSelect(selectedSets);
    onClose();
  };

  if (!isOpen) return null;

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={styles["dataset-modal__backdrop"]}
      role="dialog"
      aria-modal="true"
      aria-label="Reference library"
      onClick={handleBackdropClick}
    >
      <div className={styles["dataset-modal"]}>
        <div className={styles["dataset-modal__header"]}>
          <div>
            <p className={styles["dataset-modal__eyebrow"]}>
              Reference library
            </p>
            <div className={styles["dataset-modal__title-row"]}>
              <h3 className={styles["dataset-modal__title"]}>
                Pick saved images
              </h3>
              <button
                type="button"
                className={styles["dataset-modal__settings-btn"]}
                onClick={handleOpenSettings}
                title="Manage saved images"
                aria-label="Open saved images settings"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            </div>
            <p className={styles["dataset-modal__subtitle"]}>
              Reuse your stored character shots to keep scenes consistent.
            </p>
          </div>
          <button className={styles["dataset-modal__close"]} onClick={onClose}>
            ×
          </button>
        </div>

        {isLoading ? (
          <div className={styles["dataset-modal__empty"]}>
            <div className={styles["dataset-modal__spinner"]} />
            <p className="text text--helper" style={{ margin: 0 }}>
              Loading your references...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className={styles["dataset-modal__empty"]}>
            <div className={styles["dataset-modal__empty-icon"]}>📁</div>
            <p>No saved references yet</p>
            <p className="text text--helper" style={{ margin: 0 }}>
              Save your current uploads to quickly reuse them later.
            </p>
          </div>
        ) : (
          <div className={`${styles["dataset-modal__grid"]} custom-scrollbar`}>
            {items.map((set) => {
              const isSelected = selectedSetIds.has(set.setId);
              const firstImage = set.images[0];
              const imageCount = set.images.length;
              return (
                <button
                  key={set.setId}
                  className={`${styles["dataset-card"]} ${
                    isSelected ? styles["is-selected"] : ""
                  }`}
                  onClick={() => toggleSelection(set.setId)}
                >
                  <div className={styles["dataset-card__thumb"]}>
                    {firstImage && (
                      <img
                        src={firstImage.url}
                        alt={set.label || "Reference set"}
                        onError={(e) => {
                          console.error(
                            "Failed to load image:",
                            firstImage.id,
                            firstImage.url
                          );
                          // Fallback to a placeholder if image fails to load
                          e.currentTarget.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3EImage%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    )}
                    {imageCount > 1 && (
                      <div className={styles["dataset-card__badge"]}>
                        {imageCount}
                      </div>
                    )}
                    <span className={styles["dataset-card__check"]}>
                      {isSelected ? "✓" : "+"}
                    </span>
                  </div>
                  <div className={styles["dataset-card__meta"]}>
                    <div className={styles["dataset-card__title"]}>
                      {set.label || "Untitled reference set"}
                    </div>
                    {set.createdAt && (
                      <div className={styles["dataset-card__date"]}>
                        {new Date(set.createdAt).toLocaleString()}
                        {imageCount > 1 && ` • ${imageCount} images`}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className={styles["dataset-modal__footer"]}>
          <button
            className="primary-button"
            onClick={handleApply}
            disabled={!selectedSets.length}
          >
            Use {totalSelectedImages || ""} image
            {totalSelectedImages !== 1 ? "s" : ""}
          </button>
          <button
            className="primary-button primary-button--ghost"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferenceLibraryModal;
