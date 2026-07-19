import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { homePathForRole } from "@/lib/auth";
import { Wordmark } from "@/components/wordmark";
import { KhatamOrnament } from "@/components/khatam-ornament";

import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    redirect(homePathForRole(profile?.role));
  }

  return (
    <main
      className="hachure-ink relative flex flex-1 items-center justify-center overflow-hidden px-6 py-16"
      style={{ background: "var(--tk-ink-screen)" }}
    >
      <span
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          top: -70,
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(199,154,62,.18), transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-sm space-y-7">
        <div className="relative flex flex-col items-center text-center">
          <KhatamOrnament
            size={150}
            circle
            strokeWidth={0.5}
            className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
            style={{ opacity: 0.5 }}
          />
          <Link href="/" className="relative flex flex-col items-center gap-[22px]">
            <img
              src="/logo.png"
              alt=""
              style={{ height: 88, width: "auto", filter: "drop-shadow(0 8px 20px rgba(0,0,0,.4))" }}
            />
            <div className="flex flex-col items-center gap-3">
              <Wordmark size={54} />
              <p
                className="italic"
                style={{
                  fontFamily: "var(--font-spectral)",
                  fontSize: 19,
                  color: "var(--tk-sage)",
                  letterSpacing: ".14em",
                }}
              >
                apprends. récite. progresse.
              </p>
            </div>
          </Link>
        </div>

        {error ? (
          <p
            className="rounded-2xl px-4 py-3 text-center"
            style={{ background: "rgba(163,52,42,.12)", color: "#E7A99E", border: "1px solid rgba(163,52,42,.35)", fontSize: 14 }}
          >
            {error}
          </p>
        ) : null}

        <LoginForm />
      </div>
    </main>
  );
}
