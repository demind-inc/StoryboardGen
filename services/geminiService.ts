import { GoogleGenAI } from "@google/genai";
import type {
  CaptionRules,
  CustomGuidelines,
  Hashtags,
  ReferenceImage,
  ImageSize,
} from "../types";
import {
  DEFAULT_CHARACTER_PROMPT_BASE,
  DEFAULT_CHARACTER_BACKGROUND_SCENE,
  DEFAULT_CHARACTER_BACKGROUND_TRANSPARENT,
  MODEL_NAME,
  CAPTION_MODEL_NAME,
} from "./constants";

/** Default brand/scene context — always applied in Gemini, not exposed to frontend. */
const BRAND_DEFAULT_CONTEXT = `Always show the product in natural use, maintain warm approachable lighting, include diverse representation, avoid cluttered backgrounds, and keep the scene clean so the brand story feels calm.`;

export async function generateCharacterScene(
  prompt: string,
  references: ReferenceImage[],
  size: ImageSize,
  guidelines: CustomGuidelines = [],
  options: { transparentBackground?: boolean } = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("KEY_NOT_FOUND");
  }
  const ai = new GoogleGenAI({ apiKey });

  const referenceParts = references.map((ref) => ({
    inlineData: {
      data: ref.data.split(",")[1],
      mimeType: ref.mimeType,
    },
  }));

  const guidelineList = guidelines
    .map((group) => `- ${group.rule}`)
    .join("\n");
  const transparentBackground = options.transparentBackground ?? true;
  const backgroundPrompt = transparentBackground
    ? DEFAULT_CHARACTER_BACKGROUND_TRANSPARENT
    : DEFAULT_CHARACTER_BACKGROUND_SCENE;

  const fullPrompt = `
${DEFAULT_CHARACTER_PROMPT_BASE}

${backgroundPrompt}

### Brand / Scene (default)
${BRAND_DEFAULT_CONTEXT}

### Custom Guidelines (must follow)
${guidelineList || "- (none)"}

### Current Scene to Illustrate:
${prompt}
  `.trim();

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [...referenceParts, { text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: size,
        },
      },
    });

    let imageUrl = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      throw new Error("No image data returned from API");
    }

    return imageUrl;
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("KEY_NOT_FOUND");
    }
    throw error;
  }
}

const extractJson = (rawText: string): string => {
  const cleaned = rawText.replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("CAPTION_PARSE_ERROR");
  }
  return cleaned.slice(start, end + 1);
};

const extractJsonArray = (rawText: string): string => {
  const cleaned = rawText.replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("SCENE_SUGGEST_PARSE_ERROR");
  }
  return cleaned.slice(start, end + 1);
};

const formatTopicContext = (topic: string): string => {
  return topic
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
};

export async function generateSceneSuggestions(
  topic: string,
  count = 4
): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("KEY_NOT_FOUND");
  }
  const ai = new GoogleGenAI({ apiKey });

  const topicContext = formatTopicContext(topic);
  const prompt = `
You are a storyboard assistant.
Generate ${count} concise scene prompts using all details from the multi-line brief below.
Treat each line as an intentional requirement (story beats, style, constraints, audience, mood, camera direction).
Each prompt should describe a clear, concrete visual moment with a setting, subject, and action.
Keep each prompt to 1-2 sentences.
Avoid repeating the same setting or action.

Topic brief:
${topicContext}

Output JSON only as an array of strings, e.g.
["Scene 1", "Scene 2", "Scene 3", "Scene 4"]
`.trim();

  try {
    const response = await ai.models.generateContent({
      model: CAPTION_MODEL_NAME,
      contents: {
        parts: [{ text: prompt }],
      },
    });

    const responseText =
      response.candidates?.[0]?.content?.parts
        ?.map((part) => (part as any).text || "")
        .join("") || "";

    const parsed = JSON.parse(extractJsonArray(responseText));
    if (!Array.isArray(parsed)) {
      throw new Error("SCENE_SUGGEST_PARSE_ERROR");
    }

    return parsed
      .map((item) => String(item || "").trim())
      .filter((item) => item.length > 0)
      .slice(0, count);
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("KEY_NOT_FOUND");
    }
    throw error;
  }
}

