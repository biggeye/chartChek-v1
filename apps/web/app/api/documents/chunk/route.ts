// placedholder for agnostic document chunking

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '~/utils/supabase/client';
import { parseAndChunkPdf } from '~/utils/pdf-parser';
import { TextChunker } from '~/utils/text-chunker';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { document_id, chunk_size, chunk_overlap, type } = body;
    if (!document_id || !type) {
      return NextResponse.json({ error: 'document_id and type are required' }, { status: 400 });
    }
    const chunkSize = chunk_size || 1500;
    const chunkOverlap = chunk_overlap || 200;

    // Fetch the document record
    let docTable = type === 'knowledge' ? 'knowledge_documents' : 'user_documents';
    let { data: doc, error: docError } = await supabase
      .from(docTable)
      .select('*')
      .eq('id', document_id)
      .single();
    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Download the file from Supabase Storage
    const bucket = type === 'knowledge' ? 'knowledge-documents' : 'user-documents';
    const { data: fileData, error: fileError } = await supabase.storage
      .from(bucket)
      .download(doc.file_path);
    if (fileError || !fileData) {
      return NextResponse.json({ error: 'Failed to download file from storage' }, { status: 500 });
    }

    // Determine file type
    const ext = path.extname(doc.file_path || '').toLowerCase();
    let chunks = [];
    if (ext === '.pdf') {
      const buffer = await fileData.arrayBuffer();
      const fakeFile = new File([buffer], doc.title || 'document.pdf', { type: 'application/pdf' });
      const result = await parseAndChunkPdf(fakeFile, chunkSize, chunkOverlap);
      const pdfChunks: any[] = result.chunks;
      chunks = pdfChunks.map((chunk, idx: number) => ({
        title: doc.title,
        content: chunk.text,
        embedding: null,
        type,
        account_id: doc.account_id || null,
        document_id,
        position: idx,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    } else if (ext === '.txt') {
      const text = await fileData.text();
      const txtChunks: any[] = TextChunker.chunkText(text, { chunkSize, chunkOverlap });
      chunks = txtChunks.map((chunk, idx: number) => ({
        title: doc.title,
        content: chunk.text,
        embedding: null,
        type,
        account_id: doc.account_id || null,
        document_id,
        position: idx,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    } else {
      return NextResponse.json({ error: 'Only PDF and TXT files are supported' }, { status: 400 });
    }

    // Insert chunks into the correct table
    const chunkTable = type === 'knowledge' ? 'knowledge_chunks' : 'user_document_chunks';
    const { data: inserted, error: insertError } = await supabase
      .from(chunkTable)
      .insert(chunks)
      .select('id');
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ chunk_count: inserted.length, chunk_ids: inserted.map((c: any) => c.id) }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Chunking failed' }, { status: 500 });
  }
}