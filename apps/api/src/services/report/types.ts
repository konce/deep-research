// Report Service Types
// Type definitions for the report generation system

import type { ReportSection, Citation } from '@deep-research/shared-types';

/**
 * Report template types
 */
export type ReportTemplateType = 'default' | 'academic' | 'technical' | 'executive';

/**
 * Report generation options
 */
export interface ReportGenerationOptions {
  /**
   * Template to use for generating the report
   */
  template?: ReportTemplateType;

  /**
   * Include table of contents
   */
  includeTOC?: boolean;

  /**
   * Include metadata section (author, date, version)
   */
  includeMetadata?: boolean;

  /**
   * Citation format
   */
  citationFormat?: 'numbered' | 'apa' | 'mla';

  /**
   * Include word count in footer
   */
  includeStats?: boolean;

  /**
   * Custom CSS for HTML export (future use)
   */
  customCSS?: string;
}

/**
 * Report template interface
 */
export interface ReportTemplate {
  /**
   * Template name
   */
  name: ReportTemplateType;

  /**
   * Template display name
   */
  displayName: string;

  /**
   * Template description
   */
  description: string;

  /**
   * Generate report title section
   */
  generateTitle(title: string, metadata?: ReportMetadata): string;

  /**
   * Generate table of contents
   */
  generateTOC?(sections: ReportSection[]): string;

  /**
   * Generate section heading
   */
  generateSectionHeading(heading: string, level: number): string;

  /**
   * Generate section content
   */
  generateSectionContent(content: string): string;

  /**
   * Generate citations section
   */
  generateCitations(citations: Citation[], format?: string): string;

  /**
   * Generate footer
   */
  generateFooter?(stats?: ReportStats): string;
}

/**
 * Report metadata
 */
export interface ReportMetadata {
  /**
   * Report title
   */
  title: string;

  /**
   * Author (e.g., "Deep Research Agent")
   */
  author?: string;

  /**
   * Generation date
   */
  generatedAt: string;

  /**
   * Research query that generated this report
   */
  query?: string;

  /**
   * Report version
   */
  version?: string;

  /**
   * Custom metadata
   */
  [key: string]: any;
}

/**
 * Report statistics
 */
export interface ReportStats {
  /**
   * Total word count
   */
  wordCount: number;

  /**
   * Total character count
   */
  charCount: number;

  /**
   * Number of main sections
   */
  sectionCount: number;

  /**
   * Number of subsections
   */
  subsectionCount: number;

  /**
   * Number of citations
   */
  citationCount: number;

  /**
   * Estimated reading time (minutes)
   */
  estimatedReadingTime?: number;
}

/**
 * Complete report data structure
 */
export interface ReportData {
  /**
   * Report title
   */
  title: string;

  /**
   * Report sections
   */
  sections: ReportSection[];

  /**
   * Citations
   */
  citations: Citation[];

  /**
   * Report metadata
   */
  metadata?: ReportMetadata;

  /**
   * Generation options
   */
  options?: ReportGenerationOptions;
}

/**
 * Generated report output
 */
export interface GeneratedReport {
  /**
   * Generated Markdown content
   */
  markdown: string;

  /**
   * Report statistics
   */
  stats: ReportStats;

  /**
   * Report metadata
   */
  metadata: ReportMetadata;

  /**
   * Template used
   */
  template: ReportTemplateType;
}

/**
 * Citation format types
 */
export type CitationFormatType = 'numbered' | 'apa' | 'mla' | 'chicago';

/**
 * Formatted citation
 */
export interface FormattedCitation {
  /**
   * Citation ID
   */
  id: string;

  /**
   * Formatted citation string
   */
  formatted: string;

  /**
   * Inline reference (e.g., "[1]" or "(Author, 2024)")
   */
  inlineRef: string;
}

/**
 * Markdown formatting options
 */
export interface MarkdownFormattingOptions {
  /**
   * Heading style (atx: ##, setext: underline)
   */
  headingStyle?: 'atx' | 'setext';

  /**
   * List marker for unordered lists
   */
  listMarker?: '-' | '*' | '+';

  /**
   * Code fence style
   */
  codeFence?: '```' | '~~~';

  /**
   * Line width for wrapping (0 = no wrap)
   */
  lineWidth?: number;

  /**
   * Use reference-style links
   */
  useReferenceLinks?: boolean;
}

/**
 * Table data structure for Markdown tables
 */
export interface MarkdownTable {
  /**
   * Table headers
   */
  headers: string[];

  /**
   * Table rows
   */
  rows: string[][];

  /**
   * Column alignments
   */
  alignments?: ('left' | 'center' | 'right')[];
}

/**
 * Report validation result
 */
export interface ReportValidationResult {
  /**
   * Is the report valid?
   */
  valid: boolean;

  /**
   * Validation errors
   */
  errors: string[];

  /**
   * Validation warnings
   */
  warnings: string[];

  /**
   * Quality score (0-100)
   */
  qualityScore?: number;
}
