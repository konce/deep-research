// Markdown Generator Service
// Provides advanced Markdown generation capabilities with various formatting options

import type {
  ReportData,
  GeneratedReport,
  ReportStats,
  MarkdownTable,
  MarkdownFormattingOptions,
  ReportGenerationOptions,
} from './types';
import type { ReportSection, Citation } from '@deep-research/shared-types';

/**
 * Markdown Generator Class
 * Generates well-formatted Markdown documents with advanced features
 */
export class MarkdownGenerator {
  private options: MarkdownFormattingOptions;

  constructor(options: MarkdownFormattingOptions = {}) {
    this.options = {
      headingStyle: options.headingStyle || 'atx',
      listMarker: options.listMarker || '-',
      codeFence: options.codeFence || '```',
      lineWidth: options.lineWidth || 0,
      useReferenceLinks: options.useReferenceLinks || false,
    };
  }

  /**
   * Generate complete report from data
   */
  generate(data: ReportData, generationOptions?: ReportGenerationOptions): GeneratedReport {
    let markdown = '';

    // Generate title section
    markdown += this.generateTitle(data.title, data.metadata);
    markdown += '\n\n';

    // Generate metadata section if requested
    if (generationOptions?.includeMetadata && data.metadata) {
      markdown += this.generateMetadataSection(data.metadata);
      markdown += '\n\n';
    }

    markdown += '---\n\n';

    // Generate table of contents if requested
    if (generationOptions?.includeTOC) {
      markdown += this.generateTableOfContents(data.sections);
      markdown += '\n\n---\n\n';
    }

    // Generate main content sections
    markdown += this.generateSections(data.sections);

    // Generate citations
    if (data.citations && data.citations.length > 0) {
      markdown += '\n---\n\n';
      markdown += this.generateCitations(data.citations, generationOptions?.citationFormat);
    }

    // Generate footer with stats if requested
    if (generationOptions?.includeStats) {
      const stats = this.calculateStats(markdown, data.sections, data.citations);
      markdown += '\n\n';
      markdown += this.generateFooter(stats);
    }

    // Calculate statistics
    const stats = this.calculateStats(markdown, data.sections, data.citations);

    // Prepare metadata
    const metadata = {
      title: data.title,
      author: data.metadata?.author || 'Deep Research Agent',
      generatedAt: new Date().toISOString(),
      query: data.metadata?.query,
      ...data.metadata,
    };

    return {
      markdown,
      stats,
      metadata,
      template: generationOptions?.template || 'default',
    };
  }

  /**
   * Generate title section
   */
  private generateTitle(title: string, metadata?: any): string {
    let result = `# ${title}\n`;

    if (metadata?.generatedAt || !metadata) {
      const date = metadata?.generatedAt
        ? new Date(metadata.generatedAt)
        : new Date();

      result += `\n*Generated on ${date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}*\n`;
    }

    return result;
  }

  /**
   * Generate metadata section
   */
  private generateMetadataSection(metadata: any): string {
    let result = '## Document Information\n\n';

    if (metadata.author) {
      result += `**Author**: ${metadata.author}\n\n`;
    }

    if (metadata.query) {
      result += `**Research Query**: ${metadata.query}\n\n`;
    }

    if (metadata.version) {
      result += `**Version**: ${metadata.version}\n\n`;
    }

    if (metadata.generatedAt) {
      const date = new Date(metadata.generatedAt);
      result += `**Generated**: ${date.toLocaleString()}\n\n`;
    }

    return result;
  }

  /**
   * Generate table of contents
   */
  generateTableOfContents(sections: ReportSection[]): string {
    let toc = '## Table of Contents\n\n';

    sections.forEach((section, index) => {
      const anchor = this.createAnchor(section.heading);
      toc += `${index + 1}. [${section.heading}](#${anchor})\n`;

      if (section.subsections && section.subsections.length > 0) {
        section.subsections.forEach((subsection, subIndex) => {
          const subAnchor = this.createAnchor(subsection.heading);
          toc += `   ${index + 1}.${subIndex + 1}. [${subsection.heading}](#${subAnchor})\n`;
        });
      }
    });

    return toc;
  }

  /**
   * Generate main content sections
   */
  private generateSections(sections: ReportSection[]): string {
    let result = '';

    sections.forEach((section, index) => {
      // Main section heading
      result += `## ${section.heading}\n\n`;

      // Section content
      result += `${section.content}\n\n`;

      // Subsections
      if (section.subsections && section.subsections.length > 0) {
        section.subsections.forEach((subsection) => {
          result += `### ${subsection.heading}\n\n`;
          result += `${subsection.content}\n\n`;
        });
      }
    });

    return result;
  }

  /**
   * Generate citations section
   */
  private generateCitations(citations: Citation[], format: string = 'numbered'): string {
    let result = '## References\n\n';

    citations.forEach((citation, index) => {
      const number = index + 1;

      switch (format) {
        case 'apa':
          result += this.formatCitationAPA(citation, number);
          break;
        case 'mla':
          result += this.formatCitationMLA(citation, number);
          break;
        default:
          result += this.formatCitationNumbered(citation, number);
      }

      result += '\n';
    });

    return result;
  }

  /**
   * Format citation in numbered style
   */
  private formatCitationNumbered(citation: Citation, number: number): string {
    let result = `${number}. **${citation.title}**`;

    if (citation.source) {
      result += `  \n   ${citation.source}`;
    }

    if (citation.url) {
      result += `  \n   [${citation.url}](${citation.url})`;
    }

    return result;
  }

  /**
   * Format citation in APA style
   */
  private formatCitationAPA(citation: Citation, number: number): string {
    // Simplified APA format: Author/Source. (Year). Title. URL
    const source = citation.source || 'Unknown Source';
    const year = new Date().getFullYear();

    let result = `${number}. ${source}. (${year}). *${citation.title}*.`;

    if (citation.url) {
      result += ` Retrieved from ${citation.url}`;
    }

    return result;
  }

