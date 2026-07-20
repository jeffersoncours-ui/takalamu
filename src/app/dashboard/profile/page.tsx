import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AvatarUpload } from "@/components/avatar-upload";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const { userId, profile, studentId } = await requireStudent();
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("address, birth_date, school_background")
    .eq("id", studentId)
    .maybeSingle();

  let avatarUrl: string | null = null;
  if (profile.avatar_url) {
    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrl(profile.avatar_url, 3600);
    avatarUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="-mx-4 -mt-5">
      <div
        className="hachure-ink relative overflow-hidden px-[22px] pb-6 pt-6"
        style={{ background: "linear-gradient(160deg, var(--tk-ink-hero-from), var(--tk-ink-hero-to))" }}
      >
        <h1
          className="relative leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "var(--tk-cream-text)" }}
        >
          Mon profil
        </h1>
        <p className="relative font-medium mt-0.5" style={{ color: "var(--tk-sage)", fontSize: 14 }}>
          Tes informations personnelles.
        </p>

        <div className="relative mt-5">
          <AvatarUpload
            currentUrl={avatarUrl}
            fallbackLetter={profile.full_name?.[0]?.toUpperCase() ?? "?"}
          />
        </div>
      </div>

      <div className="px-[22px] pt-6 pb-2">
        <ProfileForm
          key={userId}
          fullName={profile.full_name ?? ""}
          gender={profile.gender}
          address={student?.address ?? ""}
          birthDate={student?.birth_date ?? ""}
          schoolBackground={student?.school_background ?? ""}
        />
      </div>
    </div>
  );
}
