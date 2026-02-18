import { useEffect, useState } from "react";
import {
  AppMode,
  CaptionRules,
  CustomGuidelines,
  Hashtags,
  ImageSize,
  MonthlyUsage,
  ReferenceImage,
  SceneResult,
} from "../types";
import {
  generateCharacterScene,
  generateSceneCaptionsForPlatform,
} from "../services/geminiService";
import { getMonthlyUsage } from "../services/usageService";
import { useRecordGeneration } from "./useUsageService";
import { useSaveProjectWithOutputs } from "./useProjectService";
import { setHasGeneratedFreeImage as setHasGeneratedFreeImageInDB } from "../services/authService";
import { trackImageGeneration, trackImageRegeneration } from "../lib/analytics";
import { promptToScene, sceneToImagePrompt } from "../types/scene";

interface UseImageGenerationProps {
  mode: AppMode;
  userId: string | undefined;
  references: ReferenceImage[];
  manualPrompts: string;
  projectName: string;
  size: ImageSize;
  planType: string;
  captionRules: CaptionRules;
  hashtags: Hashtags;
  guidelines: CustomGuidelines;
  transparentBackground: boolean;
  hasGeneratedFreeImage: boolean;
  isPaymentUnlocked: boolean;
  usage: MonthlyUsage | null;
  setUsage: React.Dispatch<React.SetStateAction<MonthlyUsage | null>>;
  setUsageError: React.Dispatch<React.SetStateAction<string | null>>;
  setHasGeneratedFreeImage: React.Dispatch<React.SetStateAction<boolean>>;
  setCaptions: React.Dispatch<
    React.SetStateAction<{ tiktok: string; instagram: string }>
  >;
  openPaymentModal: () => void;
  refreshUsage: (userId: string) => Promise<void>;
}

interface UseImageGenerationReturn {
  manualResults: SceneResult[];
  isGenerating: boolean;
  setManualResults: React.Dispatch<React.SetStateAction<SceneResult[]>>;
  startGeneration: () => Promise<void>;
  handleRegenerate: (index: number) => Promise<void>;
  handleGenerateCaption: (
    platform: "tiktok" | "instagram",
    options: { rules: string; hashtags: string[] }
  ) => Promise<void>;
  projectId: string | null;
}

const FREE_CREDIT_CAP = 3;

export interface UseRegenerateImageParams {
  userId: string | undefined;
  planType: string;
  usage: MonthlyUsage | null;
  setUsage: React.Dispatch<React.SetStateAction<MonthlyUsage | null>>;
  setUsageError: React.Dispatch<React.SetStateAction<string | null>>;
  isPaymentUnlocked: boolean;
  openPaymentModal: () => void;
  refreshUsage: (userId: string) => Promise<void>;
  size?: ImageSize;
  guidelines?: CustomGuidelines;
  transparentBackground?: boolean;
}

export interface RegenerateImageOptions {
  prompt: string;
  referenceImageUrl?: string | null;
  /** Extra references to prepend (e.g. from dashboard). Omitted when only referenceImageUrl is used. */
  extraReferences?: ReferenceImage[];
  size?: ImageSize;
  guidelines?: CustomGuidelines;
  transparentBackground?: boolean;
}

/**
 * Shared hook for regenerating a single image with usage checks and payment modal.
 * Used by useImageGeneration (dashboard) and SavedProjectsPanel.
 */
