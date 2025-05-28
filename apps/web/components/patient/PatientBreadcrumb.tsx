// components/patients/PatientBreadcrumb.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { usePatientStore } from "~/store/patient/patientStore";

interface BreadcrumbProps {
  patientId?: string;
  patientName?: string;
  currentPage?: string;
  actionButtons?: React.ReactNode;
}

export function PatientBreadcrumb({
  patientId,
  patientName,
  currentPage,
  actionButtons,
}: BreadcrumbProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedPatient } = usePatientStore();

  const breadcrumbName = patientName;
  
  // Determine if we're on the patients listing or a specific patient page
  const isPatientListing = !patientId;
  
  return (
    <div>
      <div>
        <nav aria-label="Back" className="sm:hidden">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ChevronLeftIcon aria-hidden="true" className="mr-1 -ml-1 size-5 shrink-0 text-gray-400" />
            Back
          </button>
        </nav>
        <nav aria-label="Breadcrumb" className="hidden sm:flex">
          <ol role="list" className="flex items-center space-x-4">
            <li>
              <div className="flex">
                <Link href="/product/patients" className="text-sm font-medium text-gray-500 hover:text-gray-700">
                  Patients
                </Link>
              </div>
            </li>
            
            {patientId && (
              <li>
                <div className="flex items-center">
                  <ChevronRightIcon aria-hidden="true" className="size-5 shrink-0 text-gray-400" />
                  <Link 
                    href={`/product/patients/${patientId}`}
                    className={`ml-4 text-sm font-medium ${currentPage ? 'text-gray-500 hover:text-gray-700' : 'text-gray-900'}`}
                  >
                    {breadcrumbName}
                  </Link>
                </div>
              </li>
            )}
            
            {currentPage && (
              <li>
                <div className="flex items-center">
                  <ChevronRightIcon aria-hidden="true" className="size-5 shrink-0 text-gray-400" />
                  <span className="ml-4 text-sm font-medium text-gray-900">
                    {currentPage}
                  </span>
                </div>
              </li>
            )}
          </ol>
        </nav>
      </div>
      <div className="mt-2 md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
        </div>
        {actionButtons && (
          <div className="mt-4 flex shrink-0 md:mt-0 md:ml-4">
            {actionButtons}
          </div>
        )}
      </div>
    </div>
  );
}