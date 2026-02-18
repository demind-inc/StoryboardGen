import React from "react";
import { useRouter } from "next/router";
import { useGenerationQueue } from "../../providers/GenerationQueueProvider";
import styles from "./GenerationQueueToast.module.scss";

const GenerationQueueToast: React.FC = () => {
  const router = useRouter();
  const { items, removeItem } = useGenerationQueue();

  if (items.length === 0) return null;

  return (
    <div className={styles.container} aria-live="polite" aria-label="Generation queue">
      {items.map((item) => {
        const isDone = item.status !== "running";
        const canOpenProject = item.status === "succeeded";

        return (
          <div
            key={item.id}
            className={`${styles.item} ${styles[item.status]} ${canOpenProject ? styles.clickable : ""}`}
            onClick={() => {
              if (!canOpenProject) return;
              if (item.projectId) {
                void router.push(`/saved/project/${item.projectId}`);
              } else {
                void router.push("/saved/project");
              }
            }}
            onKeyDown={(event) => {
              if (!canOpenProject) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                if (item.projectId) {
                  void router.push(`/saved/project/${item.projectId}`);
                } else {
                  void router.push("/saved/project");
                }
              }
            }}
            role={canOpenProject ? "button" : "status"}
            tabIndex={canOpenProject ? 0 : -1}
            aria-label={
              canOpenProject
                ? `${item.projectName} generation complete. Open saved project.`
                : `${item.projectName} generation ${item.status}`
            }
          >
            <div className={styles.headlineRow}>
              <strong className={styles.projectName}>{item.projectName || "Untitled project"}</strong>
              {isDone && (
                <button
                  type="button"
                  className={styles.dismiss}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    removeItem(item.id);
                  }}
                  aria-label="Dismiss queue item"
                >
                  ×
                </button>
              )}
            </div>
            {item.status === "running" ? (
              <p className={styles.message}>
                Generating {item.completedScenes}/{item.totalScenes}
              </p>
            ) : item.status === "succeeded" ? (
              <p className={styles.message}>Done. Click to open saved project.</p>
            ) : (
              <p className={styles.message}>{item.error || "Generation failed."}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GenerationQueueToast;
