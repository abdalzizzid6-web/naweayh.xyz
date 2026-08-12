import { NewsArticle, SEOMeta } from '../core';

export class SEOMetaGenerator {
  public static generateSEOMeta(article: NewsArticle): SEOMeta {
    return {
      title: `${article.title} | أخبار نوعية — Naw3iya News`,
      description: article.summary,
      keywords: [article.category, article.country, ...article.aiEntities.tags],
      canonicalUrl: `https://naweayh.xyz/news/${article.slug}`,
      schemaType: 'NewsArticle',
      openGraphImage: article.mainImage,
    };
  }

  public static generateJSONLD(article: NewsArticle): string {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      description: article.summary,
      image: [article.mainImage, ...article.galleryImages],
      datePublished: article.publishDate,
      dateModified: article.updatedAt,
      author: {
        '@type': 'Organization',
        name: 'أخبار نوعية — Naw3iya News',
      },
      publisher: {
        '@type': 'Organization',
        name: 'أخبار نوعية',
        logo: {
          '@type': 'ImageObject',
          url: 'https://naweayh.xyz/logo.png',
        },
      },
    };
    return JSON.stringify(jsonLd);
  }
}
