-- Nourevo — migration : plat affichable en réalité augmentée (le client pose le modèle 3D sur
-- sa table via la caméra de son téléphone — Scene Viewer sur Android via un fichier .glb,
-- Quick Look sur iPhone via un fichier .usdz). Facultatif : sans modèle, la fiche plat reste
-- inchangée (juste des photos), aucun impact sur les restaurants qui n'utilisent pas cette
-- fonctionnalité.
-- À exécuter une fois dans le SQL Editor, en plus des migrations précédentes.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'models',
  'models',
  true,
  20971520,
  array['model/gltf-binary', 'model/gltf+json', 'model/vnd.usdz+zip', 'model/usd', 'application/octet-stream', 'application/zip']
)
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "models_public_read" on storage.objects;
create policy "models_public_read" on storage.objects
  for select using (bucket_id = 'models');

drop policy if exists "models_owner_insert" on storage.objects;
create policy "models_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'models' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "models_owner_update" on storage.objects;
create policy "models_owner_update" on storage.objects
  for update using (
    bucket_id = 'models' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "models_owner_delete" on storage.objects;
create policy "models_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'models' and auth.uid()::text = (storage.foldername(name))[1]
  );

alter table dishes add column if not exists ar_model_url text;
alter table dishes add column if not exists ar_model_ios_url text;
