'use client'

import { createClient } from "~/utils/supabase/client"
import { TextChunker, Chunk } from "~/utils/text-chunker"

export type DocumentMetadata = {
  title?: string;
  author?: string;
  volumeTitle?: string;
  volumeNumber?: number;
  batchId?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export type UploadDocumentParams = {
  file: File
  corpusId: string
  chunkSize: number
  chunkOverlap: number
  metadata?: DocumentMetadata
  onProgress?: (percent: number) => void
}

export type BatchUploadParams = {
  files: File[]
  corpusId: string
  chunkSize: number
  chunkOverlap: number
  batchMetadata?: {
    volumeTitle?: string
    batchId?: string
    tags?: string[]
    customFields?: Record<string, any>
  }
  onProgress?: (percent: number) => void
  onFileComplete?: (fileIndex: number, documentId: string) => void
}

/**
 * Upload and process a single document
 */
export async function uploadDocument({
  file,
  corpusId,
  chunkSize,
  chunkOverlap,
  metadata = {},
  onProgress = () => { },
}: UploadDocumentParams): Promise<{ documentId: string; chunkCount: number }> {
  try {
    console.log('Document Service - Starting upload for file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    // Step 1: Parse the PDF and chunk the text
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('Document Service - Sending file to API endpoint:', `/api/corpora/${corpusId}/document`);
    
    // Send the file to our API endpoint
    const response = await fetch(`/api/corpora/${corpusId}/document`, {
      method: "POST",
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Document Service - API response error:', errorData);
      throw new Error(`Error parsing PDF: ${errorData.error || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Document Service - API response:', data);
    
    // Process the parsed text into chunks using TextChunker
    if (!data.text) {
      console.warn('Document Service - No text returned from API');
      // Create a single chunk with a warning message if no text was extracted
      const chunks: Chunk[] = [{
        text: "No text could be extracted from this PDF. It may be a scanned document or contain only images.",
        metadata: { position: 0 }
      }];
      console.log('Document Service - Created fallback chunk');
    } else {
      console.log('Document Service - Text length from API:', data.text.length);
      console.log('Document Service - Text preview:', data.text.substring(0, 100) + (data.text.length > 100 ? '...' : ''));
    }
    
    const chunks: Chunk[] = data.text ? TextChunker.chunkText(data.text, { chunkSize, chunkOverlap }) : [{
      text: "No text could be extracted from this PDF. It may be a scanned document or contain only images.",
      metadata: { position: 0 }
    }];
    
    console.log('Document Service - Created chunks:', chunks.length);
    
    // Get metadata from the first chunk to use for the document
    const documentMetadata = {
      pageCount: data.numPages || 1, // Use numPages from API response if available
      title: metadata.title || file.name,
      author: metadata.author,
      volumeTitle: metadata.volumeTitle,
      volumeNumber: metadata.volumeNumber,
      batchId: metadata.batchId,
      tags: metadata.tags,
      customFields: metadata.customFields
    };
    
    console.log('Document Service - Document metadata:', documentMetadata);
    
    const supabase = createClient();
    // Step 2: Upload the original file to Supabase Storage
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `documents/${fileName}`
    console.log('Document Service - Uploading file to Supabase:', filePath);
    const { data: fileUploaded, error: uploadError } = await supabase.storage.from("knowledge-documents").upload(filePath, file)
    console.log('Document Service - Supabase storage response:', fileUploaded);
    if (uploadError) {
      console.error('Document Service - Supabase storage upload error:', uploadError);
      throw new Error(`Error uploading file: ${uploadError.message}`);
    }

    // Step 3: Create a document record in the database
    console.log('Document Service - Creating document record in Supabase');
    const { data: document, error: documentError } = await supabase
      .from("knowledge_documents")
      .insert([
        {
          corpus_id: corpusId,
          title: documentMetadata.title,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          page_count: documentMetadata.pageCount || 0,
          metadata: documentMetadata,
        },
      ])
      .select()

    if (documentError) {
      console.error('Document Service - Error creating document record:', documentError);
      throw new Error(`Error creating document record: ${documentError.message}`);
    }
    console.log('Document Service - Document record created:', document[0].id);

    // Step 4: Insert chunks with progress tracking
    const documentId = document[0].id
    const totalChunks = chunks.length
    const user = await supabase.auth.getUser();
    const userId = user.data?.user?.id;
    
    console.log('Document Service - User ID for chunks:', userId);

    if (!documentId || !corpusId || !userId) {
      console.error('Document Service - Missing required IDs:', { documentId, corpusId, userId });
      throw new Error('Missing required IDs: need documentId, corpusId and userId!');
    }

    console.log('Document Service - Inserting chunks:', totalChunks);
    
    // Performance optimization: Insert chunks in batches rather than one by one
    const BATCH_SIZE = 10; // Insert 10 chunks at a time
    const chunkBatches = [];
    
    // Prepare chunk batches - filter out any suspiciously small chunks
    const MIN_CHUNK_SIZE = 100; // Minimum characters for embedding
    const validChunks = chunks.filter(chunk => chunk.text.length >= MIN_CHUNK_SIZE);
    
    if (validChunks.length < chunks.length) {
      console.log(`Document Service - Filtered out ${chunks.length - validChunks.length} chunks that were too small for embedding`);
    }
    
    for (let i = 0; i < validChunks.length; i += BATCH_SIZE) {
      const batch = validChunks.slice(i, i + BATCH_SIZE).map((chunk, batchIndex) => ({
        user_id: userId,
        document_id: documentId,
        corpus_id: corpusId,
        content: chunk.text,
        metadata: {
          pageNumber: chunk.metadata.pageNumber || 1,
          position: chunk.metadata.position,
          volumeTitle: documentMetadata.volumeTitle,
          volumeNumber: documentMetadata.volumeNumber,
          batchId: documentMetadata.batchId,
          tags: documentMetadata.tags
        },
      }));
      
      chunkBatches.push(batch);
    }
    
    // Call edge function to generate embeddings if available
    try {
      console.log('Document Service - Invoking edge function for embeddings');
      const { data: embedData, error: embedError } = await supabase.functions.invoke('embed', {
        body: { 
          corpusId, 
          documentId,
          // Only send the content and chunk IDs needed for embedding
          chunks: chunkBatches.flat().map((chunk, index) => ({
            id: index,
            content: chunk.content
          }))
        },
      });
      
      if (embedError) {
        console.warn('Document Service - Edge function error:', embedError);
      } else {
        console.log('Document Service - Edge function response:', embedData);
      }
    } catch (embedFunctionError) {
      // Don't fail the upload if the embedding function fails
      console.warn('Document Service - Failed to invoke edge function:', embedFunctionError);
    }
    
    console.log(`Document Service - Created ${chunkBatches.length} batches of chunks`);
    
    // Insert batches sequentially with progress updates
    let completedChunks = 0;
    for (let i = 0; i < chunkBatches.length; i++) {
      const batch = chunkBatches[i];
      if (!batch) continue;
      console.log(`Document Service - Inserting batch ${i+1}/${chunkBatches.length} (${batch.length} chunks)`);
      
      const { error: chunkError } = await supabase.from("document_chunks").insert(batch);
      
      if (chunkError) {
        console.error('Document Service - Error inserting chunk batch:', chunkError);
        throw new Error(`Error inserting chunk batch: ${chunkError.message}`);
      }
      
      // Update progress after each batch
      completedChunks += batch.length;
      const progressPercent = Math.min(((completedChunks) / totalChunks) * 100, 100);
      console.log(`Document Service - Progress: ${progressPercent.toFixed(1)}% (${completedChunks}/${totalChunks} chunks)`);
      onProgress(progressPercent);
    }

    console.log('Document Service - Upload complete for document:', documentId);
    return { documentId, chunkCount: totalChunks }
  } catch (error) {
    console.error('Document Service - Error in upload process:', error);
    throw error;
  }
}

/**
 * Upload and process multiple documents as a batch with shared metadata
 */
export async function uploadDocumentBatch({
  files,
  corpusId,
  chunkSize,
  chunkOverlap,
  batchMetadata = {},
  onProgress = () => {},
  onFileComplete = () => {}
}: BatchUploadParams): Promise<{
  batchId: string;
  totalFiles: number;
  totalChunks: number;
  documentIds: string[];
}> {
  try {
    console.log('Batch Upload - Starting batch upload for', files.length, 'files');
    
    // Generate a unique batch ID if not provided
    const batchId = batchMetadata.batchId || `batch-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    console.log('Batch Upload - Using batch ID:', batchId);
    
    const results = [];
    
    // Process each file sequentially
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      const fileNumber = i + 1;
      
      console.log(`Batch Upload - Processing file ${fileNumber}/${files.length}: ${file.name}`);
      
      // Create file-specific metadata that includes batch info
      const fileMetadata: DocumentMetadata = {
        title: file.name,
        volumeTitle: batchMetadata.volumeTitle,
        volumeNumber: fileNumber,
        batchId: batchId,
        tags: batchMetadata.tags,
        customFields: {
          ...batchMetadata.customFields,
          batchIndex: i,
          batchTotal: files.length
        }
      };
      
      // Calculate the progress offset for this file
      const fileProgressOffset = (i / files.length) * 100;
      const fileProgressWeight = 100 / files.length;
      
      // Upload the individual document with batch metadata
      const result = await uploadDocument({
        file: file,
        corpusId,
        chunkSize,
        chunkOverlap,
        metadata: fileMetadata,
        onProgress: (filePercent) => {
          // Scale the file's progress to the overall batch progress
          const overallProgress = fileProgressOffset + (filePercent * fileProgressWeight / 100);
          onProgress(overallProgress);
        }
      });
      
      results.push(result);
      
      // Notify that this file is complete
      onFileComplete(i, result.documentId);
    }
    
    console.log('Batch Upload - All files processed successfully');
    
    return {
      batchId,
      totalFiles: files.length,
      totalChunks: results.reduce((sum, result) => sum + result.chunkCount, 0),
      documentIds: results.map(result => result.documentId)
    };
  } catch (error) {
    console.error('Batch Upload - Error processing batch:', error);
    throw error;
  }
}

export async function uploadKnowledgeDocument({ file, categoryId, title, metadata }: {
  file: File;
  categoryId: string;
  title: string;
  metadata?: any;
}): Promise<{ documentId: string }> {
  const supabase = createClient();
  // Upload file to storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `documents/${fileName}`;
  const { data: fileUploaded, error: uploadError } = await supabase.storage.from('knowledge-documents').upload(filePath, file);
  if (uploadError) throw new Error(uploadError.message);
  // Insert document row
  const { data: doc, error: docError } = await supabase.from('knowledge_documents').insert([
    {
      category_id: categoryId,
      title,
      file_path: filePath,
      file_size: file.size,
      file_type: file.type,
      metadata: metadata || {},
    },
  ]).select();
  if (docError) throw new Error(docError.message);
  return { documentId: doc[0].id };
}

export async function fetchKnowledgeDocuments() {
  const supabase = createClient();
  const { data, error } = await supabase.from('knowledge_documents').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchKnowledgeDocument(documentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from('knowledge_documents').select('*').eq('id', documentId).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteKnowledgeDocument(documentId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('knowledge_documents').delete().eq('id', documentId);
  if (error) throw new Error(error.message);
  return true;
}

export async function chunkKnowledgeDocument({ documentId, chunkSize, chunkOverlap }: {
  documentId: string;
  chunkSize: number;
  chunkOverlap: number;
}): Promise<{ chunk_count: number; chunk_ids: string[] }> {
  const res = await fetch('/api/documents/chunk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_id: documentId, chunk_size: chunkSize, chunk_overlap: chunkOverlap, type: 'knowledge' }),
  });
  if (!res.ok) throw new Error('Chunking failed');
  return await res.json();
}

export async function fetchKnowledgeChunks(documentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from('knowledge_chunks').select('*').eq('document_id', documentId).order('position');
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteKnowledgeChunks(documentId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('knowledge_chunks').delete().eq('document_id', documentId);
  if (error) throw new Error(error.message);
  return true;
}
