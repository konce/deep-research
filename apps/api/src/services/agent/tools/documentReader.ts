// Document Reader Tool - MCP Tool for reading uploaded documents
// Reads and extracts text from documents stored in the database

import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import type { ToolResult } from '../types';

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
  'Read the content of previously uploaded documents. Supports PDF, DOCX, CSV, and plain text files. Use this to extract information from documents provided by the user.',
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
          originalName: true,
          filename: true,
          mimeType: true,
          size: true,
          extractedText: true,
          createdAt: true,
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
                error: `Document "${document.originalName}" has no extracted text.`,
                documentId: args.documentId,
                mimeType: document.mimeType,
                suggestion: 'The text extraction may have failed during upload, or the document type may not be supported.',
              }),
            },
          ],
          isError: true,
        };
      }

      // Extract content (full or summary)
      let content = document.extractedText;
      const fullLength = content.length;
      let isTruncated = false;

      if (args.extractSummary && content.length > 2000) {
        content = content.substring(0, 2000);
        isTruncated = true;
      }

      console.log(`[documentReader] Successfully read document: ${document.originalName} (${fullLength} chars, ${isTruncated ? 'truncated' : 'full'})`);

      // Return document content in MCP format
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                documentId: document.id,
                filename: document.originalName,
                mimeType: document.mimeType,
                size: document.size,
                content,
                metadata: {
                  fullLength,
                  isTruncated,
                  truncatedLength: isTruncated ? 2000 : fullLength,
                  uploadedAt: document.createdAt.toISOString(),
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
