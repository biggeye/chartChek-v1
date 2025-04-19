import React, { ReactNode, useMemo } from 'react';
import { marked } from 'marked';

interface ProcessedContent {
  content: string;
  footnotes: { index: number; annotation: any }[];
  pageReferences: { index: number; pageRange: string }[];
}

const processAnnotations = (
  content: string,
  annotations: any[] = []
): ProcessedContent => {
  if (!content) return { content: '', footnotes: [], pageReferences: [] };
  if (!annotations || !Array.isArray(annotations) || annotations.length === 0) {
    return { content, footnotes: [], pageReferences: [] };
  }

  let footnotes: { index: number; annotation: any }[] = [];
  let pageReferences: { index: number; pageRange: string }[] = [];
  let footnoteCounter = 1;

  // Sort annotations descending by end_index to avoid index shifting issues.
  const sortedAnnotations = [...annotations].sort((a, b) => b.end_index - a.end_index);
  sortedAnnotations.forEach((ann) => {
    const { start_index, end_index } = ann;
    if (start_index !== undefined && end_index !== undefined) {
      footnotes.push({ index: footnoteCounter, annotation: ann });
      // Insert a simple superscript marker without any modal logic.
      content =
        content.slice(0, end_index) +
        `<sup class="footnote-indicator" data-index="${footnoteCounter}">${footnoteCounter}</sup>` +
        content.slice(end_index);
      footnoteCounter++;
    }
  });

  // Process citations in the format【index:page†source】or [index:page†source]
  content = content.replace(/(?:【|\[)(\d+):(\d+)†([^】\]]+)(?:】|\])/g, (match, index, page, source) => {
    const citationIndex = footnotes.length + 1;
    footnotes.push({ 
      index: citationIndex, 
      annotation: {
        type: 'file_citation',
        start_index: 0,
        end_index: 0,
        text: `${source}, page ${page}`,
        file_citation: { file_id: `source-${index}` }
      } 
    });
    return `<sup class="citation-indicator" data-index="${citationIndex}">[${citationIndex}]</sup>`;
  });

  // Replace page reference markers ([number-number]) with anchor tags.
  let pageRefCounter = 1;
  content = content.replace(/\[(\d+-\d+)\]/g, (match, range) => {
    pageReferences.push({ index: pageRefCounter, pageRange: range });
    const link = `<a class="page-indicator" data-index="${pageRefCounter}" href="javascript:void(0)">${pageRefCounter}</a>`;
    pageRefCounter++;
    return link;
  });

  return { content, footnotes, pageReferences };
};

