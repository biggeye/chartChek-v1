// Server-side PDF parser using pdf-parse
import pdfParse from 'pdf-parse';

type ChunkMetadata = {
  pageNumber?: number
  position: number
}

type Chunk = {
  text: string
  metadata: ChunkMetadata
}

type DocumentMetadata = {
  title?: string
  author?: string
  subject?: string
  keywords?: string
  pageCount: number
  creationDate?: Date
  modificationDate?: Date
}

/**
 * Parse PDF using server-side pdf-parse library
 * This works in Node.js environments without browser DOM dependencies
 */
export async function parseAndChunkPdfServer(
  file: File,
  chunkSize: number,
  chunkOverlap: number,
): Promise<{ chunks: Chunk[]; metadata: DocumentMetadata }> {
  console.log(`[PDF Parser Server] Starting to parse PDF: ${file.name}, size: ${file.size} bytes`);
  
  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Parse PDF using pdf-parse with valid options
    const pdfData = await pdfParse(buffer);
    
    console.log(`[PDF Parser Server] PDF parsed successfully. Pages: ${pdfData.numpages}, Text length: ${pdfData.text.length}`);
    
    // Extract metadata
    const documentMetadata: DocumentMetadata = {
      title: pdfData.info?.Title || file.name,
      author: pdfData.info?.Author,
      subject: pdfData.info?.Subject,
      keywords: pdfData.info?.Keywords,
      pageCount: pdfData.numpages,
      creationDate: pdfData.info?.CreationDate ? new Date(pdfData.info.CreationDate) : undefined,
      modificationDate: pdfData.info?.ModDate ? new Date(pdfData.info.ModDate) : undefined,
    };
    
    console.log(`[PDF Parser Server] Extracted metadata:`, {
      title: documentMetadata.title,
      author: documentMetadata.author,
      pageCount: documentMetadata.pageCount
    });
    
    // Check if we have text content
    if (!pdfData.text || pdfData.text.trim().length === 0) {
      throw new Error('No text could be extracted from the PDF. It might be a scanned document or contain only images.');
    }
    
    // Chunk the text
    const chunks = chunkText(pdfData.text, chunkSize, chunkOverlap);
    
    console.log(`[PDF Parser Server] Successfully created ${chunks.length} chunks`);
    
    return { chunks, metadata: documentMetadata };
    
  } catch (error) {
    console.error(`[PDF Parser Server] Error parsing PDF:`, error);
    throw error;
  }
}

function chunkText(text: string, chunkSize: number, chunkOverlap: number): Chunk[] {
  const chunks: Chunk[] = [];
  
  if (text.length <= chunkSize) {
    chunks.push({
      text: text.trim(),
      metadata: { position: 0 }
    });
    return chunks;
  }

  let startIndex = 0;
  let position = 0;

  while (startIndex < text.length) {
    // Find the end of the chunk
    let endIndex = startIndex + chunkSize;

    if (endIndex > text.length) {
      endIndex = text.length;
    } else {
      // Try to end at a sentence or paragraph break
      const possibleBreaks = ["\n\n", ". ", "! ", "? ", "\n"];
      let bestBreakIndex = -1;

      for (const breakChar of possibleBreaks) {
        const breakIndex = text.lastIndexOf(breakChar, endIndex);

        if (breakIndex > startIndex && (bestBreakIndex === -1 || breakIndex > bestBreakIndex)) {
          bestBreakIndex = breakIndex + breakChar.length;
        }
      }

      if (bestBreakIndex !== -1) {
        endIndex = bestBreakIndex;
      }
    }

    // Add the chunk
    const chunkText = text.substring(startIndex, endIndex).trim();
    if (chunkText.length > 0) {
      chunks.push({
        text: chunkText,
        metadata: { position }
      });
      position++;
    }

    // Move to the next chunk, accounting for overlap
    startIndex = endIndex - chunkOverlap;

    // Make sure we're making progress
    if (startIndex >= text.length || startIndex <= endIndex - chunkSize) {
      break;
    }
  }

  return chunks;
} 