-- Les photos de profil (bucket privé "avatars") n'étaient lisibles que par
-- leur propriétaire (avatars_owner_all, ALL commands, dossier = son propre
-- auth.uid()). Le propriétaire veut désormais voir la photo de son
-- enseignant/élève dans les messages, et l'admin voir la photo de chaque
-- enseignant dans "Enseignants". Ajout de 3 policies SELECT-only additives
-- (s'ajoutent en OR à avatars_owner_all, ne retirent aucun droit existant —
-- l'écriture reste strictement réservée au propriétaire du dossier).

create policy "avatars_teacher_read_students" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and private.current_teacher_id() is not null
    and exists (
      select 1 from public.students s
      where s.profile_id::text = (storage.foldername(name))[1]
        and s.teacher_id = private.current_teacher_id()
    )
  );

create policy "avatars_student_read_teacher" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and private.current_student_id() is not null
    and exists (
      select 1 from public.students s
      join public.teachers t on t.id = s.teacher_id
      where s.id = private.current_student_id()
        and t.profile_id::text = (storage.foldername(name))[1]
    )
  );

create policy "avatars_admin_read_all" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and private.is_admin());
