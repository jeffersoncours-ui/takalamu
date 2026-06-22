import type { Database } from "@/lib/supabase/database.types";

export type AttendanceStatus =
  Database["public"]["Enums"]["attendance_status"];

/** Statuts de présence (valeur en base ↔ libellé affiché). */
export const ATTENDANCE_STATUSES: {
  value: AttendanceStatus;
  label: string;
  /** Compte dans les absences injustifiées (§8). */
  counts: boolean;
}[] = [
  { value: "present", label: "Présent", counts: false },
  { value: "late", label: "Retard (> 5 min)", counts: true },
  { value: "absent_justified", label: "Absent justifié", counts: false },
  { value: "absent_unjustified", label: "Absent injustifié", counts: true },
];

export function attendanceLabel(value: AttendanceStatus): string {
  return (
    ATTENDANCE_STATUSES.find((a) => a.value === value)?.label ?? value
  );
}

export function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return ATTENDANCE_STATUSES.some((a) => a.value === value);
}
