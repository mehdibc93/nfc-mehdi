// Traduction automatique via l'API gratuite MyMemory (pas de clé requise, usage limité).
// Qualité correcte pour une première version — pour une traduction de meilleure qualité,
// remplacer translateText par un appel à un service payant (DeepL, Google Cloud Translation...).
export const TARGET_LANGS = ['en', 'es', 'zh', 'ru'] as const;
export type TargetLang = (typeof TARGET_LANGS)[number];

async function translateText(text: string, targetLang: TargetLang): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return '';
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=fr|${targetLang}`;
    const response = await fetch(url);
    const data = await response.json();
    const translated = data?.responseData?.translatedText;
    return typeof translated === 'string' && translated.trim() ? translated : trimmed;
  } catch {
    return trimmed;
  }
}

async function translateList(items: string[], targetLang: TargetLang): Promise<string[]> {
  const results = await Promise.all(items.map((item) => translateText(item, targetLang)));
  return results;
}

export async function translateDishFields(name: string, description: string) {
  const translations: Record<string, { name: string; description: string }> = {};
  await Promise.all(
    TARGET_LANGS.map(async (lang) => {
      const [translatedName, translatedDescription] = await Promise.all([
        translateText(name, lang),
        translateText(description, lang),
      ]);
      translations[lang] = { name: translatedName, description: translatedDescription };
    }),
  );
  return translations;
}

export async function translateRestaurantFields(name: string, address: string, tags: string[]) {
  const translations: Record<string, { name: string; address: string; tags: string[] }> = {};
  await Promise.all(
    TARGET_LANGS.map(async (lang) => {
      const [translatedName, translatedAddress, translatedTags] = await Promise.all([
        translateText(name, lang),
        translateText(address, lang),
        translateList(tags, lang),
      ]);
      translations[lang] = { name: translatedName, address: translatedAddress, tags: translatedTags };
    }),
  );
  return translations;
}
