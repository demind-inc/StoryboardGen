import React from "react";
import styles from "./DashboardSummary.module.scss";

interface DashboardSummaryProps {
  isUsageLoading: boolean;
  hasSubscription: boolean;
  displayUsageLimit?: number;
  displayUsageRemaining?: number;
  freeCreditsRemaining: number;
  referencesCount: number;
  totalScenes: number;
  generatedCount: number;
  size: string;
}

const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  isUsageLoading,
  hasSubscription,
  displayUsageLimit,
  displayUsageRemaining,
  freeCreditsRemaining,
  referencesCount,
  totalScenes,
  generatedCount,
  size,
}) => {
  return (
    <section className={`card ${styles.dashboardSummary}`}>
      <div className={styles.dashboardSummary__metrics}>
        <div className={styles.metricCard}>
          <p className={styles.metricCard__value}>
            {isUsageLoading
              ? "..."
              : hasSubscription
              ? displayUsageLimit
                ? `${
                    displayUsageRemaining ?? displayUsageLimit
                  }/${displayUsageLimit}`
                : "--/--"
              : typeof freeCreditsRemaining === "number"
              ? `${freeCreditsRemaining}/3`
              : "3"}
          </p>
          <p className={styles.metricCard__label}>
            {hasSubscription ? "Credits left" : "Free credits"}
          </p>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricCard__value}>{referencesCount}</p>
          <p className={styles.metricCard__label}>References</p>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricCard__value}>{totalScenes}</p>
          <p className={styles.metricCard__label}>Scenes</p>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricCard__value}>{size}</p>
          <p className={styles.metricCard__label}>Resolution</p>
        </div>
      </div>
    </section>
  );
};

export default DashboardSummary;
