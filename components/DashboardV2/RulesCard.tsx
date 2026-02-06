import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import type { CaptionRules, Hashtags } from "../../types";
import {
  HashtagIcon,
  SettingsIcon,
  TikTokIcon,
  InstagramIcon,
} from "./DashboardIcons";
import styles from "./RulesCard.module.scss";

export interface RulesCardProps {
  rules: CaptionRules;
  hashtags: Hashtags;
}

const RulesCard: React.FC<RulesCardProps> = ({ rules, hashtags }) => {
  const router = useRouter();
  const [selectedTiktokIndex, setSelectedTiktokIndex] = useState(0);
  const [selectedInstagramIndex, setSelectedInstagramIndex] = useState(0);

  const tiktokGroups = rules.tiktok;
  const instagramGroups = rules.instagram;

  useEffect(() => {
    if (selectedTiktokIndex >= tiktokGroups.length)
      setSelectedTiktokIndex(Math.max(0, tiktokGroups.length - 1));
  }, [tiktokGroups.length, selectedTiktokIndex]);
  useEffect(() => {
    if (selectedInstagramIndex >= instagramGroups.length)
      setSelectedInstagramIndex(Math.max(0, instagramGroups.length - 1));
  }, [instagramGroups.length, selectedInstagramIndex]);
  const selectedTiktok =
    tiktokGroups[Math.min(selectedTiktokIndex, tiktokGroups.length - 1)];
  const selectedInstagram =
    instagramGroups[Math.min(selectedInstagramIndex, instagramGroups.length - 1)];
  const hashtagText =
    hashtags.length > 0 ? hashtags.join(" ") : "—";

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
          {tiktokGroups.length > 0 ? (
            <>
              <select
                className={styles.ruleSelector}
                value={Math.min(selectedTiktokIndex, tiktokGroups.length - 1)}
                onChange={(e) =>
                  setSelectedTiktokIndex(Number(e.target.value))
                }
                aria-label="Select TikTok rule group"
              >
                {tiktokGroups.map((group, i) => (
                  <option key={i} value={i}>
                    {group.name || `Rule ${i + 1}`}
                  </option>
                ))}
              </select>
              <div
                className={styles.ruleText}
                aria-label="TikTok caption rules"
              >
                {selectedTiktok?.rule?.trim() || "—"}
              </div>
            </>
          ) : (
            <div className={styles.ruleText} aria-label="TikTok caption rules">
              —
            </div>
          )}
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
          {instagramGroups.length > 0 ? (
            <>
              <select
                className={styles.ruleSelector}
                value={Math.min(
                  selectedInstagramIndex,
                  instagramGroups.length - 1
                )}
                onChange={(e) =>
                  setSelectedInstagramIndex(Number(e.target.value))
                }
                aria-label="Select Instagram rule group"
              >
                {instagramGroups.map((group, i) => (
                  <option key={i} value={i}>
                    {group.name || `Rule ${i + 1}`}
                  </option>
                ))}
              </select>
              <div
                className={styles.ruleText}
                aria-label="Instagram caption rules"
              >
                {selectedInstagram?.rule?.trim() || "—"}
              </div>
            </>
          ) : (
            <div
              className={styles.ruleText}
              aria-label="Instagram caption rules"
            >
              —
            </div>
          )}
        </div>
        <div className={styles.ruleList}>
          <div className={styles.cardTitleRow}>
            <span className={styles.platformLabel}>
              <HashtagIcon />
              <strong>Hashtags</strong>
            </span>
            <button
              type="button"
              className={styles.editIcon}
              title="Open hashtags settings"
              onClick={() => router.push("/rules/hashtags")}
            >
              <SettingsIcon />
            </button>
          </div>
          <div className={styles.hashtagText} aria-label="Approved hashtags">
            {hashtagText}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RulesCard;
