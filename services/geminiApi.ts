import type {
  CaptionRules,
  CustomGuidelines,
  Hashtags,
  ImageSize,
  ReferenceImage,
} from "../types";
import { getSupabaseClient } from "./supabaseClient";

async function postGenerate<T>(path: string, body: unknown): Promise<T> {
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Unable to verify your account. Please sign in again.");
  }

  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as
    | ({ error?: string } & T)
    | null;

  if (!response.ok) {
    throw new Error(payload?.error || "Request failed");
  }

  if (!payload) {
    throw new Error("Request failed");
  }

  return payload;
}

export async function generateCharacterScene(
  prompt: string,
  references: ReferenceImage[],
  size: ImageSize,
  guidelines: CustomGuidelines = [],
  options: { transparentBackground?: boolean } = {}
): Promise<string> {
  const { imageUrl } = await postGenerate<{ imageUrl: string }>(
    "/api/generate/scene",
    { prompt, references, size, guidelines, options }
  );
  return imageUrl;
}

export async function generateSceneSuggestions(
  topic: string,
  count = 4,
  customGuideline?: string
): Promise<Array<{ title: string; description: string; scenePrompt: string }>> {
  const { suggestions } = await postGenerate<{
    suggestions: Array<{
      title: string;
      description: string;
      scenePrompt: string;
    }>;
  }>("/api/generate/suggestions", { topic, count, customGuideline });
  return suggestions;
}

export async function generateSceneCaptionsForPlatform(
  prompts: string[],
  references: ReferenceImage[],
  platform: "tiktok" | "instagram",
  rules: CaptionRules,
  guidelines: CustomGuidelines,
  hashtags: Hashtags = []
): Promise<string[]> {
  const { captions } = await postGenerate<{ captions: string[] }>(
    "/api/generate/captions",
    { prompts, references, platform, rules, guidelines, hashtags }
  );
  return captions;
}
