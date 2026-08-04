-- TableConnect NFC — migration : stockage des photos (upload direct au lieu de coller une URL)
-- À exécuter une fois dans le SQL Editor, en plus des migrations précédentes.

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Lecture publique (les photos doivent s'afficher sur la carte publique /r/:slug sans connexion).
drop policy if exists "photos_public_read" on storage.objects;
create policy "photos_public_read" on storage.objects
  for select using (bucket_id = 'photos');

-- Écriture réservée aux restaurateurs connectés, dans leur propre dossier
-- (chemin attendu : {user_id}/nom-de-fichier.jpg).
drop policy if exists "photos_owner_insert" on storage.objects;
create policy "photos_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "photos_owner_update" on storage.objects;
create policy "photos_owner_update" on storage.objects
  for update using (
    bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "photos_owner_delete" on storage.objects;
create policy "photos_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]
  );