// Enhanced formatting: converts markdown-style elements to HTML
const applyFormatting = (content: string): string => {
  if (!content) return '';

  // Pre-process content for our specific formatting needs
  // Convert standalone ### (used as section dividers)
  content = content.replace(/^#+\s*$/gm, '---');

  // Replace specific patterns with custom HTML that marked will pass through
  // Handle section headings with ### followed by a title (like "### Initial Assessment:")
  content = content.replace(/^###\s+([^:\n]+):(.*)$/gm, function(match: string, title: string, rest: string): string {
    return `<h3 class="text-lg font-bold mt-6 mb-3 text-primary">${title}</h3>${rest}`;
  });
  
  // Handle numbered items with bold headers (like "1. **Complete a Comprehensive Assessment:**")
  content = content.replace(/^(\d+)\.\s+\*\*([^*:]+)\*\*:(.*)$/gm, function(match: string, number: string, title: string, rest: string): string {
    return `<div class="ml-0 mb-3">
      <div class="font-bold flex items-baseline">
        <span class="mr-2">${number}.</span>
        <span>${title}:</span>
      </div>${rest}
    </div>`;
  });
  
  // Handle bold subsections (- **Title**:)
  content = content.replace(/^\s*-\s+\*\*([^*:]+)\*\*:(.*)$/gm, function(match: string, title: string, rest: string): string {
    return `<div class="ml-6 mb-2">
      <strong class="text-gray-800">${title}:</strong>${rest}
    </div>`;
  });
  
  // Handle plain bullet points
  content = content.replace(/^\s*-\s+([^*\n][^\n]*)$/gm, function(match: string, text: string): string {
    return `<div class="ml-6 mb-2 flex">
      <span class="inline-block w-1.5 h-1.5 mt-2 mr-2 rounded-full bg-gray-500"></span>
      <span>${text}</span>
    </div>`;
  });

  // Set marked options
  marked.setOptions({
    gfm: true,         // Enable GitHub Flavored Markdown
    breaks: true,      // Convert '\n' in paragraphs into <br>
    pedantic: false,   // Conform to original markdown spec
    silent: false      // Don't ignore errors
  });

  try {
    // Let marked handle standard markdown elements
    const result = marked.parse(content);
    
    // Ensure we have a string result
    const resultStr = typeof result === 'string' ? result : '';
    
    // Post-process the HTML result
    
    // Replace horizontal rules with section dividers (which is what standalone ### was used for)
    let processedResult = resultStr.replace(/<hr>/g, '<div class="section-divider my-6 border-t-2 border-gray-200"></div>');
    
    // Style standard markdown elements with our custom classes
    
    // Style h1-h4 elements
    processedResult = processedResult.replace(/<h1>([^<]+)<\/h1>/g, '<h1 class="text-lg font-bold my-4">$1</h1>');
    processedResult = processedResult.replace(/<h2>([^<]+)<\/h2>/g, '<h2 class="text-xl font-bold my-3">$1</h2>');
    processedResult = processedResult.replace(/<h3>([^<]+)<\/h3>/g, '<h3 class="text-lg font-semibold my-3 text-primary">$1</h3>');
    processedResult = processedResult.replace(/<h4>([^<]+)<\/h4>/g, '<h4 class="text-base font-semibold my-2">$1</h4>');
    
    // Style paragraphs
    processedResult = processedResult.replace(/<p>([^<]+)<\/p>/g, (match: string, content: string): string => {
      // Special handling for paragraphs with specific content
      if (content.includes("Joint Commission") || 
          content.startsWith("To create a treatment plan") || 
          content.startsWith("This plan is developed")) {
        return `<p class="my-3">${content}</p>`;
      }
      return `<p class="my-2">${content}</p>`;
    });
    
    // Style lists
    processedResult = processedResult.replace(/<ul>/g, '<ul class="list-disc pl-6 my-2">');
    processedResult = processedResult.replace(/<ol>/g, '<ol class="list-decimal pl-6 my-2">');
    
    // Style code blocks
    processedResult = processedResult.replace(/<pre><code( class="language-([^"]+)")?>([^<]+)<\/code><\/pre>/g, 
      (match: string, languageClass: string, language: string, code: string): string => {
        return `<div class="code-block ${language ? `language-${language}` : ''}"><pre>${code}</pre></div>`;
      }
    );
    
    // Clean up any potential nesting issues
    processedResult = processedResult.replace(/<\/div>\s*<\/div>/g, '</div>');
    processedResult = processedResult.replace(/<div[^>]*><\/div>/g, '');
    
    return processedResult;
  } catch (error) {
    console.error('Error parsing markdown:', error);
    return content; // Return original content on error
  }
};

interface ChatbotContentProps {
  content: string;
  annotations?: any[];
}

export const ChatbotContent: React.FC<ChatbotContentProps> = ({ content, annotations = [] }) => {
  if (!content) return null;

  // Process annotations and then format the resulting content.
  const { content: processedText, footnotes } = processAnnotations(content, annotations);
  const formattedContent = applyFormatting(processedText);

  return (
    <div className="chatbot-content">
      <div dangerouslySetInnerHTML={{ __html: formattedContent }} />
      
      {/* Render citations/footnotes if any */}
      {footnotes.length > 0 && (
        <div className="mt-4 pt-2 border-t border-gray-200 text-sm">
          {footnotes.map(({ index, annotation }) => (
            <div key={`footnote-${index}`} className="flex gap-1 text-muted-foreground mb-1">
              <span className="font-medium">[{index}]</span>
              <span>{annotation.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const renderContent = (
  text: string,
  annotations: any[] = []
): ReactNode => {
  return <ChatbotContent content={text} annotations={annotations} />;
};

export const renderContentAsync = (
  text: string,
  annotations: any[] = []
): ReactNode => {
  return renderContent(text, annotations);
};