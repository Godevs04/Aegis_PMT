import apiClient from './api-client';

export interface SearchResult {
  type: 'task' | 'project' | 'member' | 'comment' | 'label';
  id: string;
  title: string;
  subtitle?: string;
  meta?: Record<string, any>;
}

export interface SearchResponse {
  query: string;
  total: number;
  results: SearchResult[];
}

export const searchService = {
  async search(query: string, workspaceId: string, options?: { limit?: number; types?: string[] }): Promise<SearchResponse> {
    const params = new URLSearchParams({ q: query, workspaceId });
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.types) params.append('types', options.types.join(','));

    const response = await apiClient.get(`/search?${params.toString()}`);
    return response.data.data;
  },
};

export default searchService;
