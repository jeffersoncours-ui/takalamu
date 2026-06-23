import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function GrammairePage() {
  await requireStudent();
  const supabase = await createClient();

  const { data: rules } = await supabase
    .from("grammar_rules")
    .select("id, title, content, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-5">
      <div className="px-0.5">
        <h1
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
        >
          Mes règles de grammaire
        </h1>
        <p className="font-medium mt-0.5" style={{ color: "#8B857A", fontSize: 14 }}>
          {rules?.length ?? 0} règle{(rules?.length ?? 0) > 1 ? "s" : ""}
        </p>
      </div>

      {!rules?.length && (
        <p style={{ color: "#8B857A", fontSize: 14 }}>
          Aucune règle enregistrée pour le moment.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {rules?.map((r) => (
          <div
            key={r.id}
            className="rounded-[16px] p-4"
            style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 5px 14px rgba(28,26,23,.03)" }}
          >
            <div className="flex items-start justify-between gap-3 mb-1">
              <p className="font-bold" style={{ color: "#1C1A17", fontSize: 15 }}>{r.title}</p>
              <p className="shrink-0" style={{ color: "#A8A29E", fontSize: 11 }}>
                {format(new Date(r.created_at), "d MMM yyyy", { locale: fr })}
              </p>
            </div>
            <p
              className="leading-relaxed whitespace-pre-wrap"
              style={{ color: "#4A463F", fontSize: 14 }}
            >
              {r.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
