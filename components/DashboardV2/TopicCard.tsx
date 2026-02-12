import React from "react";
import styles from "./TopicCard.module.scss";

export interface TopicCardProps {
  topic: string;
  onTopicChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  error?: string | null;
}

const TopicCard: React.FC<TopicCardProps> = ({
  topic,
  onTopicChange,
  onGenerate,
  isGenerating,
  error,
}) => {
  const canGenerate = topic.trim().length > 0 && !isGenerating;

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleRow}>
          <h2 className={styles.cardTitle}>2. Topic</h2>
          <p className={styles.cardDescription}>Generate scene ideas with AI</p>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.inputRow}>
          <textarea
            className={styles.topicInput}
            placeholder="Describe your storyboard idea, themes, style, and key moments..."
            value={topic}
            onChange={(event) => onTopicChange(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && canGenerate) {
                event.preventDefault();
                onGenerate();
              }
            }}
          />
          <button
            type="button"
            className={styles.generateButton}
            onClick={onGenerate}
            disabled={!canGenerate}
          >
            {isGenerating ? "Generating..." : "Generate Scenes"}
          </button>
        </div>
        <p className={styles.hint}>Tip: press Ctrl/Cmd + Enter to generate scenes.</p>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </section>
  );
};

export default TopicCard;
