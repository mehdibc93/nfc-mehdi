-- TableConnect NFC — génère de fausses statistiques pour tous les restaurants déjà créés
-- par de vrais comptes (owner_id non nul, donc le restaurant de démo "Le Jardin Parisien"
-- n'est pas concerné). Utile pour voir à quoi ressemble /dashboard/stats avant d'avoir
-- de vrais visiteurs.
--
-- À exécuter une fois dans le SQL Editor de Supabase. Sans danger pour le reste des
-- données (ne touche que la table dish_events). Pour tout supprimer ensuite :
--   delete from dish_events;

do $$
declare
  d record;
  view_count int;
  cart_count int;
  purchase_count int;
  remove_count int;
  i int;
begin
  for d in
    select dishes.id, dishes.name, categories.restaurant_id
    from dishes
    join categories on categories.id = dishes.category_id
    join restaurants on restaurants.id = categories.restaurant_id
    where restaurants.owner_id is not null
  loop
    view_count := 15 + floor(random() * 60)::int;
    cart_count := floor(view_count * (0.2 + random() * 0.3))::int;
    purchase_count := floor(cart_count * (0.4 + random() * 0.4))::int;
    remove_count := greatest(cart_count - purchase_count - floor(random() * 3)::int, 0);

    for i in 1..view_count loop
      insert into dish_events (restaurant_id, dish_id, dish_name, event_type, created_at)
      values (d.restaurant_id, d.id, d.name, 'view', now() - (random() * interval '30 days'));
    end loop;

    for i in 1..cart_count loop
      insert into dish_events (restaurant_id, dish_id, dish_name, event_type, created_at)
      values (d.restaurant_id, d.id, d.name, 'add_to_cart', now() - (random() * interval '30 days'));
    end loop;

    for i in 1..purchase_count loop
      insert into dish_events (restaurant_id, dish_id, dish_name, event_type, created_at)
      values (d.restaurant_id, d.id, d.name, 'purchase', now() - (random() * interval '30 days'));
    end loop;

    for i in 1..remove_count loop
      insert into dish_events (restaurant_id, dish_id, dish_name, event_type, created_at)
      values (d.restaurant_id, d.id, d.name, 'remove_from_cart', now() - (random() * interval '30 days'));
    end loop;
  end loop;
end $$;
