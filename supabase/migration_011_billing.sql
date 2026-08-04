-- TableConnect NFC — migration : abonnement payant du restaurateur à la plateforme
-- (à distinguer du compte Stripe Connect, qui sert à encaisser les clients du restaurant).
-- À exécuter une fois dans le SQL Editor, en plus des migrations précédentes.

alter table restaurants add column if not exists stripe_customer_id text;
alter table restaurants add column if not exists stripe_subscription_id text;
alter table restaurants add column if not exists subscription_status text not null default 'inactive'
  check (subscription_status in ('inactive', 'active', 'past_due', 'canceled'));
alter table restaurants add column if not exists subscription_plan text
  check (subscription_plan is null or subscription_plan in ('monthly', 'annual_monthly', 'annual_upfront'));

-- Ces colonnes suivent la même logique de protection que stripe_account_id/stripe_onboarded :
-- seules les Edge Functions (via service_role) doivent pouvoir les modifier, jamais le client
-- directement, pour qu'un restaurateur ne puisse pas se donner un faux statut "actif".
create or replace function protect_billing_columns()
returns trigger as $$
begin
  if auth.role() is distinct from 'service_role' then
    new.stripe_customer_id := old.stripe_customer_id;
    new.stripe_subscription_id := old.stripe_subscription_id;
    new.subscription_status := old.subscription_status;
    new.subscription_plan := old.subscription_plan;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists protect_billing_columns_trigger on restaurants;
create trigger protect_billing_columns_trigger
  before update on restaurants
  for each row execute function protect_billing_columns();
