// =============================================
// supabaseClient.js — Supabase connection
// =============================================
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "[supabase] Missing env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env or Vercel project settings."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
