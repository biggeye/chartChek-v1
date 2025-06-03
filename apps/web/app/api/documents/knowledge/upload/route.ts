import { NextRequest, NextResponse } from 'next/server';
import { parseAndChunkPdfServer } from '~/utils/pdf-parser-server';
import { TextChunker } from '~/utils/text-chunker';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const chunkSize = Number(formData.get('chunkSize')) || 1500;
    const chunkOverlap = Number(formData.get('chunkOverlap')) || 200;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`[Upload API] Processing file: ${file.name} (${file.type})`);

    let chunks: Array<{ text: string; metadata: any }> = [];
    let metadata: any = {};

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      // Use server-side PDF parser
      const result = await parseAndChunkPdfServer(file, chunkSize, chunkOverlap);
      chunks = result.chunks;
      metadata = result.metadata;
      
      console.log(`[Upload API] PDF processed: ${chunks.length} chunks created`);
    } else if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
      // Process text file
      const text = await file.text();
      const textChunks = TextChunker.chunkText(
        text, 
        { chunkSize, chunkOverlap }, 
        undefined, 
        file.name
      );
      
      chunks = textChunks.map((chunk) => ({
        text: chunk.text,
        metadata: chunk.metadata
      }));
      
      metadata = {
        title: file.name,
        pageCount: 1,
        type: 'text'
      };
      
      console.log(`[Upload API] Text file processed: ${chunks.length} chunks created`);
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Only PDF and TXT files are supported.' },
        { status: 400 }
      );
    }

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No content could be extracted from the file' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      chunks,
      metadata,
      message: `Successfully processed ${file.name} into ${chunks.length} chunks`
    });

  } catch (error) {
    console.error('[Upload API] Error processing file:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process file',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 