import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { RestaurantWithMenu } from '../lib/types';
import { supabase } from '../lib/supabaseClient';
import { useDt } from '../lib/dashboardLocale';
import { whatsappHref } from '../lib/site';

// Envoi des cartes NFC : le restaurateur abonné indique où les envoyer (table privée
// `nfc_shipments`, voir migration_031). Un bouton WhatsApp prévient Nourevo avec toutes les infos.

type Shipment = {
  contact_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  postal_code: string;
  city: string;
  country: string;
  cards_count: number;
  notes: string;
  status: 'to_ship' | 'shipped';
  shipped_at: string | null;
};

const EMPTY = { contact_name: '', phone: '', address_line1: '', address_line2: '', postal_code: '', city: '', country: 'France', notes: '' };

export function NfcShippingCard({ restaurant }: { restaurant: RestaurantWithMenu }) {
  const dt = useDt();
  // undefined : chargement · null : rien de renseigné · 'unavailable' : migration pas encore faite.
  const [shipment, setShipment] = useState<Shipment | null | undefined | 'unavailable'>(undefined);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...EMPTY, cards_count: String(Math.max(1, restaurant.tableCount)) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('nfc_shipments')
      .select('contact_name, phone, address_line1, address_line2, postal_code, city, country, cards_count, notes, status, shipped_at')
      .eq('restaurant_id', restaurant.id)
      .maybeSingle()
      .then(({ data, error: loadError }) => {
        if (cancelled) return;
        if (loadError) {
          setShipment('unavailable');
          return;
        }
        setShipment((data as Shipment | null) ?? null);
        if (data) {
          const row = data as Shipment;
          setForm({ ...row, cards_count: String(row.cards_count) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [restaurant.id]);

  if (shipment === undefined || shipment === 'unavailable') return null;

  const set = (field: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [field]: value }));

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const cards = Number(form.cards_count);
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (!form.contact_name.trim() || !form.address_line1.trim() || !form.postal_code.trim() || !form.city.trim()) {
      setError(dt('Merci de remplir tous les champs obligatoires.', 'Please fill in all required fields.'));
      return;
    }
    if (phoneDigits.length < 9) {
      setError(dt('Le numéro de téléphone semble incomplet.', 'The phone number looks incomplete.'));
      return;
    }
    if (!Number.isInteger(cards) || cards < 1 || cards > 200) {
      setError(dt('Indiquez un nombre de cartes entre 1 et 200.', 'Enter a number of cards between 1 and 200.'));
      return;
    }
    setSaving(true);
    const row = {
      restaurant_id: restaurant.id,
      contact_name: form.contact_name.trim(),
      phone: form.phone.trim(),
      address_line1: form.address_line1.trim(),
      address_line2: form.address_line2.trim(),
      postal_code: form.postal_code.trim(),
      city: form.city.trim(),
      country: form.country.trim() || 'France',
      cards_count: cards,
      notes: form.notes.trim(),
      updated_at: new Date().toISOString(),
    };
    const { error: saveError } = await supabase.from('nfc_shipments').upsert(row, { onConflict: 'restaurant_id' });
    setSaving(false);
    if (saveError) {
      setError(dt('L’enregistrement a échoué. Réessayez dans un instant.', 'Saving failed. Please try again.'));
      return;
    }
    setShipment({ ...row, status: 'to_ship', shipped_at: null });
    setEditing(false);
  };

  const whatsappMessage = (current: Shipment) =>
    [
      'Bonjour, je viens de m’abonner à Nourevo 👋',
      `Restaurant : ${restaurant.name}`,
      `Cartes NFC à envoyer : ${current.cards_count}`,
      `Contact : ${current.contact_name} · ${current.phone}`,
      `Adresse : ${current.address_line1}${current.address_line2 ? `, ${current.address_line2}` : ''}, ${current.postal_code} ${current.city}, ${current.country}`,
      current.notes ? `Précisions : ${current.notes}` : '',
    ]
      .filter(Boolean)
      .join('\n');

  // Cartes expédiées : simple confirmation.
  if (shipment && shipment.status === 'shipped') {
    return (
      <section className="flex items-center gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
        <span className="text-3xl">📬</span>
        <div>
          <p className="font-display font-bold text-emerald-900">{dt('Vos cartes NFC sont en route', 'Your NFC cards are on their way')}</p>
          <p className="mt-0.5 text-sm text-emerald-800">
            {shipment.cards_count} {dt('carte(s) envoyée(s)', 'card(s) shipped')}
            {shipment.shipped_at ? ` ${dt('le', 'on')} ${new Date(shipment.shipped_at).toLocaleDateString('fr-FR')}` : ''} · {shipment.address_line1},{' '}
            {shipment.postal_code} {shipment.city}
          </p>
        </div>
      </section>
    );
  }

  // Adresse déjà renseignée : récapitulatif.
  if (shipment && !editing) {
    return (
      <section className="rounded-3xl border border-stone-200/70 bg-white p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-2xl">📦</span>
            <div>
              <p className="font-display font-bold text-stone-900">{dt('Vos cartes NFC sont en préparation', 'Your NFC cards are being prepared')}</p>
              <p className="mt-1 text-sm text-stone-600">
                {shipment.cards_count} {dt('carte(s)', 'card(s)')} · {shipment.contact_name} · {shipment.phone}
              </p>
              <p className="text-sm text-stone-500">
                {shipment.address_line1}
                {shipment.address_line2 ? `, ${shipment.address_line2}` : ''}, {shipment.postal_code} {shipment.city}
              </p>
            </div>
          </div>
          <button type="button" onClick={() => setEditing(true)} className="text-sm font-bold text-navy-700">
            {dt('Modifier', 'Edit')}
          </button>
        </div>
        <a
          href={whatsappHref(whatsappMessage(shipment))}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
        >
          💬 {dt('Prévenir Nourevo sur WhatsApp', 'Notify Nourevo on WhatsApp')}
        </a>
        <p className="mt-2 text-xs text-stone-400">
          {dt('Nous vous contactons à ce numéro si besoin, avant l’envoi.', 'We will call this number if needed before shipping.')}
        </p>
      </section>
    );
  }

  // Formulaire (premier renseignement ou modification).
  const input = (field: keyof typeof form, label: string, opts: { required?: boolean; type?: string; placeholder?: string; className?: string } = {}) => (
    <label className={`block text-xs font-semibold text-stone-600 ${opts.className ?? ''}`}>
      {label}
      {opts.required && <span className="text-red-500"> *</span>}
      <input
        type={opts.type ?? 'text'}
        value={form[field]}
        placeholder={opts.placeholder}
        onChange={(event) => set(field)(event.target.value)}
        className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-normal text-stone-800 outline-none focus:border-navy-300"
      />
    </label>
  );

  return (
    <section className="rounded-3xl border-2 border-amber-300 bg-amber-50/60 p-5 sm:p-6">
      <div className="flex gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-soft">📦</span>
        <div>
          <p className="font-display text-lg font-bold text-stone-900">{dt('Où envoyer vos cartes NFC ?', 'Where should we send your NFC cards?')}</p>
          <p className="mt-0.5 text-sm text-stone-600">
            {dt(
              'Vos cartes sont incluses dans l’abonnement. Indiquez l’adresse de livraison et un numéro pour vous joindre.',
              'Your cards are included in your subscription. Tell us the delivery address and a phone number.',
            )}
          </p>
        </div>
      </div>
      <form onSubmit={save} className="mt-5 grid gap-3 sm:grid-cols-2">
        {input('contact_name', dt('Nom du contact', 'Contact name'), { required: true, placeholder: 'Sarah Martin' })}
        {input('phone', dt('Téléphone', 'Phone'), { required: true, type: 'tel', placeholder: '06 12 34 56 78' })}
        {input('address_line1', dt('Adresse', 'Address'), { required: true, placeholder: '14 rue des Vertus', className: 'sm:col-span-2' })}
        {input('address_line2', dt('Complément (étage, code…)', 'Address line 2'), { className: 'sm:col-span-2' })}
        {input('postal_code', dt('Code postal', 'Postal code'), { required: true, placeholder: '75003' })}
        {input('city', dt('Ville', 'City'), { required: true, placeholder: 'Paris' })}
        {input('cards_count', dt('Nombre de cartes (une par table)', 'Number of cards (one per table)'), { required: true, type: 'number' })}
        {input('country', dt('Pays', 'Country'))}
        {input('notes', dt('Précisions (facultatif)', 'Notes (optional)'), { placeholder: dt('Horaires de livraison, interphone…', 'Delivery hours, intercom…'), className: 'sm:col-span-2' })}
        {error && <p className="text-sm font-semibold text-red-600 sm:col-span-2">{error}</p>}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-gradient-to-r from-navy-600 via-navy-700 to-navy-800 px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? dt('Enregistrement…', 'Saving…') : dt('Enregistrer l’adresse d’envoi', 'Save the delivery address')}
          </button>
          {shipment && (
            <button type="button" onClick={() => setEditing(false)} className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-600">
              {dt('Annuler', 'Cancel')}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
