import { NextRequest, NextResponse } from 'next/server';
import { uploadToS3 } from '@/lib/aws';
import { revalidateSite } from '@/lib/revalidate';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

const badRequest = (error: string) => NextResponse.json({ success: false, error }, { status: 400 });

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentId = formData.get('documentId') as string;
    const folder = formData.get('folder') as string || '';
    const collection = formData.get('collection') as string || '';

    if (!file) return badRequest('No file provided');
    if (!collection) return badRequest('No Collection provided');
    if (file.size > MAX_FILE_SIZE) return badRequest('File size exceeds 10MB limit');
    if (!ALLOWED_TYPES.includes(file.type)) return badRequest('Only image files are allowed (JPEG, PNG, GIF, WebP)');

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToS3({ name: file.name, type: file.type, buffer }, folder, documentId, collection);
    revalidateSite();

    return NextResponse.json({ success: true, url, message: 'File uploaded successfully' });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

async function methodNotAllowed() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}

export { methodNotAllowed as GET, methodNotAllowed as PUT, methodNotAllowed as DELETE };
