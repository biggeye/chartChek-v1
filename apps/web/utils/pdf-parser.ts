// (Type import for pdfjs-dist removed; dynamic import used below)

// Define types for PDF.js metadata
interface PDFMetadataInfo {
  Title?: string;
  Author?: string;
  Subject?: string;
  Keywords?: string;
  CreationDate?: string;
  ModDate?: string;
  [key: string]: any;
}

interface PDFMetadata {
  info: PDFMetadataInfo;
  metadata?: any;
  contentDispositionFilename?: string;
}

type ChunkMetadata = {
  pageNumber: number
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

// Helper function to dynamically load PDF.js
async function loadPdfJs() {
  // Dynamic import of pdfjs-dist; type safety handled at runtime
  const pdfjs = await import('pdfjs-dist');
  
  // Configure worker based on environment
  const isServer = typeof window === 'undefined';
  const pdfjsVersion = pdfjs.version || '3.11.174';
  
  if (isServer) {
    // Server-side: Disable worker and use main thread processing
    console.log(`[PDF Parser] Running in server environment with PDF.js version ${pdfjsVersion}`);
    console.log('[PDF Parser] Using main thread processing for server-side PDF parsing');
    
    // Disable worker for server-side processing - this forces PDF.js to run in the main thread
    pdfjs.GlobalWorkerOptions.workerSrc = false as any;
    
  } else {
    // Client-side: Use web worker
    console.log(`[PDF Parser] Running in browser environment with PDF.js version ${pdfjsVersion}`);
    
    try {
      // Use a reliable CDN source with proper CORS headers
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.js`;
      console.log(`[PDF Parser] Using jsdelivr CDN worker for browser`);
    } catch (workerError) {
      console.warn('[PDF Parser] Worker setup issue, PDF.js will fall back to main thread processing');
    }
  }
  
  return pdfjs;
}

export async function parseAndChunkPdf(
  file: File,
  chunkSize: number,
  chunkOverlap: number,
): Promise<{ chunks: Chunk[]; metadata: DocumentMetadata }> {
  const isServer = typeof window === 'undefined';
  console.log(`[PDF Parser] Starting to parse PDF: ${file.name}, size: ${file.size} bytes (${isServer ? 'server' : 'client'} environment)`);
  
  // Load PDF.js dynamically
  const pdfjs = await loadPdfJs();

  // Convert the file to an ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()

  // Load the PDF document with configuration appropriate for the environment
  const loadingTask = pdfjs.getDocument({ 
    data: arrayBuffer,
    verbosity: 0, // Reduce console spam
    useSystemFonts: true,
    disableFontFace: true, // Helps with compatibility
    // Additional options for server-side processing
    ...(isServer && {
      disableAutoFetch: true,
      disableStream: true,
    })
  })
  
  const pdfDocument = await loadingTask.promise

  console.log(`[PDF Parser] PDF loaded successfully. Pages: ${pdfDocument.numPages}`);

  // Extract metadata
  const metadata = await pdfDocument.getMetadata() as PDFMetadata
  const documentMetadata: DocumentMetadata = {
    title: metadata.info?.Title,
    author: metadata.info?.Author,
    subject: metadata.info?.Subject,
    keywords: metadata.info?.Keywords,
    pageCount: pdfDocument.numPages,
    creationDate: metadata.info?.CreationDate ? new Date(metadata.info.CreationDate) : undefined,
    modificationDate: metadata.info?.ModDate ? new Date(metadata.info.ModDate) : undefined,
  }

  console.log(`[PDF Parser] Extracted metadata:`, documentMetadata);

  // Extract text from each page
  const chunks: Chunk[] = []

  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    try {
      console.log(`[PDF Parser] Processing page ${pageNum}/${pdfDocument.numPages}`);
      
      const page = await pdfDocument.getPage(pageNum)
      const textContent = await page.getTextContent()

      // Concatenate the text items
      let pageText = textContent.items.map((item: any) => ("str" in item ? item.str : "")).join(" ")

      // Clean up the text (remove excessive whitespace)
      pageText = pageText.replace(/\s+/g, " ").trim()

      console.log(`[PDF Parser] Page ${pageNum} text length: ${pageText.length} characters`);

      // Only process if there's meaningful content
      if (pageText.length > 10) {
        // Chunk the text
        const pageChunks = chunkText(pageText, chunkSize, chunkOverlap)

        // Add metadata to each chunk
        pageChunks.forEach((text) => {
          chunks.push({
            text,
            metadata: {
              pageNumber: pageNum,
            },
          })
        })
      } else {
        console.log(`[PDF Parser] Page ${pageNum} has minimal content, skipping`);
      }
    } catch (pageError) {
      console.error(`[PDF Parser] Error processing page ${pageNum}:`, pageError);
      // Continue with other pages even if one fails
    }
  }

  console.log(`[PDF Parser] Successfully created ${chunks.length} chunks from ${pdfDocument.numPages} pages`);

  return { chunks, metadata: documentMetadata }
}

function chunkText(text: string, chunkSize: number, chunkOverlap: number): string[] {
  const chunks: string[] = []

  if (text.length <= chunkSize) {
    chunks.push(text)
    return chunks
  }

  let startIndex = 0

  while (startIndex < text.length) {
    // Find the end of the chunk
    let endIndex = startIndex + chunkSize

    if (endIndex > text.length) {
      endIndex = text.length
    } else {
      // Try to end at a sentence or paragraph break
      const possibleBreaks = [". ", "! ", "? ", "\n\n"]
      let bestBreakIndex = -1

      for (const breakChar of possibleBreaks) {
        const breakIndex = text.lastIndexOf(breakChar, endIndex)

        if (breakIndex > startIndex && (bestBreakIndex === -1 || breakIndex > bestBreakIndex)) {
          bestBreakIndex = breakIndex + breakChar.length - 1
        }
      }

      if (bestBreakIndex !== -1) {
        endIndex = bestBreakIndex + 1
      }
    }

    // Add the chunk
    chunks.push(text.substring(startIndex, endIndex).trim())

    // Move to the next chunk, accounting for overlap
    startIndex = endIndex - chunkOverlap

    // Make sure we're making progress
    if (startIndex >= text.length || startIndex <= 0) {
      break
    }
  }

  return chunks
}
