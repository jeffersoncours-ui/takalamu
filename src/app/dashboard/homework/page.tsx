import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type HomeworkStatus = Database["public"]["Enums"]["homework_status"];

const STATUS_LABEL: Record<HomeworkStatus, string> = {
  a_rendre: "À rendre",
  rendu: "Rendu",
  corrige: "Corrigé",
  vu: "Vu",
};

const STATUS_COLOR: Record<HomeworkStatus, string> = {
  a_rendre: "bg-amber-100 text-amber-800",
  rendu: "bg-blue-100 text-blue-800",
  corrige: "bg-emerald-100 text-emerald-800",
  vu: "bg-slate-100 text-slate-600",
};

export default async function DevoirsPage() {
  await requireStudent();
  const supabase = await createClient();

  const { data: homeworks } = await supabase
    .from("homework")
    .select("id, instructions, status, feedback, grade, assigned_at")
    .order("assigned_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Mes devoirs</h1>

      {!homeworks?.length && (
        <p className="text-sm text-slate-500">Aucun devoir pour le moment.</p>
      )}

      {homeworks?.map((hw) => (
        <div
          key={hw.id}
          className="rounded-xl border border-slate-200 bg-white p-4 space-y-2"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-slate-500 text-xs">
              {format(new Date(hw.assigned_at), "d MMMM yyyy", { locale: fr })}
            </p>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[hw.status]}`}
            >
              {STATUS_LABEL[hw.status]}
            </span>
          </div>

          {hw.instructions && (
            <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap">
              {hw.instructions}
            </p>
          )}

          {hw.feedback && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              <span className="font-medium">Retour : </span>
              {hw.feedback}
              {hw.grade && (
                <span className="ml-2 font-semibold">— Note : {hw.grade}</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
