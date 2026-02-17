import React, { useState, useEffect } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  TopicIcon,
  CustomGuidelinesIcon,
  CloseIcon,
  AIIcon,
  SpinnerIcon,
  SceneIcon,
} from "./DashboardIcons";
import styles from "./DashboardLayout.module.scss";

interface AutoGenerateSceneModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
  onGenerate: (topic: string, count: number, guideline?: string) => void;
  isGenerating?: boolean;
  error?: string;
}

const DEFAULT_GUIDELINE =
  "You are generating TikTok and Instagram slideshow content about this topic";

const AutoGenerateSceneModal: React.FC<AutoGenerateSceneModalProps> = ({
  isOpen,
  onClose,
  initialTopic = "",
  onGenerate,
  isGenerating = false,
  error,
}) => {
  const [topic, setTopic] = useState(initialTopic);
  const [guideline, setGuideline] = useState(DEFAULT_GUIDELINE);
  const [sceneCountInput, setSceneCountInput] = useState("4");

  // Update topic when initialTopic changes
  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
    }
  }, [initialTopic]);

  const validateAndClampSceneCount = (value: string): number => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) return 1;
    if (num > 10) return 10;
    return num;
  };

  const handleSceneCountBlur = () => {
    const validCount = validateAndClampSceneCount(sceneCountInput);
    setSceneCountInput(String(validCount));
  };

  const handleGenerate = () => {
    if (topic.trim()) {
      const count = validateAndClampSceneCount(sceneCountInput);
      const resolvedGuideline = (guideline.trim() || DEFAULT_GUIDELINE).replace(
        /\{topic\}/g,
        topic.trim()
      );
      onGenerate(topic, count, resolvedGuideline);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-[1000]">
      <div className={styles.modalOverlay} aria-hidden="true" />
      <div className={styles.modalContainer}>
        <DialogPanel className={styles.modalPanel}>
          <button
            type="button"
            className={styles.modalClose}
            onClick={handleClose}
            aria-label="Close"
            disabled={isGenerating}
          >
            <CloseIcon />
          </button>

          <DialogTitle className={styles.modalTitle}>
            Auto-Generate Scenes
          </DialogTitle>
          <p className={styles.modalSubtitle}>
            Enter a topic, number of scenes, and optional guidelines to generate
            scenes automatically.
          </p>

          <div className={styles.modalBody}>
            <div className={styles.modalField}>
              <div className={styles.modalFieldHeader}>
                <span className={styles.modalFieldIcon}>
                  <TopicIcon />
                </span>
                <label className={styles.modalFieldLabel}>Topic</label>
              </div>
              <input
                type="text"
                className={styles.modalInput}
                placeholder="e.g. Coffee morning routine for Gen Z"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && topic.trim() && !isGenerating) {
                    handleGenerate();
                  }
                }}
                disabled={isGenerating}
              />
            </div>

            <div className={styles.modalField}>
              <div className={styles.modalFieldHeader}>
                <span className={styles.modalFieldIcon}>
                  <SceneIcon />
                </span>
                <label className={styles.modalFieldLabel}>
                  Number of Scenes (1-10)
                </label>
              </div>
              <input
                type="number"
                className={styles.modalInput}
                placeholder="4"
                min="1"
                max="10"
                value={sceneCountInput}
                onChange={(e) => setSceneCountInput(e.target.value)}
                onBlur={handleSceneCountBlur}
                disabled={isGenerating}
              />
            </div>

            <div className={styles.modalField}>
              <div className={styles.modalFieldHeader}>
                <span className={styles.modalFieldIcon}>
                  <CustomGuidelinesIcon />
                </span>
                <label className={styles.modalFieldLabel}>
                  Guideline (optional)
                </label>
              </div>
              <textarea
                className={styles.modalTextarea}
                placeholder="Add custom instructions for scene titles, descriptions, tone, or structure..."
                value={guideline}
                onChange={(e) => setGuideline(e.target.value)}
                disabled={isGenerating}
              />
            </div>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.modalCancelBtn}
              onClick={handleClose}
              disabled={isGenerating}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.modalGenerateBtn}
              onClick={handleGenerate}
              disabled={!topic.trim() || isGenerating}
            >
              {isGenerating ? <SpinnerIcon /> : <AIIcon />}
              <span>{isGenerating ? "Generating..." : "Generate"}</span>
            </button>
          </div>

          {error && <p className={styles.modalError}>{error}</p>}
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default AutoGenerateSceneModal;
