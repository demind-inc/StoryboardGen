import React, { useState, useEffect } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  TopicIcon,
  CustomGuidelinesIcon,
  CloseIcon,
  AIIcon,
  SpinnerIcon,
} from "./DashboardIcons";
import styles from "./DashboardLayout.module.scss";

interface AutoGenerateSceneModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
  onGenerate: (topic: string, guideline?: string) => void;
  isGenerating?: boolean;
  error?: string;
}

const AutoGenerateSceneModal: React.FC<AutoGenerateSceneModalProps> = ({
  isOpen,
  onClose,
  initialTopic = "",
  onGenerate,
  isGenerating = false,
  error,
}) => {
  const [topic, setTopic] = useState(initialTopic);
  const [guideline, setGuideline] = useState("");

  // Update topic when initialTopic changes
  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
    }
  }, [initialTopic]);

  const handleGenerate = () => {
    if (topic.trim()) {
      onGenerate(topic, guideline.trim() || undefined);
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
            Enter a topic and optional guidelines to generate scenes
            automatically.
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
