import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Le rôle (depuis `profiles`, soumis aux RLS) sera affiché ici au Lot 1B,
  // une fois le modèle de données et les types générés.

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Tableau de bord</h1>
        <p className="text-sm text-slate-600">
          Connecté en tant que{" "}
          <span className="font-medium">{user.email}</span>
        </p>
      </div>

      <form action={signOut}>
        <button
          type="submit"
          className="rounded-full border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Se déconnecter
        </button>
      </form>
    </main>
  );
}
