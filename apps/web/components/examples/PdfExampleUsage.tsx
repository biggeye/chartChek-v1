'use client';

import React from 'react';
import { PdfGenerationButton, PDFService, usePdfGeneration, type ContextItem } from '~/components/pdf';

/**
 * Example component demonstrating various ways to use the PDF generation system
 * This shows how the modular PDF system can be easily integrated anywhere in the app
 */
export function PdfExampleUsage() {
  const { generateDirectDownload } = usePdfGeneration();

  // Example context items
  const sampleContextItems: ContextItem[] = [
    {
      id: 'eval-123',
      title: 'Mental Health Assessment',
      content: 'Patient shows significant improvement in mood and cognition...',
      type: 'evaluation',
    },
    {
      id: 'doc-456',
      title: 'Treatment Plan',
      content: 'Recommended interventions include therapy and medication...',
      type: 'document',
    },
  ];

  // Example of direct service usage (for custom implementations)
  const handleDirectServiceCall = async () => {
    try {
      await PDFService.generateDirectDownload(sampleContextItems, 'custom-report.pdf');
    } catch (error) {
      console.error('Direct PDF generation failed:', error);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">PDF Generation Examples</h2>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">1. Standard Button with Preview</h3>
        <PdfGenerationButton
          contextItems={sampleContextItems}
          patientId="patient-789"
          showPreview={true}
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">2. Direct Download (No Preview)</h3>
        <PdfGenerationButton
          contextItems={sampleContextItems}
          patientId="patient-789"
          showPreview={false}
          variant="outline"
        >
          Quick Download
        </PdfGenerationButton>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">3. Custom Styled Button</h3>
        <PdfGenerationButton
          contextItems={sampleContextItems}
          patientId="patient-789"
          variant="default"
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
        >
          Generate Patient Report
        </PdfGenerationButton>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">4. Direct Service Call (Programmatic)</h3>
        <button
          onClick={handleDirectServiceCall}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Direct Service Call
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2">Usage Notes:</h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Components handle all state management internally</li>
          <li>Error handling is built-in with user-friendly messages</li>
          <li>Supports both preview and direct download modes</li>
          <li>Automatically generates appropriate filenames</li>
          <li>Fully customizable styling and behavior</li>
          <li>Can be used anywhere in the app with consistent behavior</li>
        </ul>
      </div>
    </div>
  );
} 