export function useRegenerateImage({
  userId,
  planType,
  usage,
  setUsage,
  setUsageError,
  isPaymentUnlocked,
  openPaymentModal,
  refreshUsage,
  size: defaultSize = "1K",
  guidelines: defaultGuidelines = [],
  transparentBackground: defaultTransparent = true,
}: UseRegenerateImageParams) {
  const recordGenerationMutation = useRecordGeneration();

  return async function regenerateSingle(options: RegenerateImageOptions): Promise<string> {
    const {
      prompt,
      referenceImageUrl,
      extraReferences = [],
      size = defaultSize,
      guidelines = defaultGuidelines,
      transparentBackground = defaultTransparent,
    } = options;

    if (!userId) {
      throw new Error("Unable to verify your account. Please sign in again.");
    }

    let latestUsage: MonthlyUsage | null = usage;
    try {
      latestUsage = await getMonthlyUsage(userId, planType as any);
      setUsage(latestUsage);
      setUsageError(null);
    } catch (error) {
      console.error("Usage check error:", error);
      throw new Error("Unable to check credit balance.");
    }

    if (
      !isPaymentUnlocked &&
      latestUsage &&
      latestUsage.used >= FREE_CREDIT_CAP
    ) {
      openPaymentModal();
      throw new Error("Upgrade to keep generating.");
    }

    if (latestUsage && latestUsage.remaining <= 0) {
      openPaymentModal();
      throw new Error("Monthly credit limit reached.");
    }

    let referencesToUse: ReferenceImage[] = [...extraReferences];
    if (referenceImageUrl) {
      try {
        const previousRef = await urlToReferenceImage(referenceImageUrl);
        referencesToUse = [previousRef, ...referencesToUse];
      } catch (e) {
        console.error("Failed to use previous image as reference", e);
      }
    }

    try {
      const imageUrl = await generateCharacterScene(
        prompt,
        referencesToUse,
        size,
        guidelines,
        { transparentBackground }
      );
      const updatedUsage = await recordGenerationMutation.mutateAsync({
        userId,
        amount: 1,
        planType: planType as any,
      });
      setUsage(updatedUsage);
      return imageUrl;
    } catch (error: any) {
      if (error?.message === "MONTHLY_LIMIT_REACHED") {
        await refreshUsage(userId);
        openPaymentModal();
      }
      throw error;
    }
  };
}

/** Convert an image URL (data, blob, or https) to ReferenceImage for API use. */
export async function urlToReferenceImage(
  url: string
): Promise<ReferenceImage> {
  if (url.startsWith("data:")) {
    const match = url.match(/^data:(image\/[^;]+);base64,/);
    return {
      id: "previous",
      data: url,
      mimeType: match ? match[1] : "image/png",
    };
  }
  const response = await fetch(url);
  const blob = await response.blob();
  const mimeType = blob.type || "image/png";
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  return { id: "previous", data: dataUrl, mimeType };
}

