import React from "react";
import { useRouter } from "next/router";
import { CustomGuidelinesIcon, SettingsIcon } from "./DashboardIcons";
import styles from "./GuidelinesCard.module.scss";

export interface GuidelinesCardProps {
  guidelines: string[];
  onGuidelinesChange?: (guidelines: string[]) => void;
}

const GuidelinesCard: React.FC<GuidelinesCardProps> = ({ guidelines }) => {
  const router = useRouter();
  const guidelineDisplay = guidelines
    .map((item) => (item.trim().startsWith("•") ? item.trim() : `• ${item}`))
    .join("\n");

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardTitleRow}>
            <CustomGuidelinesIcon />
            <h2 className={styles.cardTitle}>Custom Guidelines</h2>
            <button
              type="button"
              className={styles.editIcon}
              title="Open guidelines page"
              onClick={() => router.push("/rules/custom-guidelines")}
              aria-label="Open guidelines page"
            >
              <SettingsIcon />
            </button>
          </div>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.guidelineList}>
          <textarea
            className={styles.ruleTextarea}
            value={guidelineDisplay}
            readOnly
            aria-label="Custom guidelines"
          />
        </div>
      </div>
    </section>
  );
};

export default GuidelinesCard;
