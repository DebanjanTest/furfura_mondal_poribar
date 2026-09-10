import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, getSavedLanguage, setLanguage as setSavedLanguage } from '../utils/i18n.js';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => getSavedLanguage() || 'en');

  const setLanguage = useCallback((newLang) => {
    const valid = newLang === 'bn' ? 'bn' : 'en';
    setLangState(valid);
    setSavedLanguage(valid);
    document.documentElement.lang = valid;
    window.dispatchEvent(new CustomEvent('pujo_language_changed', { detail: { lang: valid } }));
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key, fallback = '') => {
    if (!key) return fallback;
    const dict = translations[lang] || translations.en || {};
    if (dict[key] !== undefined) return dict[key];
    const fallbackDict = translations.en || {};
    return fallbackDict[key] !== undefined ? fallbackDict[key] : (fallback || key);
  }, [lang]);

  const value = {
    lang,
    setLanguage,
    t,
    isBengali: lang === 'bn',
    isEnglish: lang === 'en'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
