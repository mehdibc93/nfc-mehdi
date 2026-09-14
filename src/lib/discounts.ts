// Réductions automatiques par jour/horaire (ex: "-10% tous les mardis", "happy hour -20% de
// 17h à 19h") — voir migration_025_discount_rules.sql. Toujours évaluées en heure de Paris,
// indépendamment du fuseau du serveur ou de l'appareil du client, pour que la règle déclenche
// au même moment partout (la même logique est dupliquée côté Edge Function
// create-payment-intent, qui reste la source de vérité pour le montant réellement facturé).

import type { DiscountRule } from './types';

const RESTAURANT_TIMEZONE = 'Europe/Paris';
const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function getParisNow(now: Date = new Date()): { weekday: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: RESTAURANT_TIMEZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const weekdayShort = parts.find((part) => part.type === 'weekday')?.value ?? 'Sun';
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0') % 24;
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
  return { weekday: WEEKDAY_INDEX[weekdayShort] ?? 0, minutes: hour * 60 + minute };
}

function parseTimeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function isRuleActiveNow(rule: DiscountRule, now: Date = new Date()): boolean {
  if (!rule.active) return false;
  const { weekday, minutes } = getParisNow(now);
  if (!rule.daysOfWeek.includes(weekday)) return false;
  if (!rule.startTime || !rule.endTime) return true;
  const start = parseTimeToMinutes(rule.startTime);
  const end = parseTimeToMinutes(rule.endTime);
  if (start === null || end === null) return true;
  if (start <= end) return minutes >= start && minutes < end;
  // Plage à cheval sur minuit (ex: 22:00 -> 02:00)
  return minutes >= start || minutes < end;
}

// Si plusieurs règles sont actives en même temps, on applique la plus avantageuse pour le
// client plutôt que de les cumuler — évite un cumul non prévu par erreur de configuration.
export function getActiveDiscountPercent(rules: DiscountRule[], now: Date = new Date()): number {
  const active = rules.filter((rule) => isRuleActiveNow(rule, now));
  if (active.length === 0) return 0;
  return Math.max(...active.map((rule) => rule.percent));
}

export function applyDiscount(price: number, percent: number): number {
  if (percent <= 0) return price;
  return Math.round(price * (1 - percent / 100) * 100) / 100;
}

export const DAY_LABELS_SHORT: { value: number; fr: string; en: string }[] = [
  { value: 1, fr: 'Lun', en: 'Mon' },
  { value: 2, fr: 'Mar', en: 'Tue' },
  { value: 3, fr: 'Mer', en: 'Wed' },
  { value: 4, fr: 'Jeu', en: 'Thu' },
  { value: 5, fr: 'Ven', en: 'Fri' },
  { value: 6, fr: 'Sam', en: 'Sat' },
  { value: 0, fr: 'Dim', en: 'Sun' },
];
