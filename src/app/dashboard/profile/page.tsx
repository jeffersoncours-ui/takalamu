import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const { userId, profile, studentId } = await requireStudent();
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("address, birth_date, school_background")
    .eq("id", studentId)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div className="px-0.5">
        <h1
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
        >
          Mon profil
        </h1>
        <p className="font-medium mt-0.5" style={{ color: "#8B857A", fontSize: 14 }}>
          Tes informations personnelles.
        </p>
      </div>

      <ProfileForm
        key={userId}
        fullName={profile.full_name ?? ""}
        gender={profile.gender}
        address={student?.address ?? ""}
        birthDate={student?.birth_date ?? ""}
        schoolBackground={student?.school_background ?? ""}
      />
    </div>
  );
}
