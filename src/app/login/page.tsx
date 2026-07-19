import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { homePathForRole } from "@/lib/auth";

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
    <main className="flex flex-1 items-center justify-center px-6 py-16" style={{ background: "#F7F4EE" }}>
      <div className="w-full max-w-sm space-y-7">
        <div className="flex flex-col items-center text-center space-y-3">
          <Link href="/" className="flex flex-col items-center gap-3">
            <img
              src="/logo.png"
              alt=""
              style={{ height: 104, width: "auto" }}
            />
            <img
              src="/wordmark.png"
              alt="تتكلموا"
              style={{ height: 100, width: "auto" }}
            />
          </Link>
        </div>

        {error ? (
          <p
            className="rounded-2xl px-4 py-3 text-center"
            style={{ background: "#FDECEC", color: "#B4292E", border: "1px solid #F3B0B2", fontSize: 14 }}
          >
            {error}
          </p>
        ) : null}

        <div
          className="rounded-[20px] p-5"
          style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 10px 26px rgba(28,26,23,.09)" }}
        >
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
