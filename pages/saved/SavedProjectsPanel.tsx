import React, { useMemo } from "react";
import DashboardLayout from "../../components/DashboardV2/DashboardLayout";
import type { ProjectDetail, SceneResult } from "../../types";
import styles from "./SavedProjectsPanel.module.scss";

const formatCaptionList = (items: string[]) =>
  items
    .map((caption, idx) =>
      items.length > 1 ? `Scene ${idx + 1}: ${caption}` : caption
    )
    .join("\n\n");

interface SavedProjectsPanelProps {
  selectedProject: ProjectDetail | null;
  isLoading: boolean;
}

const SavedProjectsPanel: React.FC<SavedProjectsPanelProps> = ({
  selectedProject,
  isLoading,
}) => {
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
    <div className={styles.savedProjects__content}>
      {isLoading && (
        <div className={styles.savedProjects__empty}>Loading project...</div>
      )}
      {!isLoading && !selectedProject && (
        <div className={styles.savedProjects__empty}>
          Select a project to view the results.
        </div>
      )}
      {!isLoading && selectedProject && results.length > 0 && (
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
      {!isLoading && selectedProject && results.length === 0 && (
        <div className={styles.savedProjects__empty}>
          This project has no saved outputs yet.
        </div>
      )}
    </div>
  );
};

export default SavedProjectsPanel;
