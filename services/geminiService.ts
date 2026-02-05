import { GoogleGenAI } from "@google/genai";
import type {
  CaptionRules,
  CustomGuidelines,
  ReferenceImage,
  ImageSize,
} from "../types";
import {
  DEFAULT_CHARACTER_PROMPT,
  MODEL_NAME,
  CAPTION_MODEL_NAME,
} from "./constants";

export async function generateCharacterScene(
  prompt: string,
  references: ReferenceImage[],
  size: ImageSize,
  guidelines: CustomGuidelines = []
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
  const fullPrompt = `
${DEFAULT_CHARACTER_PROMPT}

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

export async function generateSceneCaptions(
  prompts: string[],
  references: ReferenceImage[],
  rules: CaptionRules,
  guidelines: CustomGuidelines
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
