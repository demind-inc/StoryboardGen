import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Hashtags, RuleGroup } from "../types";
import type { CaptionRules } from "../types";
import {
  getCaptionSettings,
  updateCaptionRules,
  updateCaptionRulesForPlatform,
  updateCustomGuidelines,
  updateHashtags,
} from "../services/captionSettingsService";
import { queryKeys } from "../lib/queryKeys";

export function useCaptionSettings(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.captionSettings(userId),
    queryFn: () => getCaptionSettings(userId!),
    enabled: !!userId,
  });
}

export function useUpdateCaptionRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string; rules: CaptionRules }) =>
      updateCaptionRules(params.userId, params.rules),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.captionSettings(variables.userId),
      });
    },
  });
}

export function useUpdateCaptionRulesForPlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      userId: string;
      platform: "tiktok" | "instagram";
      rules: RuleGroup[];
    }) =>
      updateCaptionRulesForPlatform(
        params.userId,
        params.platform,
        params.rules
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.captionSettings(variables.userId),
      });
    },
  });
}

export function useUpdateCustomGuidelines() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string; guidelines: RuleGroup[] }) =>
      updateCustomGuidelines(params.userId, params.guidelines),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.captionSettings(variables.userId),
      });
    },
  });
}

export function useUpdateHashtags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string; hashtags: Hashtags }) =>
      updateHashtags(params.userId, params.hashtags),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.captionSettings(variables.userId),
      });
    },
  });
}
