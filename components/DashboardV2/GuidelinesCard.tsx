import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { CustomGuidelinesIcon, SettingsIcon } from "./DashboardIcons";
import styles from "./GuidelinesCard.module.scss";
import type { CustomGuidelines } from "../../types";

export interface GuidelinesCardProps {
  guidelines: CustomGuidelines;
  onGuidelinesChange?: (guidelines: CustomGuidelines) => void;
}

const GuidelinesCard: React.FC<GuidelinesCardProps> = ({ guidelines }) => {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (selectedIndex >= guidelines.length)
      setSelectedIndex(Math.max(0, guidelines.length - 1));
  }, [guidelines.length, selectedIndex]);

  const selectedGuideline =
    guidelines[Math.min(selectedIndex, guidelines.length - 1)];
  const guidelineDisplay = selectedGuideline?.rule?.trim() ?? "—";

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardTitleRow}>
            <span className={styles.cardIcon}>
              <CustomGuidelinesIcon />
            </span>
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
          {guidelines.length > 0 ? (
            <>
              <select
                className={styles.ruleSelector}
                value={Math.min(selectedIndex, guidelines.length - 1)}
                onChange={(e) => setSelectedIndex(Number(e.target.value))}
                aria-label="Select guideline"
              >
                {guidelines.map((group, i) => (
                  <option key={i} value={i}>
                    {group.name || `Guideline ${i + 1}`}
                  </option>
                ))}
              </select>
              <textarea
                className={styles.ruleTextarea}
                value={guidelineDisplay}
                readOnly
                aria-label="Custom guidelines"
              />
            </>
          ) : (
            <textarea
              className={styles.ruleTextarea}
              value="—"
              readOnly
              aria-label="Custom guidelines"
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default GuidelinesCard;
