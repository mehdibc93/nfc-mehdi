-- TableConnect NFC — migration : paiements Stripe Connect
-- À exécuter une fois dans le SQL Editor, en plus des migrations précédentes.

alter table restaurants add column if not exists stripe_account_id text;
alter table restaurants add column if not exists stripe_onboarded boolean not null default false;

-- stripe_account_id / stripe_onboarded ne doivent être modifiés que par les Edge Functions
-- (via la clé service_role) — jamais directement par le restaurateur depuis le dashboard,
-- pour qu'il ne puisse pas se donner un faux badge "connecté" en appelant l'API Supabase
-- directement. Un trigger restaure ces deux colonnes à leur valeur précédente pour toute
-- écriture qui ne vient pas du service_role (les policies RLS ne peuvent pas comparer
-- ancienne/nouvelle valeur d'une colonne, un trigger si).
create or replace function protect_stripe_columns()
returns trigger as $$
begin
  if auth.role() is distinct from 'service_role' then
    new.stripe_account_id := old.stripe_account_id;
    new.stripe_onboarded := old.stripe_onboarded;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists protect_stripe_columns_trigger on restaurants;
create trigger protect_stripe_columns_trigger
  before update on restaurants
  for each row execute function protect_stripe_columns();
