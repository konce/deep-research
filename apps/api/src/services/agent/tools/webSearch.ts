// Web Search Tool - MCP Tool for searching the web
// Phase 3: Integrated with Tavily API

import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import type { ToolResult } from '../types';
import type { WebSearchResult } from '@deep-research/shared-types';
import { getTavilyClient, type FormattedSearchResult } from '../../search/TavilyClient';

/**
 * Convert Tavily result to WebSearchResult format
 */
function convertToWebSearchResult(result: FormattedSearchResult): WebSearchResult {
  return {
    title: result.title,
    url: result.url,
    snippet: result.snippet,
    content: result.content,
    publishedDate: result.publishedDate,
    score: result.relevanceScore,
  };
}

/**
 * Web Search MCP Tool
 * Searches the web for information on any topic
 */
export const webSearchTool = tool(
  'web_search',
  'Search the web for information on any topic. Returns relevant web pages with titles, URLs, snippets, and full content. Use this to gather information from the internet about any subject.',
  {
    query: z
      .string()
      .min(1)
      .describe('The search query. Be specific and use relevant keywords.'),
    numResults: z
      .number()
      .int()
      .min(1)
      .max(20)
      .default(10)
      .describe('Number of search results to return (1-20). Default is 10.'),
    searchDepth: z
      .enum(['basic', 'advanced'])
      .default('basic')
      .describe(
        'Search depth: "basic" for quick results, "advanced" for more comprehensive results.'
      ),
  },
  async (args): Promise<ToolResult> => {
    try {
      console.log(`[webSearch] Searching for: "${args.query}" (${args.numResults} results, ${args.searchDepth} depth)`);

      // Get Tavily client
      const tavilyClient = getTavilyClient();

      // Perform search using Tavily API
      const searchResponse = await tavilyClient.search(args.query, {
        searchDepth: args.searchDepth,
        maxResults: args.numResults,
        includeAnswer: true,
        includeImages: false,
      });

      console.log(`[webSearch] Found ${searchResponse.results.length} results from Tavily`);

      // Convert to WebSearchResult format
      const results: WebSearchResult[] = searchResponse.results.map(convertToWebSearchResult);

      // Return results in MCP format
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                query: args.query,
                results,
                totalFound: searchResponse.totalResults,
                searchDepth: args.searchDepth,
                answer: searchResponse.answer, // AI-generated answer from Tavily
                timestamp: new Date().toISOString(),
                metadata: {
                  source: 'tavily',
                  searchDepth: searchResponse.searchDepth,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error('[webSearch] Error:', error);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: error instanceof Error ? error.message : 'Unknown error occurred',
              query: args.query,
              details: 'Failed to perform web search. Check if TAVILY_API_KEY is set correctly.',
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

/**
 * Usage:
 * - Set TAVILY_API_KEY environment variable
 * - Sign up at https://tavily.com to get an API key
 * - The tool automatically uses the Tavily client singleton
 */
