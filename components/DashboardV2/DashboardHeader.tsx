import React from "react";
import { PencilIcon } from "./DashboardIcons";
import styles from "./DashboardHeader.module.scss";

export interface DashboardHeaderProps {
  projectName: string;
  onProjectNameChange?: (value: string) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  projectName,
  onProjectNameChange,
}) => (
  <header className={styles.header}>
    <div className={styles.titleArea}>
      <span className={styles.projectLabel}>Project</span>
      <div className={styles.projectRow}>
        {onProjectNameChange ? (
          <input
            className={styles.projectTitleInput}
            value={projectName}
            onChange={(event) => onProjectNameChange(event.target.value)}
            aria-label="Project name"
          />
        ) : (
          <h1 className={styles.projectTitle}>{projectName}</h1>
        )}
        {onProjectNameChange && (
          <span className={styles.editIcon} title="Editable">
            <PencilIcon />
          </span>
        )}
      </div>
    </div>
  </header>
);

export default DashboardHeader;
