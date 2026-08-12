// Localization Engine (i18n) for Naw3iya News Network
export type SupportedLanguage = 'ar' | 'en' | 'fr';

export interface TranslationDictionary {
  [key: string]: {
    ar: string;
    en: string;
    fr: string;
  };
}

const TRANSLATIONS: TranslationDictionary = {
  app_name: {
    ar: 'أخبار نوعية',
    en: 'Naw3iya News',
    fr: 'Naw3iya News',
  },
  app_tagline: {
    ar: 'الأخبار كما تستحق أن تُقرأ',
    en: 'News as it deserves to be read',
    fr: 'L\'actualité comme elle mérite d\'être lue',
  },
  breaking_news: {
    ar: 'عاجل',
    en: 'Breaking News',
    fr: 'En Direct',
  },
  latest_news: {
    ar: 'آخر الأخبار',
    en: 'Latest News',
    fr: 'Dernières Nouvelles',
  },
  trending_topics: {
    ar: 'الأكثر تداولاً',
    en: 'Trending Topics',
    fr: 'Sujets Tendance',
  },
  categories: {
    ar: 'التصنيفات',
    en: 'Categories',
    fr: 'Catégories',
  },
  sources: {
    ar: 'المصادر الإخبارية',
    en: 'News Sources',
    fr: 'Sources d\'Information',
  },
  saved_articles: {
    ar: 'المقالات المحفوظة',
    en: 'Saved Articles',
    fr: 'Articles Sauvegardés',
  },
  reading_history: {
    ar: 'سجل القراءة',
    en: 'Reading History',
    fr: 'Historique de Lecture',
  },
  ai_summary: {
    ar: 'ملخص الذكاء الاصطناعي',
    en: 'AI Summary',
    fr: 'Résumé IA',
  },
  search_placeholder: {
    ar: 'ابحث عن أي خبر، موضوع، شخصية أو دولة...',
    en: 'Search for news, topics, figures, or countries...',
    fr: 'Rechercher des actualités, sujets, personnalités...',
  },
  admin_dashboard: {
    ar: 'لوحة التحكم والمراقبة Enterprise',
    en: 'Enterprise Control Dashboard',
    fr: 'Tableau de Bord Entreprise',
  },
  settings: {
    ar: 'الإعدادات',
    en: 'Settings',
    fr: 'Paramètres',
  },
  theme_dark: {
    ar: 'الوضع الليلي (Dark Mode)',
    en: 'Dark Mode',
    fr: 'Mode Sombre',
  },
  theme_light: {
    ar: 'الوضع النهار (Light Mode)',
    en: 'Light Mode',
    fr: 'Mode Clair',
  },
  auto_refresh: {
    ar: 'التحديث التلقائي (كل 5 دقائق)',
    en: 'Auto Refresh (Every 5 mins)',
    fr: 'Rafraîchissement Auto (Chaque 5 min)',
  },
};

class LocalizationService {
  private currentLang: SupportedLanguage = 'ar';
  private listeners: Array<(lang: SupportedLanguage) => void> = [];

  constructor() {
    const saved = localStorage.getItem('naw3iya_language') as SupportedLanguage;
    if (saved && ['ar', 'en', 'fr'].includes(saved)) {
      this.currentLang = saved;
    } else {
      this.currentLang = 'ar';
    }
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLang;
  }

  public setLanguage(lang: SupportedLanguage): void {
    this.currentLang = lang;
    localStorage.setItem('naw3iya_language', lang);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    this.listeners.forEach((fn) => fn(lang));
  }

  public translate(key: string, defaultText?: string): string {
    if (TRANSLATIONS[key] && TRANSLATIONS[key][this.currentLang]) {
      return TRANSLATIONS[key][this.currentLang];
    }
    return defaultText || key;
  }

  public isRTL(): boolean {
    return this.currentLang === 'ar';
  }

  public subscribe(fn: (lang: SupportedLanguage) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }
}

export const localizationService = new LocalizationService();
