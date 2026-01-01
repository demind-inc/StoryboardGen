import { DailyUsage } from "../types";
import { getSupabaseClient } from "./supabaseClient";
import { UsageLimitsInsert } from "../database.types";

const USAGE_TABLE = "usage_limits";
export const DEFAULT_DAILY_LIMIT = 10;

const getTodayDate = () => new Date().toISOString().split("T")[0];

const normalizeUsage = (record: any): DailyUsage => {
  const dailyLimit = record?.daily_limit ?? DEFAULT_DAILY_LIMIT;
  const used = record?.used ?? 0;

  return {
    userId: record.user_id,
    usageDate: record.usage_date,
    used,
    dailyLimit,
    remaining: Math.max(dailyLimit - used, 0),
  };
};

export async function getDailyUsage(userId: string): Promise<DailyUsage> {
  const supabase = getSupabaseClient();
  const today = getTodayDate();

  const { data, error } = await supabase
    .from(USAGE_TABLE)
    .select("user_id, usage_date, used, daily_limit")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

  if (error) {
    throw error;
  }

  if (data) {
    return normalizeUsage(data);
  }

  // If no record exists (404), return default values
  return {
    userId,
    usageDate: today,
    used: 0,
    dailyLimit: DEFAULT_DAILY_LIMIT,
    remaining: DEFAULT_DAILY_LIMIT,
  };
}

export async function recordGeneration(
  userId: string,
  amount = 1
): Promise<DailyUsage> {
  const supabase = getSupabaseClient();
  const currentUsage = await getDailyUsage(userId);

  if (currentUsage.used + amount > currentUsage.dailyLimit) {
    const limitError = new Error("DAILY_LIMIT_REACHED");
    (limitError as any).remaining = currentUsage.remaining;
    throw limitError;
  }

  // Use upsert to create the record if it doesn't exist, or update if it does
  const { data, error } = await supabase
    .from(USAGE_TABLE)
    .upsert(
      {
        user_id: userId,
        usage_date: currentUsage.usageDate,
        used: currentUsage.used + amount,
        daily_limit: currentUsage.dailyLimit,
      } as any,
      {
        onConflict: "user_id,usage_date",
      }
    )
    .select("user_id, usage_date, used, daily_limit")
    .single();

  if (error) {
    // If upsert returns no rows (PGRST116), try to fetch the record
    if (error.code === "PGRST116") {
      // Record might have been created but not returned, fetch it
      const { data: fetchedData, error: fetchError } = await supabase
        .from(USAGE_TABLE)
        .select("user_id, usage_date, used, daily_limit")
        .eq("user_id", userId)
        .eq("usage_date", currentUsage.usageDate)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (fetchedData) {
        return normalizeUsage(fetchedData);
      }

      // If still no data, return the expected values
      return {
        userId,
        usageDate: currentUsage.usageDate,
        used: currentUsage.used + amount,
        dailyLimit: currentUsage.dailyLimit,
        remaining: Math.max(
          currentUsage.dailyLimit - (currentUsage.used + amount),
          0
        ),
      };
    }
    throw error;
  }

  if (!data) {
    // Fallback if data is null
    return {
      userId,
      usageDate: currentUsage.usageDate,
      used: currentUsage.used + amount,
      dailyLimit: currentUsage.dailyLimit,
      remaining: Math.max(
        currentUsage.dailyLimit - (currentUsage.used + amount),
        0
      ),
    };
  }

  return normalizeUsage(data);
}
