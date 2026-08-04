// Supabase Edge Function — renvoie uniquement le statut d'une commande précise, pour que
// l'écran d'attente du client (page publique, non authentifiée) reflète en direct ce que
// fait le restaurateur dans le Mode Service (nouvelle -> confirmée -> servie).
//
// Volontairement minimal : ne renvoie QUE le statut (jamais le total, la table, ni les autres
// commandes) pour ne pas exposer de données commerciales du restaurant à un visiteur anonyme.
// L'accès à la table `orders` reste protégé par RLS (lecture réservée au propriétaire) ; cette
// fonction utilise la clé service_role côté serveur pour faire cette seule lecture ciblée.

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { orderId } = (await req.json()) as { orderId?: string };
    if (!orderId) {
      return json({ error: 'orderId manquant.' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase.from('orders').select('status').eq('id', orderId).maybeSingle();

    if (error || !data) {
      return json({ error: 'Commande introuvable.' }, 404);
    }

    return json({ status: data.status });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Erreur inconnue.' }, 500);
  }
});
