'use client';

import { useState } from 'react';
import { downloadPDFClient } from '~/lib/services/toolCallService';

export default function PDFChek() {
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [text, setText] = useState('Edward Flinsticks: Next.js, FastAPI, done right.');

  // Option 1: Download directly
  const handleDownload = () => downloadPDFClient(text);

  // Option 2: Get base64 for preview
  const handlePreview = async () => {
    const res = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response_text: text }),
    });
    if (!res.ok) return;
    const arrayBuffer = await res.arrayBuffer();
    setPdfBase64(Buffer.from(arrayBuffer).toString('base64'));
  };

  return (
    <div>
      <textarea value={text} onChange={e => setText(e.target.value)} />
      <div>
        <button onClick={handleDownload}>Download PDF</button>
        <button onClick={handlePreview}>Preview PDF</button>
      </div>
      {pdfBase64 && (
        <iframe
          src={`data:application/pdf;base64,${pdfBase64}`}
          width="100%"
          height={400}
          title="PDF Preview"
        />
      )}
    </div>
  );
}