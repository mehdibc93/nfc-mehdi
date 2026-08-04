-- Nourevo — migration : suivi de stock par plat (facultatif)
-- NULL = stock illimité (comportement actuel, inchangé). Une valeur numérique active le
-- suivi : quand elle atteint 0, le plat disparaît entièrement de la carte publique (différent
-- de la case "Rupture de stock" existante, qui grise le plat mais le laisse visible).
-- À exécuter une fois dans le SQL Editor, en plus des migrations précédentes.

alter table dishes add column if not exists stock_quantity integer check (stock_quantity is null or stock_quantity >= 0);

-- Décrémente le stock de façon atomique (évite qu'une commande simultanée fasse passer le
-- stock sous zéro). Appelée par le client au moment de la commande — SECURITY DEFINER pour
-- pouvoir modifier `dishes` malgré la policy RLS qui réserve l'écriture au propriétaire.
create or replace function decrement_dish_stock(p_dish_id uuid, p_qty integer)
returns void as $$
begin
  update dishes
  set stock_quantity = greatest(stock_quantity - p_qty, 0)
  where id = p_dish_id and stock_quantity is not null;
end;
$$ language plpgsql security definer;

grant execute on function decrement_dish_stock(uuid, integer) to anon, authenticated;
