import React, { useEffect, useState } from "react";
import styles from "./DatasetModal.module.scss";

interface PromptEditModalProps {
  isOpen: boolean;
  defaultValue: string;
  isEditing: boolean;
  onSave: (value: string) => void;
  onCancel: () => void;
}

const PromptEditModal: React.FC<PromptEditModalProps> = ({
  isOpen,
  defaultValue,
  isEditing,
  onSave,
  onCancel,
}) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue, isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  };

  const handleSave = () => {
    if (value.trim()) {
      onSave(value.trim());
    }
  };

  return (
    <div
      className={styles["dataset-modal__backdrop"]}
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      <div className={styles["dataset-modal"]}>
        <div className={styles["dataset-modal__header"]}>
          <div>
            <p className={styles["dataset-modal__eyebrow"]}>Prompt</p>
            <h3 className={styles["dataset-modal__title"]}>
              {isEditing ? "Edit prompt" : "Add prompt for scene"}
            </h3>
          </div>
          <button
            className={styles["dataset-modal__close"]}
            onClick={onCancel}
          >
            ×
          </button>
        </div>
        <div className={styles["dataset-modal__body"]}>
          <label className="label">Scene Prompt</label>
          <textarea
            className="input input--textarea"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Describe actions, emotions, and props..."
            autoFocus
            rows={4}
          />
        </div>
        <div className={styles["dataset-modal__footer"]}>
          <button
            className="primary-button"
            onClick={handleSave}
            disabled={!value.trim()}
          >
            {isEditing ? "Save" : "Add"}
          </button>
          <button
            className="primary-button primary-button--ghost"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptEditModal;
