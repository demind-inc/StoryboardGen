import { getSupabaseClient } from "./supabaseClient";
import type { CaptionRules } from "../types";

export const DEFAULT_CAPTION_RULES: CaptionRules = {
  tiktok: [
    "Slightly long captions with line breaks",
    "Natural brand mention integration",
    "Exactly 5 approved hashtags",
  ],
  instagram: [
    "Longer, educational captions",
    "Natural brand mention integration",
    "More hashtags allowed (no #apps/#iphoneapps)",
    "Hashtags at bottom of caption",
  ],
};

export const DEFAULT_CAPTIONS = {
  tiktok:
    "Starting my morning right (sun)\n\nThere's something magical about that first sip of @BrandCoffee...\n\n#MorningVibes #CoffeeLovers #DailyRitual #BrandCoffee #CoffeeMoments",
  instagram:
    "There's a reason why your morning routine matters (coffee)\n\nResearch shows that taking just 5 minutes to enjoy your morning coffee mindfully can set a positive tone for your entire day...\n\n#MorningRoutine #CoffeeTime #WellnessJourney #MindfulMornings #CoffeeCulture #SelfCare #DailyRituals",
};

export async function ensureCaptionSettings(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("caption_settings")
    .upsert(
      {
        user_id: userId,
        tiktok_rules: DEFAULT_CAPTION_RULES.tiktok,
        instagram_rules: DEFAULT_CAPTION_RULES.instagram,
        tiktok_caption: DEFAULT_CAPTIONS.tiktok,
        instagram_caption: DEFAULT_CAPTIONS.instagram,
      },
      { onConflict: "user_id", ignoreDuplicates: true }
    );

  if (error) {
    console.error("Failed to ensure caption settings:", error);
    throw error;
  }
}

export async function getCaptionSettings(userId: string): Promise<{
  rules: CaptionRules;
  captions: { tiktok: string; instagram: string };
}> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("caption_settings")
    .select(
      "tiktok_rules, instagram_rules, tiktok_caption, instagram_caption"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch caption settings:", error);
    throw error;
  }

  if (!data) {
    await ensureCaptionSettings(userId);
    return { rules: DEFAULT_CAPTION_RULES, captions: DEFAULT_CAPTIONS };
  }

  return {
    rules: {
      tiktok: data.tiktok_rules?.length
        ? data.tiktok_rules
        : DEFAULT_CAPTION_RULES.tiktok,
      instagram: data.instagram_rules?.length
        ? data.instagram_rules
        : DEFAULT_CAPTION_RULES.instagram,
    },
    captions: {
      tiktok: data.tiktok_caption || DEFAULT_CAPTIONS.tiktok,
      instagram: data.instagram_caption || DEFAULT_CAPTIONS.instagram,
    },
  };
}

export async function updateCaptionRules(
  userId: string,
  rules: CaptionRules
): Promise<void> {
  const supabase = getSupabaseClient();
  await ensureCaptionSettings(userId);
  const { error } = await supabase
    .from("caption_settings")
    .update({
      tiktok_rules: rules.tiktok,
      instagram_rules: rules.instagram,
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to update caption rules:", error);
    throw error;
  }
}
