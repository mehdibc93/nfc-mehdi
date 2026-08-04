import { supabase } from './supabaseClient';

const PHOTOS_BUCKET = 'photos';
const VIDEOS_BUCKET = 'videos';

const MAX_IMAGE_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;
const SKIP_COMPRESSION_UNDER_BYTES = 300 * 1024;

// Réduit la taille des photos avant envoi (redimensionnement + recompression JPEG) — le
// stockage et la bande passante Supabase sont limités sur le plan gratuit, et les photos
// envoyées telles quelles (souvent plusieurs Mo depuis un téléphone) sont de loin le plus gros
// poste de consommation. On garde le fichier d'origine si la compression échoue ou n'aide pas
// (ex : petit fichier déjà léger, format non supporté par le navigateur).
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return file;
  if (file.size <= SKIP_COMPRESSION_UNDER_BYTES) return file;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!blob || blob.size >= file.size) return file;

    const newName = `${file.name.replace(/\.[^./]+$/, '')}.jpg`;
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

export async function uploadPhoto(file: File, userId: string): Promise<string> {
  const compressed = await compressImage(file);
  const ext = compressed.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(PHOTOS_BUCKET).upload(path, compressed, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Limite alignée sur le bucket Supabase (voir migration_022_custom_videos.sql) — vérifiée
// côté client d'abord pour donner un message clair plutôt que l'erreur brute du stockage.
export const MAX_VIDEO_SIZE_MB = 20;

export async function uploadVideo(file: File, userId: string): Promise<string> {
  if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
    throw new Error(`Vidéo trop lourde (max ${MAX_VIDEO_SIZE_MB} Mo).`);
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(VIDEOS_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(VIDEOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
