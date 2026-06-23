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
      <div className="px-0.5">
        <h1
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
        >
          Mes disponibilités
        </h1>
        <p className="font-medium mt-0.5" style={{ color: "#8B857A", fontSize: 14 }}>
          Créneaux récurrents ouverts à la réservation.
        </p>
      </div>

      <AvailabilityForm />

      <div className="space-y-2">
        <p
          className="px-0.5 font-bold uppercase"
          style={{ color: "#8B857A", fontSize: 12, letterSpacing: ".06em" }}
        >
          Créneaux actuels ({slots?.length ?? 0})
        </p>

        {!slots?.length && (
          <p style={{ color: "#8B857A", fontSize: 14 }}>Aucun créneau défini.</p>
        )}

        <div className="flex flex-col gap-[10px]">
          {slots?.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center gap-[14px] rounded-[16px] px-4 py-[15px]"
              style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 5px 14px rgba(28,26,23,.03)" }}
            >
              <div className="flex-1">
                <div className="font-bold" style={{ color: "#1C1A17", fontSize: 15 }}>
                  {DAY_LABELS[slot.day_of_week]}
                </div>
                <div className="font-medium" style={{ color: "#8B857A", fontSize: 12 }}>
                  {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)} (UTC)
                </div>
              </div>
              <DeleteSlotButton slotId={slot.id} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
