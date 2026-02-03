import React from "react";
import { ReferenceImage } from "../../types";
import { LibraryIcon } from "./DashboardIcons";
import styles from "./ReferenceCard.module.scss";

export interface ReferenceCardProps {
  references: ReferenceImage[];
  onUpload: () => void;
  onOpenLibrary: () => void;
}

const ReferenceCard: React.FC<ReferenceCardProps> = ({
  references,
  onUpload,
  onOpenLibrary,
}) => (
  <section className={styles.card}>
    <div className={styles.cardHeader}>
      <div>
        <h2 className={styles.cardTitle}>Reference Images</h2>
        <p className={styles.cardDescription}>
          Subject + style anchors for consistency
        </p>
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
          +
        </button>
      </div>
    </div>
    <div className={styles.cardBody}>
      <div className={styles.referenceGrid}>
        <button className={styles.uploadTile} onClick={onUpload}>
          <span>+</span>
          <span>Add Image</span>
        </button>
        {references.map((ref) => (
          <img
            key={ref.id}
            src={ref.data}
            alt="Reference"
            className={styles.referenceThumb}
          />
        ))}
      </div>
    </div>
  </section>
);

export default ReferenceCard;
