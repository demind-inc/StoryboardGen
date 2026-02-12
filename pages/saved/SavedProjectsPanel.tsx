import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../../components/DashboardV2/DashboardLayout";
import {
  DEFAULT_CAPTION_RULES,
  DEFAULT_CUSTOM_GUIDELINES,
  DEFAULT_HASHTAGS,
} from "../../services/captionSettingsService";
import type {
  ProjectDetail,
  ProjectSummary,
  ReferenceImage,
  SceneResult,
  SubscriptionPlan,
} from "../../types";
import {
  generateCharacterScene,
  generateSceneCaptionsForPlatform,
} from "../../services/geminiService";
import {
  useSaveProjectCaptions,
  useSaveProjectOutput,
} from "../../hooks/useProjectService";
import { useRecordGeneration } from "../../hooks/useUsageService";
import { useCaptionSettings } from "../../hooks/useCaptionSettingsService";
import { urlToReferenceImage } from "../../hooks/useImageGeneration";
import { promptToScene } from "../../types/scene";
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
  planType?: SubscriptionPlan;
}

const SavedProjectsPanel: React.FC<SavedProjectsPanelProps> = ({
  projects = null,
  projectListLoading = false,
  selectedProject,
  isLoadingDetail = false,
  onSelectProject,
  userId,
  planType,
}) => {
  const router = useRouter();
  const saveProjectOutputMutation = useSaveProjectOutput();
  const saveProjectCaptionsMutation = useSaveProjectCaptions();
  const recordGenerationMutation = useRecordGeneration();
  const captionSettingsQuery = useCaptionSettings(userId);
  const availableRules =
    captionSettingsQuery.data?.rules ?? DEFAULT_CAPTION_RULES;
  const availableHashtags =
    captionSettingsQuery.data?.hashtags ?? DEFAULT_HASHTAGS;
  const handleSelectProject =
    onSelectProject ?? ((id) => router.push("/saved/project/" + id));
  const [detailResults, setDetailResults] = useState<SceneResult[]>([]);
  const [detailCaptions, setDetailCaptions] = useState<{
    tiktok: string[];
    instagram: string[];
  }>({ tiktok: [], instagram: [] });
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
    if (!selectedProject && detailCaptions.tiktok.length === 0) {
      return { tiktok: "", instagram: "" };
    }
    return {
      tiktok: formatCaptionList(detailCaptions.tiktok),
      instagram: formatCaptionList(detailCaptions.instagram),
    };
  }, [selectedProject, detailCaptions]);

  const previewImageUrl = displayResults[0]?.imageUrl;

  useEffect(() => {
    if (!selectedProject) {
      setDetailResults([]);
      setDetailCaptions({ tiktok: [], instagram: [] });
      return;
    }
    setDetailResults(results);
    setDetailCaptions({
      tiktok: selectedProject.captions.tiktok,
      instagram: selectedProject.captions.instagram,
    });
  }, [selectedProject, results]);

  const handleGenerateCaption = async (
    platform: "tiktok" | "instagram",
    options: { rules: string; hashtags: string[] }
  ) => {
    if (!selectedProject) return;
    const prompts = displayResults
      .map((result, idx) => result.prompt || selectedProject.prompts[idx] || "")
      .filter(Boolean);
    if (prompts.length === 0) return;

    const customRule = options.rules.trim();
    const rulesForGeneration = {
      ...availableRules,
      [platform]: customRule
        ? [{ name: "Custom", rule: customRule }]
        : availableRules[platform],
    };
    const hashtagsForGeneration = Array.from(
      new Set(
        [...availableHashtags, ...options.hashtags]
          .map((tag) => tag.trim())
          .filter(Boolean)
      )
    );

    const generated = await generateSceneCaptionsForPlatform(
      prompts,
      [],
      platform,
      rulesForGeneration,
      DEFAULT_CUSTOM_GUIDELINES,
      hashtagsForGeneration
    );
    setDetailCaptions((prev) => ({
      ...prev,
      [platform]: generated,
    }));

    if (!userId) return;
    try {
      await saveProjectCaptionsMutation.mutateAsync({
        userId,
        projectId: selectedProject.id,
        captions: {
          tiktok: platform === "tiktok" ? generated : detailCaptions.tiktok,
          instagram:
            platform === "instagram" ? generated : detailCaptions.instagram,
        },
      });
    } catch (error) {
      console.error("Failed to save generated caption:", error);
    }
  };

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
      const currentImageUrl = displayResults[index]?.imageUrl;
      let referencesToUse: ReferenceImage[] = [];
      if (currentImageUrl) {
        try {
          const previousRef = await urlToReferenceImage(currentImageUrl);
          referencesToUse = [previousRef];
        } catch (e) {
          console.error("Failed to use previous image as reference", e);
        }
      }
      const imageUrl = await generateCharacterScene(
        prompt,
        referencesToUse,
        "1K",
        []
      );
      setDetailResults((prev) =>
        prev.map((res, idx) =>
          idx === index
            ? {
                ...res,
                imageUrl,
                isLoading: false,
              }
            : res
        )
      );
      if (userId) {
        await recordGenerationMutation.mutateAsync({
          userId,
          amount: 1,
          planType: planType ?? null,
        });
        await saveProjectOutputMutation.mutateAsync({
          userId,
          projectId: selectedProject.id,
          sceneIndex: index,
          prompt,
          imageUrl,
          title: displayResults[index]?.title,
          description: displayResults[index]?.description,
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
        const currentImageUrl = nextResults[i]?.imageUrl;
        let referencesToUse: ReferenceImage[] = [];
        if (currentImageUrl) {
          try {
            const previousRef = await urlToReferenceImage(currentImageUrl);
            referencesToUse = [previousRef];
          } catch (e) {
            console.error("Failed to use previous image as reference", e);
          }
        }
        const imageUrl = await generateCharacterScene(
          prompt,
          referencesToUse,
          "1K",
          []
        );
        nextResults[i] = {
          ...nextResults[i],
          imageUrl,
          isLoading: false,
        };
        if (userId) {
          try {
            await recordGenerationMutation.mutateAsync({
              userId,
              amount: 1,
              planType: planType ?? null,
            });
            await saveProjectOutputMutation.mutateAsync({
              userId,
              projectId: selectedProject.id,
              sceneIndex: i,
              prompt,
              imageUrl,
              title: nextResults[i]?.title,
              description: nextResults[i]?.description,
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
    const scenes = selectedProject.prompts.map((prompt, index) =>
      promptToScene(prompt, `scene_${index}`)
    );

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
        scenes={scenes}
        activeSceneIndex={0}
        onSceneSelect={() => {}}
        onAddScene={() => {}}
        onRemoveScene={() => {}}
        onSaveScene={() => {}}
        previewImageUrl={previewImageUrl}
        isGenerating={isRegenerating}
        disableGenerate
        onGenerateAll={handleRegenerateAll}
        onRegenerateActive={() => {}}
        rules={availableRules}
        guidelines={DEFAULT_CUSTOM_GUIDELINES}
        onGuidelinesChange={() => {}}
        captions={captions}
        onGenerateCaption={handleGenerateCaption}
        results={displayResults}
        onRegenerateResult={handleRegenerateResult}
        allowRegenerate
        transparentBackground={true}
        onTransparentBackgroundChange={() => {}}
        hashtags={availableHashtags}
        selectedHashtags={availableHashtags}
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
