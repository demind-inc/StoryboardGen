import { useCallback, useEffect, useMemo, useState } from "react";
import { SubscriptionPlan } from "../types";
import { useSubscription } from "../providers/SubscriptionProvider";
import { useReferences } from "./useReferences";
import { usePrompts } from "./usePrompts";
import { useImageGeneration } from "./useImageGeneration";
import { useModals } from "./useModals";
import {
  DEFAULT_MONTHLY_CREDITS,
  PLAN_CREDITS,
} from "../services/usageService";
import {
  DEFAULT_CAPTION_RULES,
  DEFAULT_CAPTIONS,
  DEFAULT_CUSTOM_GUIDELINES,
  DEFAULT_HASHTAGS,
} from "../services/captionSettingsService";
import { useReferenceLibrary } from "./useLibraryService";
import { useCaptionSettings } from "./useCaptionSettingsService";
import type { CaptionRules, CustomGuidelines, Hashtags } from "../types";
import { generateSceneSuggestions } from "../services/geminiService";
import { 
  Scene, 
  generateSceneId, 
  scenesToPrompts, 
  promptsToScenes,
  sceneToPrompt 
} from "../types/scene";

const PLAN_PRICE_LABEL: Record<SubscriptionPlan, string> = {
  basic: "$15/mo",
  pro: "$29/mo",
  business: "$79/mo",
};

function getDefaultProjectName(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
}

interface UseDashboardManualProps {
  userId: string | undefined;
  authStatus: "checking" | "signed_out" | "signed_in";
}

