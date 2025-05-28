'use client';

import { Suspense } from 'react';
import { Skeleton } from '@kit/ui/skeleton';
import { usePatientStore } from '~/store/patient/patientStore';
import { useFacilityStore } from '~/store/patient/facilityStore';
import { useMemo, useEffect, useState } from 'react';
import { Loader } from '~/components/loading';
import { createClient } from '~/utils/supabase/client';
import { useFetchFacilityOccupancy } from '~/hooks/usePatients';
import { KipuOccupancy, KipuOccupancyBuilding, KipuOccupancyRoom, KipuOccupancyBed } from '~/types/kipu/kipuAdapter';
import { mockKipuOccupancy } from './mock-occupancy';
import { useProtocolStore } from '~/store/protocolStore';


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
const useMock = false; // flip this to false for real data

export default function Dashboard() {
  const { occupancy: realOccupancy, ...rest } = useFetchFacilityOccupancy();
  const occupancy = useMock ? mockKipuOccupancy : realOccupancy;

  const { isLoading, error, fetchOccupancy } = useFetchFacilityOccupancy();
  const { capacity } = useFacilityStore();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const supabase = createClient();
  const { fetchRequirementsForProtocol } = useProtocolStore();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
    fetchOccupancy();
  }, [fetchOccupancy]);

  // Helper to extract stats from KipuOccupancy
  function getOccupancyStats(occupancy: KipuOccupancy | undefined) {
    let totalBeds = 0;
    let occupiedBeds = 0;
    let availableBeds = 0;
    if (!occupancy || !Array.isArray(occupancy.buildings)) {
      return { totalBeds: 0, occupiedBeds: 0, availableBeds: 0, occupancyRate: 0 };
    }
    occupancy.buildings.forEach((building: KipuOccupancyBuilding) => {
      if (!building || !Array.isArray(building.rooms)) return;
      building.rooms.forEach((room: KipuOccupancyRoom) => {
        if (!room || !Array.isArray(room.beds)) return;
        room.beds.forEach((bed: KipuOccupancyBed) => {
          totalBeds++;
          if (bed.status === 'occupied') occupiedBeds++;
          if (bed.status === 'available') availableBeds++;
        });
      });
    });
    return {
      totalBeds,
      occupiedBeds,
      availableBeds,
      occupancyRate: totalBeds ? (occupiedBeds / totalBeds) * 100 : 0,
    };
  }

  const stats = getOccupancyStats(occupancy);

  // Example: fetch requirements for a protocol (replace 'some-protocol-id' with actual id as needed)
  // useEffect(() => {
  //   fetchRequirementsForProtocol('some-protocol-id').then(reqs => {
  //     // Do something with requirements (e.g., metrics)
  //     console.log('Protocol requirements:', reqs);
  //   });
  // }, [fetchRequirementsForProtocol]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <h3 className="text-base font-semibold text-gray-900">Welcome back, {userEmail}</h3>
      {isLoading ? (
        <Loader showLogo={false} size="sm" message="Loading occupancy..." className="shadow-sm p-6 mb-6" />
      ) : error ? (
        <div className="rounded-lg bg-red-100 text-red-800 p-4 mb-6">{error}</div>
      ) : (
        <div className="rounded-lg bg-white shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Census to Capacity</span>
            <span className="text-sm font-semibold text-gray-900">
              {stats.occupiedBeds} / {stats.totalBeds} beds occupied ({stats.occupancyRate.toFixed(0)}%)
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${stats.occupancyRate}%` }}
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <Loader showLogo={true} size="lg" message="" className="rounded-lg bg-white px-4 pt-5 pb-12 shadow-sm sm:px-6 sm:pt-6" />
      ) : error ? null : (
        <div className="rounded-lg bg-white shadow-sm p-6 mb-6">
          <h4 className="text-md font-semibold mb-4">Occupancy by Building</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {occupancy?.buildings.map((building: KipuOccupancyBuilding) => (
              <div key={building.building_id} className="border rounded-lg p-4 bg-gray-50">
                <div className="font-bold text-indigo-700 mb-2">{building.building_name}</div>
                {building.rooms.map((room: KipuOccupancyRoom) => (
                  <div key={room.room_id} className="mb-2">
                    <div className="font-medium text-gray-800">Room: {room.room_name}</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {room.beds.map((bed: KipuOccupancyBed) => (
                        <span key={bed.bed_id} className={`px-2 py-1 rounded text-xs font-semibold ${bed.status === 'occupied' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>{bed.bed_name} ({bed.status})</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}