import type { NextApiRequest, NextApiResponse } from "next";
import { handleGenerateError } from "../../../lib/api/handleGenerateError";
import { ensureUser } from "../../../lib/api/requireUser";
import { generateCharacterScene } from "../../../services/geminiService";
import type { CustomGuidelines, ImageSize, ReferenceImage } from "../../../types";

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: "16mb",
    },
    responseLimit: false,
  },
};

type SceneRequestBody = {
  prompt?: string;
  references?: ReferenceImage[];
  size?: ImageSize;
  guidelines?: CustomGuidelines;
  options?: { transparentBackground?: boolean };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ imageUrl: string } | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!(await ensureUser(req, res))) {
    return;
  }

  const body = (req.body ?? {}) as SceneRequestBody;
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return res.status(400).json({ error: "prompt is required" });
  }

  try {
    const imageUrl = await generateCharacterScene(
      prompt,
      Array.isArray(body.references) ? body.references : [],
      body.size ?? "1K",
      Array.isArray(body.guidelines) ? body.guidelines : [],
      body.options ?? {}
    );
    return res.status(200).json({ imageUrl });
  } catch (error) {
    handleGenerateError(res, error);
  }
}
