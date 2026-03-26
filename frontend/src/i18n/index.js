import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from './zh.json';
import en from './en.json';
import de from './de.json';
import tr from './tr.json';
import ar from './ar.json';
import hu from './hu.json';
import vi from './vi.json';
import pl from './pl.json';

export const RTL_LANGS = new Set(['ar']);

export const LANG_OPTIONS = [
  ['zh', '中文'],
  ['en', 'English'],
  ['de', 'Deutsch'],
  ['tr', 'Türkçe'],
  ['ar', 'العربية'],
  ['hu', 'Magyar'],
  ['vi', 'Tiếng Việt'],
  ['pl', 'Polski'],
];

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
    de: { translation: de },
    tr: { translation: tr },
    ar: { translation: ar },
    hu: { translation: hu },
    vi: { translation: vi },
    pl: { translation: pl },
  },
  lng: localStorage.getItem('hr7_lang') || 'zh',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  keySeparator: false,
  nsSeparator: false,
});

export default i18n;
