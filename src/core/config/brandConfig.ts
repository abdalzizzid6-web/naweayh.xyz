export interface BrandConfig {
  name: string;
  shortName: string;
  englishName: string;
  appName: string;
  domain: string;
  appUrl: string;
  tagline: string;
  description: string;
  defaultCountry: string;
  defaultCurrency: string;
  timezone: string;
  logos: {
    primary: string;
    compact: string;
    monochrome: string;
    dark: string;
    light: string;
    favicon: string;
    appIcon: string;
    ogImage: string;
  };
  social: {
    twitter?: string;
    facebook?: string;
    telegram?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
  };
}

export const brandConfig: BrandConfig = {
  name: 'أخبار نوعية',
  shortName: 'نوعية',
  englishName: 'Naw3iya News',
  appName: 'Naw3iya',
  domain: 'naweayh.xyz',
  appUrl: 'https://naweayh.xyz',
  tagline: 'الأخبار كما تستحق أن تُقرأ',
  description: 'أخبار نوعية — المنصة الإخبارية الذكية الشاملة: تغطية إخبارية عاجلة ومباشرة بذكاء اصطناعي فائق وتحليلات موثوقة باللغة العربية.',
  defaultCountry: 'اليمن',
  defaultCurrency: 'الريال اليمني',
  timezone: 'Asia/Aden',
  logos: {
    primary: '/assets/logo-primary.svg',
    compact: '/assets/logo-compact.svg',
    monochrome: '/assets/logo-mono.svg',
    dark: '/assets/logo-dark.svg',
    light: '/assets/logo-light.svg',
    favicon: '/favicon.ico',
    appIcon: '/icon-512.png',
    ogImage: 'https://naweayh.xyz/og-default.jpg',
  },
  social: {
    twitter: 'https://twitter.com/Naw3iyaNews',
    facebook: 'https://facebook.com/Naw3iyaNews',
    telegram: 'https://t.me/Naw3iyaNews',
    instagram: 'https://instagram.com/Naw3iyaNews',
  },
};
