import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type Lang, type TranslationKey, t as translate } from './translations';

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
  isRtl: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('paltur-lang') as Lang) || 'en';
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('paltur-lang', l);
  };

  const isRtl = lang === 'ar';

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  }, [lang, isRtl]);

  const t = (key: TranslationKey) => translate(key, lang);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, isRtl }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
