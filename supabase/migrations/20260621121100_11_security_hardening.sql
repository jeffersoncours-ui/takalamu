-- 11 — Durcissement sécurité (suite au linter Supabase)
-- 1) Sortir les helpers RLS du schéma exposé (public) → plus d'endpoint REST /rpc,
--    donc inexécutables par anon. Les RLS continuent de les appeler (référence par OID).
-- 2) Restreindre EXECUTE au seul rôle authenticated (nécessaire à l'évaluation des RLS).
-- 3) Figer le search_path de set_updated_at.

create schema if not exists private;
grant usage on schema private to authenticated, service_role;

alter function public.is_admin() set schema private;
alter function public.current_teacher_id() set schema private;
alter function public.current_student_id() set schema private;
alter function public.owns_student(uuid) set schema private;
alter function public.handle_new_user() set schema private;

revoke all on function private.is_admin() from public;
revoke all on function private.current_teacher_id() from public;
revoke all on function private.current_student_id() from public;
revoke all on function private.owns_student(uuid) from public;
revoke all on function private.handle_new_user() from public;

grant execute on function private.is_admin() to authenticated;
grant execute on function private.current_teacher_id() to authenticated;
grant execute on function private.current_student_id() to authenticated;
grant execute on function private.owns_student(uuid) to authenticated;
-- handle_new_user : déclencheur uniquement (s'exécute en SECURITY DEFINER hors de tout rôle client).

alter function public.set_updated_at() set search_path = '';
