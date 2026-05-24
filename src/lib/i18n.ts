import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import ptBR from '@/locales/pt-BR.json'
import enUS from '@/locales/en-US.json'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'pt-BR',
    supportedLngs: ['pt-BR', 'en-US'],
    resources: {
      'pt-BR': { translation: ptBR },
      'en-US': { translation: enUS },
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'spoter_lang',
    },
    interpolation: { escapeValue: false },
  })

export default i18n
