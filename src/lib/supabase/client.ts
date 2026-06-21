import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";

/**
 * Client Supabase pour les Composants Client (navigateur).
 * Utilise la clé anon : toute l'isolation des données repose sur les RLS.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
