import { useCallback, useState } from "react";
import {
  AppMode,
  CaptionRules,
  ImageSize,
  MonthlyUsage,
  ReferenceImage,
  SceneResult,
} from "../types";
import {
  generateCharacterScene,
  generateSceneCaptions,
} from "../services/geminiService";
import { getMonthlyUsage, recordGeneration } from "../services/usageService";
import {
  getHasGeneratedFreeImage,
  setHasGeneratedFreeImage as setHasGeneratedFreeImageInDB,
} from "../services/authService";
import { trackImageGeneration, trackImageRegeneration } from "../lib/analytics";

interface UseImageGenerationProps {
  mode: AppMode;
  userId: string | undefined;
  references: ReferenceImage[];
  manualPrompts: string;
  size: ImageSize;
  planType: string;
  captionRules: CaptionRules;
  guidelines: string[];
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
}

const FREE_CREDIT_CAP = 3;

export const useImageGeneration = ({
  mode,
  userId,
  references,
  manualPrompts,
  size,
  planType,
  captionRules,
  guidelines,
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
  const [manualResults, setManualResults] = useState<SceneResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [captionResults, setCaptionResults] = useState<{
    tiktok: string[];
    instagram: string[];
  }>({ tiktok: [], instagram: [] });

  const updateCaptionDisplay = useCallback(
    (results: { tiktok: string[]; instagram: string[] }) => {
      const format = (items: string[]) =>
        items
          .map((caption, idx) =>
            items.length > 1 ? `Scene ${idx + 1}: ${caption}` : caption
          )
          .join("\n\n");
      setCaptions({
        tiktok: format(results.tiktok),
        instagram: format(results.instagram),
      });
    },
    [setCaptions]
  );

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

  const handleRegenerate = async (index: number) => {
    if (hasGeneratedFreeImage && !isPaymentUnlocked) {
      openPaymentModal();
      return;
    }

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

    // Track regeneration event
    trackImageRegeneration(mode, index);

    const currentList = manualResults;
    const targetResult = currentList[index];

    if (!targetResult) return;

    setManualResults((prev) =>
      prev.map((res, idx) =>
        idx === index ? { ...res, isLoading: true, error: undefined } : res
      )
    );

    let latestUsage: MonthlyUsage | null = usage;
    try {
      latestUsage = await getMonthlyUsage(userId, planType as any);
      setUsage(latestUsage);
      setUsageError(null);
    } catch (error) {
      console.error("Usage check error:", error);
      setManualResults((prev) =>
        prev.map((res, idx) =>
          idx === index
            ? {
                ...res,
                isLoading: false,
                error: "Unable to check credit balance.",
              }
            : res
        )
      );
      return;
    }

    if (
      !isPaymentUnlocked &&
      latestUsage &&
      latestUsage.used >= FREE_CREDIT_CAP
    ) {
      openPaymentModal();
      setManualResults((prev) =>
        prev.map((res, idx) =>
          idx === index
            ? { ...res, isLoading: false, error: "Upgrade to keep generating." }
            : res
        )
      );
      return;
    }

    if (latestUsage && latestUsage.remaining <= 0) {
      setManualResults((prev) =>
        prev.map((res, idx) =>
          idx === index
            ? {
                ...res,
                isLoading: false,
                error: "Monthly credit limit reached.",
              }
            : res
        )
      );
      alert("Monthly credit limit reached. Please upgrade for more.");
      return;
    }

    try {
      const imageUrl = await generateCharacterScene(
        targetResult.prompt,
        references,
        size,
        guidelines
      );
      try {
        const captionResponse = await generateSceneCaptions(
          [targetResult.prompt],
          references,
          captionRules,
          guidelines
        );
        setCaptionResults((prev) => {
          const next = {
            tiktok: [...prev.tiktok],
            instagram: [...prev.instagram],
          };
          next.tiktok[index] = captionResponse.tiktok[0] || "";
          next.instagram[index] = captionResponse.instagram[0] || "";
          updateCaptionDisplay(next);
          return next;
        });
      } catch (captionError) {
        console.error("Caption regeneration error:", captionError);
      }
      const updatedUsage = await recordGeneration(userId, 1, planType as any);
      setUsage(updatedUsage);
      markFirstGenerationComplete();
      setManualResults((prev) =>
        prev.map((res, idx) =>
          idx === index ? { ...res, imageUrl, isLoading: false } : res
        )
      );
    } catch (error: any) {
      console.error("Regeneration error:", error);
      if (error?.message === "MONTHLY_LIMIT_REACHED") {
        await refreshUsage(userId);
        alert("Monthly credit limit reached. Please upgrade for more.");
      }
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
    if (hasGeneratedFreeImage && !isPaymentUnlocked) {
      openPaymentModal();
      return;
    }

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
      alert(
        `You can generate ${latestUsage.remaining} more image${
          latestUsage.remaining === 1 ? "" : "s"
        } this month (credits ${latestUsage.monthlyLimit}).`
      );
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

    const initialManualResults = promptList.map(
      (p) => ({ prompt: p, isLoading: true } as SceneResult)
    );
    setManualResults(initialManualResults);

    const captionPromise = (async () => {
      try {
        const generatedCaptions = await generateSceneCaptions(
          promptList,
          references,
          captionRules,
          guidelines
        );
        setCaptionResults(generatedCaptions);
        updateCaptionDisplay(generatedCaptions);
      } catch (captionError) {
        console.error("Caption generation error:", captionError);
      }
    })();

    for (let i = 0; i < initialManualResults.length; i++) {
      try {
        const imageUrl = await generateCharacterScene(
          promptList[i],
          references,
          size,
          guidelines
        );
        const updatedUsage = await recordGeneration(userId, 1, planType as any);
        setUsage(updatedUsage);
        markFirstGenerationComplete();
        setManualResults((prev) =>
          prev.map((res, idx) =>
            idx === i ? { ...res, imageUrl, isLoading: false } : res
          )
        );
      } catch (error: any) {
        console.error("Manual generation error:", error);
        if (error?.message === "MONTHLY_LIMIT_REACHED") {
          await refreshUsage(userId);
          alert("Monthly credit limit reached. Please upgrade for more.");
          break;
        }
        setManualResults((prev) =>
          prev.map((res, idx) =>
            idx === i ? { ...res, error: error.message, isLoading: false } : res
          )
        );
      }
    }

    await captionPromise;
    setIsGenerating(false);
  };

  return {
    manualResults,
    isGenerating,
    setManualResults,
    startGeneration,
    handleRegenerate,
  };
};
