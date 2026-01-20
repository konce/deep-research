// Report Writer Tool - MCP Tool for generating research reports
// Generates comprehensive Markdown-formatted research reports

import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import type { ToolResult } from '../types';
import type { ReportSection, Citation } from '@deep-research/shared-types';

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

/**
 * Generate Markdown content from report structure
 */
function generateMarkdown(
  title: string,
  sections: ReportSection[],
  citations: Citation[]
): string {
  let markdown = '';

  // Title (H1)
  markdown += `# ${title}\n\n`;

  // Generate date
  markdown += `*Generated on ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}*\n\n`;

  markdown += `---\n\n`;

  // Main sections
  for (const section of sections) {
    // Section heading (H2)
    markdown += `## ${section.heading}\n\n`;

    // Section content
    markdown += `${section.content}\n\n`;

    // Subsections (if any)
    if (section.subsections && section.subsections.length > 0) {
      for (const subsection of section.subsections) {
        // Subsection heading (H3)
        markdown += `### ${subsection.heading}\n\n`;

        // Subsection content
        markdown += `${subsection.content}\n\n`;
      }
    }
  }

  // References section
  if (citations && citations.length > 0) {
    markdown += `---\n\n`;
    markdown += `## References\n\n`;

    citations.forEach((citation, index) => {
      const number = index + 1;

      if (citation.url) {
        // Citation with URL
        markdown += `${number}. **${citation.title}**  \n   ${citation.source}  \n   [${citation.url}](${citation.url})\n\n`;
      } else {
        // Citation without URL
        markdown += `${number}. **${citation.title}**  \n   ${citation.source}\n\n`;
      }
    });
  }

  return markdown;
}

/**
 * Calculate report statistics
 */
function calculateStatistics(markdown: string, sections: ReportSection[], citations: Citation[]) {
  const wordCount = markdown.split(/\s+/).length;
  const charCount = markdown.length;
  const sectionCount = sections.length;

  let subsectionCount = 0;
  sections.forEach((section) => {
    if (section.subsections) {
      subsectionCount += section.subsections.length;
    }
  });

  return {
    wordCount,
    charCount,
    sectionCount,
    subsectionCount,
    citationCount: citations.length,
  };
}

/**
 * Report Writer MCP Tool
 * Generates a comprehensive research report in Markdown format
 */
export const reportWriterTool = tool(
  'report_writer',
  'Generate a comprehensive research report in Markdown format. Use this tool at the end of your research to compile all findings into a well-structured report with proper citations.',
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
  },
  async (args): Promise<ToolResult> => {
    try {
      console.log(`[reportWriter] Generating report: "${args.title}"`);
      console.log(`[reportWriter] Sections: ${args.sections.length}, Citations: ${args.citations.length}`);

      // Validate that we have content
      if (args.sections.length === 0) {
        throw new Error('Report must have at least one section');
      }

      if (args.citations.length === 0) {
        throw new Error('Report must have at least one citation');
      }

      // Generate Markdown
      const markdown = generateMarkdown(args.title, args.sections, args.citations);

      // Calculate statistics
      const stats = calculateStatistics(markdown, args.sections, args.citations);

      console.log(`[reportWriter] Report generated successfully:`);
      console.log(`  - Word count: ${stats.wordCount}`);
      console.log(`  - Sections: ${stats.sectionCount} (${stats.subsectionCount} subsections)`);
      console.log(`  - Citations: ${stats.citationCount}`);

      // Return report in MCP format
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                markdown,
                metadata: {
                  title: args.title,
                  ...stats,
                  generatedAt: new Date().toISOString(),
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
