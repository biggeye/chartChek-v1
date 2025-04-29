import { NextRequest } from 'next/server';
import { downloadPDFServer } from '~/lib/services/toolCallService';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
    
export async function POST(req: NextRequest) {
  console.log('PDF generation server route hit');
  const { text } = await req.json();
  const response_text = 'Prepare the following text into a professional format for rendering as a PDF: ' + text;
  console.log('Request text:', text);
  const pdfPrep = await generateText({
    model: google('gemini-1.5-pro-002'),
    messages: [{
      role: 'user',
      content: response_text,
        }],
  });

  console.log('PDF preparation response:', pdfPrep);

  const pdfRes = await fetch('https://pdfchek.onrender.com/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pdfPrep }),
  });

  console.log('PDF generation response status:', pdfRes.status);

  if (!pdfRes.ok) {
    console.log('Error generating PDF:', await pdfRes.text());
    return new Response(JSON.stringify({ error: 'Failed to generate PDF' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
  console.log('PDF buffer length:', pdfBuffer.length);
  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="output.pdf"',
    },
  });
}