export async function generateSceneCaptions(
  prompts: string[],
  references: ReferenceImage[],
  rules: CaptionRules,
  guidelines: CustomGuidelines,
  hashtags: Hashtags = []
): Promise<{ tiktok: string[]; instagram: string[] }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("KEY_NOT_FOUND");
  }
  const ai = new GoogleGenAI({ apiKey });

  const referenceParts = references.map((ref) => ({
    inlineData: {
      data: ref.data.split(",")[1],
      mimeType: ref.mimeType,
    },
  }));

  const sceneList = prompts
    .map((scene, idx) => `${idx + 1}. ${scene}`)
    .join("\n");
  const tiktokRules = rules.tiktok.map((group) => `- ${group.rule}`).join("\n");
  const instagramRules = rules.instagram
    .map((group) => `- ${group.rule}`)
    .join("\n");
  const guidelineList = guidelines
    .map((group) => `- ${group.rule}`)
    .join("\n");
  const hashtagList = hashtags.length ? hashtags.join(" ") : "(none)";

  const captionPrompt = `
You are a social media copywriter.
Create captions for each scene using the attached reference images for character consistency.

Scenes:
${sceneList}

Global brand guidelines:
${guidelineList || "- (none)"}

TikTok rules:
${tiktokRules || "- (none)"}

Instagram rules:
${instagramRules || "- (none)"}

Approved hashtags:
${hashtagList}

Requirements:
- Provide one TikTok and one Instagram caption per scene.
- Keep the tone natural and platform-appropriate.
- If rules conflict, follow platform rules over global guidelines.
- Output JSON only, with this exact shape:
{
  "tiktok": ["caption for scene 1", "caption for scene 2"],
  "instagram": ["caption for scene 1", "caption for scene 2"]
}
- The array length must match the number of scenes.
`.trim();

  try {
    const response = await ai.models.generateContent({
      model: CAPTION_MODEL_NAME,
      contents: {
        parts: [...referenceParts, { text: captionPrompt }],
      },
    });

    const responseText =
      response.candidates?.[0]?.content?.parts
        ?.map((part) => (part as any).text || "")
        .join("") || "";

    const parsed = JSON.parse(extractJson(responseText));
    console.log(parsed);
    if (!Array.isArray(parsed?.tiktok) || !Array.isArray(parsed?.instagram)) {
      throw new Error("CAPTION_PARSE_ERROR");
    }

    return {
      tiktok: prompts.map((_, idx) => String(parsed.tiktok[idx] ?? "").trim()),
      instagram: prompts.map((_, idx) =>
        String(parsed.instagram[idx] ?? "").trim()
      ),
    };
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("KEY_NOT_FOUND");
    }
    throw error;
  }
}

export async function generateSceneSummaries(
  prompts: string[],
  guidelines: CustomGuidelines
): Promise<{ titles: string[]; descriptions: string[] }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("KEY_NOT_FOUND");
  }
  const ai = new GoogleGenAI({ apiKey });

  const sceneList = prompts
    .map((scene, idx) => `${idx + 1}. ${scene}`)
    .join("\n");
  const guidelineList = guidelines
    .map((group) => `- ${group.rule}`)
    .join("\n");

  const summaryPrompt = `
You are a storyboard assistant.
Create a concise title and a short description for each scene.

Scenes:
${sceneList}

Global brand guidelines:
${guidelineList || "- (none)"}

Requirements:
- Title: 3-6 words.
- Description: 1-2 sentences, focused on visible action and setting.
- Output JSON only as an array of objects, e.g.
[
  { "title": "Scene 1 Title", "description": "Scene 1 description." },
  { "title": "Scene 2 Title", "description": "Scene 2 description." }
]
- The array length must match the number of scenes.
`.trim();

  try {
    const response = await ai.models.generateContent({
      model: CAPTION_MODEL_NAME,
      contents: {
        parts: [{ text: summaryPrompt }],
      },
    });

    const responseText =
      response.candidates?.[0]?.content?.parts
        ?.map((part) => (part as any).text || "")
        .join("") || "";

    const parsed = JSON.parse(extractJsonArray(responseText));
    if (!Array.isArray(parsed)) {
      throw new Error("SUMMARY_PARSE_ERROR");
    }

    return {
      titles: prompts.map((_, idx) =>
        String(parsed[idx]?.title ?? "").trim()
      ),
      descriptions: prompts.map((_, idx) =>
        String(parsed[idx]?.description ?? "").trim()
      ),
    };
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("KEY_NOT_FOUND");
    }
    throw error;
  }
}
