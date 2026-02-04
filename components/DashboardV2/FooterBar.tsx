import React from "react";
import { AIIcon } from "./DashboardIcons";
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
}) => {
  const isReady = !disableGenerate && !isGenerating;
  return (
    <div className={styles.footerBar}>
      <button
        className={`${styles.actionButton} ${styles.actionButtonPrimary} ${
          isReady ? styles.actionButtonReady : ""
        }`}
        onClick={onGenerateAll}
        disabled={disableGenerate}
      >
        <AIIcon />
        <span>{isGenerating ? "Generating..." : "Generate All Scenes"}</span>
      </button>
    </div>
  );
};

export default FooterBar;
