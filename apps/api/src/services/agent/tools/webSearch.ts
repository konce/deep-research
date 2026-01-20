// Web Search Tool - MCP Tool for searching the web
// Phase 2: Uses mock data for testing
// Phase 3: Will integrate with Tavily API

import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import type { ToolResult } from '../types';
import type { WebSearchResult } from '@deep-research/shared-types';

/**
 * Mock search results for Phase 2 testing
 * In Phase 3, this will be replaced with real Tavily API calls
 */
function generateMockResults(query: string, numResults: number): WebSearchResult[] {
  const mockResultsTemplates = [
    {
      title: `${query} - Official Documentation`,
      url: `https://www.${query.toLowerCase().replace(/\s+/g, '-')}.org/docs/`,
      snippet: `Official documentation and guides for ${query}. Comprehensive resources for learning and reference.`,
      content: `This is the official documentation for ${query}. It provides comprehensive guides, tutorials, and API references for developers and users. The documentation covers basic concepts, advanced features, best practices, and troubleshooting tips.`,
      publishedDate: '2025-12-01',
      score: 0.95,
    },
    {
      title: `Understanding ${query}: A Complete Guide`,
      url: `https://www.techblog.com/guides/${query.toLowerCase().replace(/\s+/g, '-')}`,
      snippet: `A comprehensive guide to understanding ${query}, covering key concepts, benefits, and practical applications.`,
      content: `This guide provides an in-depth look at ${query}. It covers the fundamental concepts, explains why it's important, discusses common use cases, and provides practical examples. The guide is suitable for both beginners and experienced professionals.`,
      publishedDate: '2025-11-15',
      score: 0.88,
    },
    {
      title: `${query} Tutorial for Beginners`,
      url: `https://www.learningplatform.com/tutorials/${query.toLowerCase().replace(/\s+/g, '-')}`,
      snippet: `Learn ${query} from scratch with this beginner-friendly tutorial. Includes hands-on examples and exercises.`,
      content: `This tutorial is designed for beginners who want to learn ${query}. It starts with the basics and gradually introduces more advanced topics. Each section includes practical examples and exercises to reinforce learning.`,
      publishedDate: '2025-10-20',
      score: 0.82,
    },
    {
      title: `${query}: Best Practices and Common Pitfalls`,
      url: `https://www.devblog.com/articles/${query.toLowerCase().replace(/\s+/g, '-')}-best-practices`,
      snippet: `Expert advice on ${query} best practices and how to avoid common mistakes.`,
      content: `This article shares best practices for working with ${query}. It discusses common pitfalls that developers encounter and provides strategies to avoid them. The advice is based on real-world experience and industry standards.`,
      publishedDate: '2025-09-10',
      score: 0.75,
    },
    {
      title: `The Future of ${query}: Trends and Predictions`,
      url: `https://www.techinnovation.com/insights/${query.toLowerCase().replace(/\s+/g, '-')}-future`,
      snippet: `Explore the future trends and predictions for ${query} based on current developments and expert analysis.`,
      content: `This article examines the future of ${query}. It analyzes current trends, discusses emerging technologies, and presents expert predictions about where the field is heading. The analysis is based on industry research and interviews with leading experts.`,
      publishedDate: '2025-08-05',
      score: 0.70,
    },
  ];

  // Return the requested number of results
  return mockResultsTemplates.slice(0, Math.min(numResults, mockResultsTemplates.length));
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

      // Phase 2: Generate mock results
      // TODO Phase 3: Replace with Tavily API call
      const results = generateMockResults(args.query, args.numResults);

      console.log(`[webSearch] Found ${results.length} mock results`);

      // Return results in MCP format
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                query: args.query,
                results,
                totalFound: results.length,
                searchDepth: args.searchDepth,
                timestamp: new Date().toISOString(),
                // Mock metadata
                metadata: {
                  source: 'mock',
                  note: 'Phase 2: Using mock data. Phase 3 will use Tavily API.',
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
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

/**
 * Integration guide for Phase 3 Tavily API:
 *
 * 1. Add Tavily API key to .env:
 *    TAVILY_API_KEY=tvly-xxx
 *
 * 2. Install Tavily client (if needed):
 *    pnpm add tavily-js
 *
 * 3. Replace mock logic with Tavily API call:
 *    const response = await fetch('https://api.tavily.com/search', {
 *      method: 'POST',
 *      headers: {
 *        'Content-Type': 'application/json',
 *        'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`
 *      },
 *      body: JSON.stringify({
 *        query: args.query,
 *        max_results: args.numResults,
 *        search_depth: args.searchDepth,
 *        include_answer: true,
 *        include_raw_content: true
 *      })
 *    });
 *
 * 4. Transform Tavily response to match WebSearchResult interface
 */
