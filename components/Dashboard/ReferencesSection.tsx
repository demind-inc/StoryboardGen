import React from "react";
import { ReferenceImage } from "../../types";
import styles from "./ReferencesSection.module.scss";

interface ReferencesSectionProps {
  references: ReferenceImage[];
  isSavingReferences: boolean;
  onUpload: () => void;
  onRemove: (id: string) => void;
  onOpenLibrary: () => void;
  onSave: () => void;
}

const ReferencesSection: React.FC<ReferencesSectionProps> = ({
  references,
  isSavingReferences,
  onUpload,
  onRemove,
  onOpenLibrary,
  onSave,
}) => {
  return (
    <section className="card">
      <div className="card__header">
        <h3 className="card__title">1. References</h3>
        <div className="card__actions">
          <button
            onClick={onOpenLibrary}
            className="card__action card__action--ghost"
          >
            Dataset
          </button>
          <button onClick={onUpload} className="card__action">
            Upload
          </button>
          <button
            onClick={onSave}
            disabled={isSavingReferences || references.length === 0}
            className="card__action"
            title="Save current references for reuse"
          >
            {isSavingReferences ? "Saving..." : "Save to dataset"}
          </button>
        </div>
      </div>
      {references.length === 0 ? (
        <div className={styles.referencesSection__placeholder}>
          <div className={styles.referencesSection__illustration}>
            <span>🧑‍🎤</span>
            <span>🖼️</span>
            <span>🎯</span>
          </div>
          <div className={styles.referencesSection__text}>
            <h4>Add Character Images</h4>
            <p>
              Upload reference images to keep characters consistent across
              scenes.
            </p>
            <p className={styles.referencesSection__meta}>
              Supports JPG, PNG, WEBP · Best with 3-5 angles per character
            </p>
          </div>
          <div className={styles.referencesSection__actions}>
            <button onClick={onUpload} className="primary-button">
              Upload references
            </button>
            <button
              onClick={onOpenLibrary}
              className="primary-button primary-button--border-purple"
            >
              Try with saved dataset
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.referencesSection__grid}>
          {references.map((ref) => (
            <div key={ref.id} className={styles.referencesSection__thumb}>
              <img src={ref.data} alt="Reference" />
              <button
                onClick={() => onRemove(ref.id)}
                className={styles.referencesSection__thumbRemove}
                aria-label="Remove reference"
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
        </div>
      )}
    </section>
  );
};

export default ReferencesSection;
