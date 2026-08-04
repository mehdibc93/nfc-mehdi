// Catalogue des vidéos d'introduction disponibles (phase "cinématique" à l'ouverture de la carte).
// Pour ajouter une vidéo : dépose le fichier .mp4 dans public/video/, puis ajoute une entrée ici.
// Specs conseillées : format vertical 9:16, 5-10s en boucle, sans texte incrusté, < 8 Mo.

export type IntroVideo = {
  id: string;
  label: string;
  file: string;
};

export const INTRO_VIDEOS: IntroVideo[] = [
  { id: 'bistro', label: 'Bistro traditionnel', file: '/video/kling_20260729_VIDEO_genere_une_1130_0.mp4' },
];

export const DEFAULT_INTRO_VIDEO = INTRO_VIDEOS[0];

export function getIntroVideo(id: string | null): IntroVideo {
  return INTRO_VIDEOS.find((video) => video.id === id) ?? DEFAULT_INTRO_VIDEO;
}
