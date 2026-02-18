import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type GenerationQueueStatus = "running" | "succeeded" | "failed";

export interface GenerationQueueItem {
  id: string;
  projectName: string;
  createdAt: number;
  totalScenes: number;
  completedScenes: number;
  status: GenerationQueueStatus;
  error?: string;
  projectId?: string | null;
}

interface GenerationQueueContextValue {
  items: GenerationQueueItem[];
  enqueue: (payload: { projectName: string; totalScenes: number }) => string;
  updateProgress: (id: string, completedScenes: number) => void;
  resolveItem: (id: string, payload: { status: "succeeded" | "failed"; projectId?: string | null; error?: string }) => void;
  removeItem: (id: string) => void;
}

const GenerationQueueContext = createContext<GenerationQueueContextValue | undefined>(undefined);

function buildId() {
  return `generation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const GenerationQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<GenerationQueueItem[]>([]);

  const enqueue = useCallback((payload: { projectName: string; totalScenes: number }) => {
    const id = buildId();
    setItems((prev) => [
      {
        id,
        projectName: payload.projectName,
        createdAt: Date.now(),
        totalScenes: payload.totalScenes,
        completedScenes: 0,
        status: "running",
      },
      ...prev,
    ]);
    return id;
  }, []);

  const updateProgress = useCallback((id: string, completedScenes: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              completedScenes: Math.min(item.totalScenes, Math.max(0, completedScenes)),
            }
          : item
      )
    );
  }, []);

  const resolveItem = useCallback(
    (id: string, payload: { status: "succeeded" | "failed"; projectId?: string | null; error?: string }) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: payload.status,
                completedScenes: item.totalScenes,
                projectId: payload.projectId,
                error: payload.error,
              }
            : item
        )
      );
    },
    []
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(
    () => ({ items, enqueue, updateProgress, resolveItem, removeItem }),
    [items, enqueue, updateProgress, resolveItem, removeItem]
  );

  return (
    <GenerationQueueContext.Provider value={value}>
      {children}
    </GenerationQueueContext.Provider>
  );
};

export const useGenerationQueue = () => {
  const context = useContext(GenerationQueueContext);
  if (!context) {
    throw new Error("useGenerationQueue must be used within GenerationQueueProvider");
  }
  return context;
};
