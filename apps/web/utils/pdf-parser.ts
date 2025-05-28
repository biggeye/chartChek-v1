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
  // Only import PDF.js on the client side
  if (typeof window === 'undefined') {
    throw new Error('PDF parsing can only be performed in browser environments');
  }
  
  // Dynamic import of pdfjs-dist; type safety handled at runtime
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`;
  return pdfjs;
}

export async function parseAndChunkPdf(
  file: File,
  chunkSize: number,
  chunkOverlap: number,
): Promise<{ chunks: Chunk[]; metadata: DocumentMetadata }> {
  // Load PDF.js dynamically
  const pdfjs = await loadPdfJs();

  // Convert the file to an ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()

  // Load the PDF document
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
  const pdfDocument = await loadingTask.promise

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

  // Extract text from each page
  const chunks: Chunk[] = []

  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum)
    const textContent = await page.getTextContent()

    // Concatenate the text items
    let pageText = textContent.items.map((item: any) => ("str" in item ? item.str : "")).join(" ")

    // Clean up the text (remove excessive whitespace)
    pageText = pageText.replace(/\s+/g, " ").trim()

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
  }

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
