// Document Reader Tool - MCP Tool for reading uploaded documents
// Reads and extracts text from documents stored in the database

import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import type { ToolResult } from '../types';
import { getDocumentProcessor, type DocumentChunk } from '../../document/TextExtractor';

// Lazy-initialize Prisma client to avoid initialization issues
let prisma: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

/**
 * Document Reader MCP Tool
 * Reads the content of previously uploaded documents
 */
export const documentReaderTool = tool(
  'document_reader',
  'Read the content of previously uploaded documents. Supports PDF, DOCX, CSV, and plain text files. Use this to extract information from documents provided by the user. For long documents, can chunk the content into manageable pieces.',
  {
    documentId: z
      .string()
      .min(1)
      .describe('The unique ID of the document to read from the database.'),
    extractSummary: z
      .boolean()
      .default(false)
      .describe(
        'If true, returns only a summary/preview of the document (first 2000 characters). If false, returns the full text.'
      ),
    useChunking: z
      .boolean()
      .default(false)
      .describe(
        'If true and the document is long (>4000 characters), splits it into chunks for easier processing.'
      ),
    chunkIndex: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe(
        'If useChunking is true, specify which chunk to retrieve (0-indexed). If not specified, returns information about all chunks.'
      ),
  },
  async (args): Promise<ToolResult> => {
    try {
      console.log(`[documentReader] Reading document: ${args.documentId}`);

      // Query document from database
      const client = getPrismaClient();
      const document = await client.document.findUnique({
        where: { id: args.documentId },
        select: {
          id: true,
          originalFilename: true,
          filename: true,
          mimeType: true,
          fileSize: true,
          extractedText: true,
          wordCount: true,
          charCount: true,
          pageCount: true,
          uploadedAt: true,
        },
      });

      // Handle document not found
      if (!document) {
        console.error(`[documentReader] Document not found: ${args.documentId}`);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: `Document with ID "${args.documentId}" not found.`,
                documentId: args.documentId,
                suggestion: 'Check that the document ID is correct and the document has been uploaded.',
              }),
            },
          ],
          isError: true,
        };
      }

      // Handle document without extracted text
      if (!document.extractedText) {
        console.error(`[documentReader] No extracted text for document: ${args.documentId}`);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: `Document "${document.originalFilename}" has no extracted text.`,
                documentId: args.documentId,
                mimeType: document.mimeType,
                suggestion: 'The text extraction may have failed during upload, or the document type may not be supported.',
              }),
            },
          ],
          isError: true,
        };
      }

      const fullText = document.extractedText;
      const fullLength = fullText.length;

      // Handle chunking
      if (args.useChunking) {
        const processor = getDocumentProcessor();
        const extractor = processor['extractors'][0]; // Get any extractor for chunking
        const chunks = extractor.chunkText(fullText, { maxChunkSize: 4000, overlapSize: 200 });

        console.log(`[documentReader] Document chunked into ${chunks.length} pieces`);

        // If chunkIndex is specified, return that specific chunk
        if (args.chunkIndex !== undefined) {
          if (args.chunkIndex >= chunks.length) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    error: `Chunk index ${args.chunkIndex} is out of range. Document has ${chunks.length} chunks (0-${chunks.length - 1}).`,
                    documentId: args.documentId,
                    totalChunks: chunks.length,
                  }),
                },
              ],
              isError: true,
            };
          }

          const chunk = chunks[args.chunkIndex];
          console.log(`[documentReader] Returning chunk ${args.chunkIndex} of ${chunks.length}`);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    documentId: document.id,
                    filename: document.originalFilename,
                    mimeType: document.mimeType,
                    chunk: {
                      index: chunk.chunkIndex,
                      totalChunks: chunk.totalChunks,
                      text: chunk.text,
                      wordCount: chunk.wordCount,
                      charCount: chunk.charCount,
                    },
                    fullDocumentMetadata: {
                      totalLength: fullLength,
                      totalWords: document.wordCount,
                      totalPages: document.pageCount,
                      uploadedAt: document.uploadedAt.toISOString(),
                    },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // Return chunk overview
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  documentId: document.id,
                  filename: document.originalFilename,
                  mimeType: document.mimeType,
                  chunksAvailable: chunks.length,
                  chunks: chunks.map((chunk) => ({
                    index: chunk.chunkIndex,
                    wordCount: chunk.wordCount,
                    charCount: chunk.charCount,
                  })),
                  instruction: `Document is split into ${chunks.length} chunks. Use chunkIndex parameter (0-${chunks.length - 1}) to retrieve a specific chunk.`,
                  fullDocumentMetadata: {
                    totalLength: fullLength,
                    totalWords: document.wordCount,
                    totalPages: document.pageCount,
                    uploadedAt: document.uploadedAt.toISOString(),
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Handle summary extraction
      let content = fullText;
      let isTruncated = false;

      if (args.extractSummary && content.length > 2000) {
        content = content.substring(0, 2000);
        isTruncated = true;
      }

      console.log(`[documentReader] Successfully read document: ${document.originalFilename} (${fullLength} chars, ${isTruncated ? 'truncated' : 'full'})`);

      // Return document content in MCP format
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                documentId: document.id,
                filename: document.originalFilename,
                mimeType: document.mimeType,
                fileSize: document.fileSize,
                content,
                metadata: {
                  fullLength,
                  isTruncated,
                  truncatedLength: isTruncated ? 2000 : fullLength,
                  wordCount: document.wordCount,
                  pageCount: document.pageCount,
                  uploadedAt: document.uploadedAt.toISOString(),
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error('[documentReader] Error:', error);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: error instanceof Error ? error.message : 'Unknown error occurred while reading document',
              documentId: args.documentId,
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

/**
 * Cleanup function to disconnect Prisma client
 * Should be called when shutting down the service
 */
export async function disconnectDocumentReader() {
  if (prisma) {
    await prisma.$disconnect();
  }
}

/**
 * Usage notes:
 *
 * 1. Document must be uploaded first via POST /api/documents/upload
 * 2. Text extraction happens during upload (handled by document upload service)
 * 3. Supported formats: PDF, DOCX, TXT, CSV (via pdf-parse, mammoth, csv-parse)
 * 4. The extracted text is stored in the extractedText field
 * 5. For large documents, use extractSummary: true to get a preview first
 * 6. The Agent should use this tool when the user provides documents for research
 */
