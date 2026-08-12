import React, { createContext, useContext, useState, ReactNode } from 'react';
import { arTranslations } from './ar';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ar');

  const t = (path: string): string => {
    const keys = path.split('.');
    let current: any = arTranslations;
    for (const k of keys) {
      if (current && current[k] !== undefined) {
        current = current[k];
      } else {
        return path;
      }
    }
    return typeof current === 'string' ? current : path;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      <div dir={dir} className={language === 'ar' ? 'font-cairo' : ''}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if accessed outside provider
    return {
      language: 'ar' as Language,
      setLanguage: () => {},
      t: (path: string) => {
        const keys = path.split('.');
        let current: any = arTranslations;
        for (const k of keys) {
          if (current && current[k] !== undefined) {
            current = current[k];
          } else {
            return path;
          }
        }
        return typeof current === 'string' ? current : path;
      },
      dir: 'rtl' as const,
    };
  }
  return context;
};
