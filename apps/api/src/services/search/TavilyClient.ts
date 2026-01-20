import { TavilyClient as TavilySDK } from 'tavily';

/**
 * Search result from Tavily
 */
export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: string | number; // Tavily returns string, but we treat it as number
  published_date?: string;
}

/**
 * Formatted search result for our system
 */
export interface FormattedSearchResult {
  title: string;
  url: string;
  content: string;
  snippet: string;
  relevanceScore: number;
  publishedDate?: string;
  source: string;
}

/**
 * Search options
 */
export interface SearchOptions {
  searchDepth?: 'basic' | 'advanced';
  maxResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  includeAnswer?: boolean;
  includeImages?: boolean;
}

/**
 * Search response
 */
export interface SearchResponse {
  query: string;
  results: FormattedSearchResult[];
  answer?: string;
  images?: string[];
  searchDepth: 'basic' | 'advanced';
  totalResults: number;
}

/**
 * Tavily API Client
 * Wrapper around the Tavily SDK with additional functionality
 */
export class TavilyClient {
  private client: TavilySDK;
  private seenUrls: Set<string> = new Set();

  constructor(apiKey?: string) {
    // If no API key provided, TavilySDK will use TAVILY_API_KEY env var
    this.client = new TavilySDK(apiKey ? { apiKey } : undefined);
  }

  /**
   * Perform a web search
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    const {
      searchDepth = 'basic',
      maxResults = 10,
      includeDomains,
      excludeDomains,
      includeAnswer = true,
      includeImages = false,
    } = options;

    try {
      console.log(`[TavilyClient] Searching: "${query}"`);
      console.log(`[TavilyClient] Options:`, { searchDepth, maxResults });

      // Call Tavily API
      const response = await this.client.search({
        query,
        search_depth: searchDepth,
        max_results: maxResults,
        include_answer: includeAnswer,
        include_images: includeImages,
        include_domains: includeDomains,
        exclude_domains: excludeDomains,
      });

      console.log(`[TavilyClient] Got ${response.results?.length || 0} results`);

      // Format results
      const formattedResults = this.formatResults(response.results || []);

      // Deduplicate results
      const deduplicatedResults = this.deduplicateResults(formattedResults);

      return {
        query,
        results: deduplicatedResults,
        answer: response.answer,
        images: response.images || [],
        searchDepth,
        totalResults: deduplicatedResults.length,
      };
    } catch (error) {
      console.error('[TavilyClient] Search error:', error);
      throw new Error(`Tavily search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Format raw Tavily results into our format
   */
  private formatResults(results: TavilySearchResult[]): FormattedSearchResult[] {
    return results.map((result) => {
      // Extract domain from URL
      let source = 'unknown';
      try {
        const url = new URL(result.url);
        source = url.hostname.replace('www.', '');
      } catch (e) {
        // Invalid URL, use as-is
        source = result.url;
      }

      // Create snippet (first 200 chars of content)
      const snippet = result.content.length > 200
        ? result.content.substring(0, 200) + '...'
        : result.content;

      // Convert score to number if it's a string
      const relevanceScore = typeof result.score === 'string'
        ? parseFloat(result.score)
        : result.score;

      return {
        title: result.title,
        url: result.url,
        content: result.content,
        snippet,
        relevanceScore,
        publishedDate: result.published_date,
        source,
      };
    });
  }

  /**
   * Remove duplicate results based on URL
   */
  private deduplicateResults(results: FormattedSearchResult[]): FormattedSearchResult[] {
    const uniqueResults: FormattedSearchResult[] = [];
    const seenUrls = new Set<string>();

    for (const result of results) {
      // Normalize URL (remove trailing slash, query params for dedup)
      const normalizedUrl = this.normalizeUrl(result.url);

      if (!seenUrls.has(normalizedUrl)) {
        seenUrls.add(normalizedUrl);
        uniqueResults.push(result);
      } else {
        console.log(`[TavilyClient] Duplicate URL filtered: ${result.url}`);
      }
    }

    return uniqueResults;
  }

  /**
   * Normalize URL for deduplication
   */
  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Use protocol + hostname + pathname (ignore query params and hash)
      return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`.toLowerCase();
    } catch (e) {
      // If URL parsing fails, return as-is
      return url.toLowerCase();
    }
  }

  /**
   * Clear the seen URLs cache (useful for new research sessions)
   */
  clearCache(): void {
    this.seenUrls.clear();
    console.log('[TavilyClient] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { cachedUrls: number } {
    return {
      cachedUrls: this.seenUrls.size,
    };
  }
}

// Singleton instance
let tavilyClient: TavilyClient | null = null;

/**
 * Get or create TavilyClient singleton
 */
export function getTavilyClient(): TavilyClient {
  if (!tavilyClient) {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
      console.warn('[TavilyClient] TAVILY_API_KEY not set in environment variables');
    }

    tavilyClient = new TavilyClient(apiKey);
    console.log('[TavilyClient] Client initialized');
  }

  return tavilyClient;
}
