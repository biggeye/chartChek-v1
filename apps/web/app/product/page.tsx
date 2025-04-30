'use client';

import { Suspense } from 'react';
import { Skeleton } from '@kit/ui/skeleton';
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/20/solid'
import { CursorArrowRaysIcon, EnvelopeOpenIcon, UsersIcon } from '@heroicons/react/24/outline'
import { usePatientStore } from '~/store/patient/patientStore';
import { useFacilityStore } from '~/store/patient/facilityStore';

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
  const { patients } = usePatientStore();
  const { capacity } = useFacilityStore();

  const currentCensus = patients.length;
  const censusPercent = capacity ? Math.min((currentCensus / capacity) * 100, 100) : 0;

  const stats = [
    {
      id: 1,
      name: 'Current Census',
      stat: currentCensus,
      icon: UsersIcon,
      capacity,
    },
    {
      id: 2,
      name: 'Avg. Open Rate',
      stat: '58.16%',
      icon: EnvelopeOpenIcon,
      change: '5.4%',
      changeType: 'increase',
    },
    {
      id: 3,
      name: 'Avg. Click Rate',
      stat: '24.57%',
      icon: CursorArrowRaysIcon,
      change: '3.2%',
      changeType: 'decrease',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <h3 className="text-base font-semibold text-gray-900">Last 30 days</h3>

      {/* Census Over Capacity Card */}
      <div className="rounded-lg bg-white shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Census Over Capacity</span>
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
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">
                {stat.stat}
              </p>
              {/* Only show change if present */}
              {'change' in stat && stat.change && (
                <p
                  className={classNames(
                    stat.changeType === 'increase'
                      ? 'text-green-600'
                      : 'text-red-600',
                    'ml-2 flex items-baseline text-sm font-semibold',
                  )}
                >
                  {stat.changeType === 'increase' ? (
                    <ArrowUpIcon
                      aria-hidden="true"
                      className="size-5 shrink-0 self-center text-green-500"
                    />
                  ) : (
                    <ArrowDownIcon
                      aria-hidden="true"
                      className="size-5 shrink-0 self-center text-red-500"
                    />
                  )}
                  <span className="sr-only">
                    {' '}
                    {stat.changeType === 'increase' ? 'Increased' : 'Decreased'}
                    {' '}
                    by
                  </span>
                  {stat.change}
                </p>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <a
                    href="#"
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
    </div>
  );
}