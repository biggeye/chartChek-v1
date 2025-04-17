// components/ui/loading-bar.tsx
'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function LoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setTimeout(() => setLoading(false), 200);

    window.addEventListener('beforeunload', handleStart);
    window.addEventListener('load', handleComplete);

    return () => {
      window.removeEventListener('beforeunload', handleStart);
      window.removeEventListener('load', handleComplete);
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  return (
    <div className={`fixed top-0 left-0 right-0 h-1 z-50 transition-opacity duration-750 ${loading ? 'opacity-100' : 'opacity-0'}`}>
      <div className="h-full bg-indigo-500 animate-loading-bar"></div>
    </div>
  );
}