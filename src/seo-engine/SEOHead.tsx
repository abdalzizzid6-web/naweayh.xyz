import React, { useEffect } from 'react';
import { NewsArticle } from '../core/domain/types';
import { seoEngineService } from './SEOEngineService';

interface SEOHeadProps {
  article?: NewsArticle;
}

export const SEOHead: React.FC<SEOHeadProps> = ({ article }) => {
  useEffect(() => {
    const metaTags = seoEngineService.generateMetaTags(article);

    // 1. Update Title
    document.title = metaTags.title;

    // Helper to update or create meta tag
    const setMetaTag = (nameOrProperty: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${nameOrProperty}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, nameOrProperty);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to update canonical link
    const setCanonical = (url: string) => {
      let link = document.querySelector(`link[rel="canonical"]`) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', url);
    };

    // 2. Set Basic Meta Tags
    setMetaTag('description', metaTags.description);
    setMetaTag('keywords', metaTags.keywords);
    setCanonical(metaTags.canonicalUrl);

    // 3. Set Open Graph Tags
    setMetaTag('og:type', metaTags.ogType, true);
    setMetaTag('og:title', metaTags.ogTitle, true);
    setMetaTag('og:description', metaTags.ogDescription, true);
    setMetaTag('og:image', metaTags.ogImage, true);
    setMetaTag('og:url', metaTags.canonicalUrl, true);
    setMetaTag('og:site_name', 'أخبار نوعية — Naw3iya News', true);
    setMetaTag('og:locale', 'ar_SA', true);

    // 4. Set Twitter Card Tags
    setMetaTag('twitter:card', metaTags.twitterCard);
    setMetaTag('twitter:site', '@Naw3iyaNews');
    setMetaTag('twitter:title', metaTags.ogTitle);
    setMetaTag('twitter:description', metaTags.ogDescription);
    setMetaTag('twitter:image', metaTags.ogImage);

    // 5. Inject Schema.org JSON-LD
    let schemaScript = document.getElementById('schema-json-ld');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'schema-json-ld';
      schemaScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(schemaScript);
    }

    if (article) {
      const newsArticleSchema = seoEngineService.generateNewsArticleSchema(article);
      const breadcrumbSchema = seoEngineService.generateBreadcrumbSchema(article);
      schemaScript.textContent = JSON.stringify([newsArticleSchema, breadcrumbSchema]);
    } else {
      const websiteSchema = seoEngineService.generateWebSiteSchema();
      schemaScript.textContent = JSON.stringify(websiteSchema);
    }
  }, [article]);

  return null;
};
