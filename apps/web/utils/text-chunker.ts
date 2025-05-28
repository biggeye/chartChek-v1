// utils/text-chunker.ts
/**
 * TextChunker utility for splitting documents into chunks for RAG processing
 * Handles different chunking strategies and overlap configurations
 */

export type ChunkMetadata = {
    pageNumber?: number;
    position: number;
    documentTitle?: string;
    tags?: string[];
  }
  
  export type Chunk = {
    text: string;
    metadata: ChunkMetadata;
  }
  
  export interface ChunkOptions {
      chunkSize?: number;
      chunkOverlap?: number;
      separator?: string;
      minChunkSize?: number;
      maxChunks?: number; // Add maximum chunks limit
    }
    
    export class TextChunker {
      /**
       * Chunks text into smaller pieces with optional overlap, ensuring chunks end at sentence boundaries and always include document title in metadata
       * @param text The text to chunk
       * @param options Chunking options (size, overlap, etc.)
       * @param pageMap Optional: Array mapping each sentence to its page number (if available)
       * @param documentTitle Title of the document (required for metadata)
       * @param tags Optional tags to include in metadata
       * @returns Array of chunks with metadata
       */
      static chunkText(
        text: string,
        options: ChunkOptions = {},
        pageMap?: number[],
        documentTitle?: string,
        tags?: string[]
      ): Chunk[] {
        const {
          chunkSize = 1536,
          chunkOverlap = 200,
          minChunkSize = 100,
          maxChunks = 100
        } = options;
        // Use Intl.Segmenter if available, else fallback to regex
        const sentences = typeof Intl !== 'undefined' && Intl.Segmenter
          ? Array.from(new Intl.Segmenter('en', { granularity: 'sentence' }).segment(text), seg => seg.segment ?? "")
          : text.match(/[^.!?\n]+[.!?]+["')\]]*|[^.!?\n]+$/g) ?? [text];
  
        const chunks: Chunk[] = [];
        let currentChunk: string[] = [];
        let currentTokenCount = 0;
        let position = 0;
        let pageNumber = 1;
        const getTokenCount = (str: string) => str.split(/\s+/).length;
        for (let i = 0; i < sentences.length; i++) {
          const sentence = sentences[i] ?? "";
          const sentenceTokens = getTokenCount(sentence);
          // Determine page number for this sentence
          const thisPage = pageMap && pageMap[i] !== undefined ? pageMap[i]! : pageNumber;
          // If adding this sentence would exceed chunk size, flush current chunk
          if (currentTokenCount + sentenceTokens > chunkSize && currentChunk.length > 0) {
            chunks.push({
              text: currentChunk.join(' ').trim(),
              metadata: {
                position: position++,
                pageNumber,
                documentTitle: documentTitle || '',
                tags: tags || []
              }
            });
            // Start new chunk, with overlap
            const overlapSentences: string[] = [];
            let overlapTokens = 0;
            for (let j = currentChunk.length - 1; j >= 0 && overlapTokens < chunkOverlap; j--) {
              const chunk = currentChunk[j] ?? "";
              overlapSentences.unshift(chunk);
              overlapTokens += getTokenCount(chunk);
            }
            currentChunk = [...overlapSentences, sentence];
            currentTokenCount = overlapTokens + sentenceTokens;
            pageNumber = thisPage;
          } else {
            // Add sentence to current chunk
            currentChunk.push(sentence);
            currentTokenCount += sentenceTokens;
            // Update page number if this is the first sentence in chunk
            if (currentChunk.length === 1) pageNumber = thisPage;
          }
        }
        // Push any remaining chunk
        if (currentChunk.length > 0) {
          chunks.push({
            text: currentChunk.join(' ').trim(),
            metadata: {
              position: position++,
              pageNumber,
              documentTitle: documentTitle || '',
              tags: tags || []
            }
          });
        }
        return chunks;
      }
      
      /**
       * Apply standard chunking algorithm to text
       * @param text The text to chunk
       * @param options Chunking options
       * @param startPosition Position offset for chunk metadata
       */
      static applyStandardChunking(
        text: string,
        options: ChunkOptions = {},
        startPosition: number = 0
      ): Chunk[] {
        const {
          chunkSize = 1536,
          chunkOverlap = 200,
          minChunkSize = 100,
          maxChunks = 100
        } = options;
        const chunks: Chunk[] = [];
        let position = startPosition;
        
        // COMPLETE REWRITE: Use a simpler, more reliable chunking algorithm
        // that won't get stuck in infinite loops
        
        // Safety check for empty text
        if (!text || text.length === 0) {
          console.log("TextChunker - Empty text provided, returning empty chunks array");
          return chunks;
        }
        
        // Log the chunking strategy
        console.log(`TextChunker - Using new chunking algorithm on text of length ${text.length}`);
        
        // Calculate actual chunk positions
        const textLength = text.length;
        const effectiveChunkSize = Math.max(chunkSize, minChunkSize);
        const effectiveOverlap = Math.min(chunkOverlap, effectiveChunkSize / 2);
        
        // Calculate chunk start positions in advance
        const chunkStarts: number[] = [];
        let currentPosition = 0;
        
        while (currentPosition < textLength && chunkStarts.length < maxChunks) {
          chunkStarts.push(currentPosition);
          const nextPosition = currentPosition + effectiveChunkSize - effectiveOverlap;
          if (chunkStarts.length > 1 && nextPosition <= chunkStarts[chunkStarts.length - 1]!) {
            break;
          }
          currentPosition = nextPosition;
        }
        
        console.log(`TextChunker - Will create ${chunkStarts.length} chunks`);
        
        // Process each chunk
        for (let i = 0; i < chunkStarts.length; i++) {
          // Log progress periodically
          if (i % 50 === 0) {
            console.log(`TextChunker - Processing chunk ${i}/${chunkStarts.length}`);
          }
          
          const start = chunkStarts[i] ?? 0;
          // End is either the next chunk start or the end of text
          const end = i < chunkStarts.length - 1 
            ? (chunkStarts[i + 1] ?? textLength) + effectiveOverlap 
            : textLength;
            
          // Get the raw chunk text
          let chunkText = text.substring(start, Math.min(end, textLength));
          
          // Find better break points if possible
          if (i < chunkStarts.length - 1) {
            // Try to end at a sentence or paragraph break
            const possibleBreaks = ["\n\n", ". ", "! ", "? ", "\n"];
            
            // Only search in the last part of the chunk to find a good break point
            const searchAreaStart = Math.max(0, chunkText.length - 200);
            const searchText = chunkText.substring(searchAreaStart);
            
            for (const breakChar of possibleBreaks) {
              const breakPos = searchText.lastIndexOf(breakChar);
              if (breakPos !== -1) {
                // Found a good break point
                const actualBreakPos = searchAreaStart + breakPos + breakChar.length;
                chunkText = chunkText.substring(0, actualBreakPos);
                break;
              }
            }
          }
          
          // Trim and add the chunk if it's large enough
          chunkText = chunkText.trim();
          if (chunkText.length >= minChunkSize) {
            chunks.push({
              text: chunkText,
              metadata: { position: position++ }
            });
          } else {
            console.log(`TextChunker - Skipping small chunk of size ${chunkText.length}`);
          }
        }
        
        console.log(`TextChunker - Successfully created ${chunks.length} chunks`);
        return chunks;
      }
  
      /**
       * Split text into chunks with specified size and overlap
       * @param text Text content to split
       * @param options Chunking options
       * @returns Array of text chunks
       */
      static splitText(text: string, options: ChunkOptions = {}): string[] {
        const {
          chunkSize = 1000,
          chunkOverlap = 200,
          separator = ' ',
          minChunkSize = 100,
          maxChunks = 100
        } = options;
  
        if (!text || text.length === 0) {
          return [];
        }
  
        // If text is smaller than chunk size, return as single chunk
        if (text.length <= chunkSize) {
          return [text];
        }
  
        const chunks: string[] = [];
        const tokens = text.split(separator).filter(Boolean);
        let currentChunk: string[] = [];
        let currentChunkLength = 0;
  
        for (let i = 0; i < tokens.length && chunks.length < maxChunks; i++) {
          const token = tokens[i] ?? "";
          currentChunk.push(token);
          currentChunkLength += token.length + (currentChunk.length > 1 ? separator.length : 0);
  
          // Check if we've reached the chunk size
          if (currentChunkLength >= chunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.join(separator));
            
            // Calculate overlap tokens
            const overlapTokenCount = Math.min(
              Math.floor((chunkOverlap / currentChunkLength) * currentChunk.length),
              currentChunk.length - 1 // Ensure we don't keep all tokens
            );
            
            // Reset for next chunk, keeping overlap tokens
            if (overlapTokenCount > 0) {
              currentChunk = currentChunk.slice(-overlapTokenCount);
              currentChunkLength = currentChunk.join(separator).length;
            } else {
              currentChunk = [];
              currentChunkLength = 0;
            }
          }
        }
  
        // Add the last chunk if it's not empty and meets minimum size
        if (currentChunk.length > 0 && currentChunkLength >= minChunkSize && chunks.length < maxChunks) {
          chunks.push(currentChunk.join(separator));
        }
  
        return chunks;
      }
  
      /**
       * Split text by paragraphs and then into chunks
       * @param text Text content to split
       * @param options Chunking options
       * @returns Array of text chunks
       */
      static splitByParagraphs(text: string, options: ChunkOptions = {}): string[] {
        const {
          chunkSize = 1000,
          minChunkSize = 100,
          maxChunks = 100
        } = options;
        
        // Safeguard against very large texts by truncating
        const maxTextLength = chunkSize * maxChunks;
        const truncatedText = text.length > maxTextLength ? text.substring(0, maxTextLength) : text;
        
        const paragraphs = truncatedText.split(/\n\s*\n/);
        const chunks: string[] = [];
        
        let currentChunk: string[] = [];
        let currentLength = 0;
        
        for (const paragraph of paragraphs) {
          if (chunks.length >= maxChunks) break; // Stop if we've reached max chunks
          
          const trimmedParagraph = paragraph.trim();
          if (!trimmedParagraph) continue;
          
          // If this paragraph alone exceeds chunk size, split it further
          if (trimmedParagraph.length > chunkSize) {
            // Add current chunk if not empty
            if (currentChunk.length > 0) {
              chunks.push(currentChunk.join('\n\n'));
              currentChunk = [];
              currentLength = 0;
            }
            
            // Split large paragraph using splitText
            const subChunks = this.splitText(trimmedParagraph, {
              ...options,
              maxChunks: maxChunks - chunks.length // Adjust max chunks
            });
            
            // Add sub-chunks to our chunks array
            chunks.push(...subChunks);
            continue;
          }
          
          // If adding this paragraph would exceed chunk size, save current chunk and start new one
          if (currentLength + trimmedParagraph.length > chunkSize && currentLength >= minChunkSize) {
            chunks.push(currentChunk.join('\n\n'));
            currentChunk = [];
            currentLength = 0;
          }
          
          // Add paragraph to current chunk
          currentChunk.push(trimmedParagraph);
          currentLength += trimmedParagraph.length + (currentChunk.length > 1 ? 2 : 0); // +2 for '\n\n'
        }
        
        // Add the last chunk if not empty
        if (currentChunk.length > 0 && currentLength >= minChunkSize && chunks.length < maxChunks) {
          chunks.push(currentChunk.join('\n\n'));
        }
        
        return chunks;
      }
  
      /**
       * Create metadata for each chunk
       * @param chunks Array of text chunks
       * @param documentName Name of the document
       * @returns Array of chunks with metadata
       */
      static createChunksWithMetadata(
        chunks: string[], 
        documentName: string
      ): { content: string; metadata: { position: number; total: number; documentName: string } }[] {
        return chunks.map((content, index) => ({
          content,
          metadata: {
            position: index + 1,
            total: chunks.length,
            documentName
          }
        }));
      }
    }