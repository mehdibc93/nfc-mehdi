import type { MenuService } from './types';

export const MENU_SERVICES: { key: MenuService; label: string; icon: string }[] = [
  { key: 'all_day', label: 'Toute la journée', icon: '🌞' },
  { key: 'lunch', label: 'Menu midi', icon: '🥗' },
  { key: 'dinner', label: 'Menu soir', icon: '🌙' },
];

function parseTimeToMinutes(value: string | null): number | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function isWithinWindow(nowMinutes: number, start: string | null, end: string | null): boolean {
  const startMin = parseTimeToMinutes(start);
  const endMin = parseTimeToMinutes(end);
  if (startMin === null || endMin === null) return false;
  if (startMin <= endMin) return nowMinutes >= startMin && nowMinutes <= endMin;
  // Créneau qui traverse minuit (ex : 18:00 -> 01:00)
  return nowMinutes >= startMin || nowMinutes <= endMin;
}

type ScheduleFields = {
  lunchStart: string | null;
  lunchEnd: string | null;
  dinnerStart: string | null;
  dinnerEnd: string | null;
  lunchEnabled: boolean;
  dinnerEnabled: boolean;
};

// Renvoie la liste des services actuellement actifs ('all_day' toujours inclus), ou `null` si
// le restaurateur n'a configuré aucun horaire (ou a désactivé le créneau) — dans ce cas, aucun
// filtrage n'est appliqué et tous les plats restent visibles, quel que soit leur créneau
// (comportement rétrocompatible).
export function getActiveMenuServices(restaurant: ScheduleFields, now: Date = new Date()): MenuService[] | null {
  const hasLunch = restaurant.lunchEnabled && Boolean(restaurant.lunchStart && restaurant.lunchEnd);
  const hasDinner = restaurant.dinnerEnabled && Boolean(restaurant.dinnerStart && restaurant.dinnerEnd);
  if (!hasLunch && !hasDinner) return null;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const active: MenuService[] = ['all_day'];
  if (hasLunch && isWithinWindow(nowMinutes, restaurant.lunchStart, restaurant.lunchEnd)) active.push('lunch');
  if (hasDinner && isWithinWindow(nowMinutes, restaurant.dinnerStart, restaurant.dinnerEnd)) active.push('dinner');
  return active;
}
