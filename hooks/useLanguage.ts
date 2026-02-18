import { useEffect, useState } from 'react';
import i18n, { supportedLanguages } from '@/locales/i18n';

export const useLanguage = () => {
  const [language, setLanguage] = useState(i18n.language || 'en');

  useEffect(() => {
    const handler = (lng: string) => setLanguage(lng);
    i18n.on('languageChanged', handler);
    return () => {
      i18n.off('languageChanged', handler);
    };
  }, []);

  const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
  };

  return { language, changeLanguage, languages: supportedLanguages };
};
