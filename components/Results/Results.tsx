import React from "react";
import { Listbox } from "@headlessui/react";
import { useRouter } from "next/router";
import { AppMode, CaptionRules, Hashtags, SceneResult } from "../../types";
import {
  TikTokIcon,
  InstagramIcon,
  SettingsIcon,
} from "../DashboardV2/DashboardIcons";
import styles from "./Results.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import { InlineSpinner } from "../Spinner/InlineSpinner";

interface ResultsProps {
  mode: AppMode;
  results: SceneResult[];
  isGenerating: boolean;
  onRegenerate?: (index: number) => void;
  captions?: {
    tiktok: string;
    instagram: string;
  };
  onGenerateCaption?: (
    platform: "tiktok" | "instagram",
    options: { rules: string; hashtags: string[] }
  ) => Promise<void> | void;
  captionRuleOptions?: CaptionRules;
  captionHashtagOptions?: Hashtags;
  onRegenerateAll?: () => void;
  onDownloadAll?: () => void;
  onBack?: () => void;
  projectName?: string;
  allowRegenerate?: boolean;
}

const Results: React.FC<ResultsProps> = ({
  mode,
  results,
  isGenerating,
  onRegenerate,
  captions,
  onGenerateCaption,
  captionRuleOptions,
  captionHashtagOptions = [],
  onRegenerateAll,
  onDownloadAll,
  onBack,
  projectName,
  allowRegenerate = true,
}) => {
  const router = useRouter();
  const handleBack = onBack ?? (() => undefined);
  const handleDownloadAll = onDownloadAll ?? (() => undefined);
  const [captionModalPlatform, setCaptionModalPlatform] = React.useState<
    "tiktok" | "instagram" | null
  >(null);
  const [captionGeneratingPlatforms, setCaptionGeneratingPlatforms] =
    React.useState<Set<"tiktok" | "instagram">>(() => new Set());
  const [selectedRuleIndex, setSelectedRuleIndex] = React.useState({
    tiktok: 0,
    instagram: 0,
  });
  const [selectedHashtags, setSelectedHashtags] = React.useState<{
    tiktok: string[];
    instagram: string[];
  }>({
    tiktok: [],
    instagram: [],
  });
  const [expandedImage, setExpandedImage] = React.useState<string | null>(null);
  const [copiedTarget, setCopiedTarget] = React.useState<
    "tiktok" | "instagram" | null
  >(null);
  const closeExpandedImage = () => setExpandedImage(null);
  const captionValues = captions ?? { tiktok: "", instagram: "" };
  const hasCaptionSection = Boolean(captions || onGenerateCaption);
  const ruleOptions = captionRuleOptions ?? { tiktok: [], instagram: [] };

  const openCaptionModal = (platform: "tiktok" | "instagram") => {
    setCaptionModalPlatform(platform);
  };

  const closeCaptionModal = () => {
    if (
      captionModalPlatform &&
      captionGeneratingPlatforms.has(captionModalPlatform)
    )
      return;
    setCaptionModalPlatform(null);
  };

  const handleCopy = async (platform: "tiktok" | "instagram") => {
    const text = captionValues[platform];
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTarget(platform);
      window.setTimeout(() => setCopiedTarget(null), 1200);
    } catch (error) {
      console.error("Failed to copy caption:", error);
    }
  };

  const handleGenerateCaption = async () => {
    if (!captionModalPlatform || !onGenerateCaption) {
      setCaptionModalPlatform(null);
      return;
    }

    const platform = captionModalPlatform;
    const selectedRule = ruleOptions[platform][selectedRuleIndex[platform]];
    const hashtags = selectedHashtags[platform];

    setCaptionGeneratingPlatforms((prev) => new Set([...prev, platform]));
    setCaptionModalPlatform(null);
    try {
      await onGenerateCaption(platform, {
        rules: selectedRule?.rule ?? "",
        hashtags,
      });
    } catch (error) {
      console.error("Failed to generate caption:", error);
    } finally {
      setCaptionGeneratingPlatforms((prev) => {
        const next = new Set(prev);
        next.delete(platform);
        return next;
      });
    }
  };

  const renderCaptionColumn = (
    platform: "tiktok" | "instagram",
    label: string,
    Icon: React.ComponentType
  ) => {
    const hasCaption = Boolean(captionValues[platform]?.trim());
    const isGeneratingPlatform = captionGeneratingPlatforms.has(platform);

    if (!hasCaption) {
      return (
        <button
          className={`${styles.captionGenerateButton}`}
          onClick={() => openCaptionModal(platform)}
          disabled={isGeneratingPlatform || !onGenerateCaption}
          type="button"
        >
          <span className={styles.captionGenerateBadge}>
            <Icon />
          </span>
          <span>
            {isGeneratingPlatform
              ? `Generating ${label}...`
              : `Generate ${label}`}
          </span>
        </button>
      );
    }

    return (
      <div className={styles.captionBox}>
        <div className={styles.captionTitleRow}>
          <div className={styles.captionTitle}>
            <Icon />
            <span>{label}</span>
          </div>
          <button
            className={styles.copyButton}
            onClick={() => handleCopy(platform)}
            aria-label={`Copy ${label}`}
            disabled={!captionValues[platform]}
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        </div>
        <div className={styles.captionText}>{captionValues[platform]}</div>
      </div>
    );
  };
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeExpandedImage();
    }
  };
  return (
    <div className={styles.resultsPage} data-mode={mode}>
      <div className={styles.resultsHeader}>
        <div className={styles.headerLeft}>
          {onBack && (
            <button className={styles.secondaryButton} onClick={handleBack}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 18l-6-6 6-6"
                />
              </svg>
              Back
            </button>
          )}
          <span className={styles.headerTitle}>Generated results</span>
        </div>
        <div className={styles.headerRight}>
          <button
            className={styles.secondaryButton}
            onClick={handleDownloadAll}
            disabled={!onDownloadAll || isGenerating}
          >
            Download all
          </button>
          {allowRegenerate && (
            <button
              className={styles.primaryButton}
              onClick={onRegenerateAll}
              disabled={!onRegenerateAll || isGenerating}
            >
              {isGenerating ? "Regenerating..." : "Regenerate"}
            </button>
          )}
        </div>
      </div>

      {projectName && (
        <div className={styles.projectMeta}>Project: {projectName}</div>
      )}

      {hasCaptionSection && (
        <div className={styles.captionsCard}>
          <div className={styles.captionGenerationIntro}>
            <div className={styles.captionGenerationLabel}>
              CAPTION GENERATION
            </div>
            <div className={styles.captionGenerationHint}>
              Generate platform captions with custom rules and hashtags.
            </div>
          </div>
          <div className={styles.captionActions}>
            {renderCaptionColumn("tiktok", "TikTok Caption", TikTokIcon)}
            {renderCaptionColumn(
              "instagram",
              "Instagram Caption",
              InstagramIcon
            )}
          </div>
        </div>
      )}

      {captionModalPlatform && (
        <div
          className={styles.captionModalBackdrop}
          role="dialog"
          aria-modal="true"
          onClick={closeCaptionModal}
        >
          <div
            className={styles.captionModal}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.captionModalTitle}>
              {captionModalPlatform === "tiktok"
                ? "TikTok Caption Setup"
                : "Instagram Caption Setup"}
            </div>
            <div className={styles.captionModalHint}>
              Configure custom rules and hashtags before generating.
            </div>
            {(() => {
              const selectedRule =
                ruleOptions[captionModalPlatform][
                  selectedRuleIndex[captionModalPlatform]
                ];
              return (
                <>
                  <label
                    className={styles.captionModalLabelRow}
                    htmlFor="caption-rule-select"
                  >
                    <span className={styles.captionModalLabel}>Rule</span>
                    <button
                      type="button"
                      className={styles.captionModalSettingButton}
                      title="Open rule settings"
                      aria-label="Open rule settings"
                      onClick={() =>
                        router.push(
                          captionModalPlatform === "tiktok"
                            ? "/rules/tiktok"
                            : "/rules/instagram"
                        )
                      }
                    >
                      <SettingsIcon />
                    </button>
                  </label>
                  <Listbox
                    value={selectedRuleIndex[captionModalPlatform]}
                    onChange={(value: number) =>
                      setSelectedRuleIndex((prev) => ({
                        ...prev,
                        [captionModalPlatform]: value,
                      }))
                    }
                  >
                    <div className={styles.listbox}>
                      <Listbox.Button
                        id="caption-rule-select"
                        className={styles.listboxButton}
                      >
                        {ruleOptions[captionModalPlatform][
                          selectedRuleIndex[captionModalPlatform]
                        ]?.name || "Select rule"}
                      </Listbox.Button>
                      <Listbox.Options className={styles.listboxOptions}>
                        {ruleOptions[captionModalPlatform].map((rule, idx) => (
                          <Listbox.Option
                            key={`${captionModalPlatform}-${rule.name}-${idx}`}
                            value={idx}
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
                            {rule.name}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </div>
                  </Listbox>
                  <div className={styles.captionRuleDescription}>
                    {selectedRule?.rule || "No rule description available."}
                  </div>
                  <label
                    className={styles.captionModalLabelRow}
                    htmlFor="caption-hashtag-selector"
                  >
                    <span className={styles.captionModalLabel}>Hashtags</span>
                    <button
                      type="button"
                      className={styles.captionModalSettingButton}
                      title="Open hashtag settings"
                      aria-label="Open hashtag settings"
                      onClick={() => router.push("/rules/hashtags")}
                    >
                      <SettingsIcon />
                    </button>
                  </label>
                  <div className={styles.captionModalHint}>
                    Select hashtags to apply (multi-select supported).
                  </div>
                  {captionHashtagOptions.length > 0 ? (
                    <Listbox
                      value={selectedHashtags[captionModalPlatform]}
                      onChange={(value: string[]) =>
                        setSelectedHashtags((prev) => ({
                          ...prev,
                          [captionModalPlatform]: value,
                        }))
                      }
                      multiple
                    >
                      <div className={styles.listbox}>
                        <Listbox.Button
                          id="caption-hashtag-selector"
                          className={styles.listboxButton}
                        >
                          {selectedHashtags[captionModalPlatform].length > 0
                            ? selectedHashtags[captionModalPlatform].join(" ")
                            : "Select hashtags"}
                        </Listbox.Button>
                        <Listbox.Options className={styles.listboxOptions}>
                          {captionHashtagOptions.map((tag) => (
                            <Listbox.Option
                              key={`${captionModalPlatform}-${tag}`}
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
                  ) : (
                    <div className={styles.captionModalHint}>
                      No hashtag options available.
                    </div>
                  )}
                </>
              );
            })()}
            <div className={styles.captionModalActions}>
              <button
                className={styles.captionModalCancel}
                type="button"
                onClick={closeCaptionModal}
              >
                Cancel
              </button>
              <button
                className={styles.captionModalGenerate}
                type="button"
                onClick={handleGenerateCaption}
                disabled={
                  captionModalPlatform != null &&
                  captionGeneratingPlatforms.has(captionModalPlatform)
                }
              >
                {captionModalPlatform != null &&
                captionGeneratingPlatforms.has(captionModalPlatform)
                  ? "Generating..."
                  : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.resultsListScroll}>
        {results.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>+</div>
            <div>No results yet</div>
          </div>
        ) : (
          <div className={styles.resultsGrid}>
            {results.map((result, idx) => {
              const hasImage = Boolean(result.imageUrl);
              return (
                <div key={idx} className={styles.resultCard}>
                  <div className={styles.resultImage}>
                    {result.isLoading ? (
                      <div className={styles.resultOverlay}>
                        <InlineSpinner size="md" label="Generating" />
                        <span>Generating</span>
                      </div>
                    ) : result.error ? (
                      <div className={styles.resultOverlayError}>
                        <div>Error</div>
                        {allowRegenerate && onRegenerate && (
                          <button
                            className={styles.retryButton}
                            onClick={() => onRegenerate(idx)}
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    ) : hasImage ? (
                      <button
                        className={styles.imageButton}
                        onClick={() => setExpandedImage(result.imageUrl!)}
                        aria-label={`Expand scene ${idx + 1}`}
                      >
                        <img
                          src={result.imageUrl}
                          alt={`Scene ${idx + 1}`}
                          loading="lazy"
                        />
                        <span className={styles.imageHint}>
                          Click to expand
                        </span>
                      </button>
                    ) : (
                      <div className={styles.resultOverlay}>Awaiting...</div>
                    )}
                  </div>
                  <div className={styles.resultMeta}>
                    <div className={styles.sceneHeader}>
                      <div className={styles.sceneHeaderTitle}>
                        <span className={styles.sceneTitle}>
                          Scene {idx + 1}
                        </span>
                      </div>

                      <div className={styles.sceneHeaderActions}>
                        {allowRegenerate && onRegenerate && (
                          <button
                            className={`${styles.regenerateButton} ${
                              isGenerating || result.isLoading
                                ? styles.regenerateButtonDisabled
                                : ""
                            }`}
                            onClick={() => onRegenerate(idx)}
                            disabled={isGenerating || result.isLoading}
                            aria-label={`Regenerate scene ${idx + 1}`}
                          >
                            <FontAwesomeIcon
                              icon={faArrowsRotate}
                              style={{ width: 12, height: 12 }}
                            />
                            Regenerate
                          </button>
                        )}
                        <a
                          className={`${styles.downloadButton} ${
                            !hasImage || isGenerating
                              ? styles.downloadButtonDisabled
                              : ""
                          }`}
                          href={result.imageUrl || "#"}
                          download={`scene-${idx + 1}.png`}
                          aria-disabled={!hasImage || isGenerating}
                          aria-label={`Download scene ${idx + 1}`}
                          onClick={(event) => {
                            if (!hasImage || isGenerating) {
                              event.preventDefault();
                            }
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </a>
                      </div>
                    </div>
                    {result.title && (
                      <span className={styles.sceneTitleText}>
                        {result.title}
                      </span>
                    )}
                    {result.description && (
                      <div className={styles.sceneDescription}>
                        {result.description}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {expandedImage && (
        <div
          className={styles.imageExpandModal__backdrop}
          role="dialog"
          aria-modal="true"
          onClick={handleBackdropClick}
        >
          <div className={styles.imageExpandModal}>
            <button
              className={styles.imageExpandModal__close}
              onClick={closeExpandedImage}
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <img
              src={expandedImage}
              alt="Expanded scene"
              className={styles.imageExpandModal__image}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
