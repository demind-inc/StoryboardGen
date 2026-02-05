import { getSupabaseClient } from "./supabaseClient";
import type {
  CaptionSettingsInsert,
  CaptionSettingsRow,
  Json,
} from "../database.types";
import type { CaptionRules, CustomGuidelines, RuleGroup } from "../types";

const DEFAULT_TIKTOK_RULE: RuleGroup = {
  name: "Default",
  rule:
    "Keep captions slightly long with clear line breaks, weave the brand in naturally, use exactly five approved hashtags, stay casual and energetic, and prioritize clarity so the message lands in seconds.",
  isDefault: true,
};

const DEFAULT_INSTAGRAM_RULE: RuleGroup = {
  name: "Default",
  rule:
    "Write longer, educational captions that integrate the brand naturally and add helpful context without sounding salesy, allow more hashtags only when they add value to discovery, and place the hashtag block at the end.",
  isDefault: true,
};

const DEFAULT_GUIDELINE: RuleGroup = {
  name: "Default",
  rule:
    "Always show the product in natural use, maintain warm approachable lighting, include diverse representation, avoid cluttered backgrounds, and keep the scene clean so the brand story feels calm.",
  isDefault: true,
};

export const DEFAULT_CAPTION_RULES: CaptionRules = {
  tiktok: [DEFAULT_TIKTOK_RULE],
  instagram: [DEFAULT_INSTAGRAM_RULE],
};

export const DEFAULT_CAPTIONS = {
  tiktok:
    "Starting my morning right (sun)\n\nThere's something magical about that first sip of @BrandCoffee...\n\n#MorningVibes #CoffeeLovers #DailyRitual #BrandCoffee #CoffeeMoments",
  instagram:
    "There's a reason why your morning routine matters (coffee)\n\nResearch shows that taking just 5 minutes to enjoy your morning coffee mindfully can set a positive tone for your entire day...\n\n#MorningRoutine #CoffeeTime #WellnessJourney #MindfulMornings #CoffeeCulture #SelfCare #DailyRituals",
};

export const DEFAULT_CUSTOM_GUIDELINES: CustomGuidelines = [DEFAULT_GUIDELINE];

/** Default rules and guidelines used when generating (creating) caption_settings for a new user. */
export const DEFAULT_RULES = {
  rules: DEFAULT_CAPTION_RULES,
  guidelines: DEFAULT_CUSTOM_GUIDELINES,
} as const;

const isRuleGroup = (value: unknown): value is RuleGroup => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.name === "string" && typeof record.rule === "string";
};

const buildCustomName = (index: number) => `Custom ${index + 1}`;

const normalizeRuleGroups = (
  groups: RuleGroup[],
  defaultGroup: RuleGroup
): RuleGroup[] => {
  const customGroups = groups
    .filter((group) => !group.isDefault)
    .map((group) => ({
      name: group.name?.trim() || "",
      rule: group.rule?.trim() || "",
    }))
    .filter((group) => group.rule.length > 0)
    .map((group, index) => ({
      name: group.name || buildCustomName(index),
      rule: group.rule,
    }));

  return [defaultGroup, ...customGroups];
};

const coerceRuleGroups = (
  rawValue: unknown,
  defaultGroup: RuleGroup
): RuleGroup[] => {
  if (!Array.isArray(rawValue)) {
    return [defaultGroup];
  }

  const customGroups: RuleGroup[] = [];

  rawValue.forEach((item) => {
    if (typeof item === "string") {
      customGroups.push({ name: "", rule: item });
      return;
    }

    if (isRuleGroup(item)) {
      customGroups.push({
        name: item.name,
        rule: item.rule,
        isDefault: item.isDefault,
      });
      return;
    }

    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      const name = typeof record.name === "string" ? record.name : "";
      const rule = typeof record.rule === "string" ? record.rule : "";
      if (rule) {
        customGroups.push({ name, rule });
      }
    }
  });

  return normalizeRuleGroups(customGroups, defaultGroup);
};

