import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

/**
 * Client Supabase à privilèges service_role — CONTOURNE les RLS.
 * À n'utiliser QUE côté serveur, pour des opérations de confiance
 * (cron de relances, création de comptes par l'admin, etc.).
 * Ne jamais importer dans un Composant Client.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
