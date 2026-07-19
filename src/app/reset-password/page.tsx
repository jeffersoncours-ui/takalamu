import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Wordmark } from "@/components/wordmark";
import { KhatamOrnament } from "@/components/khatam-ornament";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main
      className="hachure-ink relative flex flex-1 items-center justify-center overflow-hidden px-6 py-16"
      style={{ background: "var(--tk-ink-screen)" }}
    >
      <div className="relative w-full max-w-sm space-y-7">
        <div className="relative flex flex-col items-center text-center">
          <KhatamOrnament
            size={110}
            circle
            strokeWidth={0.5}
            className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
            style={{ opacity: 0.4 }}
          />
          <Link href="/" className="relative flex flex-col items-center gap-4">
            <img
              src="/logo.png"
              alt=""
              style={{ height: 64, width: "auto", filter: "drop-shadow(0 8px 20px rgba(0,0,0,.4))" }}
            />
            <Wordmark size={34} />
          </Link>
        </div>

        <div
          className="rounded-[20px] p-5"
          style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(199,154,62,.28)" }}
        >
          <ResetPasswordForm />
        </div>
      </div>
    </main>
  );
}
