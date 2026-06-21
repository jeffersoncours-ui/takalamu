-- 12 — Correctif : owns_student appelait public.current_teacher_id(), déplacée en
-- schéma private au 11. On corrige la référence interne (CREATE OR REPLACE conserve
-- l'OID → les policies RLS qui la référencent restent valides).

create or replace function private.owns_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.students s
    where s.id = p_student_id and s.teacher_id = private.current_teacher_id()
  );
$$;
