import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MonthlyUsage, SubscriptionPlan } from "../types";
import {
  getHasGeneratedFreeImage,
} from "../services/authService";
import { useSubscriptionQuery } from "./useSubscriptionService";
import { useMonthlyUsage } from "./useUsageService";
import { queryKeys } from "../lib/queryKeys";
import type { Subscription } from "../services/subscriptionService";

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
  subscription: Subscription | null;
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
  const queryClient = useQueryClient();
  const subscriptionQuery = useSubscriptionQuery(userId);
  const [localPlanType, setLocalPlanType] = useState<SubscriptionPlan>("basic");
  const subscription = subscriptionQuery.data ?? null;
  const planLockedFromSubscription = !!subscription?.planType;
  const planType = subscription?.planType ?? localPlanType;
  const usageQuery = useMonthlyUsage(userId, planType);

  const [usageError, setUsageError] = useState<string | null>(null);
  const [hasGeneratedFreeImage, setHasGeneratedFreeImage] =
    useState<boolean>(false);
  const [isFreeImageLoading, setIsFreeImageLoading] = useState(false);

  const usage = usageQuery.data ?? null;
  const isUsageLoading = usageQuery.isLoading || usageQuery.isFetching;
  const isSubscriptionLoading = subscriptionQuery.isLoading || subscriptionQuery.isFetching;
  const isPaymentUnlocked = subscription?.isActive ?? false;
  const stripeSubscriptionId = subscription?.stripeSubscriptionId;

  const refreshUsage = useCallback(
    async (uid: string) => {
      try {
        await usageQuery.refetch();
        setUsageError(null);
      } catch (error) {
        console.error("Usage fetch error:", error);
        setUsageError("Unable to load credits.");
      }
    },
    [usageQuery.refetch]
  );

  const refreshSubscription = useCallback(async () => {
    await subscriptionQuery.refetch();
  }, [subscriptionQuery.refetch]);

  const refreshHasGeneratedFreeImage = useCallback(async (uid: string) => {
    setIsFreeImageLoading(true);
    try {
      const hasGenerated = await getHasGeneratedFreeImage(uid);
      setHasGeneratedFreeImage(hasGenerated);
    } catch (error) {
      console.error("Failed to fetch has_generated_free_image:", error);
      setHasGeneratedFreeImage(false);
    } finally {
      setIsFreeImageLoading(false);
    }
  }, []);

  const setUsage = useCallback(
    (action: React.SetStateAction<MonthlyUsage | null>) => {
      const key = queryKeys.usage(userId, planType);
      if (typeof action === "function") {
        queryClient.setQueryData<MonthlyUsage>(key, (prev) => {
          const next = action(prev ?? null);
          return next ?? undefined;
        });
      } else {
        queryClient.setQueryData(key, action ?? undefined);
      }
    },
    [queryClient, userId, planType]
  );

  const setPlanType = useCallback((action: React.SetStateAction<SubscriptionPlan>) => {
    setLocalPlanType((prev) =>
      typeof action === "function" ? action(prev) : action
    );
  }, []);

  // Load plan type from URL or localStorage when not locked from subscription
  useEffect(() => {
    if (planLockedFromSubscription) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const urlPlan = params.get("plan");
    const storedPlan = window.localStorage.getItem(
      "preferred_plan"
    ) as SubscriptionPlan | null;

    if (urlPlan && ["basic", "pro", "business"].includes(urlPlan)) {
      setLocalPlanType(urlPlan as SubscriptionPlan);
    } else if (
      storedPlan &&
      ["basic", "pro", "business"].includes(storedPlan)
    ) {
      setLocalPlanType(storedPlan as SubscriptionPlan);
    }
  }, [authStatus, planLockedFromSubscription]);

  // Sync local plan from subscription when it loads
  useEffect(() => {
    if (subscription?.planType) {
      setLocalPlanType(subscription.planType);
    }
  }, [subscription?.planType]);

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
    refreshUsage: (uid: string) => refreshUsage(uid),
    refreshSubscription: (uid: string) => refreshSubscription(),
    refreshHasGeneratedFreeImage,
    isPaymentModalOpen: false,
    setIsPaymentModalOpen: () => {},
    openPaymentModal: () => {},
  };
};
