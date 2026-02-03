import React, { useState, useRef, useEffect } from "react";
import { PencilIcon } from "./DashboardIcons";
import styles from "./GuidelinesCard.module.scss";

export interface GuidelinesCardProps {
  guidelines: string[];
  onGuidelinesChange?: (guidelines: string[]) => void;
}

const GuidelinesCard: React.FC<GuidelinesCardProps> = ({
  guidelines,
  onGuidelinesChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
    }
  }, [isEditing]);

  const updateGuidelines = (value: string) => {
    if (!onGuidelinesChange) return;
    onGuidelinesChange(
      value
        .split("\n")
        .map((item) => item.replace(/^•\s?/, "").trim())
        .filter(Boolean)
    );
  };

  const guidelineText = guidelines.join("\n");
  const guidelineDisplay = guidelines
    .map((item) => (item.trim().startsWith("•") ? item.trim() : `• ${item}`))
    .join("\n");

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardTitleRow}>
            <h2 className={styles.cardTitle}>Custom Guidelines</h2>
            {onGuidelinesChange && (
              <button
                type="button"
                className={styles.editIcon}
                title={isEditing ? "Stop editing" : "Edit guidelines"}
                onClick={() => setIsEditing((prev) => !prev)}
                aria-pressed={isEditing}
              >
                <PencilIcon />
              </button>
            )}
          </div>
          <p className={styles.cardDescription}>Brand-specific constraints</p>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.guidelineList}>
          <textarea
            ref={textareaRef}
            className={styles.ruleTextarea}
            value={isEditing ? guidelineText : guidelineDisplay}
            readOnly={!isEditing}
            onChange={(event) => updateGuidelines(event.target.value)}
            aria-label="Custom guidelines"
          />
        </div>
      </div>
    </section>
  );
};

export default GuidelinesCard;
