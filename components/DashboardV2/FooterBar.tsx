import React from "react";
import styles from "./FooterBar.module.scss";

export interface FooterBarProps {
  disableGenerate: boolean;
  isGenerating: boolean;
  onGenerateAll: () => void;
  projectName: string;
}

const FooterBar: React.FC<FooterBarProps> = ({
  disableGenerate,
  isGenerating,
  onGenerateAll,
  projectName,
}) => (
  <div className={styles.footerBar}>
    <span className={styles.footerMeta}>Project: {projectName}</span>
    <button
      className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
      onClick={onGenerateAll}
      disabled={disableGenerate}
    >
      {isGenerating ? "Generating..." : "Generate All Scenes"}
    </button>
  </div>
);

export default FooterBar;
