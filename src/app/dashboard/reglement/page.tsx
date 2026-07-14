import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AcceptForm } from "./accept-form";

export const RULES = [
  "Caméra obligatoire",
  "Être en position de cours (assis, concentré…)",
  "Retard non toléré",
  "Interdiction d'enregistrer",
  "Réaliser et rendre les devoirs avant le prochain cours",
];

export default async function ReglementPage() {
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("house_rules_accepted_at")
    .eq("id", studentId)
    .maybeSingle();

  const acceptedAt = student?.house_rules_accepted_at ?? null;

  return (
    <div className="space-y-5">
      <div
        className="rounded-2xl p-5"
        style={{ background: "#0A2E2A", boxShadow: "0 16px 32px rgba(10,46,42,.28)" }}
      >
        <h1
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 24, color: "#fff" }}
        >
          Règlement intérieur
        </h1>
        <p className="mt-2 leading-relaxed" style={{ color: "#B9E4D6", fontSize: 14 }}>
          Ces règles encadrent l&apos;accès aux cours en direct et s&apos;appliquent
          pour l&apos;ensemble des cours suivis sur la plateforme.
        </p>
      </div>

      {acceptedAt && (
        <div
          className="flex items-start gap-3 rounded-2xl p-4"
          style={{ background: "#ECFAF4", border: "1px solid #9FE3C8" }}
        >
          <span
            className="flex shrink-0 items-center justify-center rounded-full"
            style={{ width: 24, height: 24, background: "#0F9D6E" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <p style={{ color: "#0A6B4E", fontSize: 14, fontWeight: 600 }}>
            Vous avez déjà validé le règlement intérieur, le{" "}
            {format(new Date(acceptedAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}.
          </p>
        </div>
      )}

      <div className="rounded-2xl bg-white" style={{ border: "1px solid #EFEAE0" }}>
        {RULES.map((rule, idx) => (
          <div
            key={rule}
            className="flex items-center gap-4 px-4 py-4"
            style={idx > 0 ? { borderTop: "1px solid #EFEAE0" } : undefined}
          >
            <span
              className="flex shrink-0 items-center justify-center rounded-full font-semibold"
              style={{ width: 32, height: 32, border: "1.5px solid #9FE3C8", color: "#0A553F", fontSize: 14 }}
            >
              {idx + 1}
            </span>
            <p style={{ color: "#1C1A17", fontSize: 15 }}>{rule}</p>
          </div>
        ))}
      </div>

      {!acceptedAt && <AcceptForm />}
    </div>
  );
}
