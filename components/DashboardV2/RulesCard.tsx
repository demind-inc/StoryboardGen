import React, { useState, useRef, useEffect } from "react";
import { Rule } from "./dashboardLayout.types";
import { PencilIcon } from "./DashboardIcons";
import styles from "./RulesCard.module.scss";

export interface RulesCardProps {
  rules: Rule;
  onRulesChange?: (rules: Rule) => void;
}

const RulesCard: React.FC<RulesCardProps> = ({ rules, onRulesChange }) => {
  const [isEditingTikTok, setIsEditingTikTok] = useState(false);
  const [isEditingInstagram, setIsEditingInstagram] = useState(false);
  const tiktokTextareaRef = useRef<HTMLTextAreaElement>(null);
  const instagramTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditingTikTok) {
      tiktokTextareaRef.current?.focus();
    }
  }, [isEditingTikTok]);

  useEffect(() => {
    if (isEditingInstagram) {
      instagramTextareaRef.current?.focus();
    }
  }, [isEditingInstagram]);

  const updateRules = (platform: "tiktok" | "instagram", value: string) => {
    if (!onRulesChange) return;
    const next: Rule = {
      ...rules,
      [platform]: value
        .split("\n")
        .map((rule) => rule.replace(/^•\s?/, "").trim())
        .filter(Boolean),
    };
    onRulesChange(next);
  };

  const tiktokText = rules.tiktok.join("\n");
  const instagramText = rules.instagram.join("\n");
  const formatBullet = (rule: string) =>
    rule.trim().startsWith("•") ? rule.trim() : `${rule}`;
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
            <strong>TikTok Caption Rules</strong>
            {onRulesChange && (
              <button
                type="button"
                className={styles.editIcon}
                title={isEditingTikTok ? "Stop editing" : "Edit TikTok rules"}
                onClick={() => setIsEditingTikTok((prev) => !prev)}
                aria-pressed={isEditingTikTok}
              >
                <PencilIcon />
              </button>
            )}
          </div>
          <textarea
            ref={tiktokTextareaRef}
            className={styles.ruleTextarea}
            value={isEditingTikTok ? tiktokText : tiktokDisplay}
            readOnly={!isEditingTikTok}
            tabIndex={isEditingTikTok ? 0 : -1}
            onMouseDown={(e) => !isEditingTikTok && e.preventDefault()}
            onChange={(event) => updateRules("tiktok", event.target.value)}
            aria-label="TikTok caption rules"
          />
        </div>
        <div className={styles.ruleList}>
          <div className={styles.cardTitleRow}>
            <strong>Instagram Caption Rules</strong>
            {onRulesChange && (
              <button
                type="button"
                className={styles.editIcon}
                title={
                  isEditingInstagram ? "Stop editing" : "Edit Instagram rules"
                }
                onClick={() => setIsEditingInstagram((prev) => !prev)}
                aria-pressed={isEditingInstagram}
              >
                <PencilIcon />
              </button>
            )}
          </div>
          <textarea
            ref={instagramTextareaRef}
            className={styles.ruleTextarea}
            value={isEditingInstagram ? instagramText : instagramDisplay}
            readOnly={!isEditingInstagram}
            onChange={(event) => updateRules("instagram", event.target.value)}
            aria-label="Instagram caption rules"
          />
        </div>
      </div>
    </section>
  );
};

export default RulesCard;
