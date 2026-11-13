-- Nourevo — migration : page d'administration (nourevo.fr/admin), réservée au fondateur.
-- À exécuter une fois dans le SQL Editor, APRÈS migration_031_nfc_shipments.sql.
--
-- Le compte administrateur est celui de contact.nourevo@gmail.com (tout en bas) : il doit être
-- inscrit sur Nourevo (/inscription) AVANT d'exécuter ce script, sinon relancez juste la fin.

-- Liste des administrateurs (comptes autorisés sur /admin).
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table admins enable row level security;

-- Chacun peut seulement vérifier s'il est lui-même administrateur.
drop policy if exists "admins_self_read" on admins;
create policy "admins_self_read" on admins for select using (user_id = auth.uid());

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- L'administrateur voit et met à jour tous les envois de cartes NFC.
drop policy if exists "nfc_shipments_admin_read" on nfc_shipments;
create policy "nfc_shipments_admin_read" on nfc_shipments for select using (is_admin());

drop policy if exists "nfc_shipments_admin_update" on nfc_shipments;
create policy "nfc_shipments_admin_update" on nfc_shipments for update using (is_admin()) with check (is_admin());

-- Liste des restaurants avec l'email du compte (lu dans auth.users, inaccessible autrement depuis le site).
create or replace function admin_subscribers()
returns table (
  restaurant_id uuid,
  name text,
  slug text,
  email text,
  subscription_status text,
  subscription_plan text,
  table_count integer,
  signed_up_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then
    raise exception 'Accès réservé à l''administrateur';
  end if;
  return query
    select r.id, r.name, r.slug, u.email::text, r.subscription_status::text, r.subscription_plan::text, r.table_count, u.created_at
    from restaurants r
    left join auth.users u on u.id = r.owner_id
    order by u.created_at desc nulls last;
end;
$$;

revoke all on function admin_subscribers() from public, anon;
grant execute on function admin_subscribers() to authenticated;

-- Le compte contact.nourevo@gmail.com devient administrateur.
insert into admins (user_id)
select id from auth.users where email = 'contact.nourevo@gmail.com'
on conflict do nothing;
