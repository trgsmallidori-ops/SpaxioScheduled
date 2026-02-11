import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (typeof window !== "undefined" && (!url || !anonKey)) {
  console.error(
    "[Supabase] Missing env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel → Project Settings → Environment Variables, then redeploy."
  );
}

export function createClient() {
  if (!url || !anonKey) {
    throw new Error(
      "Supabase URL and anon key are required. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your host's environment variables (e.g. Vercel → Settings → Environment Variables) and redeploy."
    );
  }
  return createBrowserClient(url, anonKey);
}
