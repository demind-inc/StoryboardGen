import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SceneResult } from "../types";
import {
  fetchProjectList,
  fetchProjectDetail,
  saveProjectWithOutputs,
  saveProjectOutput,
} from "../services/projectService";
import { queryKeys } from "../lib/queryKeys";

export function useProjectList(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.list(userId),
    queryFn: () => fetchProjectList(userId!),
    enabled: !!userId,
  });
}

export function useProjectDetail(
  userId: string | undefined,
  projectId: string | undefined
) {
  return useQuery({
    queryKey: queryKeys.projects.detail(userId, projectId),
    queryFn: () => fetchProjectDetail({ userId: userId!, projectId: projectId! }),
    enabled: !!userId && !!projectId,
  });
}

export function useSaveProjectWithOutputs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      userId: string;
      projectId?: string | null;
      projectName: string;
      prompts: string[];
      captions: { tiktok: string[]; instagram: string[] };
      results: SceneResult[];
    }) => saveProjectWithOutputs(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.list(variables.userId),
      });
    },
  });
}

export function useSaveProjectOutput() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      userId: string;
      projectId: string;
      sceneIndex: number;
      prompt: string;
      imageUrl: string;
    }) => saveProjectOutput(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.list(variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(variables.userId, variables.projectId),
      });
    },
  });
}
