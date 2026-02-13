export interface Scene {
  id: string;
  title: string;
  description: string;
  scenePrompt: string;
}

/** Unit separator used to store title, description, and scenePrompt in one line (no collision with normal text). */
const SCENE_FIELD_SEP = "\u001f";

export function generateSceneId(): string {
  return `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Serializes a scene to a single line for storage. Preserves description and scenePrompt separately.
 */
export function sceneToPrompt(scene: Scene): string {
  const title = scene.title ?? "";
  const description = scene.description ?? "";
  const scenePrompt = scene.scenePrompt ?? "";
  return [title, description, scenePrompt].join(SCENE_FIELD_SEP);
}

/**
 * Returns the string to send to the image generation API (title + scenePrompt only).
 */
export function sceneToImagePrompt(scene: Scene): string {
  const promptBody = scene.scenePrompt || scene.description;
  if (scene.title && promptBody) {
    return `${scene.title}: ${promptBody}`;
  }
  return scene.title || promptBody || " ";
}

export function scenesToPrompts(scenes: Scene[]): string {
  return scenes.map(sceneToPrompt).join("\n");
}

export function promptToScene(prompt: string, id?: string): Scene {
  const sceneId = id || generateSceneId();

  if (!prompt || !prompt.trim()) {
    return { id: sceneId, title: "", description: "", scenePrompt: "" };
  }

  // New format: title \u001f description \u001f scenePrompt
  if (prompt.includes(SCENE_FIELD_SEP)) {
    const parts = prompt.split(SCENE_FIELD_SEP);
    return {
      id: sceneId,
      title: (parts[0] ?? "").trim(),
      description: (parts[1] ?? "").trim(),
      scenePrompt: (parts[2] ?? "").trim(),
    };
  }

  // Legacy format: "Title: body" — both description and scenePrompt get the body
  const separatorIndex = prompt.indexOf(": ");
  if (separatorIndex > 0) {
    const body = prompt.substring(separatorIndex + 2).trim();
    return {
      id: sceneId,
      title: prompt.substring(0, separatorIndex).trim(),
      description: body,
      scenePrompt: body,
    };
  }

  return {
    id: sceneId,
    title: "",
    description: prompt.trim(),
    scenePrompt: prompt.trim(),
  };
}

export function promptsToScenes(prompts: string): Scene[] {
  if (!prompts) {
    return [];
  }
  
  // Split by newlines and convert each to a scene
  // Use index-based stable IDs (will stay consistent as long as order doesn't change)
  return prompts.split("\n").map((prompt, index) => {
    const id = `scene_${index}`;
    return promptToScene(prompt, id);
  });
}
