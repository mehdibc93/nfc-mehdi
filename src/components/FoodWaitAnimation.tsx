import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import foodAnimationUrl from '../assets/food.lottie?url';

// Animation Lottie (aliments qui virevoltent au-dessus d'une poêle) — une des options de la
// bibliothèque d'animations d'attente (voir src/lib/waitAnimations.ts).
export function FoodWaitAnimation({ className }: { className?: string }) {
  return <DotLottieReact src={foodAnimationUrl} loop autoplay className={className} />;
}
