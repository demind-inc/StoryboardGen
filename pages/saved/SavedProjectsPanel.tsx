import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../../components/DashboardV2/DashboardLayout";
import {
  DEFAULT_CAPTION_RULES,
  DEFAULT_CUSTOM_GUIDELINES,
  DEFAULT_HASHTAGS,
} from "../../services/captionSettingsService";
import type { ProjectDetail, ProjectSummary, SceneResult } from "../../types";
import {
  generateCharacterScene,
  generateSceneCaptions,
  generateSceneSummaries,
} from "../../services/geminiService";
import { useSaveProjectOutput } from "../../hooks/useProjectService";
import styles from "./SavedProjectsPanel.module.scss";

const formatShortDate = (value?: string | null) => {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

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
  userId?: string;
}

const SavedProjectsPanel: React.FC<SavedProjectsPanelProps> = ({
  projects = null,
  projectListLoading = false,
  selectedProject,
  isLoadingDetail = false,
  onSelectProject,
  userId,
}) => {
  const router = useRouter();
  const saveProjectOutputMutation = useSaveProjectOutput();
  const handleSelectProject =
    onSelectProject ?? ((id) => router.push("/saved/project/" + id));
  const [detailResults, setDetailResults] = useState<SceneResult[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const results: SceneResult[] = useMemo(() => {
    if (!selectedProject) return [];
    return selectedProject.outputs.map((output) => ({
      prompt: output.prompt,
      title: output.title,
      description: output.description,
      imageUrl: output.imageUrl,
      isLoading: false,
    }));
  }, [selectedProject]);

  const displayResults = detailResults.length ? detailResults : results;

  const captions = useMemo(() => {
    if (!selectedProject) return { tiktok: "", instagram: "" };
    return {
      tiktok: formatCaptionList(selectedProject.captions.tiktok),
      instagram: formatCaptionList(selectedProject.captions.instagram),
    };
  }, [selectedProject]);

  const previewImageUrl = displayResults[0]?.imageUrl;

  useEffect(() => {
    if (!selectedProject) {
      setDetailResults([]);
      return;
    }
    setDetailResults(results);
  }, [selectedProject, results]);

  const handleRegenerateResult = async (index: number) => {
    if (!selectedProject) return;
    const prompt =
      displayResults[index]?.prompt || selectedProject.prompts[index] || "";
    if (!prompt) return;

    setIsRegenerating(true);
    setDetailResults((prev) =>
      prev.map((res, idx) =>
        idx === index ? { ...res, isLoading: true, error: undefined } : res
      )
    );

    try {
      const imageUrl = await generateCharacterScene(prompt, [], "1K", []);
      let summaryUpdate: { title?: string; description?: string } | undefined;
      try {
        const summaryResponse = await generateSceneSummaries([prompt], []);
        summaryUpdate = {
          title: summaryResponse.titles[0] || "",
          description: summaryResponse.descriptions[0] || "",
        };
      } catch (summaryError) {
        console.error("Failed to regenerate summary:", summaryError);
      }
      let captionsUpdate: { tiktok?: string; instagram?: string } | undefined;
      try {
        const captionResponse = await generateSceneCaptions(
          [prompt],
          [],
          DEFAULT_CAPTION_RULES,
          DEFAULT_CUSTOM_GUIDELINES,
          DEFAULT_HASHTAGS
        );
        captionsUpdate = {
          tiktok: captionResponse.tiktok[0] || "",
          instagram: captionResponse.instagram[0] || "",
        };
      } catch (captionError) {
        console.error("Failed to regenerate captions:", captionError);
      }
      setDetailResults((prev) =>
        prev.map((res, idx) =>
          idx === index
            ? {
                ...res,
                imageUrl,
                isLoading: false,
                title: summaryUpdate?.title ?? res.title,
                description: summaryUpdate?.description ?? res.description,
              }
            : res
        )
      );
      if (userId) {
        await saveProjectOutputMutation.mutateAsync({
          userId,
          projectId: selectedProject.id,
          sceneIndex: index,
          prompt,
          imageUrl,
          title: summaryUpdate?.title,
          description: summaryUpdate?.description,
          captions: captionsUpdate,
        });
      }
    } catch (error: any) {
      console.error("Failed to regenerate image:", error);
      setDetailResults((prev) =>
        prev.map((res, idx) =>
          idx === index
            ? {
                ...res,
                isLoading: false,
                error: error?.message || "Regeneration failed",
              }
            : res
        )
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRegenerateAll = async () => {
    if (!selectedProject || displayResults.length === 0) return;
    setIsRegenerating(true);
    setDetailResults((prev) =>
      prev.map((res) => ({ ...res, isLoading: true, error: undefined }))
    );

    const nextResults = [...displayResults];
    for (let i = 0; i < nextResults.length; i++) {
      const prompt = nextResults[i]?.prompt || selectedProject.prompts[i] || "";
      if (!prompt) {
        nextResults[i] = { ...nextResults[i], isLoading: false };
        continue;
      }
      try {
        const imageUrl = await generateCharacterScene(prompt, [], "1K", []);
        let summaryUpdate: { title?: string; description?: string } | undefined;
        try {
          const summaryResponse = await generateSceneSummaries([prompt], []);
          summaryUpdate = {
            title: summaryResponse.titles[0] || "",
            description: summaryResponse.descriptions[0] || "",
          };
        } catch (summaryError) {
          console.error("Failed to regenerate summary:", summaryError);
        }
        let captionsUpdate: { tiktok?: string; instagram?: string } | undefined;
        try {
          const captionResponse = await generateSceneCaptions(
            [prompt],
            [],
            DEFAULT_CAPTION_RULES,
            DEFAULT_CUSTOM_GUIDELINES,
            DEFAULT_HASHTAGS
          );
          captionsUpdate = {
            tiktok: captionResponse.tiktok[0] || "",
            instagram: captionResponse.instagram[0] || "",
          };
        } catch (captionError) {
          console.error("Failed to regenerate captions:", captionError);
        }
        nextResults[i] = {
          ...nextResults[i],
          imageUrl,
          isLoading: false,
          title: summaryUpdate?.title ?? nextResults[i].title,
          description: summaryUpdate?.description ?? nextResults[i].description,
        };
        if (userId) {
          try {
            await saveProjectOutputMutation.mutateAsync({
              userId,
              projectId: selectedProject.id,
              sceneIndex: i,
              prompt,
              imageUrl,
              title: summaryUpdate?.title,
              description: summaryUpdate?.description,
              captions: captionsUpdate,
            });
          } catch (error) {
            console.error("Failed to save regenerated output:", error);
          }
        }
      } catch (error: any) {
        console.error("Failed to regenerate image:", error);
        nextResults[i] = {
          ...nextResults[i],
          isLoading: false,
          error: error?.message || "Regeneration failed",
        };
      }
      setDetailResults([...nextResults]);
    }

    setIsRegenerating(false);
  };

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
            <div className={styles.savedProjects__headerRow}>
              <div>
                <div className={styles.savedProjects__eyebrow}>
                  SAVED PROJECTS
                </div>
                <div className={styles.savedProjects__subtitle}>
                  All projects in your workspace
                </div>
              </div>
              <button
                type="button"
                className={styles.savedProjects__newButton}
                aria-label="Create new project"
              >
                New Project
              </button>
            </div>
            <ul className={styles.savedProjects__listItems}>
              {projects.map((project) => (
                <li key={project.id}>
                  <button
                    type="button"
                    className={styles.savedProjects__listItem}
                    onClick={() => handleSelectProject(project.id)}
                  >
                    <span className={styles.savedProjects__listItemContent}>
                      <span className={styles.savedProjects__listItemTitle}>
                        {project.name}
                      </span>
                      <span className={styles.savedProjects__listItemMeta}>
                        {project.prompts.length} prompts
                      </span>
                    </span>
                    <span className={styles.savedProjects__listItemUpdated}>
                      Updated {formatShortDate(project.updatedAt)}
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
  if (!isLoadingDetail && selectedProject && displayResults.length > 0) {
    return (
      <DashboardLayout
        projectName={selectedProject.name}
        onProjectNameChange={() => {}}
        references={[]}
        onUpload={() => {}}
        onOpenLibrary={() => {}}
        onRemoveReference={() => {}}
        topic=""
        onTopicChange={() => {}}
        onGenerateTopicScenes={() => {}}
        isTopicGenerating={false}
        topicError={null}
        promptList={selectedProject.prompts}
        activeSceneIndex={0}
        onSceneSelect={() => {}}
        onAddScene={() => {}}
        onRemoveScene={() => {}}
        onSavePrompt={() => {}}
        previewImageUrl={previewImageUrl}
        isGenerating={isRegenerating}
        disableGenerate
        onGenerateAll={handleRegenerateAll}
        onRegenerateActive={() => {}}
        rules={DEFAULT_CAPTION_RULES}
        guidelines={DEFAULT_CUSTOM_GUIDELINES}
        onGuidelinesChange={() => {}}
        captions={captions}
        results={displayResults}
        onRegenerateResult={handleRegenerateResult}
        allowRegenerate={false}
        transparentBackground={true}
        onTransparentBackgroundChange={() => {}}
        hashtags={DEFAULT_HASHTAGS}
        selectedHashtags={DEFAULT_HASHTAGS}
        onSelectedHashtagsChange={() => {}}
      />
    );
  }

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

      {!isLoadingDetail && selectedProject && results.length === 0 && (
        <div className={styles.savedProjects__empty}>
          This project has no saved outputs yet.
        </div>
      )}
    </div>
  );
};

export default SavedProjectsPanel;
