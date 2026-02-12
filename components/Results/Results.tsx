import React from "react";
import { AppMode, SceneResult } from "../../types";
import { TikTokIcon, InstagramIcon } from "../DashboardV2/DashboardIcons";
import styles from "./Results.module.scss";

interface ResultsProps {
  mode: AppMode;
  results: SceneResult[];
  isGenerating: boolean;
  onRegenerate?: (index: number) => void;
  captions?: {
    tiktok: string;
    instagram: string;
  };
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
  onRegenerateAll,
  onDownloadAll,
  onBack,
  projectName,
  allowRegenerate = true,
}) => {
  const handleBack = onBack ?? (() => undefined);
  const handleDownloadAll = onDownloadAll ?? (() => undefined);
  const [expandedImage, setExpandedImage] = React.useState<string | null>(null);
  const [copiedTarget, setCopiedTarget] = React.useState<
    "tiktok" | "instagram" | null
  >(null);
  const closeExpandedImage = () => setExpandedImage(null);
  const handleCopy = async (platform: "tiktok" | "instagram") => {
    if (!captions) return;
    const text = captions[platform];
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTarget(platform);
      window.setTimeout(() => setCopiedTarget(null), 1200);
    } catch (error) {
      console.error("Failed to copy caption:", error);
    }
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

      {captions && (
        <div className={styles.captionsCard}>
          <div className={styles.captionBox}>
            <div className={styles.captionTitleRow}>
              <div className={styles.captionTitle}>
                <TikTokIcon />
                <span>TikTok Caption</span>
              </div>
              <button
                className={styles.copyButton}
                onClick={() => handleCopy("tiktok")}
                aria-label="Copy TikTok caption"
                disabled={!captions.tiktok}
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
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
            <div className={styles.captionText}>
              {isGenerating && !captions.tiktok
                ? "Generating captions..."
                : captions.tiktok}
            </div>
          </div>
          <div className={styles.captionBox}>
            <div className={styles.captionTitleRow}>
              <div className={styles.captionTitle}>
                <InstagramIcon />
                <span>Instagram Caption</span>
              </div>
              <button
                className={styles.copyButton}
                onClick={() => handleCopy("instagram")}
                aria-label="Copy Instagram caption"
                disabled={!captions.instagram}
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
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
            <div className={styles.captionText}>
              {isGenerating && !captions.instagram
                ? "Generating captions..."
                : captions.instagram}
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
                      <div className={styles.resultOverlay}>Rendering...</div>
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
                        {result.title && (
                          <>
                            <span className={styles.sceneTitleDivider}>•</span>
                            <span className={styles.sceneTitleText}>
                              {result.title}
                            </span>
                          </>
                        )}
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
                            Re-run
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
                    {result.description && (
                      <div className={styles.sceneDescription}>
                        {result.description}
                      </div>
                    )}
                    <div className={styles.promptBlock}>
                      <div className={styles.promptLabel}>Prompt</div>
                      <div className={styles.promptText}>{result.prompt}</div>
                    </div>
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
