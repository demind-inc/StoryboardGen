import React, { useState, useCallback, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

import { ReferenceImage } from "../../types";
import { LibraryIcon } from "./DashboardIcons";
import styles from "./ReferenceCard.module.scss";
export interface ReferenceCardProps {
  references: ReferenceImage[];
  onUpload: () => void;
  onOpenLibrary: () => void;
  onRemoveReference?: (id: string) => void;
}

const ReferenceCard: React.FC<ReferenceCardProps> = ({
  references,
  onUpload,
  onOpenLibrary,
  onRemoveReference,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const closeExpanded = useCallback(() => setExpandedId(null), []);

  useEffect(() => {
    if (!expandedId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeExpanded();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expandedId, closeExpanded]);

  const expandedRef = expandedId
    ? references.find((r) => r.id === expandedId)
    : null;

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>1. Reference Images</h2>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.iconButtonSecondary}
            onClick={onOpenLibrary}
            aria-label="Pick from saved images"
            title="Pick from saved images"
          >
            <LibraryIcon />
          </button>
          <button
            className={styles.iconButton}
            onClick={onUpload}
            aria-label="Upload reference images"
            title="Upload reference images"
          >
            <FontAwesomeIcon icon={faPlus} style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.referenceGrid}>
          <button className={styles.uploadTile} onClick={onUpload}>
            <FontAwesomeIcon icon={faPlus} style={{ width: 16, height: 16 }} />
            <span>Add Image</span>
          </button>
          {references.map((ref) => (
            <div key={ref.id} className={styles.referenceThumbContainer}>
              <button
                type="button"
                className={styles.referenceThumbWrap}
                onClick={() => setExpandedId(ref.id)}
                aria-label="Expand reference image"
                title="Click to expand"
              >
                <img
                  src={ref.data}
                  alt="Reference"
                  className={styles.referenceThumb}
                />
              </button>
              {onRemoveReference && (
                <button
                  type="button"
                  className={styles.referenceThumbRemove}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveReference(ref.id);
                  }}
                  title="Remove image"
                  aria-label="Remove reference image"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      {expandedRef && (
        <div
          className={styles.expandedOverlay}
          onClick={closeExpanded}
          role="dialog"
          aria-modal="true"
          aria-label="Expanded reference image"
        >
          <button
            type="button"
            className={styles.expandedClose}
            onClick={closeExpanded}
            aria-label="Close"
          >
            ×
          </button>
          <img
            src={expandedRef.data}
            alt="Reference (expanded)"
            className={styles.expandedImage}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
};

export default ReferenceCard;
