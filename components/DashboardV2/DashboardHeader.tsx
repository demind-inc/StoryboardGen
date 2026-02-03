import React, { useState, useRef, useEffect } from "react";
import { PencilIcon } from "./DashboardIcons";
import styles from "./DashboardHeader.module.scss";

export interface DashboardHeaderProps {
  projectName: string;
  onProjectNameChange?: (value: string) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  projectName,
  onProjectNameChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  return (
    <header className={styles.header}>
      <div className={styles.titleArea}>
        <span className={styles.projectLabel}>Project</span>
        <div className={styles.projectRow}>
          {onProjectNameChange ? (
            isEditing ? (
              <input
                ref={inputRef}
                className={styles.projectTitleInput}
                value={projectName}
                onChange={(event) => onProjectNameChange(event.target.value)}
                onBlur={() => setIsEditing(false)}
                aria-label="Project name"
              />
            ) : (
              <h1 className={styles.projectTitle}>{projectName}</h1>
            )
          ) : (
            <h1 className={styles.projectTitle}>{projectName}</h1>
          )}
          {onProjectNameChange && !isEditing && (
            <button
              type="button"
              className={styles.editIcon}
              title="Edit project name"
              onClick={() => setIsEditing(true)}
              aria-label="Edit project name"
            >
              <PencilIcon />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
