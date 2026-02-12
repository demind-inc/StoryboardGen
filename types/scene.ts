export interface Scene {
  id: string;
  title: string;
  description: string;
}

export function generateSceneId(): string {
  return `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function sceneToPrompt(scene: Scene): string {
  if (scene.title && scene.description) {
    return `${scene.title}: ${scene.description}`;
  }
  return scene.title || scene.description || "";
}

export function scenesToPrompts(scenes: Scene[]): string {
  return scenes.map(sceneToPrompt).join("\n");
}

export function promptToScene(prompt: string, id?: string): Scene {
  const sceneId = id || generateSceneId();
  
  if (!prompt || !prompt.trim()) {
    return { id: sceneId, title: "", description: "" };
  }

  // Check if prompt has the format "Title: Description"
  const separatorIndex = prompt.indexOf(": ");
  if (separatorIndex > 0) {
    return {
      id: sceneId,
      title: prompt.substring(0, separatorIndex).trim(),
      description: prompt.substring(separatorIndex + 2).trim(),
    };
  }

  // If no separator, treat entire prompt as description
  return { id: sceneId, title: "", description: prompt.trim() };
}

export function promptsToScenes(prompts: string): Scene[] {
  if (!prompts || !prompts.trim()) {
    return [];
  }
  
  return prompts.split("\n").map(prompt => promptToScene(prompt));
}
