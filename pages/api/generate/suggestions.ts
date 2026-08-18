import type { NextApiRequest, NextApiResponse } from "next";
import { handleGenerateError } from "../../../lib/api/handleGenerateError";
import { ensureUser } from "../../../lib/api/requireUser";
import { generateSceneSuggestions } from "../../../services/geminiService";

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: "16mb",
    },
    responseLimit: false,
  },
};

type Suggestion = {
  title: string;
  description: string;
  scenePrompt: string;
};

type SuggestionsRequestBody = {
  topic?: string;
  count?: number;
  customGuideline?: string;
};

const MAX_SUGGESTION_COUNT = 12;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ suggestions: Suggestion[] } | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!(await ensureUser(req, res))) {
    return;
  }

  const body = (req.body ?? {}) as SuggestionsRequestBody;
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  if (!topic) {
    return res.status(400).json({ error: "topic is required" });
  }

  const rawCount = typeof body.count === "number" ? body.count : 4;
  const count = Math.min(
    MAX_SUGGESTION_COUNT,
    Math.max(1, Math.floor(rawCount))
  );
  const customGuideline =
    typeof body.customGuideline === "string"
      ? body.customGuideline
      : undefined;

  try {
    const suggestions = await generateSceneSuggestions(
      topic,
      count,
      customGuideline
    );
    return res.status(200).json({ suggestions });
  } catch (error) {
    handleGenerateError(res, error);
  }
}
