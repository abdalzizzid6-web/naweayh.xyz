import React, { useEffect } from 'react';
import { NewsArticle } from '../core/domain/types';
import { seoEngineService, SEOMetaOutput } from './SEOEngineService';

interface SEOHeadProps {
  article?: NewsArticle;
  category?: string;
  source?: string;
  searchQuery?: string;
  is404?: boolean;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  article,
  category,
  source,
  searchQuery,
  is404,
}) => {
  useEffect(() => {
    let metaTags: SEOMetaOutput;
    const schemas: object[] = [];

    if (is404) {
      metaTags = seoEngineService.generate404MetaTags();
    } else if (article) {
      metaTags = seoEngineService.generateMetaTags(article);
      schemas.push(seoEngineService.generateNewsArticleSchema(article));
      schemas.push(seoEngineService.generateArticleBreadcrumbSchema(article));
    } else if (category) {
      metaTags = seoEngineService.generateCategoryMetaTags(category);
      schemas.push(seoEngineService.generateCategoryBreadcrumbSchema(category));
      schemas.push(seoEngineService.generateWebSiteSchema());
    } else if (source) {
      metaTags = seoEngineService.generateSourceMetaTags(source);
      schemas.push(seoEngineService.generateSourceBreadcrumbSchema(source));
      schemas.push(seoEngineService.generateWebSiteSchema());
    } else if (searchQuery !== undefined) {
      metaTags = seoEngineService.generateSearchMetaTags(searchQuery);
    } else {
      metaTags = seoEngineService.generateMetaTags();
      schemas.push(seoEngineService.generateWebSiteSchema());
      schemas.push(seoEngineService.generateOrganizationSchema());
    }

    // 1. Update Document Title
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
    setMetaTag('robots', metaTags.robots);
    setCanonical(metaTags.canonicalUrl);

    // 3. Set Open Graph Tags
    setMetaTag('og:type', metaTags.ogType, true);
    setMetaTag('og:title', metaTags.ogTitle, true);
    setMetaTag('og:description', metaTags.ogDescription, true);
    setMetaTag('og:image', metaTags.ogImage, true);
    setMetaTag('og:url', metaTags.canonicalUrl, true);
    setMetaTag('og:site_name', metaTags.ogSiteName, true);
    setMetaTag('og:locale', metaTags.ogLocale, true);

    if (metaTags.articlePublishTime) {
      setMetaTag('article:published_time', metaTags.articlePublishTime, true);
    }
    if (metaTags.articleModifiedTime) {
      setMetaTag('article:modified_time', metaTags.articleModifiedTime, true);
    }
    if (metaTags.articleSection) {
      setMetaTag('article:section', metaTags.articleSection, true);
    }
    if (metaTags.articleAuthor) {
      setMetaTag('article:author', metaTags.articleAuthor, true);
    }

    // 4. Set Twitter Card Tags
    setMetaTag('twitter:card', metaTags.twitterCard);
    setMetaTag('twitter:site', metaTags.twitterSite);
    setMetaTag('twitter:title', metaTags.twitterTitle);
    setMetaTag('twitter:description', metaTags.twitterDescription);
    setMetaTag('twitter:image', metaTags.twitterImage);

    // 5. Inject Schema.org JSON-LD
    let schemaScript = document.getElementById('schema-json-ld');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'schema-json-ld';
      schemaScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(schemaScript);
    }

    schemaScript.textContent = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas);
  }, [article, category, source, searchQuery, is404]);

  return null;
};