export const useImageGeneration = ({
  mode,
  userId,
  references,
  manualPrompts,
  projectName,
  size,
  planType,
  captionRules,
  hashtags,
  guidelines,
  transparentBackground,
  hasGeneratedFreeImage,
  isPaymentUnlocked,
  usage,
  setUsage,
  setUsageError,
  setHasGeneratedFreeImage,
  setCaptions,
  openPaymentModal,
  refreshUsage,
}: UseImageGenerationProps): UseImageGenerationReturn => {
  const recordGenerationMutation = useRecordGeneration();
  const saveProjectMutation = useSaveProjectWithOutputs();
  const [manualResults, setManualResults] = useState<SceneResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [captionStore, setCaptionStore] = useState<{
    tiktok: string[];
    instagram: string[];
  }>({ tiktok: [], instagram: [] });

  const regenerateSingle = useRegenerateImage({
    userId,
    planType,
    usage,
    setUsage,
    setUsageError,
    isPaymentUnlocked,
    openPaymentModal,
    refreshUsage,
    size,
    guidelines,
    transparentBackground,
  });

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isGenerating) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isGenerating]);

  const markFirstGenerationComplete = async () => {
    if (!hasGeneratedFreeImage && userId) {
      try {
        await setHasGeneratedFreeImageInDB(userId, true);
        setHasGeneratedFreeImage(true);
      } catch (error) {
        console.error("Failed to update has_generated_free_image:", error);
        // Still update local state even if DB update fails
        setHasGeneratedFreeImage(true);
      }
    }
  };

  const formatCaptionDisplay = (items: string[]) =>
    items
      .map((caption, idx) =>
        items.length > 1 ? `Scene ${idx + 1}: ${caption}` : caption
      )
      .join("\n\n");

  const handleGenerateCaption = async (
    platform: "tiktok" | "instagram",
    options: { rules: string; hashtags: string[] }
  ) => {
    if (manualResults.length === 0) return;
    const prompts = manualResults
      .map((result) => result.prompt.trim())
      .filter(Boolean);
    if (prompts.length === 0) return;

    const customRule = options.rules.trim();
    const mergedRules: CaptionRules = {
      ...captionRules,
      [platform]: customRule
        ? [{ name: "Custom", rule: customRule }]
        : captionRules[platform],
    };

    const mergedHashtags = Array.from(
      new Set(
        [...hashtags, ...options.hashtags]
          .map((tag) => tag.trim())
          .filter(Boolean)
      )
    );

    const response = await generateSceneCaptionsForPlatform(
      prompts,
      references,
      platform,
      mergedRules,
      guidelines,
      mergedHashtags
    );

    // Use functional update so the other platform's captions are never overwritten
    // when TikTok and Instagram generation run independently (e.g. one finishes after the other).
    const nextCaptionsRef: {
      current: { tiktok: string[]; instagram: string[] } | null;
    } = { current: null };
    setCaptionStore((prev) => {
      const next = { ...prev, [platform]: response };
      nextCaptionsRef.current = next;
      setCaptions({
        tiktok: formatCaptionDisplay(next.tiktok),
        instagram: formatCaptionDisplay(next.instagram),
      });
      return next;
    });

    if (userId && manualResults.length > 0 && nextCaptionsRef.current) {
      try {
        const savedProjectId = await saveProjectMutation.mutateAsync({
          userId,
          projectId: projectId ?? undefined,
          projectName,
          prompts: manualResults.map((result) => result.prompt),
          captions: nextCaptionsRef.current,
          results: manualResults,
        });
        setProjectId(savedProjectId);
      } catch (error) {
        console.error("Failed to save generated captions:", error);
      }
    }
  };

  const handleRegenerate = async (index: number) => {
    if (references.length === 0) {
      alert(
        "Please upload at least one reference image for character consistency."
      );
      return;
    }

    const currentList = manualResults;
    const targetResult = currentList[index];
    if (!targetResult) return;

    trackImageRegeneration(mode, index);
    setManualResults((prev) =>
      prev.map((res, idx) =>
        idx === index ? { ...res, isLoading: true, error: undefined } : res
      )
    );

    try {
      const imageUrl = await regenerateSingle({
        prompt: targetResult.prompt,
        referenceImageUrl: targetResult.imageUrl ?? undefined,
        extraReferences: references,
        size,
        guidelines,
        transparentBackground,
      });
      markFirstGenerationComplete();
      setManualResults((prev) =>
        prev.map((res, idx) =>
          idx === index ? { ...res, imageUrl, isLoading: false } : res
        )
      );
    } catch (error: any) {
      console.error("Regeneration error:", error);
      setManualResults((prev) =>
        prev.map((res, idx) =>
          idx === index
            ? {
                ...res,
                error: error.message || "Generation failed",
                isLoading: false,
              }
            : res
        )
      );
    }
  };

  const startGeneration = async () => {
    if (references.length === 0) {
      alert(
        "Please upload at least one reference image for character consistency."
      );
      return;
    }

    if (!userId) {
      alert("Unable to verify your account. Please sign in again.");
      return;
    }

    const promptList = manualPrompts.split("\n").filter((p) => p.trim() !== "");
    if (promptList.length === 0) {
      alert("Please enter some manual prompts.");
      return;
    }

    const scenesToGenerate = promptList.length;

    // Track generation event
    trackImageGeneration(mode, scenesToGenerate, {
      references_count: references.length,
      image_size: size,
    });

    setIsGenerating(true);

    let latestUsage: MonthlyUsage | null = usage;

    try {
      latestUsage = await getMonthlyUsage(userId, planType as any);
      setUsage(latestUsage);
      setUsageError(null);
    } catch (error) {
      console.error("Usage check error:", error);
      setUsageError("Unable to load credits.");
      alert("Unable to check your monthly credits. Please try again.");
      setIsGenerating(false);
      return;
    }

    if (latestUsage && scenesToGenerate > latestUsage.remaining) {
      if (!isPaymentUnlocked) {
        openPaymentModal();
      } else {
        alert(
          `You can generate ${latestUsage.remaining} more image${
            latestUsage.remaining === 1 ? "" : "s"
          } this month (credits ${latestUsage.monthlyLimit}).`
        );
      }
      setIsGenerating(false);
      return;
    }

    if (
      !isPaymentUnlocked &&
      latestUsage &&
      latestUsage.used >= FREE_CREDIT_CAP
    ) {
      openPaymentModal();
      setIsGenerating(false);
      return;
    }

    const initialManualResults = promptList.map((p) => {
      const scene = promptToScene(p);
      return {
        prompt: p,
        title: scene.title || undefined,
        description: scene.description || undefined,
        isLoading: true,
      } as SceneResult;
    });
    setManualResults(initialManualResults);
    const generatedResults = [...initialManualResults];
    const emptyCaptions = { tiktok: [], instagram: [] };
    setCaptionStore(emptyCaptions);
    setCaptions({ tiktok: "", instagram: "" });

    // Run all image generations in parallel so results can be shown together
    const settled = await Promise.allSettled(
      promptList.map((prompt) => {
        const scene = promptToScene(prompt);
        const imagePrompt = sceneToImagePrompt(scene);
        return generateCharacterScene(
          imagePrompt,
          references,
          size,
          guidelines,
          { transparentBackground }
        );
      })
    );

    let hitMonthlyLimit = false;
    let successfulCount = 0;

    for (let i = 0; i < settled.length; i++) {
      const outcome = settled[i];
      if (outcome.status === "fulfilled") {
        generatedResults[i] = {
          ...generatedResults[i],
          imageUrl: outcome.value,
          isLoading: false,
        };
        markFirstGenerationComplete();
        successfulCount += 1;
      } else {
        const error = outcome.reason as any;
        console.error("Manual generation error:", error);
        if (error?.message === "MONTHLY_LIMIT_REACHED") {
          hitMonthlyLimit = true;
        }
        generatedResults[i] = {
          ...generatedResults[i],
          error: error?.message || "Generation failed",
          isLoading: false,
        };
      }
    }

    if (hitMonthlyLimit) {
      await refreshUsage(userId);
      if (!isPaymentUnlocked) {
        openPaymentModal();
      } else {
        alert("Monthly credit limit reached. Please upgrade for more.");
      }
    }

    // Record total usage in one call (reduces total credits by successfulCount)
    if (successfulCount > 0) {
      try {
        const updatedUsage = await recordGenerationMutation.mutateAsync({
          userId,
          amount: successfulCount,
          planType: planType as any,
        });
        setUsage(updatedUsage);
      } catch (e) {
        console.error("Failed to record usage", e);
      }
    }

    setManualResults([...generatedResults]);

    const isFinished = generatedResults.every((result) => !result.isLoading);
    const hasAnyOutput = generatedResults.some((result) => result.imageUrl);
    if (isFinished && hasAnyOutput) {
      try {
        const savedProjectId = await saveProjectMutation.mutateAsync({
          userId,
          projectId: projectId ?? undefined,
          projectName,
          prompts: promptList,
          captions: emptyCaptions,
          results: generatedResults,
        });
        setProjectId(savedProjectId);
      } catch (error) {
        console.error("Failed to save project outputs:", error);
        alert("Failed to save project outputs. Please try again.");
      }
    }
    setIsGenerating(false);
  };

  return {
    manualResults,
    isGenerating,
    setManualResults,
    startGeneration,
    handleRegenerate,
    handleGenerateCaption,
    projectId,
  };
};
