// Déclaration JSX pour le web component <model-viewer> (@google/model-viewer), chargé
// dynamiquement uniquement quand un plat a un modèle 3D — voir RestaurantExperience.tsx.
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        'ios-src'?: string;
        alt?: string;
        ar?: boolean;
        'ar-modes'?: string;
        'camera-controls'?: boolean;
        'auto-rotate'?: boolean;
        'shadow-intensity'?: string;
        reveal?: string;
        loading?: string;
        poster?: string;
        exposure?: string;
      };
    }
  }
}

export {};
