import React, { useEffect, useRef, useState } from "react";
import { AIIcon } from "./DashboardIcons";
import styles from "./FooterBar.module.scss";

export interface FooterBarProps {
  disableGenerate: boolean;
  isGenerating: boolean;
  onGenerateAll: () => void;
  projectName: string;
  transparentBackground: boolean;
  onTransparentBackgroundChange: (value: boolean) => void;
}

const FooterBar: React.FC<FooterBarProps> = ({
  disableGenerate,
  isGenerating,
  onGenerateAll,
  projectName,
  transparentBackground,
  onTransparentBackgroundChange,
}) => {
  const isDisabled = disableGenerate || isGenerating;
  const isReady = !isDisabled;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [isMenuOpen]);

  return (
    <div className={styles.footerBar}>
      <div className={styles.configWrap} ref={menuRef}>
        <button
          type="button"
          className={styles.configButton}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
        >
          Other Config <span aria-hidden="true">›</span>
        </button>
        {isMenuOpen && (
          <div className={styles.configMenu} role="menu">
            <label className={styles.configRow}>
              <span>Transparent background</span>
              <input
                type="checkbox"
                checked={transparentBackground}
                onChange={(event) =>
                  onTransparentBackgroundChange(event.target.checked)
                }
                aria-label="Toggle transparent background"
              />
            </label>
          </div>
        )}
      </div>
      <button
        className={`${styles.actionButton} ${styles.actionButtonPrimary} ${
          isReady ? styles.actionButtonReady : ""
        }`}
        onClick={isDisabled ? undefined : onGenerateAll}
        disabled={isDisabled}
      >
        <AIIcon />
        <span>{isGenerating ? "Generating..." : "Generate Storyboards"}</span>
      </button>
    </div>
  );
};

export default FooterBar;
