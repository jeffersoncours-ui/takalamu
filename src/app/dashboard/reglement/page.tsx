import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { KhatamOrnament } from "@/components/khatam-ornament";
import { toArabicIndicDigits } from "@/lib/arabic-numerals";
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
    <div className="-mx-4 -mt-5">
      <div
        className="hachure-ink relative overflow-hidden px-[22px] pb-7 pt-6"
        style={{ background: "linear-gradient(160deg, var(--tk-ink-hero-from), var(--tk-ink-hero-to))" }}
      >
        <KhatamOrnament
          size={180}
          strokeWidth={0.4}
          className="pointer-events-none absolute -right-10 -top-10"
          style={{ opacity: 0.5 }}
        />
        <h1
          className="relative leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "var(--tk-cream-text)" }}
        >
          Règlement intérieur
        </h1>
        <p className="relative mt-2 leading-relaxed" style={{ color: "var(--tk-sage)", fontSize: 14 }}>
          Ces règles encadrent l&apos;accès aux cours en direct et s&apos;appliquent
          pour l&apos;ensemble des cours suivis sur la plateforme.
        </p>
      </div>

      <div className="px-[22px] pt-6 pb-2 space-y-5">
        {acceptedAt && (
          <div
            className="flex items-start gap-3 rounded-2xl p-4"
            style={{ background: "rgba(12,107,78,.10)", border: "1px solid rgba(12,107,78,.3)" }}
          >
            <span
              className="flex shrink-0 items-center justify-center rounded-full"
              style={{ width: 24, height: 24, background: "var(--tk-green-active)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <p style={{ color: "var(--tk-green-active)", fontSize: 14, fontWeight: 600 }}>
              Vous avez déjà validé le règlement intérieur, le{" "}
              {format(new Date(acceptedAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}.
            </p>
          </div>
        )}

        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)", boxShadow: "var(--tk-shadow-card)" }}
        >
          {RULES.map((rule, idx) => (
            <div
              key={rule}
              className="flex items-center gap-4 px-4 py-4"
              style={idx > 0 ? { borderTop: "1px solid var(--tk-parchment-border)" } : undefined}
            >
              <span
                className="flex shrink-0 items-center justify-center rounded-full font-semibold"
                style={{ width: 32, height: 32, border: "1.5px solid var(--tk-gold)", color: "var(--tk-gold-darker)", fontSize: 15, fontFamily: "var(--font-spectral)" }}
              >
                {toArabicIndicDigits(idx + 1)}
              </span>
              <p style={{ color: "var(--tk-ink-text)", fontSize: 15 }}>{rule}</p>
            </div>
          ))}
        </div>

        {!acceptedAt && <AcceptForm />}
      </div>
    </div>
  );
}
