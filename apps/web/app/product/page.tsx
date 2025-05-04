'use client';

import { Suspense } from 'react';
import { Skeleton } from '@kit/ui/skeleton';
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/20/solid'
import { CursorArrowRaysIcon, EnvelopeOpenIcon, UsersIcon } from '@heroicons/react/24/outline'
import { usePatientStore } from '~/store/patient/patientStore';
import { useFacilityStore } from '~/store/patient/facilityStore';
import { useMemo } from 'react';
import { Loader } from '~/components/loading';
import { useUser } from '@kit/supabase/hooks/use-user';
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

function classNames(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Dashboard() {
  const { data: user } = useUser();

  const { patients, isLoadingPatients } = usePatientStore();
  const { capacity } = useFacilityStore();
  const averageLengthOfStay = useMemo(() => {
    // Ensure patients is an array before proceeding
    if (!Array.isArray(patients) || patients.length === 0) {
      console.log('[Dashboard] No patient data available for LOS calculation.');
      return 0; // Or null, or NaN, depending on how you want to handle no patients
    }

    let totalDays = 0;
    let dischargedPatientCount = 0;

    patients.forEach(patient => {
      // *** IMPORTANT: Adjust property names if they differ in your patient object ***
      // Safely access potentially nested properties if needed, e.g., patient.details?.admission_date
      const admissionDateStr = patient?.admissionDate;
      const dischargeDateStr = patient?.dischargeDate;

      if (admissionDateStr && dischargeDateStr) {
        try {
          const admissionDate = new Date(admissionDateStr);
          const dischargeDate = new Date(dischargeDateStr);

          // Basic validation to ensure dates are valid and logical
          if (!isNaN(admissionDate.getTime()) && !isNaN(dischargeDate.getTime()) && dischargeDate >= admissionDate) {
            const differenceInTime = dischargeDate.getTime() - admissionDate.getTime();
            // Ensure non-negative difference before calculating days
            if (differenceInTime >= 0) {
              const differenceInDays = differenceInTime / (1000 * 3600 * 24); // Convert ms to days
              totalDays += differenceInDays;
              dischargedPatientCount++;
            } else {
              console.warn(`[Dashboard] Discharge date is before admission date for patient:`, patient?.patientId || 'Unknown ID');
            }
          } else {
            console.warn(`[Dashboard] Invalid date format or illogical dates for patient:`, patient?.patientId || 'Unknown ID', { admission: admissionDateStr, discharge: dischargeDateStr });
          }
        } catch (error) {
          console.error(`[Dashboard] Error parsing dates for patient:`, patient?.patientId || 'Unknown ID', error);
        }
      }
      // Optional: Log patients without discharge dates if needed for debugging
      // else if (admissionDateStr && !dischargeDateStr) {
      //   console.log(`[Dashboard] Patient ${patient?.id || 'Unknown ID'} has admission date but no discharge date yet.`);
      // }
    });

    if (dischargedPatientCount === 0) {
      console.log('[Dashboard] No patients found with valid admission and discharge dates for LOS calculation.');
      return 0; // Avoid division by zero
    }

    const avgLOS = totalDays / dischargedPatientCount;
    // Log the final calculation details
    console.log(`[Dashboard] Calculated Average LOS: ${avgLOS.toFixed(1)} days across ${dischargedPatientCount} discharged patients.`);
    return avgLOS;

  }, [patients]);

  const currentCensus = patients.length;
  const censusPercent = capacity ? Math.min((currentCensus / capacity) * 100, 100) : 0;

  const stats = [
    {
      id: 1,
      name: 'Current Census',
      stat: currentCensus,
      icon: UsersIcon,
      censusPercent,
    },
    {
      id: 2,
      name: 'Avg. Length of Stay',
      stat: averageLengthOfStay.toFixed(1),
      icon: EnvelopeOpenIcon,
      change: '5.4%',
      changeType: 'increase',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <h3 className="text-base font-semibold text-gray-900">Welcome back, {user?.email}</h3>

      {isLoadingPatients ? (
        <Loader
          showLogo={false}
          size="sm"
          message="Loading patient stats..."
          className="shadow-sm p-6 mb-6"
        />
      ) : (
      <div className="rounded-lg bg-white shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Census to Capacity</span>
          <span className="text-sm font-semibold text-gray-900">
            {currentCensus} / {capacity ?? '—'} ({capacity ? `${censusPercent.toFixed(0)}%` : '—'})
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${censusPercent}%` }}
          />
        </div>
      </div>
      )}
      {isLoadingPatients ? (
        <Loader
          showLogo={true}
          size="lg"
          message=""
          className="rounded-lg bg-white px-4 pt-5 pb-12 shadow-sm sm:px-6 sm:pt-6"
        />
      ) : (
        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow-sm sm:px-6 sm:pt-6"
            >
              <dt>
                <div className="absolute rounded-md bg-indigo-500 p-3">
                  <stat.icon aria-hidden="true" className="size-6 text-white" />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-gray-500">
                  {stat.name}
                </p>
              </dt>
              <dd className="ml-16 flex flex-col items-baseline pb-6 sm:pb-7">
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.stat}
                  </p>
          
                  {'%' in stat && stat.censusPercent && (
                    <span
                      className={classNames(
                        patients.length === stat.censusPercent
                          ? 'text-green-600'
                          : patients.length < stat.censusPercent / 2
                            ? 'text-red-600'
                            : 'text-gray-600',
                        'ml-2 flex items-baseline text-sm font-semibold',
                      )}
                    >
                      {/* Empty on main line, capacity will be below */}
                    </span>
                  )}
                </div>
               
                <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <a
                      href="/product/patients"
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      View all
                      <span className="sr-only"> {stat.name} stats</span>
                    </a>
                  </div>
                </div>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}