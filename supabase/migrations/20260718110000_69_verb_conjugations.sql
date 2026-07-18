-- Quiz de conjugaison (الماضي/المضارع/الأمر). Table + RLS + 2 RPC.
-- Purement additif (nouvelle table, nouvelles RPC) → sans risque sur la base
-- partagée preview/prod : aucun client déployé n'y touche.

create table public.verb_conjugations (
  id uuid primary key default gen_random_uuid(),
  vocab_id uuid not null references public.vocabulary (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  tense text not null check (tense in ('madi','mudari','amr')),
  forms jsonb not null default '{}'::jsonb,   -- { person_code: "forme vocalisée", ... }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vocab_id, tense)
);
create index verb_conjugations_student_idx on public.verb_conjugations (student_id);
create index verb_conjugations_vocab_idx on public.verb_conjugations (vocab_id);

alter table public.verb_conjugations enable row level security;

-- Enseignant : gère la conjugaison de SES élèves (comme vocabulary).
create policy vc_teacher_all on public.verb_conjugations
  for all to authenticated
  using (private.owns_student(student_id))
  with check (private.owns_student(student_id));

-- Élève : lit la sienne (sa donnée d'étude, comme son vocabulaire).
create policy vc_select_student on public.verb_conjugations
  for select to authenticated
  using (student_id = private.current_student_id());

create trigger set_updated_at before update on public.verb_conjugations
  for each row execute function public.set_updated_at();

-- ════════════════════════════════════════════════════════════════════════════
-- Génération d'un quiz de conjugaison (QCM auto, jamais de saisie arabe libre).
-- Deux types de question :
--  • 'conjugate'    : verbe + personne cible → choisir la forme (4 formes du
--                     MÊME verbe, distinctes en valeur).
--  • 'which_person' : une forme → retrouver la personne (4 pronoms ; les
--                     distracteurs ont une forme DIFFÉRENTE de la forme montrée,
--                     donc jamais un « faux distracteur » en réalité correct).
-- Anti-triche : le payload ne marque jamais la bonne réponse. La correction est
-- recalculée côté serveur depuis la table (submit_conjugation_quiz).
-- ════════════════════════════════════════════════════════════════════════════
create or replace function public.generate_conjugation_quiz(
  p_student_id uuid,
  p_tense      text default null,
  p_size       int  default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student     uuid;
  v_pool        int;
  v_size        int;
  v_questions   jsonb := '[]'::jsonb;
  v_slot        record;
  v_persons     text[];
  v_forms       text[];
  v_correct     text;
  v_qtype       text;
  v_choices     text[];
  v_distractors text[];
  v_dforms      text[];
begin
  v_student := private.current_student_id();
  if v_student is null or v_student <> p_student_id then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;

  select count(*) into v_pool
  from public.verb_conjugations vc
  where vc.student_id = p_student_id
    and (p_tense is null or vc.tense = p_tense);

  v_size := coalesce(p_size, least(10, greatest(4, v_pool * 2)));

  for v_slot in
    select vc.id, vc.vocab_id, vc.tense, vc.forms,
           v.arabic_word, v.french_definition,
           k as person_code, vc.forms->>k as form
    from   public.verb_conjugations vc
    join   public.vocabulary v on v.id = vc.vocab_id
    cross join lateral jsonb_object_keys(vc.forms) as k
    where  vc.student_id = p_student_id
      and  (p_tense is null or vc.tense = p_tense)
      and  coalesce(vc.forms->>k, '') <> ''
    order by random()
    limit v_size
  loop
    -- Toutes les paires (personne, forme) non vides de cette ligne.
    select array_agg(key), array_agg(val)
      into v_persons, v_forms
    from (
      select key, value as val
      from jsonb_each_text(v_slot.forms)
      where coalesce(value, '') <> ''
    ) s;

    v_correct := v_slot.form;
    v_qtype := case when random() < 0.5 then 'conjugate' else 'which_person' end;

    -- ── Type « conjugate » ────────────────────────────────────────────────────
    if v_qtype = 'conjugate' then
      select array_agg(f order by random()) into v_distractors
      from (select distinct unnest(v_forms) as f) d
      where f <> v_correct;

      if v_distractors is null or array_length(v_distractors, 1) < 3 then
        v_qtype := 'which_person';   -- pas assez de formes distinctes → bascule
      else
        v_choices := (select array_agg(c order by random())
                      from unnest((v_distractors)[1:3] || array[v_correct]) as c);
        v_questions := v_questions || jsonb_build_object(
          'qtype', 'conjugate',
          'vocab_id', v_slot.vocab_id,
          'tense', v_slot.tense,
          'person_code', v_slot.person_code,
          'verb_ar', coalesce(v_slot.forms->>'huwa', v_slot.arabic_word),
          'verb_fr', v_slot.french_definition,
          'choices', to_jsonb(v_choices)
        );
        continue;
      end if;
    end if;

    -- ── Type « which_person » (avec repli conjugate si trop ambigu) ────────────
    select array_agg(p order by random()) into v_distractors
    from unnest(v_persons, v_forms) as t(p, f)
    where f <> v_correct;

    if v_distractors is null or array_length(v_distractors, 1) < 3 then
      -- repli : conjugate si possible, sinon on saute la question
      select array_agg(f order by random()) into v_dforms
      from (select distinct unnest(v_forms) as f) d
      where f <> v_correct;
      if v_dforms is null or array_length(v_dforms, 1) < 3 then
        continue;
      end if;
      v_choices := (select array_agg(c order by random())
                    from unnest((v_dforms)[1:3] || array[v_correct]) as c);
      v_questions := v_questions || jsonb_build_object(
        'qtype', 'conjugate',
        'vocab_id', v_slot.vocab_id,
        'tense', v_slot.tense,
        'person_code', v_slot.person_code,
        'verb_ar', coalesce(v_slot.forms->>'huwa', v_slot.arabic_word),
        'verb_fr', v_slot.french_definition,
        'choices', to_jsonb(v_choices)
      );
      continue;
    end if;

    v_choices := (select array_agg(c order by random())
                  from unnest((v_distractors)[1:3] || array[v_slot.person_code]) as c);
    v_questions := v_questions || jsonb_build_object(
      'qtype', 'which_person',
      'vocab_id', v_slot.vocab_id,
      'tense', v_slot.tense,
      'shown_form', v_correct,
      'choices', to_jsonb(v_choices)
    );
  end loop;

  return v_questions;
end;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- Correction d'un quiz de conjugaison. La bonne réponse est TOUJOURS recalculée
-- côté serveur depuis la table (jamais fournie par le client).
--  • 'conjugate'    : chosen = forme choisie ; correct = forms->>person_code.
--  • 'which_person' : chosen = person_code choisi ; correct dès que la forme du
--                     pronom choisi == forme montrée (gère l'ambiguïté : تَكْتُبُ
--                     est أنتَ ET هي → les deux comptent juste).
-- ════════════════════════════════════════════════════════════════════════════
create or replace function public.submit_conjugation_quiz(
  p_student_id uuid,
  p_answers    jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student     uuid;
  v_score       int := 0;
  v_total       int;
  v_quiz_id     uuid;
  v_attempt_id  uuid;
  v_enriched    jsonb := '[]'::jsonb;
  v_idx         int;
  v_item        jsonb;
  v_qtype       text;
  v_vocab_id    uuid;
  v_tense       text;
  v_forms       jsonb;
  v_arabic      text;
  v_french      text;
  v_person      text;
  v_chosen      text;
  v_correct     text;
  v_chosen_form text;
  v_is_correct  boolean;
begin
  v_student := private.current_student_id();
  if v_student is null or v_student <> p_student_id then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;

  insert into public.quizzes (scope, source_type, title)
  values ('individual', 'conjugation', 'Conjugaison auto')
  returning id into v_quiz_id;

  v_total := jsonb_array_length(p_answers);

  for v_idx in 0 .. v_total - 1 loop
    v_item     := p_answers -> v_idx;
    v_qtype    := v_item ->> 'qtype';
    v_vocab_id := (v_item ->> 'vocab_id')::uuid;
    v_tense    := v_item ->> 'tense';
    v_chosen   := v_item ->> 'chosen';

    -- Charge la table de conjugaison (scopée à l'élève → aucune fuite).
    select vc.forms, v.arabic_word, v.french_definition
      into v_forms, v_arabic, v_french
    from public.verb_conjugations vc
    join public.vocabulary v on v.id = vc.vocab_id
    where vc.vocab_id = v_vocab_id and vc.tense = v_tense
      and vc.student_id = p_student_id;

    if v_qtype = 'which_person' then
      v_chosen_form := v_forms ->> v_chosen;                 -- forme du pronom choisi
      v_correct     := v_item ->> 'shown_form';              -- forme montrée
      v_is_correct  := v_chosen_form is not null and v_chosen_form = v_correct;
      if v_is_correct then v_score := v_score + 1; end if;
      v_enriched := v_enriched || jsonb_build_object(
        'qtype', 'which_person',
        'tense', v_tense,
        'shown_form', v_correct,
        'chosen', v_chosen,                                  -- person_code choisi
        'chosen_form', v_chosen_form,
        'correct_person', (
          select k from jsonb_each_text(v_forms) as e(k, val)
          where val = v_correct order by k limit 1
        ),
        'is_correct', v_is_correct
      );
    else
      v_person     := v_item ->> 'person_code';
      v_correct    := v_forms ->> v_person;                  -- forme attendue
      v_is_correct := v_correct is not null and v_correct = v_chosen;
      if v_is_correct then v_score := v_score + 1; end if;
      v_enriched := v_enriched || jsonb_build_object(
        'qtype', 'conjugate',
        'tense', v_tense,
        'person_code', v_person,
        'verb_ar', coalesce(v_forms->>'huwa', v_arabic),
        'verb_fr', v_french,
        'chosen', v_chosen,
        'correct', v_correct,
        'is_correct', v_is_correct
      );
    end if;
  end loop;

  insert into public.quiz_attempts (student_id, quiz_id, score, answers, taken_at)
  values (
    p_student_id,
    v_quiz_id,
    case when v_total > 0 then (v_score::numeric / v_total) else 0::numeric end,
    v_enriched,
    now()
  )
  returning id into v_attempt_id;

  return jsonb_build_object(
    'score',           v_score,
    'total',           v_total,
    'quiz_attempt_id', v_attempt_id,
    'answers',         v_enriched
  );
end;
$$;

grant execute on function public.generate_conjugation_quiz(uuid, text, int) to authenticated;
grant execute on function public.submit_conjugation_quiz(uuid, jsonb) to authenticated;
