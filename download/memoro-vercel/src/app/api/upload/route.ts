import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import sharp from 'sharp';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // Upload original to Vercel Blob
    const originalBlob = await put(`photos/${uniqueName}`, file, {
      access: 'public',
      contentType: file.type,
    });

    // Create thumbnail
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let width: number | null = null;
    let height: number | null = null;
    let thumbnailUrl = originalBlob.url;

    try {
      const metadata = await sharp(buffer).metadata();
      width = metadata.width || null;
      height = metadata.height || null;

      // Create thumbnail buffer
      const thumbBuffer = await sharp(buffer)
        .resize(400, null, { withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbName = `thumb-${uniqueName}`;
      const thumbBlob = await put(`photos/${thumbName}`, thumbBuffer, {
        access: 'public',
        contentType: 'image/jpeg',
      });
      thumbnailUrl = thumbBlob.url;
    } catch (err) {
      console.error('Thumbnail creation failed:', err);
    }

    return NextResponse.json({
      filename: uniqueName,
      filepath: originalBlob.url,
      thumbnail: thumbnailUrl,
      mimetype: file.type,
      size: file.size,
      width,
      height,
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
