// Notifications système du navigateur (API Notification) — s'affichent tant que le
// restaurateur a un onglet du dashboard ouvert quelque part (même en arrière-plan, même sur
// un autre onglet), sans avoir besoin de garder Mode Service au premier plan. Ce n'est PAS
// du push : si aucun onglet du site n'est ouvert du tout, rien n'arrive (ça demanderait un
// service worker + des clés VAPID + un serveur de push, hors périmètre pour l'instant).

let permissionRequested = false;

export function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (permissionRequested) return;
  permissionRequested = true;
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

export function showBrowserNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: '/logo192.png' });
  } catch {
    // certains environnements (ex. iOS Safari) n'implémentent pas l'API Notification
  }
}
