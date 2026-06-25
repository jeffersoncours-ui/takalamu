-- Vitrine publique : exposer le genre des enseignants sans ouvrir la table profiles à anon.
-- Cause racine du bug "Khadija = Cours hommes" : la jointure profiles(gender) est bloquée
-- par la RLS deny-by-default de profiles pour le rôle anon → gender null → fallback hommes.
-- Pattern projet : encapsuler dans une RPC SECURITY DEFINER qui projette EXACTEMENT
-- ce que la vitrine doit voir (id, display_name, bio, gender), rien d'autre.

create or replace function public.get_public_teachers()
returns table (
  id uuid,
  display_name text,
  bio text,
  gender public.gender_type
)
language sql
security definer
set search_path = ''
stable
as $$
  select t.id, t.display_name, t.bio, p.gender
  from public.teachers t
  join public.profiles p on p.id = t.profile_id
  order by t.created_at;
$$;

grant execute on function public.get_public_teachers() to anon, authenticated;
