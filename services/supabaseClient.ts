import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

let cachedClient: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (cachedClient) return cachedClient;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY."
    );
  }

  cachedClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return cachedClient;
}
