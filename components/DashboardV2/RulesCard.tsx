import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Listbox } from "@headlessui/react";
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
  selectedHashtags: Hashtags;
  onSelectedHashtagsChange: (next: Hashtags) => void;
}

const RulesCard: React.FC<RulesCardProps> = ({
  rules,
  hashtags,
  selectedHashtags,
  onSelectedHashtagsChange,
}) => {
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
    instagramGroups[
      Math.min(selectedInstagramIndex, instagramGroups.length - 1)
    ];
  const availableHashtags = hashtags;
  const displayedHashtags = selectedHashtags.length > 0 ? selectedHashtags : [];
  const hashtagText =
    displayedHashtags.length > 0 ? displayedHashtags.join(" ") : "—";

  return (
    <section className={styles.card}>
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
              <Listbox
                value={Math.min(selectedTiktokIndex, tiktokGroups.length - 1)}
                onChange={(value: number) => setSelectedTiktokIndex(value)}
              >
                <div className={styles.listbox}>
                  <Listbox.Button className={styles.listboxButton}>
                    {tiktokGroups[selectedTiktokIndex]?.name ||
                      `Rule ${selectedTiktokIndex + 1}`}
                  </Listbox.Button>
                  <Listbox.Options className={styles.listboxOptions}>
                    {tiktokGroups.map((group, i) => (
                      <Listbox.Option
                        key={i}
                        value={i}
                        className={({ active, selected }) =>
                          [
                            styles.listboxOption,
                            active ? styles.listboxOptionActive : "",
                            selected ? styles.listboxOptionSelected : "",
                          ]
                            .filter(Boolean)
                            .join(" ")
                        }
                      >
                        {group.name || `Rule ${i + 1}`}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
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
              <Listbox
                value={Math.min(
                  selectedInstagramIndex,
                  instagramGroups.length - 1
                )}
                onChange={(value: number) => setSelectedInstagramIndex(value)}
              >
                <div className={styles.listbox}>
                  <Listbox.Button className={styles.listboxButton}>
                    {instagramGroups[selectedInstagramIndex]?.name ||
                      `Rule ${selectedInstagramIndex + 1}`}
                  </Listbox.Button>
                  <Listbox.Options className={styles.listboxOptions}>
                    {instagramGroups.map((group, i) => (
                      <Listbox.Option
                        key={i}
                        value={i}
                        className={({ active, selected }) =>
                          [
                            styles.listboxOption,
                            active ? styles.listboxOptionActive : "",
                            selected ? styles.listboxOptionSelected : "",
                          ]
                            .filter(Boolean)
                            .join(" ")
                        }
                      >
                        {group.name || `Rule ${i + 1}`}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
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
          {availableHashtags.length > 0 ? (
            <Listbox
              value={selectedHashtags}
              onChange={onSelectedHashtagsChange}
              multiple
            >
              <div className={styles.listbox}>
                <Listbox.Button className={styles.listboxButton}>
                  {selectedHashtags.length > 0
                    ? `${selectedHashtags.length} selected`
                    : "Select hashtags"}
                </Listbox.Button>
                <Listbox.Options className={styles.listboxOptions}>
                  {availableHashtags.map((tag) => (
                    <Listbox.Option
                      key={tag}
                      value={tag}
                      className={({ active, selected }) =>
                        [
                          styles.listboxOption,
                          active ? styles.listboxOptionActive : "",
                          selected ? styles.listboxOptionSelected : "",
                        ]
                          .filter(Boolean)
                          .join(" ")
                      }
                    >
                      {({ selected }) => (
                        <div className={styles.listboxOptionInner}>
                          <span className={styles.listboxOptionLabel}>
                            {tag}
                          </span>
                          <span
                            className={
                              selected
                                ? styles.listboxOptionCheckActive
                                : styles.listboxOptionCheck
                            }
                          >
                            {selected ? "Selected" : "Select"}
                          </span>
                        </div>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          ) : null}
          <div className={styles.hashtagText} aria-label="Approved hashtags">
            {hashtagText}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RulesCard;
