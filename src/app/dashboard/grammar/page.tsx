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
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">
        Mes règles de grammaire{rules?.length ? ` (${rules.length})` : ""}
      </h1>

      {!rules?.length && (
        <p className="text-sm text-slate-500">Aucune règle enregistrée pour le moment.</p>
      )}

      {rules?.map((r) => (
        <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">{r.title}</p>
            <p className="text-xs text-slate-400 shrink-0">
              {format(new Date(r.created_at), "d MMM yyyy", { locale: fr })}
            </p>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{r.content}</p>
        </div>
      ))}
    </div>
  );
}
