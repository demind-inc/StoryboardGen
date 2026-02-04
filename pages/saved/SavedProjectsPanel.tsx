import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/DashboardV2/DashboardLayout";
import { useAuth } from "../../providers/AuthProvider";
import {
  fetchProjectDetail,
  fetchProjectList,
} from "../../services/projectService";
import type { ProjectDetail, ProjectSummary, SceneResult } from "../../types";
import styles from "./SavedProjectsPanel.module.scss";

const formatCaptionList = (items: string[]) =>
  items
    .map((caption, idx) =>
      items.length > 1 ? `Scene ${idx + 1}: ${caption}` : caption
    )
    .join("\n\n");

const SavedProjectsPanel: React.FC = () => {
  const { session, authStatus } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(
    null
  );
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isListOpen, setIsListOpen] = useState(true);

  const loadProjects = async (userId: string) => {
    setIsLoadingList(true);
    try {
      const list = await fetchProjectList(userId);
      setProjects(list);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setIsLoadingList(false);
    }
  };

  const loadProjectDetail = async (userId: string, projectId: string) => {
    setIsLoadingDetail(true);
    try {
      const detail = await fetchProjectDetail({ userId, projectId });
      setSelectedProject(detail);
    } catch (error) {
      console.error("Failed to load project detail:", error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    const userId = session?.user?.id;
    if (authStatus === "signed_in" && userId) {
      loadProjects(userId);
    }
  }, [authStatus, session?.user?.id]);

  const results: SceneResult[] = useMemo(() => {
    if (!selectedProject) return [];
    return selectedProject.outputs.map((output) => ({
      prompt: output.prompt,
      imageUrl: output.imageUrl,
      isLoading: false,
    }));
  }, [selectedProject]);

  const captions = useMemo(() => {
    if (!selectedProject) return { tiktok: "", instagram: "" };
    return {
      tiktok: formatCaptionList(selectedProject.captions.tiktok),
      instagram: formatCaptionList(selectedProject.captions.instagram),
    };
  }, [selectedProject]);

  const previewImageUrl = results[0]?.imageUrl;

  return (
    <div className={styles.savedProjects}>
      <div className={styles.savedProjects__sidebar}>
        <div className={styles.savedProjects__header}>
          <div>
            <h2 className={styles.savedProjects__title}>Saved projects</h2>
            <p className={styles.savedProjects__subtitle}>
              Reopen a past generation anytime.
            </p>
          </div>
          <button
            className={styles.savedProjects__toggle}
            onClick={() => setIsListOpen((prev) => !prev)}
          >
            {isListOpen ? "Hide" : "Show"}
          </button>
        </div>

        {isListOpen && (
          <div className={styles.savedProjects__list}>
            {isLoadingList ? (
              <p className={styles.savedProjects__empty}>
                Loading saved projects...
              </p>
            ) : projects.length === 0 ? (
              <p className={styles.savedProjects__empty}>
                No saved projects yet.
              </p>
            ) : (
              projects.map((project) => {
                const isActive = selectedProject?.id === project.id;
                const sceneCount = project.prompts?.length ?? 0;
                const dateLabel = project.createdAt
                  ? new Date(project.createdAt).toLocaleDateString()
                  : "";
                return (
                  <button
                    key={project.id}
                    className={`${styles.savedProjects__item} ${
                      isActive ? styles.isActive : ""
                    }`}
                    onClick={() => {
                      const userId = session?.user?.id;
                      if (!userId) return;
                      loadProjectDetail(userId, project.id);
                    }}
                  >
                    <div className={styles.savedProjects__itemTitle}>
                      {project.name}
                    </div>
                    <div className={styles.savedProjects__itemMeta}>
                      <span>{sceneCount} scenes</span>
                      <span>{dateLabel}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className={styles.savedProjects__content}>
        {isLoadingDetail && (
          <div className={styles.savedProjects__empty}>
            Loading project...
          </div>
        )}
        {!isLoadingDetail && !selectedProject && (
          <div className={styles.savedProjects__empty}>
            Select a project to view the results.
          </div>
        )}
        {!isLoadingDetail && selectedProject && results.length > 0 && (
          <DashboardLayout
            projectName={selectedProject.name}
            onProjectNameChange={() => {}}
            references={[]}
            onUpload={() => {}}
            onOpenLibrary={() => {}}
            onRemoveReference={() => {}}
            promptList={selectedProject.prompts}
            activeSceneIndex={0}
            onSceneSelect={() => {}}
            onAddScene={() => {}}
            onRemoveScene={() => {}}
            onSavePrompt={() => {}}
            previewImageUrl={previewImageUrl}
            isGenerating={false}
            disableGenerate
            onGenerateAll={() => {}}
            onRegenerateActive={() => {}}
            rules={{ tiktok: [], instagram: [] }}
            guidelines={[]}
            onGuidelinesChange={() => {}}
            captions={captions}
            results={results}
            onRegenerateResult={() => {}}
          />
        )}
        {!isLoadingDetail && selectedProject && results.length === 0 && (
          <div className={styles.savedProjects__empty}>
            This project has no saved outputs yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedProjectsPanel;
