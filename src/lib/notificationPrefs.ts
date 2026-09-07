// Préférence "notifications de nouvelle commande" (son + popup système) — un réglage
// personnel de l'appareil/navigateur, mémorisé en local comme la langue du dashboard.
// Activée par défaut ; le restaurateur peut la couper depuis Configuration.

const STORAGE_KEY = 'nourevo_notifications_enabled';

export function areNotificationsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(STORAGE_KEY) !== '0';
}

export function setNotificationsEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
}
