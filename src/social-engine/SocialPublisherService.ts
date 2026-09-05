import { socialChannelsRepository } from '../repositories/socialChannelsRepository';
import { socialPostsRepository } from '../repositories/socialPostsRepository';
import { auditRepository } from '../repositories/auditRepository';
import { buildArticleCanonicalUrl } from '../core/utils/urlUtils';
import { NewsArticle, SocialChannelConfig, SocialPostItem, SocialPlatform } from '../core';

export class SocialPublisherService {
  public getChannels(): SocialChannelConfig[] {
    return socialChannelsRepository.getAll();
  }

  public toggleChannel(id: string): SocialChannelConfig | null {
    const updated = socialChannelsRepository.toggleChannel(id);
    if (updated) {
      auditRepository.logAction(
        'Social Publisher',
        'Operations Lead',
        'TOGGLE_SOCIAL_CHANNEL',
        updated.platform,
        `Toggled social channel status for ${updated.platform} (${updated.channelName})`
      );
    }
    return updated;
  }

  public updateChannelConfig(id: string, updates: Partial<SocialChannelConfig>): SocialChannelConfig | null {
    const updated = socialChannelsRepository.updateChannelConfig(id, updates);
    if (updated) {
      auditRepository.logAction(
        'Social Publisher',
        'Operations Lead',
        'UPDATE_SOCIAL_CHANNEL_CONFIG',
        updated.platform,
        `Updated channel configuration & filters for ${updated.platform}`
      );
    }
    return updated;
  }

  /**
   * Evaluates category, source, and country filter rules for a given channel
   */
  public isChannelEligibleForArticle(channel: SocialChannelConfig, article: NewsArticle): boolean {
    if (!channel.enabled) return false;

    // 1. Category Filter Check
    const matchCategory =
      channel.autoPublishCategories.includes('الكل') ||
      channel.autoPublishCategories.includes(article.category);

    if (!matchCategory) return false;

    // 2. Source Filter Check
    const primarySource = article.sources && article.sources[0] ? article.sources[0].name : 'مصدر غير محدد';
    const matchSource =
      !channel.autoPublishSources ||
      channel.autoPublishSources.includes('الكل') ||
      channel.autoPublishSources.includes(primarySource);

    if (!matchSource) return false;

    // 3. Country Filter Check
    const matchCountry =
      !channel.autoPublishCountries ||
      channel.autoPublishCountries.includes('الكل') ||
      channel.autoPublishCountries.includes(article.country);

    if (!matchCountry) return false;

    return true;
  }

  /**
   * Auto-publishes an article to all eligible social platforms automatically
   */
  public autoDispatchArticleToPlatforms(article: NewsArticle): SocialPostItem[] {
    const channels = this.getChannels();
    const createdPosts: SocialPostItem[] = [];

    channels.forEach((channel) => {
      if (this.isChannelEligibleForArticle(channel, article)) {
        const formattedText = this.formatPostContent(channel, article);
        const hashtags = channel.defaultHashtags || ['#أخبار_نوعية', `#${article.category}`];
        const canonicalUrl = article.seoMeta?.canonicalUrl || buildArticleCanonicalUrl(article.slug || article.id);
        const primarySource = article.sources && article.sources[0] ? article.sources[0].name : 'مصدر إخباري مصفى';

        const post = socialPostsRepository.schedulePost({
          articleId: article.id,
          articleTitle: article.title,
          articleSummary: article.summary,
          articleImage: article.mainImage,
          articleUrl: canonicalUrl,
          category: article.category,
          sourceName: primarySource,
          country: article.country,
          platform: channel.platform,
          formattedContent: formattedText,
          hashtags,
          status: 'Published',
          scheduledAt: new Date().toLocaleString('ar-SA'),
          publishedAt: new Date().toLocaleString('ar-SA'),
        });

        createdPosts.push(post);

        auditRepository.logAction(
          'Automated Social Publisher',
          'System Admin',
          'AUTO_PUBLISH_ARTICLE',
          channel.platform,
          `Auto-published article "${article.title}" to ${channel.platform} (${channel.channelName})`
        );
      }
    });

    return createdPosts;
  }

  /**
   * Schedule or Publish a custom/manual post to specific platforms
   */
  public publishOrScheduleCustomPost(params: {
    article: {
      id: string;
      title: string;
      summary: string;
      image: string;
      url: string;
      category: string;
      sourceName: string;
      country: string;
    };
    platforms: SocialPlatform[];
    customContent?: string;
    hashtags: string[];
    scheduledAt?: string;
    isScheduled: boolean;
  }): SocialPostItem[] {
    const results: SocialPostItem[] = [];

    params.platforms.forEach((platform) => {
      const channel = this.getChannels().find((c) => c.platform === platform);
      const defaultText = channel
        ? channel.template
            .replace('{title}', params.article.title)
            .replace('{summary}', params.article.summary)
            .replace('{url}', params.article.url)
        : `${params.article.title}\n\n${params.article.summary}\n\n${params.article.url}`;

      const finalContent = params.customContent?.trim() || defaultText;
      const scheduledTime = params.isScheduled && params.scheduledAt
        ? params.scheduledAt
        : new Date().toLocaleString('ar-SA');

      const status = params.isScheduled ? 'Scheduled' : 'Published';

      const post = socialPostsRepository.schedulePost({
        articleId: params.article.id,
        articleTitle: params.article.title,
        articleSummary: params.article.summary,
        articleImage: params.article.image,
        articleUrl: params.article.url,
        category: params.article.category,
        sourceName: params.article.sourceName,
        country: params.article.country,
        platform,
        formattedContent: finalContent,
        hashtags: params.hashtags,
        status,
        scheduledAt: scheduledTime,
        publishedAt: status === 'Published' ? scheduledTime : undefined,
      });

      results.push(post);

      auditRepository.logAction(
        'Social Engine Dispatcher',
        'Operations Lead',
        status === 'Published' ? 'MANUAL_PUBLISH' : 'SCHEDULE_POST',
        platform,
        `${status === 'Published' ? 'Published' : 'Scheduled'} post for article "${params.article.title}" to ${platform}`
      );
    });

    return results;
  }

  /**
   * Republish a post (إعادة النشر)
   */
  public republishPost(postId: string): SocialPostItem | null {
    const republished = socialPostsRepository.republishPost(postId);
    if (republished) {
      auditRepository.logAction(
        'Social Engine Publisher',
        'Operations Lead',
        'REPUBLISH_POST',
        republished.platform,
        `Republished social post ID ${postId} for "${republished.articleTitle}" to ${republished.platform}`
      );
    }
    return republished;
  }

  public getPosts(status?: SocialPostItem['status']): SocialPostItem[] {
    return socialPostsRepository.getPostsByStatus(status);
  }

  private formatPostContent(channel: SocialChannelConfig, article: NewsArticle): string {
    const primarySource = article.sources && article.sources[0] ? article.sources[0].name : 'أخبار نوعية';
    const canonicalUrl = article.seoMeta?.canonicalUrl || buildArticleCanonicalUrl(article.slug || article.id);

    return channel.template
      .replace('{title}', article.title)
      .replace('{summary}', article.summary)
      .replace('{url}', canonicalUrl)
      .replace('{category}', article.category)
      .replace('{source}', primarySource)
      .replace('{country}', article.country);
  }
}

export const socialPublisherService = new SocialPublisherService();
