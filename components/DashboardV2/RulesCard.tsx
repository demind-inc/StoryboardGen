import React from "react";
import { useRouter } from "next/router";
import type { CaptionRules } from "../../types";
import { SettingsIcon, TikTokIcon, InstagramIcon } from "./DashboardIcons";
import styles from "./RulesCard.module.scss";

export interface RulesCardProps {
  rules: CaptionRules;
}

const RulesCard: React.FC<RulesCardProps> = ({ rules }) => {
  const router = useRouter();
  const formatBullet = (rule: string) => {
    const trimmed = rule.trim();
    if (!trimmed) return "";
    return trimmed.startsWith("・") ? trimmed : `・${trimmed}`;
  };
  const tiktokDisplay = rules.tiktok.map(formatBullet).join("\n");
  const instagramDisplay = rules.instagram.map(formatBullet).join("\n");

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardTitleRow}>
            <h2 className={styles.cardTitle}>Platform Rules</h2>
          </div>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.ruleList}>
          <div className={styles.cardTitleRow}>
            <span className={styles.platformLabel}>
              <TikTokIcon />
              <strong>TikTok Caption Rules</strong>
            </span>
            <button
              type="button"
              className={styles.editIcon}
              title="Open TikTok rules settings"
              onClick={() => router.push("/rules/tiktok")}
            >
              <SettingsIcon />
            </button>
          </div>
          <div className={styles.ruleText} aria-label="TikTok caption rules">
            {tiktokDisplay}
          </div>
        </div>
        <div className={styles.ruleList}>
          <div className={styles.cardTitleRow}>
            <span className={styles.platformLabel}>
              <InstagramIcon />
              <strong>Instagram Caption Rules</strong>
            </span>
            <button
              type="button"
              className={styles.editIcon}
              title="Open Instagram rules settings"
              onClick={() => router.push("/rules/instagram")}
            >
              <SettingsIcon />
            </button>
          </div>
          <div
            className={`${styles.ruleText} ${styles.ruleTextareaInstagram}`}
            aria-label="Instagram caption rules"
          >
            {instagramDisplay}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RulesCard;
