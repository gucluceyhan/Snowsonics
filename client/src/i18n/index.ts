import { tr } from './tr';
import { en } from './en';
import { Language, Translations } from './types';

export const languages: Record<Language, Translations> = {
  tr,
  en,
};

export const defaultLanguage: Language = 'tr';

export { type Language, type Translations };