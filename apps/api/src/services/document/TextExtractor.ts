import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Extracted document text with metadata
 */
export interface ExtractedText {
  text: string;
  metadata: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    pageCount?: number;
    wordCount: number;
    charCount: number;
    extractedAt: string;
  };
}

/**
 * Document chunk for long documents
 */
export interface DocumentChunk {
  chunkIndex: number;
  totalChunks: number;
  text: string;
  wordCount: number;
  charCount: number;
}

/**
 * Text extraction options
 */
export interface ExtractionOptions {
  maxChunkSize?: number; // Max characters per chunk (default: 4000)
  overlapSize?: number;  // Overlap between chunks (default: 200)
}

/**
 * Abstract base class for text extractors
 */
export abstract class TextExtractor {
  abstract supportedMimeTypes: string[];

  /**
   * Check if this extractor supports the given MIME type
   */
  supports(mimeType: string): boolean {
    return this.supportedMimeTypes.includes(mimeType);
  }

  /**
   * Extract text from a file
   */
  abstract extractText(filePath: string, fileName: string, mimeType: string): Promise<ExtractedText>;

  /**
   * Split long text into chunks
   */
  chunkText(text: string, options: ExtractionOptions = {}): DocumentChunk[] {
    const maxChunkSize = options.maxChunkSize || 4000;
    const overlapSize = options.overlapSize || 200;

    if (text.length <= maxChunkSize) {
      return [
        {
          chunkIndex: 0,
          totalChunks: 1,
          text,
          wordCount: this.countWords(text),
          charCount: text.length,
        },
      ];
    }

    const chunks: DocumentChunk[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + maxChunkSize, text.length);
      const chunkText = text.substring(startIndex, endIndex);

      chunks.push({
        chunkIndex: chunks.length,
        totalChunks: 0, // Will update after
        text: chunkText,
        wordCount: this.countWords(chunkText),
        charCount: chunkText.length,
      });

      // Move forward, accounting for overlap
      startIndex = endIndex - overlapSize;
      if (startIndex >= text.length - overlapSize) {
        break;
      }
    }

    // Update totalChunks for all chunks
    chunks.forEach((chunk) => {
      chunk.totalChunks = chunks.length;
    });

    return chunks;
  }

  /**
   * Count words in text
   */
  protected countWords(text: string): number {
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }

  /**
   * Get file size
   */
  protected async getFileSize(filePath: string): Promise<number> {
    const stats = await fs.stat(filePath);
    return stats.size;
  }
}

/**
 * PDF text extractor using pdf-parse
 */
export class PDFExtractor extends TextExtractor {
  supportedMimeTypes = ['application/pdf'];

  async extractText(filePath: string, fileName: string, mimeType: string): Promise<ExtractedText> {
    try {
      console.log(`[PDFExtractor] Extracting text from: ${fileName}`);

      // Read PDF file
      const dataBuffer = await fs.readFile(filePath);

      // Parse PDF
      const pdfData = await pdfParse(dataBuffer);

      console.log(`[PDFExtractor] Extracted ${pdfData.numpages} pages`);

      const text = pdfData.text;
      const fileSize = await this.getFileSize(filePath);

      return {
        text,
        metadata: {
          fileName,
          fileSize,
          mimeType,
          pageCount: pdfData.numpages,
          wordCount: this.countWords(text),
          charCount: text.length,
          extractedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('[PDFExtractor] Error:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * DOCX text extractor using mammoth
 */
export class DOCXExtractor extends TextExtractor {
  supportedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];

  async extractText(filePath: string, fileName: string, mimeType: string): Promise<ExtractedText> {
    try {
      console.log(`[DOCXExtractor] Extracting text from: ${fileName}`);

      // Extract text using mammoth
      const result = await mammoth.extractRawText({ path: filePath });
      const text = result.value;

      const fileSize = await this.getFileSize(filePath);

      console.log(`[DOCXExtractor] Extracted ${text.length} characters`);

      return {
        text,
        metadata: {
          fileName,
          fileSize,
          mimeType,
          wordCount: this.countWords(text),
          charCount: text.length,
          extractedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('[DOCXExtractor] Error:', error);
      throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Plain text extractor
 */
export class TextFileExtractor extends TextExtractor {
  supportedMimeTypes = [
    'text/plain',
    'text/markdown',
    'text/csv',
    'text/html',
    'application/json',
    'application/xml',
  ];

  async extractText(filePath: string, fileName: string, mimeType: string): Promise<ExtractedText> {
    try {
      console.log(`[TextFileExtractor] Reading file: ${fileName}`);

      // Read text file
      const text = await fs.readFile(filePath, 'utf-8');
      const fileSize = await this.getFileSize(filePath);

      console.log(`[TextFileExtractor] Read ${text.length} characters`);

      return {
        text,
        metadata: {
          fileName,
          fileSize,
          mimeType,
          wordCount: this.countWords(text),
          charCount: text.length,
          extractedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('[TextFileExtractor] Error:', error);
      throw new Error(`Failed to read text file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Document processor factory
 * Selects the appropriate extractor based on MIME type
 */
export class DocumentProcessor {
  private extractors: TextExtractor[];

  constructor() {
    this.extractors = [
      new PDFExtractor(),
      new DOCXExtractor(),
      new TextFileExtractor(),
    ];
  }

  /**
   * Get extractor for a given MIME type
   */
  private getExtractor(mimeType: string): TextExtractor | null {
    return this.extractors.find((extractor) => extractor.supports(mimeType)) || null;
  }

  /**
   * Extract text from a document
   */
  async extractText(
    filePath: string,
    fileName: string,
    mimeType: string,
    options?: ExtractionOptions
  ): Promise<ExtractedText> {
    const extractor = this.getExtractor(mimeType);

    if (!extractor) {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    return extractor.extractText(filePath, fileName, mimeType);
  }

  /**
   * Extract text and chunk if necessary
   */
  async extractAndChunk(
    filePath: string,
    fileName: string,
    mimeType: string,
    options?: ExtractionOptions
  ): Promise<{ extracted: ExtractedText; chunks: DocumentChunk[] }> {
    const extractor = this.getExtractor(mimeType);

    if (!extractor) {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    const extracted = await extractor.extractText(filePath, fileName, mimeType);
    const chunks = extractor.chunkText(extracted.text, options);

    return { extracted, chunks };
  }

  /**
   * Get list of supported MIME types
   */
  getSupportedMimeTypes(): string[] {
    return this.extractors.flatMap((extractor) => extractor.supportedMimeTypes);
  }

  /**
   * Check if a MIME type is supported
   */
  isSupported(mimeType: string): boolean {
    return this.getSupportedMimeTypes().includes(mimeType);
  }
}

// Singleton instance
let documentProcessor: DocumentProcessor | null = null;

/**
 * Get or create DocumentProcessor singleton
 */
export function getDocumentProcessor(): DocumentProcessor {
  if (!documentProcessor) {
    documentProcessor = new DocumentProcessor();
    console.log('[DocumentProcessor] Processor initialized');
    console.log('[DocumentProcessor] Supported types:', documentProcessor.getSupportedMimeTypes());
  }

  return documentProcessor;
}