export const useDashboardManual = ({
  userId,
  authStatus,
}: UseDashboardManualProps) => {
  const usageHook = useSubscription();
  const {
    usage,
    isUsageLoading,
    usageError,
    hasGeneratedFreeImage,
    isPaymentUnlocked,
    isPaymentModalOpen,
    planType,
    setUsage,
    setUsageError,
    setHasGeneratedFreeImage,
    setIsPaymentModalOpen,
    setPlanType,
    refreshUsage,
    refreshSubscription,
    refreshHasGeneratedFreeImage,
  } = usageHook;

  const referenceLibraryQuery = useReferenceLibrary(userId);
  const refreshReferenceLibrary = useCallback(
    async (currentUserId: string) => {
      if (currentUserId === userId) {
        await referenceLibraryQuery.refetch();
      }
    },
    [userId, referenceLibraryQuery]
  );

  const referencesHook = useReferences(userId, refreshReferenceLibrary);
  const {
    references,
    fileInputRef,
    isSavingReferences,
    triggerUpload,
    handleFileUpload,
    removeReference,
    handleSaveReferences,
    handleAddReferencesFromLibrary,
  } = referencesHook;

  const promptsHook = usePrompts(userId, () => {});
  const {
    manualPrompts,
    editingPromptIndex,
    handleSavePrompt,
    handleRemovePrompt,
    setManualPrompts,
  } = promptsHook;

  const modalsHook = useModals();
  const {
    isReferenceLibraryOpen,
    nameModal,
    setIsReferenceLibraryOpen,
    openReferenceNameModal,
    closeNameModal,
    handleNameModalSave,
  } = modalsHook;

  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [rulesTab, setRulesTab] = useState<"tiktok" | "instagram">("tiktok");
  const [captionTab, setCaptionTab] = useState<"tiktok" | "instagram">(
    "tiktok"
  );
  const [projectName, setProjectName] = useState(getDefaultProjectName);
  const [topic, setTopic] = useState("");
  const [isTopicGenerating, setIsTopicGenerating] = useState(false);
  const [topicError, setTopicError] = useState<string | null>(null);
  const [transparentBackground, setTransparentBackground] = useState(true);
  const [guidelines, setGuidelines] =
    useState<CustomGuidelines>(DEFAULT_CUSTOM_GUIDELINES);
  const [rules, setRules] = useState<CaptionRules>(DEFAULT_CAPTION_RULES);
  const [hashtags, setHashtags] = useState<Hashtags>(DEFAULT_HASHTAGS);
  const [selectedHashtags, setSelectedHashtags] = useState<Hashtags>([]);
  const [captions, setCaptions] = useState(DEFAULT_CAPTIONS);

  const captionSettingsQuery = useCaptionSettings(userId);
  useEffect(() => {
    if (captionSettingsQuery.data) {
      setRules(captionSettingsQuery.data.rules);
      setGuidelines(captionSettingsQuery.data.guidelines);
      setHashtags(captionSettingsQuery.data.hashtags);
    }
  }, [captionSettingsQuery.data]);
  useEffect(() => {
    if (captionSettingsQuery.isError) {
      setRules(DEFAULT_CAPTION_RULES);
      setCaptions(DEFAULT_CAPTIONS);
      setGuidelines(DEFAULT_CUSTOM_GUIDELINES);
      setHashtags(DEFAULT_HASHTAGS);
    }
  }, [captionSettingsQuery.isError]);

  useEffect(() => {
    setSelectedHashtags((prev) =>
      prev.filter((tag) => hashtags.includes(tag))
    );
  }, [hashtags]);

  const scenes = useMemo(
    () => promptsToScenes(manualPrompts) || [],
    [manualPrompts]
  );

  const promptList = useMemo(
    () => scenes.map(sceneToPrompt),
    [scenes]
  );

  /** At least one tab (Scene 1) for the Scene Prompts UI. */
  const displayPromptList = useMemo(
    () => (promptList.length > 0 ? promptList : [""]),
    [promptList]
  );

  useEffect(() => {
    if (activeSceneIndex >= displayPromptList.length) {
      setActiveSceneIndex(Math.max(displayPromptList.length - 1, 0));
    }
  }, [activeSceneIndex, displayPromptList.length]);

  const effectiveHashtags =
    selectedHashtags.length > 0 ? selectedHashtags : hashtags;

  const imageGenerationHook = useImageGeneration({
    mode: "manual",
    userId,
    references,
    manualPrompts,
    projectName,
    size: "1K",
    planType,
    captionRules: rules,
    guidelines,
    hashtags: effectiveHashtags,
    transparentBackground,
    hasGeneratedFreeImage,
    isPaymentUnlocked,
    usage,
    setUsage,
    setUsageError,
    setHasGeneratedFreeImage,
    setCaptions,
    openPaymentModal: usageHook.openPaymentModal,
    refreshUsage,
  });

  const {
    manualResults,
    isGenerating,
    setManualResults,
    startGeneration,
    handleRegenerate,
    projectId,
  } = imageGenerationHook;

  useEffect(() => {
    if (authStatus === "signed_in" && userId) {
      void Promise.all([
        refreshUsage(userId),
        refreshSubscription(userId),
        refreshHasGeneratedFreeImage(userId),
      ]);
    }
    // Only re-run when auth or user identity changes; refresh fns are stable via useCallback in useUsage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, userId]);

  const usedCredits = usage?.used ?? 0;
  const freeCreditsRemaining = Math.max(3 - usedCredits, 0);
  const planCreditLimit = PLAN_CREDITS[planType] ?? DEFAULT_MONTHLY_CREDITS;
  const displayUsageLimit = isPaymentUnlocked
    ? usage?.monthlyLimit ?? planCreditLimit
    : undefined;
  const displayUsageRemaining = isPaymentUnlocked
    ? usage?.remaining ?? planCreditLimit
    : undefined;

  const hasValidScenePrompts =
    scenes.some(scene => scene.title.trim() || scene.description.trim());
  const disableGenerate =
    isGenerating ||
    references.length === 0 ||
    !hasValidScenePrompts ||
    (!!usage && usage.remaining <= 0) ||
    !!usageError;

  const stripePlanLinks = useMemo(() => {
    const baseLinks = {
      basic: process.env.STRIPE_LINK_BASIC || "",
      pro: process.env.STRIPE_LINK_PRO || "",
      business: process.env.STRIPE_LINK_BUSINESS || "",
    };
    if (!userId) return baseLinks;
    const links: Partial<Record<SubscriptionPlan, string>> = {};
    for (const [plan, baseUrl] of Object.entries(baseLinks)) {
      if (baseUrl) {
        try {
          const url = new URL(baseUrl);
          url.searchParams.set("client_reference_id", userId);
          links[plan as SubscriptionPlan] = url.toString();
        } catch {
          links[plan as SubscriptionPlan] = baseUrl;
        }
      }
    }
    return links;
  }, [userId]);

  const addScene = useCallback(() => {
    const newScene: Scene = {
      id: generateSceneId(),
      title: "",
      description: "",
    };
    
    setManualPrompts((prev) => {
      const currentScenes = promptsToScenes(prev);
      const updatedScenes = [...currentScenes, newScene];
      return scenesToPrompts(updatedScenes);
    });
    
    setActiveSceneIndex(scenes.length);
  }, [scenes.length, setManualPrompts]);

  const removeScene = useCallback(
    (index: number) => {
      setManualPrompts((prev) => {
        const currentScenes = promptsToScenes(prev);
        const updatedScenes = currentScenes.filter((_, idx) => idx !== index);
        return scenesToPrompts(updatedScenes);
      });
      
      setActiveSceneIndex((prev) => {
        if (prev === index) return Math.max(0, index - 1);
        if (prev > index) return prev - 1;
        return prev;
      });
    },
    [setManualPrompts]
  );

  const saveScene = useCallback(
    (index: number, title: string, description: string) => {
      setManualPrompts((prev) => {
        const currentScenes = promptsToScenes(prev);
        if (index >= 0 && index < currentScenes.length) {
          currentScenes[index] = {
            ...currentScenes[index],
            title,
            description,
          };
        }
        return scenesToPrompts(currentScenes);
      });
    },
    [setManualPrompts]
  );

  const handleTopicChange = useCallback((value: string) => {
    setTopic(value);
    setTopicError(null);
  }, []);

  const generateTopicScenes = useCallback(async () => {
    const trimmed = topic.trim();
    if (!trimmed || isTopicGenerating) return;

    setIsTopicGenerating(true);
    setTopicError(null);

    try {
      const suggestions = await generateSceneSuggestions(trimmed, 4);
      if (!suggestions.length) {
        throw new Error("No suggestions returned");
      }
      
      // Convert suggestions to Scene objects with IDs
      const newScenes: Scene[] = suggestions.map(({ title, description }) => ({
        id: generateSceneId(),
        title,
        description,
      }));
      
      // Convert scenes to prompt string format
      setManualPrompts(scenesToPrompts(newScenes));
      setActiveSceneIndex(0);
    } catch (error) {
      console.error("Failed to generate scene suggestions:", error);
      setTopicError("Couldn't generate scenes. Please try again.");
    } finally {
      setIsTopicGenerating(false);
    }
  }, [topic, isTopicGenerating, setActiveSceneIndex, setManualPrompts]);

  return {
    usage,
    isUsageLoading,
    usageError,
    hasGeneratedFreeImage,
    isPaymentUnlocked,
    planType,
    setPlanType,
    displayUsageLimit,
    displayUsageRemaining,
    freeCreditsRemaining,
    references,
    fileInputRef,
    isSavingReferences,
    triggerUpload,
    handleFileUpload,
    removeReference,
    handleSaveReferences,
    handleAddReferencesFromLibrary,
    manualPrompts,
    promptList,
    displayPromptList,
    scenes,
    editingPromptIndex,
    handleSavePrompt,
    addScene,
    removeScene,
    saveScene,
    activeSceneIndex,
    setActiveSceneIndex,
    rulesTab,
    setRulesTab,
    captionTab,
    setCaptionTab,
    projectName,
    setProjectName,
    topic,
    setTopic: handleTopicChange,
    generateTopicScenes,
    isTopicGenerating,
    topicError,
    transparentBackground,
    setTransparentBackground,
    guidelines,
    setGuidelines,
    rules,
    hashtags,
    setHashtags,
    selectedHashtags,
    setSelectedHashtags,
    captions,
    manualResults,
    isGenerating,
    setManualResults,
    startGeneration,
    handleRegenerate,
    projectId,
    disableGenerate,
    isReferenceLibraryOpen,
    setIsReferenceLibraryOpen,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    nameModal,
    openReferenceNameModal,
    closeNameModal,
    handleNameModalSave,
    stripePlanLinks,
    planPriceLabel: PLAN_PRICE_LABEL,
  };
};

export type DashboardManualState = ReturnType<typeof useDashboardManual>;
