import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';
import { uploadToS3 } from '@/lib/aws';
import os from 'os';
import { revalidateSite } from '@/lib/revalidate';

// Type for the response
interface UploadResponse {
  success: boolean;
  url?: string;
  message?: string;
  error?: string;
}

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed image file types only
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentId = formData.get('documentId') as string;
    const folder = formData.get('folder') as string || '';
    const collection = formData.get('collection') as string || '';

    // Validation
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'No Collection provided' },
        { status: 400 }
      );
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Only image files are allowed (JPEG, PNG, GIF, WebP)' },
        { status: 400 }
      );
    }

    // Create temporary file to work with multer-like interface
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Use os.tmpdir() for cross-platform temporary directory
    const tempDir = os.tmpdir();
    const tempFileName = `${nanoid()}_${file.name}`;
    const tempFilePath = path.join(tempDir, tempFileName);

    await writeFile(tempFilePath, buffer);

    // Create multer-like file object
    const multerFile = {
      fieldname: 'file',
      originalname: file.name,
      encoding: '7bit',
      mimetype: file.type,
      size: file.size,
      destination: tempDir,
      filename: tempFileName,
      path: tempFilePath,
      buffer: buffer
    };
    // Upload to S3
    const url = await uploadToS3(multerFile, folder, documentId, collection);
    // Clean up temp file
    await unlink(tempFilePath).catch(err => console.warn('Failed to delete temp file:', err));

    // Revalidate Next.js cache so Home section and other pages update immediately
    revalidateSite();

    return NextResponse.json({
      success: true,
      url,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET(): Promise<NextResponse<UploadResponse>> {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT(): Promise<NextResponse<UploadResponse>> {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE(): Promise<NextResponse<UploadResponse>> {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}