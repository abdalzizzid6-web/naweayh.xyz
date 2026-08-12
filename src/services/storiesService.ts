export interface StoryCluster {
  id: number;
  slug: string;
  title: string;
  summary: string;
  category: string;
  country: string;
  importance_score: number;
  status: string;
  first_published_at: string;
  last_updated_at: string;
  articles_count: number;
  sources_count: number;
  views_count: number;
  shares_count: number;
  saves_count: number;
  cover_image_url?: string;
  articles?: any[];
  sources?: any[];
}

export class StoriesService {
  public async getStories(params?: { category?: string; country?: string; search?: string; status?: string; limit?: number; page?: number }): Promise<{ data: StoryCluster[]; total: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.category) queryParams.set('category', params.category);
      if (params?.country) queryParams.set('country', params.country);
      if (params?.search) queryParams.set('search', params.search);
      if (params?.status) queryParams.set('status', params.status);
      if (params?.limit) queryParams.set('limit', String(params.limit));
      if (params?.page) queryParams.set('page', String(params.page));

      const res = await fetch(`/api/v1/stories?${queryParams.toString()}`);
      const json = await res.json();
      if (json.success) {
        return { data: json.data || [], total: json.total || 0 };
      }
      return { data: [], total: 0 };
    } catch (e) {
      console.warn('Failed to fetch stories from API, fallback to local empty list:', e);
      return { data: [], total: 0 };
    }
  }

  public async getStoryBySlugOrId(slugOrId: string): Promise<StoryCluster | null> {
    try {
      const res = await fetch(`/api/v1/stories/${slugOrId}`);
      const json = await res.json();
      if (json.success) {
        return json.data;
      }
      return null;
    } catch (e) {
      console.warn('Failed to fetch story detail:', e);
      return null;
    }
  }

  public async getStoryTimeline(id: number): Promise<any[]> {
    try {
      const res = await fetch(`/api/v1/stories/${id}/timeline`);
      const json = await res.json();
      return json.success ? json.data : [];
    } catch (e) {
      return [];
    }
  }

  public async getStoryRelated(id: number): Promise<StoryCluster[]> {
    try {
      const res = await fetch(`/api/v1/stories/${id}/related`);
      const json = await res.json();
      return json.success ? json.data : [];
    } catch (e) {
      return [];
    }
  }
}

export const storiesService = new StoriesService();
