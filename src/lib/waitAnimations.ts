// Catalogue des animations affichées sur l'écran "commande en préparation" (temps d'attente).

export type WaitAnimationId = 'chef' | 'food';

export const WAIT_ANIMATIONS: { id: WaitAnimationId; label: string }[] = [
  { id: 'chef', label: 'Illustration cuisinier' },
  { id: 'food', label: 'Animation aliments' },
];

export const DEFAULT_WAIT_ANIMATION: WaitAnimationId = 'chef';

export function getWaitAnimationId(id: string | null): WaitAnimationId {
  return WAIT_ANIMATIONS.some((animation) => animation.id === id) ? (id as WaitAnimationId) : DEFAULT_WAIT_ANIMATION;
}
