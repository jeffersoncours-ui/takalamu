-- 13 — Fiche de fin de cours : RPC atomique submit_session_record (§7.6)
-- Une seule soumission alimente lesson_records + vocabulary + grammar_rules + homework,
-- avance le curseur student_progress, crée la note privée de séance (table isolée),
-- et applique les règles d'absence (§8). Tout dans UNE transaction (atomicité).
--
-- SECURITY INVOKER (défaut) : les RLS deny-by-default restent le garde-fou — chaque insert
-- est vérifié avec les droits de l'appelant. Un contrôle d'appartenance explicite en tête
-- donne en plus un message d'erreur propre et dérive teacher_id côté serveur.
--
-- vocab  : jsonb array de { arabic_word, french_definition, root? }
-- grammar: jsonb array de { title, content }

create or replace function public.submit_session_record(
  p_student_id uuid,
  p_session_date timestamptz,
  p_attendance public.attendance_status,
  p_lesson_id uuid default null,
  p_advance_progress boolean default false,
  p_public_recap text default null,
  p_private_note text default null,
  p_homework_instructions text default null,
  p_vocab jsonb default '[]'::jsonb,
  p_grammar jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_teacher_id uuid;
  v_record_id uuid;
  v_item jsonb;
  v_arabic text;
  v_french text;
  v_root text;
  v_title text;
  v_content text;
  v_counts boolean;
begin
  v_teacher_id := private.current_teacher_id();
  if v_teacher_id is null then
    raise exception 'Action réservée à un enseignant.' using errcode = '42501';
  end if;

  -- Appartenance : l'élève doit être rattaché à l'enseignant courant.
  if not private.owns_student(p_student_id) then
    raise exception 'Élève non rattaché à cet enseignant.' using errcode = '42501';
  end if;

  -- 1) Séance (table centrale du carnet).
  insert into public.lesson_records
    (student_id, teacher_id, lesson_id, session_date, attendance, public_recap)
  values
    (p_student_id, v_teacher_id, p_lesson_id, p_session_date, p_attendance,
     nullif(btrim(coalesce(p_public_recap, '')), ''))
  returning id into v_record_id;

  -- 2) Avance du curseur (si demandé et leçon connue).
  if p_advance_progress and p_lesson_id is not null then
    insert into public.student_progress (student_id, current_lesson_id)
    values (p_student_id, p_lesson_id)
    on conflict (student_id)
    do update set current_lesson_id = excluded.current_lesson_id;
  end if;

  -- 3) Vocabulaire (ignore les entrées incomplètes).
  for v_item in select * from jsonb_array_elements(coalesce(p_vocab, '[]'::jsonb))
  loop
    v_arabic := nullif(btrim(coalesce(v_item ->> 'arabic_word', '')), '');
    v_french := nullif(btrim(coalesce(v_item ->> 'french_definition', '')), '');
    v_root := nullif(btrim(coalesce(v_item ->> 'root', '')), '');
    if v_arabic is not null and v_french is not null then
      insert into public.vocabulary
        (student_id, arabic_word, french_definition, root, lesson_record_id)
      values (p_student_id, v_arabic, v_french, v_root, v_record_id);
    end if;
  end loop;

  -- 4) Règles de grammaire (ignore les entrées incomplètes).
  for v_item in select * from jsonb_array_elements(coalesce(p_grammar, '[]'::jsonb))
  loop
    v_title := nullif(btrim(coalesce(v_item ->> 'title', '')), '');
    v_content := nullif(btrim(coalesce(v_item ->> 'content', '')), '');
    if v_title is not null and v_content is not null then
      insert into public.grammar_rules
        (student_id, title, content, lesson_record_id)
      values (p_student_id, v_title, v_content, v_record_id);
    end if;
  end loop;

  -- 5) Devoir (créé seulement si des consignes sont saisies).
  if nullif(btrim(coalesce(p_homework_instructions, '')), '') is not null then
    insert into public.homework (student_id, lesson_record_id, instructions, status)
    values (p_student_id, v_record_id, btrim(p_homework_instructions), 'a_rendre');
  end if;

  -- 6) Note privée de séance (table isolée — jamais lisible par l'élève).
  if nullif(btrim(coalesce(p_private_note, '')), '') is not null then
    insert into public.session_private_notes (lesson_record_id, teacher_id, content)
    values (v_record_id, v_teacher_id, btrim(p_private_note));
  end if;

  -- 7) Règle d'absence (§8) : seules les absences injustifiées et les retards comptent.
  v_counts := p_attendance in ('absent_unjustified', 'late');
  if v_counts then
    update public.students
      set unjustified_absences_count = unjustified_absences_count + 1,
          status = case
            when unjustified_absences_count + 1 >= 3 then 'suspended_absences'::public.student_status
            else status
          end
    where id = p_student_id;
  end if;

  return v_record_id;
end;
$$;

comment on function public.submit_session_record is
  'Fiche de fin de cours (§7.6) : soumission atomique alimentant lesson_records, vocabulary, grammar_rules, homework, student_progress et session_private_notes, avec application des règles d''absence (§8).';
