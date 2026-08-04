const DIACRITICS_PATTERN = /[̀-ͯ]/g;

export function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(DIACRITICS_PATTERN, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'restaurant'
  );
}
