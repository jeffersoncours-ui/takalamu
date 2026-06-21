import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <Link
            href="/"
            className="text-sm font-medium uppercase tracking-widest text-emerald-700"
          >
            Takalamu
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">Mon espace</h1>
          <p className="text-sm text-slate-500">
            Connecte-toi avec ton compte.
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
