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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Tableau de bord</h1>
        <p className="text-sm text-slate-600">
          Connecté en tant que{" "}
          <span className="font-medium">
            {profile?.full_name ?? user.email}
          </span>
        </p>
        <p className="text-sm text-slate-500">
          Rôle : <span className="font-medium">{profile?.role ?? "—"}</span>
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
