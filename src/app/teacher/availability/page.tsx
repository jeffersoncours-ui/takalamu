import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AvailabilityForm } from "./availability-form";
import { DeleteSlotButton } from "./delete-slot-button";

const DAY_LABELS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

export default async function AvailabilityPage() {
  await requireTeacher();
  const supabase = await createClient();

  const { data: slots } = await supabase
    .from("teacher_availability")
    .select("id, day_of_week, start_time, end_time")
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">
          Mes disponibilités
        </h1>
        <p className="text-sm text-slate-500">
          Créneaux récurrents que tes élèves peuvent réserver.
        </p>
      </div>

      <AvailabilityForm />

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">
          Créneaux actuels ({slots?.length ?? 0})
        </p>

        {!slots?.length && (
          <p className="text-sm text-slate-500">Aucun créneau défini.</p>
        )}

        {slots?.map((slot) => (
          <div
            key={slot.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
          >
            <div>
              <span className="font-medium text-slate-900">
                {DAY_LABELS[slot.day_of_week]}
              </span>
              <span className="ml-2 text-sm text-slate-600">
                {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}{" "}
                <span className="text-xs text-slate-400">UTC</span>
              </span>
            </div>
            <DeleteSlotButton slotId={slot.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
