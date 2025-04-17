'use client';

import React, { useState } from 'react';
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';

interface DetailFieldProps {
  label: string;
  value: any;
  rows?: number;
  truncate?: boolean;
  maxLength?: number;
}

export default function DetailField({ 
  label, 
  value, 
  rows = 1, 
  truncate = true, 
  maxLength = 50 
}: DetailFieldProps) {
  const [copied, setCopied] = useState(false);

  // Handle json objects and arrays with safer parsing
  const formatValue = (val: any): string => {
    if (val === null || val === undefined) {
      return 'N/A';
    }
    
    if (typeof val === 'object') {
      try {
        return JSON.stringify(val, null, 2);
      } catch (e) {
        return String(val);
      }
    }
    
    return String(val);
  };
  
  const displayValue = formatValue(value);
  
  const isTruncated = truncate && displayValue.length > maxLength;
  const truncatedValue = isTruncated 
    ? `${displayValue.substring(0, maxLength)}...` 
    : displayValue;

  const handleCopy = () => {
    navigator.clipboard.writeText(displayValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-4">
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className="mt-1 group relative">
        {rows > 1 ? (
       
            <div className="relative">
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-2 rounded-md font-mono overflow-auto max-h-[200px]">
                {truncatedValue}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1 rounded-md bg-white shadow text-gray-500 hover:text-gray-700 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Copy to clipboard"
              >
                {copied ? (
                  <span className="text-green-500 text-xs font-medium">Copied!</span>
                ) : (
                  <DocumentDuplicateIcon className="h-4 w-4" />
                )}
              </button>
            </div>
        ) : (
            <div className="relative flex items-center">
              <div className="text-sm font-mono bg-gray-50 p-2 rounded-md min-h-[28px] w-full overflow-x-auto">
                {truncatedValue}
              </div>
              <button
                onClick={handleCopy}
                className="ml-2 p-1 rounded-md bg-white shadow text-gray-500 hover:text-gray-700 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Copy to clipboard"
              >
                {copied ? (
                  <span className="text-green-500 text-xs font-medium">Copied!</span>
                ) : (
                  <DocumentDuplicateIcon className="h-4 w-4" />
                )}
              </button>
            </div>
        )}
      </div>
    </div>
  );
}
