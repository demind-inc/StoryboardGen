import React, { useEffect, useState } from "react";
import styles from "./DatasetModal.module.scss";

interface NameCaptureModalProps {
  isOpen: boolean;
  title: string;
  defaultValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}

const NameCaptureModal: React.FC<NameCaptureModalProps> = ({
  isOpen,
  title,
  defaultValue,
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
            <p className={styles["dataset-modal__eyebrow"]}>Save</p>
            <h3 className={styles["dataset-modal__title"]}>{title}</h3>
          </div>
          <button
            className={styles["dataset-modal__close"]}
            onClick={onCancel}
          >
            ×
          </button>
        </div>
        <div className={styles["dataset-modal__body"]}>
          <label className="label">Name</label>
          <input
            className="input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter a name"
            autoFocus
          />
        </div>
        <div className={styles["dataset-modal__footer"]}>
          <button className="primary-button" onClick={() => onSave(value)}>
            Save
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

export default NameCaptureModal;
