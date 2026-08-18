import type { NextApiRequest, NextApiResponse } from "next";
import { handleGenerateError } from "../../../lib/api/handleGenerateError";
import { ensureUser } from "../../../lib/api/requireUser";
import { generateSceneCaptionsForPlatform } from "../../../services/geminiService";
import type {
  CaptionRules,
  CustomGuidelines,
  Hashtags,
  ReferenceImage,
} from "../../../types";

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: "16mb",
    },
    responseLimit: false,
  },
};

type CaptionsRequestBody = {
  prompts?: string[];
  references?: ReferenceImage[];
  platform?: "tiktok" | "instagram";
  rules?: CaptionRules;
  guidelines?: CustomGuidelines;
  hashtags?: Hashtags;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ captions: string[] } | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!(await ensureUser(req, res))) {
    return;
  }

  const body = (req.body ?? {}) as CaptionsRequestBody;
  const prompts = Array.isArray(body.prompts)
    ? body.prompts.filter((prompt) => typeof prompt === "string")
    : [];
  if (prompts.length === 0) {
    return res.status(400).json({ error: "prompts are required" });
  }

  const platform = body.platform;
  if (platform !== "tiktok" && platform !== "instagram") {
    return res.status(400).json({ error: "platform must be tiktok or instagram" });
  }

  const rules = body.rules;
  if (
    !rules ||
    !Array.isArray(rules.tiktok) ||
    !Array.isArray(rules.instagram)
  ) {
    return res.status(400).json({ error: "rules are required" });
  }

  try {
    const captions = await generateSceneCaptionsForPlatform(
      prompts,
      Array.isArray(body.references) ? body.references : [],
      platform,
      rules,
      Array.isArray(body.guidelines) ? body.guidelines : [],
      Array.isArray(body.hashtags) ? body.hashtags : []
    );
    return res.status(200).json({ captions });
  } catch (error) {
    handleGenerateError(res, error);
  }
}
