import { createClient, type User } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";

export async function requireUser(
  req: NextApiRequest
): Promise<User | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    return null;
  }

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY."
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function ensureUser(
  req: NextApiRequest,
  res: NextApiResponse<{ error: string }>
): Promise<User | null> {
  try {
    const user = await requireUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return null;
    }
    return user;
  } catch (error) {
    console.error("Auth configuration error:", error);
    res.status(500).json({ error: "Server configuration error" });
    return null;
  }
}
