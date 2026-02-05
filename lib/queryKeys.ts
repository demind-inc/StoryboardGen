export const queryKeys = {
  projects: {
    all: ["projects"] as const,
    list: (userId: string | undefined) =>
      [...queryKeys.projects.all, userId] as const,
    detail: (userId: string | undefined, projectId: string | undefined) =>
      [...queryKeys.projects.all, userId, projectId] as const,
  },
  referenceLibrary: (userId: string | undefined) =>
    ["referenceLibrary", userId] as const,
  promptLibrary: (userId: string | undefined) =>
    ["promptLibrary", userId] as const,
  usage: (userId: string | undefined, planType?: string | null) =>
    ["usage", userId, planType ?? "basic"] as const,
  captionSettings: (userId: string | undefined) =>
    ["captionSettings", userId] as const,
  subscription: {
    all: ["subscription"] as const,
    byUser: (userId: string | undefined) =>
      ["subscription", userId] as const,
  },
};
