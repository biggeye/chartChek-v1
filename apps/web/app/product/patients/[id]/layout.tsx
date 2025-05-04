'use client';

import React, { useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { usePatientStore } from '~/store/patient/patientStore';
import { useFetchPatient } from '~/hooks/usePatients';
import { usePatientEvaluations } from '~/hooks/useEvaluations';
import { PatientBreadcrumb } from "~/components/patient/PatientBreadcrumb";
import { Button } from '@kit/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { ScrollArea } from '@kit/ui/scroll-area';

type ActiveTabType = 'overview' | 'evaluations' | 'appointments' | 'vitals' | 'orders' | 'treatmentPlan' | 'utilizationReview';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  // Get the patient ID from the route params and current pathname
  const params = useParams();
  const patientId = params.id as string;
  const pathname = usePathname();
  const router = useRouter();
  
  // Determine the active tab based on the current URL
  const getActiveTab = (): ActiveTabType => {
    if (pathname.includes('/evaluations')) return 'evaluations';
    if (pathname.includes('/treatment')) return 'treatmentPlan';
    return 'overview';
  };
  const activeTab = getActiveTab();

  const patientNavigation = [
    { name: 'Overview', href: `/product/patients/${patientId}`, current: activeTab === 'overview' },
    { name: 'Treatment Plan', href: `/product/patients/${patientId}/treatment`, current: activeTab === 'treatmentPlan' },
    { name: 'Evaluations', href: `/product/patients/${patientId}/evaluations`, current: activeTab === 'evaluations' },
    { name: 'Utilization Review', href: `/product/patients/${patientId}/ur`, current: activeTab === 'utilizationReview' },
    { name: 'Vitals', href: `/product/patients/${patientId}/vitals`, current: activeTab === 'vitals' },
  ];

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
  }

  // --- Use hooks for data fetching and state management ---
  useFetchPatient(patientId);

  const { 
    selectedPatient, 
    isLoadingPatients: isLoadingPatients, 
    error: patientError 
  } = usePatientStore();

  // Get evaluations state and fetch trigger from the hook
  const { 
    patientEvaluations, 
    isLoadingEvaluations: isLoadingEvaluations, 
    error: evaluationsError, 
    fetchEvaluations 
  } = usePatientEvaluations();

  // Trigger the fetch for evaluations when patientId changes
  useEffect(() => {
    if (patientId) {
      fetchEvaluations(patientId);
    }
  }, [patientId, fetchEvaluations]);

  // Derive patient display name from the hook's return value
  const patientName = selectedPatient
    ? `${selectedPatient.lastName}, ${selectedPatient.firstName}`
    : "Patient"; // Default or loading state

  // Only show dashboard content on the overview page
  const showDashboard = activeTab === 'overview';

  return (
    <div className="container mx-auto md:p-4">
      <PatientBreadcrumb 
        patientId={patientId}
        patientName={patientName} 
        currentPage={activeTab !== 'overview' ? patientNavigation.find(item => item.current)?.name : undefined}
        actionButtons={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-auto">
                <MoreVertical className="h-5 w-5" />
                <span className="sr-only">Patient Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => alert('Navigate to Patient Details...')}>
                Patient Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => alert('Open Add Note modal...')}>
                Add Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      <div className="flex flex-row w-full">
        {/* Sidebar Navigation */}
        <nav aria-label="Sidebar" className="md:flex w-48 flex-shrink-0 pr-4 border-r border-gray-200 hidden">
          <ul role="list" className="space-y-1 py-4">
            {patientNavigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={classNames(
                    item.current ? 'bg-gray-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                    'group flex gap-x-3 rounded-md p-2 pl-3 text-sm font-semibold'
                  )}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main Content Area */}
        <ScrollArea className="h-full w-full overflow-y-auto mb-10">
          <div className="flex-1 md:px-10 py-4">
            {isLoadingPatients || isLoadingEvaluations ? (
              <div className="grid grid-cols-1">
                <div className="space-y-6">
                  <div className="animate-pulse bg-gray-100 rounded-lg h-10"></div>
                  <div className="animate-pulse bg-gray-100 rounded-lg h-25"></div>
                  <div className="animate-pulse bg-gray-100 rounded-lg h-25"></div>
                </div>
               
              </div>
            ) : patientError || evaluationsError ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-red-600">Error Loading Data</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {patientError || evaluationsError}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 inline-flex items-center px-2 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
              // Render child pages (like page.tsx) within the layout structure
              <>{children}</> 
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
