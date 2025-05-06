import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend'; // Loads translations via http

i18n
  // Load translation using http -> see /public/locales
  // Learn more: https://github.com/i18next/i18next-http-backend
  .use(HttpApi)
  // Detect user language
  // Learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // Init i18next
  // For all options read: https://www.i18next.com/overview/configuration-options
  .init({ // Initialize i18next
    lng: 'en', // Set default language to English
    fallbackLng: 'en', // Use English if detected language is not available
    debug: import.meta.env.MODE === 'development', // Enable debug output in development
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    // Options for LanguageDetector
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'], // Where to cache detected language
    },
    // Options for HttpApi
    backend: {
      loadPath: '/locales/{{lng}}/translation.json', // Path to single translation file
    },
  });

export default i18n;
