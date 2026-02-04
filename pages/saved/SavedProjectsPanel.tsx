import React, { useMemo } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../../components/DashboardV2/DashboardLayout";
import type { ProjectDetail, ProjectSummary, SceneResult } from "../../types";
import styles from "./SavedProjectsPanel.module.scss";

const formatCaptionList = (items: string[]) =>
  items
    .map((caption, idx) =>
      items.length > 1 ? `Scene ${idx + 1}: ${caption}` : caption
    )
    .join("\n\n");

interface SavedProjectsPanelProps {
  /** List of projects for list view (/saved/project). When null, panel is in detail mode. */
  projects?: ProjectSummary[] | null;
  projectListLoading?: boolean;
  /** Selected project detail for detail view (/saved/project/[id]). */
  selectedProject: ProjectDetail | null;
  isLoadingDetail?: boolean;
  onSelectProject?: (projectId: string) => void;
}

const SavedProjectsPanel: React.FC<SavedProjectsPanelProps> = ({
  projects = null,
  projectListLoading = false,
  selectedProject,
  isLoadingDetail = false,
  onSelectProject,
}) => {
  const router = useRouter();
  const handleSelectProject =
    onSelectProject ?? ((id) => router.push("/saved/project/" + id));

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

  // List view: show projects when we have a list and no selected project
  const isListMode = projects !== null && !selectedProject;
  if (isListMode) {
    return (
      <div className={styles.savedProjects__content}>
        {projectListLoading && (
          <div className={styles.savedProjects__empty}>Loading projects...</div>
        )}
        {!projectListLoading && projects.length === 0 && (
          <div className={styles.savedProjects__empty}>No projects yet.</div>
        )}
        {!projectListLoading && projects.length > 0 && (
          <div className={styles.savedProjects__list}>
            <h2 className={styles.savedProjects__listTitle}>Saved Projects</h2>
            <ul className={styles.savedProjects__listItems}>
              {projects.map((project) => (
                <li key={project.id}>
                  <button
                    type="button"
                    className={styles.savedProjects__listItem}
                    onClick={() => handleSelectProject(project.id)}
                  >
                    <span className={styles.savedProjects__listItemName}>
                      {project.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Detail view
  return (
    <div className={styles.savedProjects__content}>
      {isLoadingDetail && (
        <div className={styles.savedProjects__empty}>Loading project...</div>
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
  );
};

export default SavedProjectsPanel;
