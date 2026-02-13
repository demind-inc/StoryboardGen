import React, { useState, useCallback, useEffect } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

import { ReferenceImage } from "../../types";
import { LibraryIcon, ImageIcon } from "./DashboardIcons";
import { InlineSpinner } from "../Spinner/InlineSpinner";
import styles from "./ReferenceCard.module.scss";
export interface ReferenceCardProps {
  references: ReferenceImage[];
  onUpload: () => void;
  onOpenLibrary: () => void;
  onRemoveReference?: (id: string) => void;
}

/** Preload an image by URL/data so it’s cached when shown in the expanded view. */
function preloadImage(data: string): void {
  const img = new Image();
  img.src = data;
}

const ReferenceCard: React.FC<ReferenceCardProps> = ({
  references,
  onUpload,
  onOpenLibrary,
  onRemoveReference,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const closeExpanded = useCallback(() => setExpandedId(null), []);

  // Preload all reference images so the expanded view shows instantly when selected
  useEffect(() => {
    references.forEach((ref) => {
      if (ref.data) preloadImage(ref.data);
    });
  }, [references]);

  const expandedRef = expandedId
    ? references.find((r) => r.id === expandedId)
    : null;

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleRow}>
          <span className={styles.cardIcon}>
            <ImageIcon />
          </span>
          <div>
            <h2 className={styles.cardTitle}>Reference Images</h2>
          </div>
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
                onClick={() => ref.data && setExpandedId(ref.id)}
                aria-label={ref.data ? "Expand reference image" : "Loading"}
                title={ref.data ? "Click to expand" : "Loading..."}
                disabled={!ref.data}
              >
                {ref.data ? (
                  <img
                    src={ref.data}
                    alt="Reference"
                    className={styles.referenceThumb}
                  />
                ) : (
                  <span className={styles.referenceThumbLoading}>
                    <InlineSpinner size="sm" label="Loading image" />
                  </span>
                )}
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
      <Dialog
        open={!!expandedRef}
        onClose={closeExpanded}
        className="relative z-[1000]"
      >
        <div
          className={styles.expandedOverlay}
          aria-hidden="true"
          onClick={closeExpanded}
        />
        <div className="fixed inset-0 flex items-center justify-center p-12 pointer-events-none">
          <DialogPanel
            className={`pointer-events-auto ${styles.expandedPanel}`}
            onClick={(e) => e.stopPropagation()}
          >
            <DialogTitle className={styles.srOnly}>
              Expanded reference image
            </DialogTitle>
            <button
              type="button"
              className={styles.expandedClose}
              onClick={closeExpanded}
              aria-label="Close"
            >
              ×
            </button>
            {expandedRef && (
              <img
                src={expandedRef.data}
                alt="Reference (expanded)"
                className={styles.expandedImage}
              />
            )}
          </DialogPanel>
        </div>
      </Dialog>
    </section>
  );
};

export default ReferenceCard;
