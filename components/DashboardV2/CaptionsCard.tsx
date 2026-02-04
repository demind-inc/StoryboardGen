import React from "react";
import { TikTokIcon, InstagramIcon } from "./DashboardIcons";

import styles from "./CaptionsCard.module.scss";

export interface CaptionsCardProps {
  captions: { tiktok: string; instagram: string };
}

const CaptionsCard: React.FC<CaptionsCardProps> = ({ captions }) => (
  <section className={styles.card}>
    <div className={styles.cardHeader}>
      <div>
        <h2 className={styles.cardTitle}>Generated Captions</h2>
        <p className={styles.cardDescription}>Platform-optimized copy</p>
      </div>
    </div>
    <div className={styles.cardBody}>
      <div>
        <div className={styles.captionHeader}>
          <span className={styles.platformLabel}>
            <TikTokIcon />
            <span>TikTok</span>
          </span>
          <span>Copy</span>
        </div>
        <div className={styles.captionBox}>{captions.tiktok}</div>
      </div>
      <div>
        <div className={styles.captionHeader}>
          <span className={styles.platformLabel}>
            <InstagramIcon />
            <span>Instagram</span>
          </span>
          <span>Copy</span>
        </div>
        <div className={styles.captionBox}>{captions.instagram}</div>
      </div>
    </div>
  </section>
);

export default CaptionsCard;
