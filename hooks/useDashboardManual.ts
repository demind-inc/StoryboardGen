import { useCallback, useEffect, useMemo, useState } from "react";
import { SubscriptionPlan } from "../types";
import { useUsage } from "./useUsage";
import { useReferences } from "./useReferences";
import { usePrompts } from "./usePrompts";
import { useImageGeneration } from "./useImageGeneration";
import { useModals } from "./useModals";
import { fetchReferenceLibrary } from "../services/libraryService";
import {
  DEFAULT_MONTHLY_CREDITS,
  PLAN_CREDITS,
} from "../services/usageService";

const PLAN_PRICE_LABEL: Record<SubscriptionPlan, string> = {
  basic: "$15/mo",
  pro: "$29/mo",
  business: "$79/mo",
};

const DEFAULT_GUIDELINES = [
  "Always show product in natural use context",
  "Maintain warm, approachable lighting",
  "Include diverse representation in scenes",
];

const DEFAULT_CAPTIONS = {
  tiktok:
    "Starting my morning right (sun)\n\nThere's something magical about that first sip of @BrandCoffee...\n\n#MorningVibes #CoffeeLovers #DailyRitual #BrandCoffee #CoffeeMoments",
  instagram:
    "There's a reason why your morning routine matters (coffee)\n\nResearch shows that taking just 5 minutes to enjoy your morning coffee mindfully can set a positive tone for your entire day...\n\n#MorningRoutine #CoffeeTime #WellnessJourney #MindfulMornings #CoffeeCulture #SelfCare #DailyRituals",
};

interface UseDashboardManualProps {
  userId: string | undefined;
  authStatus: "checking" | "signed_out" | "signed_in";
}

export const useDashboardManual = ({
  userId,
  authStatus,
}: UseDashboardManualProps) => {
  const usageHook = useUsage(userId, authStatus);
  const {
    usage,
    isUsageLoading,
    usageError,
    hasGeneratedFreeImage,
    isPaymentUnlocked,
    planType,
    setUsage,
    setUsageError,
    setHasGeneratedFreeImage,
    setPlanType,
    refreshUsage,
    refreshSubscription,
    refreshHasGeneratedFreeImage,
  } = usageHook;

  const refreshReferenceLibrary = useCallback(async (currentUserId: string) => {
    await fetchReferenceLibrary(currentUserId);
  }, []);

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
    setManualPrompts,
  } = promptsHook;

  const modalsHook = useModals();
  const {
    isReferenceLibraryOpen,
    isPaymentModalOpen,
    nameModal,
    setIsReferenceLibraryOpen,
    setIsPaymentModalOpen,
    openReferenceNameModal,
    closeNameModal,
    handleNameModalSave,
  } = modalsHook;

  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [rulesTab, setRulesTab] = useState<"tiktok" | "instagram">("tiktok");
  const [captionTab, setCaptionTab] = useState<"tiktok" | "instagram">(
    "tiktok"
  );
  const [guidelines, setGuidelines] = useState(DEFAULT_GUIDELINES);

  const promptList = useMemo(
    () => manualPrompts.split("\n").filter((p) => p.trim() !== ""),
    [manualPrompts]
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

  const openPaymentModal = useCallback(
    () => setIsPaymentModalOpen(true),
    [setIsPaymentModalOpen]
  );

  const imageGenerationHook = useImageGeneration({
    mode: "manual",
    userId,
    references,
    manualPrompts,
    size: "1K",
    planType,
    hasGeneratedFreeImage,
    isPaymentUnlocked,
    usage,
    setUsage,
    setUsageError,
    setHasGeneratedFreeImage,
    openPaymentModal,
    refreshUsage,
  });

  const {
    manualResults,
    isGenerating,
    setManualResults,
    startGeneration,
    handleRegenerate,
  } = imageGenerationHook;

  useEffect(() => {
    if (authStatus === "signed_in" && userId) {
      refreshUsage(userId);
      refreshSubscription(userId);
      refreshHasGeneratedFreeImage(userId);
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

  const disableGenerate =
    isGenerating ||
    references.length === 0 ||
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
    const nextIndex = promptList.length + 1;
    const nextPrompt = `Scene ${nextIndex} prompt`;
    setManualPrompts((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n${nextPrompt}` : nextPrompt;
    });
    setActiveSceneIndex(promptList.length);
  }, [promptList.length, setManualPrompts]);

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
    editingPromptIndex,
    handleSavePrompt,
    addScene,
    activeSceneIndex,
    setActiveSceneIndex,
    rulesTab,
    setRulesTab,
    captionTab,
    setCaptionTab,
    guidelines,
    setGuidelines,
    manualResults,
    isGenerating,
    setManualResults,
    startGeneration,
    handleRegenerate,
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
    defaultCaptions: DEFAULT_CAPTIONS,
    planPriceLabel: PLAN_PRICE_LABEL,
  };
};

export type DashboardManualState = ReturnType<typeof useDashboardManual>;
