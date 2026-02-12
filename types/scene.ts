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
  // Return a space for empty scenes to preserve them in the conversion cycle
  return scene.title || scene.description || " ";
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
