import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReferenceImage } from "../types";
import {
  fetchReferenceLibrary,
  fetchPromptLibrary,
  saveReferenceImages,
  savePromptPreset,
  updatePromptPreset,
  updateReferenceSetLabel,
  addImagesToReferenceSet,
  deleteReferenceSet,
  deletePromptPreset,
} from "../services/libraryService";
import { queryKeys } from "../lib/queryKeys";

export function useReferenceLibrary(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.referenceLibrary(userId),
    queryFn: () => fetchReferenceLibrary(userId!),
    enabled: !!userId,
  });
}

export function usePromptLibrary(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.promptLibrary(userId),
    queryFn: () => fetchPromptLibrary(userId!),
    enabled: !!userId,
  });
}

export function useSaveReferenceImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      userId: string;
      references: ReferenceImage[];
      label?: string;
    }) => saveReferenceImages(params.userId, params.references, params.label),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.referenceLibrary(variables.userId),
      });
    },
  });
}

export function useSavePromptPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      userId: string;
      promptText: string;
      title?: string;
    }) => savePromptPreset(params.userId, params.promptText, params.title),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.promptLibrary(variables.userId),
      });
    },
  });
}

export function useUpdatePromptPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      userId: string;
      presetId: string;
      title: string;
      content: string;
    }) =>
      updatePromptPreset(
        params.userId,
        params.presetId,
        params.title,
        params.content
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.promptLibrary(variables.userId),
      });
    },
  });
}

export function useUpdateReferenceSetLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      userId: string;
      setId: string;
      label: string;
    }) =>
      updateReferenceSetLabel(params.userId, params.setId, params.label),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.referenceLibrary(variables.userId),
      });
    },
  });
}

export function useAddImagesToReferenceSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      userId: string;
      setId: string;
      references: ReferenceImage[];
    }) =>
      addImagesToReferenceSet(params.userId, params.setId, params.references),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.referenceLibrary(variables.userId),
      });
    },
  });
}

export function useDeleteReferenceSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string; setId: string }) =>
      deleteReferenceSet(params.userId, params.setId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.referenceLibrary(variables.userId),
      });
    },
  });
}

export function useDeletePromptPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string; presetId: string }) =>
      deletePromptPreset(params.userId, params.presetId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.promptLibrary(variables.userId),
      });
    },
  });
}
