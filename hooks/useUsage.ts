import { useState, useEffect, useCallback } from "react";
import { MonthlyUsage, SubscriptionPlan } from "../types";
import { getMonthlyUsage } from "../services/usageService";
import { getSubscription } from "../services/subscriptionService";
import {
  getHasGeneratedFreeImage,
  setHasGeneratedFreeImage as setHasGeneratedFreeImageInDB,
} from "../services/authService";
export interface UseUsageReturn {
  usage: MonthlyUsage | null;
  isUsageLoading: boolean;
  usageError: string | null;
  hasGeneratedFreeImage: boolean;
  isFreeImageLoading: boolean;
  isPaymentUnlocked: boolean;
  isPaymentModalOpen: boolean;
  planType: SubscriptionPlan;
  planLockedFromSubscription: boolean;
  stripeSubscriptionId: string | null | undefined;
  isSubscriptionLoading: boolean;
  subscription: Awaited<ReturnType<typeof getSubscription>>;
  setUsage: React.Dispatch<React.SetStateAction<MonthlyUsage | null>>;
  setUsageError: React.Dispatch<React.SetStateAction<string | null>>;
  setHasGeneratedFreeImage: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPaymentModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPlanType: React.Dispatch<React.SetStateAction<SubscriptionPlan>>;
  refreshUsage: (userId: string) => Promise<void>;
  refreshSubscription: (userId: string) => Promise<void>;
  refreshHasGeneratedFreeImage: (userId: string) => Promise<void>;
  openPaymentModal: () => void;
}

export const useUsage = (
  userId: string | undefined,
  authStatus: string
): UseUsageReturn => {
  const [usage, setUsage] = useState<MonthlyUsage | null>(null);
  const [isUsageLoading, setIsUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [hasGeneratedFreeImage, setHasGeneratedFreeImage] =
    useState<boolean>(false);
  const [isFreeImageLoading, setIsFreeImageLoading] = useState(false);
  const [isPaymentUnlocked, setIsPaymentUnlocked] = useState<boolean>(false);
  const [planType, setPlanType] = useState<SubscriptionPlan>("basic");
  const [planLockedFromSubscription, setPlanLockedFromSubscription] =
    useState(false);
  const [stripeSubscriptionId, setStripeSubscriptionId] = useState<
    string | null | undefined
  >(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
  const [subscription, setSubscription] =
    useState<Awaited<ReturnType<typeof getSubscription>>>(null);

  const refreshUsage = useCallback(
    async (userId: string) => {
      setIsUsageLoading(true);
      try {
        const stats = await getMonthlyUsage(userId, planType);
        setUsage(stats);
        setUsageError(null);
      } catch (error) {
        console.error("Usage fetch error:", error);
        setUsageError("Unable to load credits.");
      } finally {
        setIsUsageLoading(false);
      }
    },
    [planType]
  );

  const refreshSubscription = useCallback(async (userId: string) => {
    setIsSubscriptionLoading(true);
    try {
      const subscription = await getSubscription(userId);
      setSubscription(subscription);
      // User has access if subscription is active OR unsubscribed (until period ends)
      const hasAccess = subscription?.isActive ?? false;
      setIsPaymentUnlocked(hasAccess);
      // Keep plan type if subscription exists (even if unsubscribed, they still have access)
      if (subscription?.planType) {
        setPlanType(subscription.planType);
        setPlanLockedFromSubscription(true);
      } else {
        setPlanLockedFromSubscription(false);
      }
      setStripeSubscriptionId(subscription?.stripeSubscriptionId);
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
      setSubscription(null);
      setIsPaymentUnlocked(false);
      setPlanLockedFromSubscription(false);
      setStripeSubscriptionId(null);
    } finally {
      setIsSubscriptionLoading(false);
    }
  }, []);

  const refreshHasGeneratedFreeImage = useCallback(async (userId: string) => {
    setIsFreeImageLoading(true);
    try {
      const hasGenerated = await getHasGeneratedFreeImage(userId);
      setHasGeneratedFreeImage(hasGenerated);
    } catch (error) {
      console.error("Failed to fetch has_generated_free_image:", error);
      setHasGeneratedFreeImage(false);
    } finally {
      setIsFreeImageLoading(false);
    }
  }, []);

  // Load plan type from URL or localStorage
  useEffect(() => {
    if (planLockedFromSubscription) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const urlPlan = params.get("plan");
    const storedPlan = window.localStorage.getItem(
      "preferred_plan"
    ) as SubscriptionPlan | null;

    if (urlPlan && ["basic", "pro", "business"].includes(urlPlan)) {
      setPlanType(urlPlan as SubscriptionPlan);
    } else if (
      storedPlan &&
      ["basic", "pro", "business"].includes(storedPlan)
    ) {
      setPlanType(storedPlan as SubscriptionPlan);
    }
  }, [authStatus, planLockedFromSubscription]);

  // Save plan type to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("preferred_plan", planType);
  }, [planType]);

  return {
    usage,
    isUsageLoading,
    usageError,
    hasGeneratedFreeImage,
    isFreeImageLoading,
    isPaymentUnlocked,
    planType,
    planLockedFromSubscription,
    stripeSubscriptionId,
    isSubscriptionLoading,
    subscription,
    setUsage,
    setUsageError,
    setHasGeneratedFreeImage,
    setPlanType,
    refreshUsage,
    refreshSubscription,
    refreshHasGeneratedFreeImage,
    // Payment modal state and openPaymentModal are provided by SubscriptionProvider
    isPaymentModalOpen: false,
    setIsPaymentModalOpen: () => {},
    openPaymentModal: () => {},
  };
};
