// Report Writer Tool - MCP Tool for generating research reports
// Generates comprehensive Markdown-formatted research reports

import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import type { ToolResult } from '../types';
import type { ReportSection, Citation } from '@deep-research/shared-types';
import { generateReport } from '../../report/MarkdownGenerator';
import type {  ReportData, ReportGenerationOptions, ReportTemplateType } from '../../report/types';

/**
 * Zod schema for report sections (recursive structure)
 */
const reportSectionSchema: z.ZodType<ReportSection> = z.lazy(() =>
  z.object({
    heading: z.string().min(1).describe('Section heading'),
    content: z.string().min(1).describe('Section content in Markdown'),
    subsections: z
      .array(
        z.object({
          heading: z.string().min(1),
          content: z.string().min(1),
        })
      )
      .optional()
      .describe('Optional subsections within this section'),
  })
);

/**
 * Zod schema for citations
 */
const citationSchema = z.object({
  id: z.string().describe('Unique citation identifier'),
  title: z.string().describe('Title of the source'),
  url: z.string().url().optional().describe('URL of the source (if web-based)'),
  source: z.string().describe('Source description (e.g., "Official Documentation", "Research Paper")'),
});

// Note: Markdown generation now handled by MarkdownGenerator service
// Old generateMarkdown and calculateStatistics functions removed

/**
 * Report Writer MCP Tool
 * Generates a comprehensive research report in Markdown format
 */
export const reportWriterTool = tool(
  'report_writer',
  'Generate a comprehensive research report in Markdown format. Use this tool at the end of your research to compile all findings into a well-structured report with proper citations. Supports multiple report templates (default, academic, technical, executive) and advanced formatting options.',
  {
    title: z
      .string()
      .min(5)
      .describe('The title of the research report. Should be clear and descriptive.'),
    sections: z
      .array(reportSectionSchema)
      .min(1)
      .describe(
        'Main sections of the report. Each section should have a heading and content. Include 3-5 main sections for comprehensive coverage.'
      ),
    citations: z
      .array(citationSchema)
      .min(1)
      .describe(
        'List of all sources cited in the report. Each citation should have an id, title, and source. Include URLs for web sources.'
      ),
    template: z
      .enum(['default', 'academic', 'technical', 'executive'])
      .optional()
      .default('default')
      .describe(
        'Report template to use. Options: default (general), academic (formal research), technical (code-friendly), executive (summary-focused). Default is "default".'
      ),
    includeTOC: z
      .boolean()
      .optional()
      .default(true)
      .describe('Include table of contents at the beginning of the report.'),
    includeStats: z
      .boolean()
      .optional()
      .default(true)
      .describe('Include document statistics in the footer (word count, reading time, etc).'),
  },
  async (args): Promise<ToolResult> => {
    try {
      console.log(`[reportWriter] Generating report: "${args.title}"`);
      console.log(`[reportWriter] Template: ${args.template || 'default'}`);
      console.log(`[reportWriter] Sections: ${args.sections.length}, Citations: ${args.citations.length}`);

      // Validate that we have content
      if (args.sections.length === 0) {
        throw new Error('Report must have at least one section');
      }

      if (args.citations.length === 0) {
        throw new Error('Report must have at least one citation');
      }

      // Prepare report data
      const reportData: ReportData = {
        title: args.title,
        sections: args.sections,
        citations: args.citations,
        metadata: {
          title: args.title,
          author: 'Deep Research Agent',
          generatedAt: new Date().toISOString(),
        },
      };

      // Prepare generation options
      const generationOptions: ReportGenerationOptions = {
        template: (args.template as ReportTemplateType) || 'default',
        includeTOC: args.includeTOC !== undefined ? args.includeTOC : true,
        includeStats: args.includeStats !== undefined ? args.includeStats : true,
        citationFormat: args.template === 'academic' ? 'apa' : 'numbered',
      };

      // Generate report using new MarkdownGenerator
      const result = generateReport(reportData, generationOptions);

      console.log(`[reportWriter] Report generated successfully:`);
      console.log(`  - Template: ${result.template}`);
      console.log(`  - Word count: ${result.stats.wordCount}`);
      console.log(`  - Sections: ${result.stats.sectionCount} (${result.stats.subsectionCount} subsections)`);
      console.log(`  - Citations: ${result.stats.citationCount}`);
      console.log(`  - Reading time: ~${result.stats.estimatedReadingTime} minutes`);

      // Return report in MCP format
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                markdown: result.markdown,
                metadata: {
                  title: args.title,
                  template: result.template,
                  wordCount: result.stats.wordCount,
                  sectionCount: result.stats.sectionCount,
                  subsectionCount: result.stats.subsectionCount,
                  citationCount: result.stats.citationCount,
                  estimatedReadingTime: result.stats.estimatedReadingTime,
                  generatedAt: result.metadata.generatedAt,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error('[reportWriter] Error:', error);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: error instanceof Error ? error.message : 'Unknown error occurred while generating report',
              title: args.title,
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

/**
 * Report structure guidelines:
 *
 * A good research report should include:
 *
 * 1. Executive Summary section
 *    - Brief overview of the topic
 *    - Key findings (2-3 paragraphs)
 *
 * 2. Main Content sections (3-5 sections)
 *    - Introduction/Background
 *    - Key Topics (organized by theme)
 *    - Analysis/Discussion
 *    - Practical Applications (if relevant)
 *
 * 3. Conclusion section
 *    - Summary of key insights
 *    - Final thoughts
 *
 * 4. References
 *    - All sources properly cited
 *    - Numbered list format
 *
 * Example structure:
 * - Section 1: Executive Summary
 * - Section 2: Introduction
 * - Section 3: [Main Topic Area 1]
 *   - Subsection: [Specific Aspect]
 *   - Subsection: [Another Aspect]
 * - Section 4: [Main Topic Area 2]
 * - Section 5: Conclusion
 */
