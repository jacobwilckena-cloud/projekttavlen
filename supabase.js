import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Mangler VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY – se .env.example");
}

export const supabase = createClient(url, key);
