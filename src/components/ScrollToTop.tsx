import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Remonte en haut de la page à chaque changement de page (navigation côté client). Les liens
// avec ancre (#...) gardent leur comportement : le navigateur défile jusqu'à l'ancre.
export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    // `instant` : le site défile en douceur (scroll-behavior: smooth), pas lors d'un changement de page.
    if (!hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
}
