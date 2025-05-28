import { NextRequest, NextResponse } from 'next/server';
import { parseAndChunkPdf } from '~/utils/pdf-parser';
import { TextChunker } from '~/utils/text-chunker';
import { promises as fs } from 'fs';
import path from 'path';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to parse multipart form data
async function parseForm(req: NextRequest) {
  return new Promise<{ fields: any; files: any }>((resolve, reject) => {
    const form = formidable({ multiples: false });
    form.parse(req as any, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    // Parse the multipart form
    const { fields, files } = await parseForm(req);
    const file = files.file;
    const category_id = fields.category_id;
    const chunkSize = parseInt(fields.chunkSize) || 1500;
    const chunkOverlap = parseInt(fields.chunkOverlap) || 200;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    if (!category_id) {
      return NextResponse.json({ error: 'category_id is required' }, { status: 400 });
    }

    const ext = path.extname(file.originalFilename || '').toLowerCase();
    let chunks, metadata;

    if (ext === '.pdf') {
      // Use pdf-parser for PDFs
      const buffer = await fs.readFile(file.filepath);
      const fakeFile = new File([buffer], file.originalFilename, { type: file.mimetype });
      const result = await parseAndChunkPdf(fakeFile, chunkSize, chunkOverlap);
      chunks = result.chunks;
      metadata = result.metadata;
    } else if (ext === '.txt') {
      // Simple text chunking for TXT
      const buffer = await fs.readFile(file.filepath);
      const text = buffer.toString('utf-8');
      chunks = TextChunker.chunkText(text, { chunkSize, chunkOverlap });
      metadata = { title: file.originalFilename, fileType: 'txt', length: text.length };
    } else {
      return NextResponse.json({ error: 'Only PDF and TXT files are supported' }, { status: 400 });
    }

    return NextResponse.json({ chunks, metadata }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
} 