import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

const supabaseUrlValue = supabaseUrl;
const supabaseAnonKeyValue = supabaseAnonKey;

const clientByPlayerKey = new Map<string, SupabaseClient>();

export function getSupabaseClient(playerKey: string): SupabaseClient {
  const key = playerKey.trim();
  if (!key) {
    throw new Error("playerKey is required");
  }

  const existing = clientByPlayerKey.get(key);
  if (existing) {
    return existing;
  }

  const client = createClient(supabaseUrlValue, supabaseAnonKeyValue, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "x-player-key": key,
      },
    },
  });

  clientByPlayerKey.set(key, client);
  return client;
}
