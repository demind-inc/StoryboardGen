import type { NextApiResponse } from "next";

export function handleGenerateError(
  res: NextApiResponse<{ error: string }>,
  error: unknown
) {
  const message = error instanceof Error ? error.message : "Generation failed";

  if (message === "KEY_NOT_FOUND") {
    console.error("GEMINI_API_KEY is not set or invalid");
    res.status(500).json({ error: "KEY_NOT_FOUND" });
    return;
  }

  if (
    message === "CAPTION_PARSE_ERROR" ||
    message === "SCENE_SUGGEST_PARSE_ERROR" ||
    message === "SUMMARY_PARSE_ERROR"
  ) {
    res.status(502).json({ error: message });
    return;
  }

  console.error("Generation error:", message);
  res.status(500).json({ error: message || "Generation failed" });
}
