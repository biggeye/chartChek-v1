'use client';

import { Suspense } from 'react';
import { Skeleton } from '@kit/ui/skeleton';

// Loading skeleton for dashboard components
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-80 w-full rounded-lg" />
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Welcome Card with Quick Actions */}
      <Suspense fallback={<Skeleton className="h-32 w-full rounded-lg" />}>
     Welcome.
      </Suspense>
      
      {/* Quick Stats Overview */}
    
      
      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Recent Documents */}
          <Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
        Recent Documents
          </Suspense>
          
          {/* Compliance Alerts */}
          <Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
     Compliance Alerts
          </Suspense>
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          {/* Evaluation Metrics */}
          <Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
           Evaluation Metrics
          </Suspense>
          
          {/* Recent Chat Activity */}
          <Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
          Recent Chat Activity
          </Suspense>
        </div>
      </div>
    </div>
  );
}