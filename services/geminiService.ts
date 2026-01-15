import { GoogleGenAI } from "@google/genai";
import { ReferenceImage, ImageSize } from "../types";
import {
  DEFAULT_CHARACTER_PROMPT,
  MODEL_NAME,
} from "./constants";

export async function generateCharacterScene(
  prompt: string,
  references: ReferenceImage[],
  size: ImageSize
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

  const fullPrompt = `
${DEFAULT_CHARACTER_PROMPT}

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
