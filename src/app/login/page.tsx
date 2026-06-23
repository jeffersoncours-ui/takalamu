import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { homePathForRole } from "@/lib/auth";

import { LoginForm } from "./login-form";

export default async function LoginPage() {
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
          <Link href="/" className="flex items-center gap-2">
            <span
              className="flex items-center justify-center rounded-[14px] text-white font-arabic"
              style={{ width: 48, height: 48, background: "#0F9D6E", fontSize: 28, boxShadow: "0 8px 18px rgba(15,157,110,.30)" }}
            >
              ت
            </span>
          </Link>
          <div>
            <h1
              className="leading-tight"
              style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 28, color: "#1C1A17" }}
            >
              Mon espace
            </h1>
            <p className="font-medium mt-1" style={{ color: "#8B857A", fontSize: 14 }}>
              Connecte-toi avec ton compte.
            </p>
          </div>
        </div>

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
