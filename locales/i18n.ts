import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import af from './af.json';
import zu from './zu.json';
import xh from './xh.json';
import st from './st.json';
import ve from './ve.json';
import ts from './ts.json';

const resources = {
  en: { translation: en },
  af: { translation: af },
  zu: { translation: zu },
  xh: { translation: xh },
  st: { translation: st },
  ve: { translation: ve },
  ts: { translation: ts },
} as const;

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: ['en', 'af', 'zu', 'xh', 'st', 've', 'ts'],
    defaultNS: 'translation',
    ns: ['translation'],
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  })
  .catch((err) => console.error('i18n init error', err));

export const supportedLanguages = [
  { code: 'en', label: en.languages.en },
  { code: 'af', label: en.languages.af },
  { code: 'zu', label: en.languages.zu },
  { code: 'xh', label: en.languages.xh },
  { code: 'st', label: en.languages.st },
  { code: 've', label: en.languages.ve },
  { code: 'ts', label: en.languages.ts },
];

export default i18n;