export async function ensureCaptionSettings(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const row: CaptionSettingsInsert = {
    user_id: userId,
    tiktok_rules: DEFAULT_RULES.rules.tiktok as unknown as Json,
    instagram_rules: DEFAULT_RULES.rules.instagram as unknown as Json,
    custom_guidelines: DEFAULT_RULES.guidelines as unknown as Json,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase infers caption_settings Insert as never
  const { error } = await (supabase.from("caption_settings") as any)
    .upsert(row, { onConflict: "user_id", ignoreDuplicates: true });

  if (error) {
    console.error("Failed to ensure caption settings:", error);
    throw error;
  }
}

export async function getCaptionSettings(userId: string): Promise<{
  rules: CaptionRules;
  guidelines: CustomGuidelines;
}> {
  const supabase = getSupabaseClient();
  const { data: rawData, error } = await supabase
    .from("caption_settings")
    .select("tiktok_rules, instagram_rules, custom_guidelines")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch caption settings:", error);
    throw error;
  }

  const data = rawData as Pick<
    CaptionSettingsRow,
    "tiktok_rules" | "instagram_rules" | "custom_guidelines"
  > | null;
  if (!data) {
    await ensureCaptionSettings(userId);
    return {
      rules: DEFAULT_RULES.rules,
      guidelines: DEFAULT_RULES.guidelines,
    };
  }

  return {
    rules: {
      tiktok: coerceRuleGroups(data.tiktok_rules, DEFAULT_TIKTOK_RULE),
      instagram: coerceRuleGroups(data.instagram_rules, DEFAULT_INSTAGRAM_RULE),
    },
    guidelines: coerceRuleGroups(data.custom_guidelines, DEFAULT_GUIDELINE),
  };
}

export async function updateCaptionRules(
  userId: string,
  rules: CaptionRules
): Promise<void> {
  const supabase = getSupabaseClient();
  await ensureCaptionSettings(userId);
  const nextRules: CaptionRules = {
    tiktok: normalizeRuleGroups(rules.tiktok, DEFAULT_TIKTOK_RULE),
    instagram: normalizeRuleGroups(rules.instagram, DEFAULT_INSTAGRAM_RULE),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase infers caption_settings Update as never
  const { error } = await (supabase.from("caption_settings") as any)
    .update({
      tiktok_rules: nextRules.tiktok as unknown as Json,
      instagram_rules: nextRules.instagram as unknown as Json,
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to update caption rules:", error);
    throw error;
  }
}

export async function updateCaptionRulesForPlatform(
  userId: string,
  platform: "tiktok" | "instagram",
  rules: RuleGroup[]
): Promise<void> {
  const supabase = getSupabaseClient();
  await ensureCaptionSettings(userId);
  const column = platform === "tiktok" ? "tiktok_rules" : "instagram_rules";
  const defaultGroup =
    platform === "tiktok" ? DEFAULT_TIKTOK_RULE : DEFAULT_INSTAGRAM_RULE;
  const nextRules = normalizeRuleGroups(rules, defaultGroup);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase infers caption_settings Update as never
  const { error } = await (supabase.from("caption_settings") as any)
    .update({ [column]: nextRules as unknown as Json })
    .eq("user_id", userId)
    .select("user_id")
    .single();

  if (error) {
    console.error("Failed to update caption rules:", error);
    throw error;
  }
}

export async function updateCustomGuidelines(
  userId: string,
  guidelines: RuleGroup[]
): Promise<void> {
  const supabase = getSupabaseClient();
  await ensureCaptionSettings(userId);
  const nextGuidelines = normalizeRuleGroups(
    guidelines,
    DEFAULT_GUIDELINE
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase infers caption_settings Update as never
  const { error } = await (supabase.from("caption_settings") as any)
    .update({ custom_guidelines: nextGuidelines as unknown as Json })
    .eq("user_id", userId)
    .select("user_id")
    .single();

  if (error) {
    console.error("Failed to update custom guidelines:", error);
    throw error;
  }
}
