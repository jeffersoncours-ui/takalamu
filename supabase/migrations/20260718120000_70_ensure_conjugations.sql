-- Persiste les conjugaisons auto-générées (moteur TS côté serveur) sans jamais
-- écraser une saisie manuelle de l'enseignant : n'insère QUE les (vocab_id, tense)
-- absents. SECURITY DEFINER + contrôle current_student_id + vérification que
-- chaque vocab appartient bien à l'élève → aucun forgeage possible.
create or replace function public.ensure_conjugations(p_student_id uuid, p_rows jsonb)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student uuid;
  v_item    jsonb;
  v_vocab   uuid;
  v_tense   text;
  v_inserted int := 0;
begin
  v_student := private.current_student_id();
  if v_student is null or v_student <> p_student_id then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;

  for v_item in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    v_vocab := (v_item->>'vocab_id')::uuid;
    v_tense := v_item->>'tense';
    if v_tense not in ('madi','mudari','amr') then continue; end if;

    if not exists (select 1 from public.vocabulary v where v.id = v_vocab and v.student_id = p_student_id) then
      continue;
    end if;
    if exists (select 1 from public.verb_conjugations c where c.vocab_id = v_vocab and c.tense = v_tense) then
      continue;
    end if;

    insert into public.verb_conjugations (vocab_id, student_id, tense, forms)
    values (v_vocab, p_student_id, v_tense, coalesce(v_item->'forms', '{}'::jsonb));
    v_inserted := v_inserted + 1;
  end loop;

  return v_inserted;
end;
$$;

grant execute on function public.ensure_conjugations(uuid, jsonb) to authenticated;
