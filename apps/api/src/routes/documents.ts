import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { getDocumentProcessor } from '../services/document/TextExtractor';

const router: Router = Router();
const prisma = new PrismaClient();
const documentProcessor = getDocumentProcessor();

// Configure storage
const STORAGE_PATH = process.env.STORAGE_PATH || './storage/documents';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Ensure storage directory exists
async function ensureStorageDir() {
  try {
    await fs.mkdir(STORAGE_PATH, { recursive: true });
  } catch (error) {
    console.error('[Documents] Error creating storage directory:', error);
  }
}

// Initialize storage directory
ensureStorageDir();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    cb(null, STORAGE_PATH);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

// File filter for validation
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const mimeType = file.mimetype;

  // Check if file type is supported
  if (documentProcessor.isSupported(mimeType)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${mimeType}. Supported types: ${documentProcessor.getSupportedMimeTypes().join(', ')}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

// POST /api/documents/upload - Upload a document
router.post('/upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    console.log('[Documents] File uploaded:', req.file.originalname);

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const mimeType = req.file.mimetype;

    // Extract text from document
    console.log('[Documents] Extracting text from document...');
    const extracted = await documentProcessor.extractText(filePath, fileName, mimeType);

    console.log('[Documents] Extracted:', {
      wordCount: extracted.metadata.wordCount,
      charCount: extracted.metadata.charCount,
    });

    // Save document to database
    const document = await prisma.document.create({
      data: {
        filename: fileName,
        originalFilename: fileName,
        filePath: filePath,
        mimeType: mimeType,
        fileSize: extracted.metadata.fileSize,
        extractedText: extracted.text,
        wordCount: extracted.metadata.wordCount,
        charCount: extracted.metadata.charCount,
        pageCount: extracted.metadata.pageCount,
      },
    });

    console.log('[Documents] Document saved to database:', document.id);

    res.json({
      documentId: document.id,
      filename: document.filename,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      wordCount: document.wordCount,
      charCount: document.charCount,
      pageCount: document.pageCount,
      uploadedAt: document.uploadedAt.toISOString(),
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('[Documents] Error cleaning up file:', unlinkError);
      }
    }

    next(error);
  }
});

// GET /api/documents/:id - Get document details
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    res.json({
      documentId: document.id,
      filename: document.filename,
      originalFilename: document.originalFilename,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      wordCount: document.wordCount,
      charCount: document.charCount,
      pageCount: document.pageCount,
      uploadedAt: document.uploadedAt.toISOString(),
      extractedText: document.extractedText, // Include text in response
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/documents/:id - Delete a document
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // Delete file from storage
    try {
      await fs.unlink(document.filePath);
    } catch (error) {
      console.error('[Documents] Error deleting file:', error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.document.delete({
      where: { id },
    });

    console.log('[Documents] Document deleted:', id);

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
