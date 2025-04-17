'use client';

import { Suspense } from 'react';
import { 
  WelcomeCard,
  QuickStatsCard,
  RecentDocumentsCard,
  RecentChatCard,
  EvaluationMetricsCard,
  ComplianceAlertsCard
} from '~/components/dashboard';
import { Skeleton } from '~/components/ui/skeleton';

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
        <WelcomeCard />
      </Suspense>
      
      {/* Quick Stats Overview */}
      <Suspense fallback={<Skeleton className="h-40 w-full rounded-lg" />}>
        <QuickStatsCard />
      </Suspense>
      
      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Recent Documents */}
          <Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
            <RecentDocumentsCard />
          </Suspense>
          
          {/* Compliance Alerts */}
          <Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
            <ComplianceAlertsCard />
          </Suspense>
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          {/* Evaluation Metrics */}
          <Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
            <EvaluationMetricsCard />
          </Suspense>
          
          {/* Recent Chat Activity */}
          <Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
            <RecentChatCard />
          </Suspense>
        </div>
      </div>
    </div>
  );
}