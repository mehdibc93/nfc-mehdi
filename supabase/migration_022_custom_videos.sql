-- Permet aux restaurateurs d'uploader leur propre vidéo d'introduction et leur propre
-- animation d'attente (au lieu de choisir uniquement parmi les modèles prédéfinis).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 20971520, array['video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "videos_public_read" on storage.objects;
create policy "videos_public_read" on storage.objects
  for select using (bucket_id = 'videos');

drop policy if exists "videos_owner_insert" on storage.objects;
create policy "videos_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "videos_owner_update" on storage.objects;
create policy "videos_owner_update" on storage.objects
  for update using (
    bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "videos_owner_delete" on storage.objects;
create policy "videos_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]
  );

alter table restaurants add column if not exists custom_intro_video text;
alter table restaurants add column if not exists custom_wait_video text;
