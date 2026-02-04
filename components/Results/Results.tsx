import React from "react";
import { AppMode, SceneResult } from "../../types";
import { TikTokIcon, InstagramIcon } from "../DashboardV2/DashboardIcons";
import styles from "./Results.module.scss";

interface ResultsProps {
  mode: AppMode;
  results: SceneResult[];
  isGenerating: boolean;
  onRegenerate: (index: number) => void;
  captions?: {
    tiktok: string;
    instagram: string;
  };
  onRegenerateAll?: () => void;
  onDownloadAll?: () => void;
  onBack?: () => void;
  projectName?: string;
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
}) => {
  const handleBack = onBack ?? (() => undefined);
  return (
    <div className={styles.resultsPage} data-mode={mode}>
      <div className={styles.resultsHeader}>
        <div className={styles.headerLeft}>
          <button
            className={styles.secondaryButton}
            onClick={handleBack}
            disabled={!onBack}
          >
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
          <span className={styles.headerTitle}>Generated results</span>
        </div>
        <div className={styles.headerRight}>
          <button
            className={styles.secondaryButton}
            onClick={onDownloadAll}
            disabled={!onDownloadAll}
          >
            Download all
          </button>
          <button
            className={styles.primaryButton}
            onClick={onRegenerateAll}
            disabled={!onRegenerateAll || isGenerating}
          >
            {isGenerating ? "Regenerating..." : "Regenerate"}
          </button>
        </div>
      </div>

      {projectName && (
        <div className={styles.projectMeta}>Project: {projectName}</div>
      )}

      {captions && (
        <div className={styles.captionsCard}>
          <div className={styles.captionBox}>
            <div className={styles.captionTitle}>
              <TikTokIcon />
              <span>TikTok Caption</span>
            </div>
            <div className={styles.captionText}>{captions.tiktok}</div>
          </div>
          <div className={styles.captionBox}>
            <div className={styles.captionTitle}>
              <InstagramIcon />
              <span>Instagram Caption</span>
            </div>
            <div className={styles.captionText}>{captions.instagram}</div>
          </div>
        </div>
      )}

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
                      <button
                        className={styles.retryButton}
                        onClick={() => onRegenerate(idx)}
                      >
                        Retry
                      </button>
                    </div>
                  ) : hasImage ? (
                    <img
                      src={result.imageUrl}
                      alt={`Scene ${idx + 1}`}
                      loading="lazy"
                    />
                  ) : (
                    <div className={styles.resultOverlay}>Awaiting...</div>
                  )}
                </div>
                <div className={styles.resultMeta}>
                  <div className={styles.sceneTitle}>Scene {idx + 1}</div>
                  <div className={styles.promptLabel}>Prompt</div>
                  <div className={styles.promptText}>{result.prompt}</div>
                  <div className={styles.downloadRow}>
                    <span className={styles.downloadLabel}>Download</span>
                    <a
                      className={`${styles.downloadButton} ${
                        !hasImage ? styles.downloadButtonDisabled : ""
                      }`}
                      href={result.imageUrl || "#"}
                      download={`scene-${idx + 1}.png`}
                    >
                      Download
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Results;
