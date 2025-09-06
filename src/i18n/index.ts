import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { frenchTranslations } from './fr';
import { englishTranslations } from './en';

const resources = {
  fr: {
    translation: frenchTranslations
  },
  en: {
    translation: englishTranslations
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr', // default language
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false, // react already does escaping
    },
    debug: false,
  });

export default i18n;
