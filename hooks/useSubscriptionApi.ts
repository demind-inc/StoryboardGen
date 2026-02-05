import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { SubscriptionPlan } from "../types";
import {
  createCheckoutSession,
  syncSubscription,
  cancelSubscription,
  type CheckoutResponse,
  type SyncSubscriptionResponse,
  type CancelSubscriptionResponse,
} from "../api/subscription";
import { queryKeys } from "../lib/queryKeys";

export function useCreateCheckoutSession(
  options?: UseMutationOptions<
    CheckoutResponse,
    Error,
    { userId: string; plan: SubscriptionPlan }
  >
) {
  return useMutation({
    mutationFn: ({ userId, plan }) => createCheckoutSession(userId, plan),
    ...options,
  });
}

export function useSyncSubscription(
  options?: UseMutationOptions<
    SyncSubscriptionResponse,
    Error,
    { sessionId: string; userId: string }
  >
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, userId }) => syncSubscription(sessionId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription.all });
    },
    ...options,
  });
}

export function useCancelSubscription(
  options?: UseMutationOptions<CancelSubscriptionResponse, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => cancelSubscription(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription.all });
    },
    ...options,
  });
}
