import 'server-only';
import { getDb } from '@/lib/db/mongo';
import { cached } from '@/lib/db/cache';
import type { Metadata } from 'next';
import { DEFAULT_LOCALE, type Locale, type TranslatedFields } from '@/lib/i18n/locales';
import { alternatesFor } from '@/lib/seo/share';

export type TranslationKind = 'blog' | 'analysis' | 'ipo';

const collection = async () => (await getDb()).collection('translations');

/** Every translation of one kind in one language, by source id, without blog bodies. */
export const getTranslationMap = cached(async (kind: TranslationKind, lang: Locale): Promise<Record<string, TranslatedFields>> => {
  if (lang === DEFAULT_LOCALE) return {};
  const docs = await (await collection()).find({ kind, lang }, { projection: { _id: 0, 'fields.content': 0 } }).toArray();
  return Object.fromEntries(docs.map((doc) => [doc.source_id, doc.fields]));
}, 'translation-map');

/** One document's translation, body included, or null when the engine has not written it yet. */
export const getTranslation = cached(async (kind: TranslationKind, sourceId: string, lang: Locale): Promise<TranslatedFields | null> => {
  if (lang === DEFAULT_LOCALE) return null;
  const doc = await (await collection()).findOne({ kind, source_id: sourceId, lang }, { projection: { fields: 1 } });
  return doc?.fields ?? null;
}, 'translation');

/** The languages a document can be read in: English plus every stored translation. */
export const getTranslatedLocales = cached(async (kind: TranslationKind, sourceId: string): Promise<Locale[]> => {
  const docs = await (await collection()).find({ kind, source_id: sourceId }, { projection: { _id: 0, lang: 1 } }).toArray();
  return [DEFAULT_LOCALE, ...docs.map((doc) => doc.lang as Locale)];
}, 'translated-locales');

/** Every stored translation as "kind|source_id|lang", ids only. */
export const getTranslatedKeys = cached(async (): Promise<string[]> => {
  const docs = await (await collection()).find({}, { projection: { _id: 0, kind: 1, source_id: 1, lang: 1 } }).toArray();
  return docs.map((doc) => `${doc.kind}|${doc.source_id}|${doc.lang}`);
}, 'translated-keys');

/** Canonical and hreflang for the languages a document exists in; an untranslated language gets noindex alone, since a canonical to English as well would contradict it. */
export async function indexingFor(kind: TranslationKind, sourceId: string, lang: Locale, path: string): Promise<Metadata> {
  const locales = await getTranslatedLocales(kind, sourceId);
  if (locales.includes(lang)) return { alternates: alternatesFor(lang, path, locales) };
  return { robots: { index: false, follow: true } };
}
