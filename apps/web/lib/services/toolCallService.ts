// lib/services/toolCallService.ts

// Client-side: triggers a download in the browser
export async function downloadPDFClient(response_text: string, filename = 'output.pdf') {
    const res = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response_text }),
    });
    if (!res.ok) throw new Error('Failed to generate PDF');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
  
  // Server-side: returns base64 for LLM/tool, or for preview/download as needed
  export async function downloadPDFServer(response_text: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response_text }),
    });
    if (!res.ok) throw new Error('Failed to generate PDF');
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  }