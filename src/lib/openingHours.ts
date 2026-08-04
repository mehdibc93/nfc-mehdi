import type { DayHours, DayKey, OpeningHours } from './types';

export const DAY_KEYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Lundi',
  tue: 'Mardi',
  wed: 'Mercredi',
  thu: 'Jeudi',
  fri: 'Vendredi',
  sat: 'Samedi',
  sun: 'Dimanche',
};

// Date.getDay() renvoie 0 pour dimanche, 1 pour lundi, etc.
const JS_DAY_TO_KEY: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function defaultOpeningHours(): OpeningHours {
  return DAY_KEYS.reduce((acc, key) => {
    acc[key] = { closed: false, open: '09:00', close: '22:00' };
    return acc;
  }, {} as OpeningHours);
}

function parseTimeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function isWithinWindow(nowMinutes: number, hours: DayHours): boolean {
  if (hours.closed) return false;
  const startMin = parseTimeToMinutes(hours.open);
  const endMin = parseTimeToMinutes(hours.close);
  if (startMin === null || endMin === null) return false;
  if (startMin <= endMin) return nowMinutes >= startMin && nowMinutes <= endMin;
  // Créneau qui traverse minuit (ex : 18:00 -> 01:00)
  return nowMinutes >= startMin || nowMinutes <= endMin;
}

export type OpenStatus = { isOpen: boolean; label: string; today: DayHours };

// Renvoie `null` si le restaurateur n'a configuré aucun horaire d'ouverture — dans ce cas,
// aucun badge n'est affiché côté client (comportement rétrocompatible).
export function getOpenStatus(openingHours: OpeningHours | null, now: Date = new Date()): OpenStatus | null {
  if (!openingHours) return null;
  const todayKey = JS_DAY_TO_KEY[now.getDay()];
  const today = openingHours[todayKey];
  if (!today) return null;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isOpen = isWithinWindow(nowMinutes, today);

  if (today.closed) return { isOpen: false, label: 'Fermé aujourd\'hui', today };
  if (isOpen) return { isOpen: true, label: `Ouvert jusqu'à ${today.close}`, today };
  return { isOpen: false, label: `Fermé — ouvre à ${today.open}`, today };
}
