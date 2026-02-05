import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SubscriptionPlan } from "../types";
import {
  getMonthlyUsage,
  recordGeneration,
  resetMonthlyUsageForNewPlan,
} from "../services/usageService";
import { queryKeys } from "../lib/queryKeys";
import { normalizeUuid } from "../lib/uuid";

export function useMonthlyUsage(
  userId: string | undefined,
  planType?: SubscriptionPlan | null
) {
  const normalizedUserId = normalizeUuid(userId);
  return useQuery({
    queryKey: queryKeys.usage(normalizedUserId, planType ?? undefined),
    queryFn: () => getMonthlyUsage(normalizedUserId!, planType),
    enabled: !!normalizedUserId,
  });
}

export function useRecordGeneration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      userId: string;
      amount?: number;
      planType?: SubscriptionPlan | null;
    }) =>
      recordGeneration(
        params.userId,
        params.amount ?? 1,
        params.planType
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.usage(variables.userId, variables.planType),
      });
    },
  });
}

export function useResetMonthlyUsageForNewPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      userId: string;
      planType: SubscriptionPlan;
    }) => resetMonthlyUsageForNewPlan(params.userId, params.planType),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.usage(variables.userId),
      });
    },
  });
}
