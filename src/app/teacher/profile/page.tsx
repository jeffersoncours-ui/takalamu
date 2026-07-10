import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AvatarUpload } from "@/components/avatar-upload";
import { ChangePasswordForm } from "@/components/change-password-form";
import { NameForm } from "./name-form";

export default async function TeacherProfilePage() {
  const { profile } = await requireTeacher();
  const supabase = await createClient();

  let avatarUrl: string | null = null;
  if (profile?.avatar_url) {
    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrl(profile.avatar_url, 3600);
    avatarUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="space-y-5">
      <div className="px-0.5">
        <h1
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
        >
          Mon profil
        </h1>
      </div>

      <div
        className="rounded-2xl p-4"
        style={{ background: "#fff", boxShadow: "0 6px 16px rgba(28,26,23,.04)" }}
      >
        <AvatarUpload
          currentUrl={avatarUrl}
          fallbackLetter={profile?.full_name?.[0]?.toUpperCase() ?? "?"}
        />
      </div>

      <NameForm fullName={profile?.full_name ?? ""} />

      <ChangePasswordForm />
    </div>
  );
}