  /**
   * Format citation in MLA style
   */
  private formatCitationMLA(citation: Citation, number: number): string {
    // Simplified MLA format: "Title." Source. URL.
    let result = `${number}. "${citation.title}."`;

    if (citation.source) {
      result += ` *${citation.source}*.`;
    }

    if (citation.url) {
      result += ` ${citation.url}.`;
    }

    return result;
  }

  /**
   * Generate footer with statistics
   */
  private generateFooter(stats: ReportStats): string {
    let footer = '---\n\n';
    footer += '*Document Statistics*\n\n';
    footer += `- **Word Count**: ${stats.wordCount.toLocaleString()}\n`;
    footer += `- **Sections**: ${stats.sectionCount} main sections, ${stats.subsectionCount} subsections\n`;
    footer += `- **References**: ${stats.citationCount}\n`;

    if (stats.estimatedReadingTime) {
      footer += `- **Estimated Reading Time**: ${stats.estimatedReadingTime} minutes\n`;
    }

    footer += `\n*Generated by Deep Research Agent*\n`;

    return footer;
  }

  /**
   * Calculate report statistics
   */
  private calculateStats(
    markdown: string,
    sections: ReportSection[],
    citations: Citation[]
  ): ReportStats {
    const wordCount = markdown.split(/\s+/).filter(word => word.length > 0).length;
    const charCount = markdown.length;
    const sectionCount = sections.length;

    let subsectionCount = 0;
    sections.forEach((section) => {
      if (section.subsections) {
        subsectionCount += section.subsections.length;
      }
    });

    // Estimate reading time: average reading speed is 200-250 words per minute
    const estimatedReadingTime = Math.ceil(wordCount / 225);

    return {
      wordCount,
      charCount,
      sectionCount,
      subsectionCount,
      citationCount: citations.length,
      estimatedReadingTime,
    };
  }

  /**
   * Create anchor link from heading text
   */
  private createAnchor(heading: string): string {
    return heading
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }

  // ========== Advanced Formatting Methods ==========

  /**
   * Generate Markdown table
   */
  generateTable(table: MarkdownTable): string {
    const { headers, rows, alignments } = table;

    if (headers.length === 0) {
      throw new Error('Table must have at least one header');
    }

    let result = '';

    // Header row
    result += '| ' + headers.join(' | ') + ' |\n';

    // Separator row
    result += '|';
    headers.forEach((_, index) => {
      const align = alignments?.[index] || 'left';
      switch (align) {
        case 'center':
          result += ' :---: |';
          break;
        case 'right':
          result += ' ---: |';
          break;
        default:
          result += ' --- |';
      }
    });
    result += '\n';

    // Data rows
    rows.forEach((row) => {
      result += '| ' + row.join(' | ') + ' |\n';
    });

    return result;
  }

  /**
   * Generate blockquote
   */
  generateBlockquote(text: string): string {
    return text
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n');
  }

  /**
   * Generate code block
   */
  generateCodeBlock(code: string, language: string = ''): string {
    const fence = this.options.codeFence || '```';
    return `${fence}${language}\n${code}\n${fence}`;
  }

  /**
   * Generate unordered list
   */
  generateList(items: string[], ordered: boolean = false): string {
    return items
      .map((item, index) => {
        const marker = ordered ? `${index + 1}.` : this.options.listMarker || '-';
        return `${marker} ${item}`;
      })
      .join('\n');
  }

  /**
   * Generate horizontal rule
   */
  generateHR(): string {
    return '---';
  }

  /**
   * Wrap text to specified line width
   */
  private wrapText(text: string, width: number): string {
    if (width <= 0) return text;

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
      if ((currentLine + word).length > width && currentLine.length > 0) {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    });

    if (currentLine.length > 0) {
      lines.push(currentLine.trim());
    }

    return lines.join('\n');
  }

  /**
   * Escape special Markdown characters
   */
  escapeMarkdown(text: string): string {
    return text.replace(/([\\`*_{}\[\]()#+\-.!])/g, '\\$1');
  }

  /**
   * Generate link (inline or reference style)
   */
  generateLink(text: string, url: string, title?: string): string {
    if (this.options.useReferenceLinks) {
      // Reference-style link (not implemented yet, fallback to inline)
      return title ? `[${text}](${url} "${title}")` : `[${text}](${url})`;
    } else {
      return title ? `[${text}](${url} "${title}")` : `[${text}](${url})`;
    }
  }

  /**
   * Generate image
   */
  generateImage(alt: string, url: string, title?: string): string {
    return title ? `![${alt}](${url} "${title}")` : `![${alt}](${url})`;
  }

  /**
   * Generate emphasis (italic)
   */
  generateEmphasis(text: string): string {
    return `*${text}*`;
  }

  /**
   * Generate strong (bold)
   */
  generateStrong(text: string): string {
    return `**${text}**`;
  }

  /**
   * Generate inline code
   */
  generateInlineCode(code: string): string {
    return `\`${code}\``;
  }
}

/**
 * Create singleton instance with default options
 */
let defaultGenerator: MarkdownGenerator | null = null;

export function getMarkdownGenerator(options?: MarkdownFormattingOptions): MarkdownGenerator {
  if (!defaultGenerator) {
    defaultGenerator = new MarkdownGenerator(options);
  }
  return defaultGenerator;
}

/**
 * Convenience function to generate report
 */
export function generateReport(
  data: ReportData,
  options?: ReportGenerationOptions
): GeneratedReport {
  const generator = new MarkdownGenerator();
  return generator.generate(data, options);
}
