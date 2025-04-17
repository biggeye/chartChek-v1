'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFacilityStore } from '~/store/patient/facilityStore';
import { usePatientStore } from '~/store/patient/patientStore';
import { useFetchPatients } from '~/hooks/usePatients';
import { Facility } from '~/types/kipu/kipuAdapter';
import { Dialog, Transition } from '@headlessui/react';
import { BuildingOffice2Icon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { cn } from '~/lib/utils';

interface FacilitySelectorProps {
  variant?: 'sidebar' | 'header' | 'modal';
  className?: string;
}

export function FacilitySelector({ variant = 'sidebar', className }: FacilitySelectorProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setIsLoadingPatients } = usePatientStore();
  // Use the facility store
  const {
    facilities,
    currentFacilityId,
    isLoading,
    fetchFacilities,
    changeFacilityWithContext,
    getCurrentFacility
  } = useFacilityStore();


  // Get the current facility object
  const currentFacility = getCurrentFacility();

  // Fetch facilities on component mount if the list is empty
  useEffect(() => {
    // Check if the facilities array in the store is empty
    if (facilities.length === 0) {
      fetchFacilities();
    }
    // Removed dependency on currentFacilityId for initial fetch trigger
  }, [fetchFacilities, facilities.length]); // Depend on fetchFacilities and facilities.length

  // Handle facility selection
  const handleSelectFacility = async (facilityId: number) => {
    changeFacilityWithContext(facilityId);
    await useFetchPatients(facilityId);
    setIsModalOpen(false);
  };

  const renderModal = () => (
    <Transition show={isModalOpen} as="div">
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => setIsModalOpen(false)}
      >
        {/* Backdrop */}
        <Transition.Child
          enter="transition-opacity ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal panel */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              enter="transition ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="transition ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-background p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-foreground">
                    Select Facility
                  </Dialog.Title>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-full p-1 text-foreground-muted hover:bg-muted transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  {isLoading ? (
                    <div className="text-center py-8 text-foreground-muted">
                      Loading facilities...
                    </div>
                  ) : facilities.length === 0 ? (
                    <div className="text-center py-8 text-foreground-muted">
                      No facilities available
                    </div>
                  ) : (
                    facilities.map((facility) => (
                      <button
                        key={facility.id || `facility-${Math.random()}`}
                        onClick={() => facility.id && handleSelectFacility(Number(facility.id))}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left",
                          Number(currentFacilityId)
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted border border-border"
                        )}
                      >
                        <div>
                          <h4 className="font-medium">{facility.name}</h4>
                          <p className="text-sm text-foreground-muted">{facility.address}</p>
                        </div>
                        {Number(facility.id) === Number(currentFacilityId) && (
                          <CheckIcon className="h-5 w-5 text-primary" />
                        )}
                      </button>
                    ))
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );

  // Render different variants
  if (variant === 'sidebar') {
    return (
      <div className={cn("px-2 py-4", className)}>
        <div className="mb-2 text-xs font-medium text-foreground-muted">Current Facility</div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md bg-background-muted hover:bg-muted transition-colors"
          disabled={isLoading}
        >
          <div className="flex items-center">
            <BuildingOffice2Icon className="h-5 w-5 mr-2 text-primary" />
            <span className="truncate max-w-[140px]">
              {isLoading ? 'Loading...' : (currentFacility?.name || 'Select Facility')}
            </span>
          </div>
        </button>

        {renderModal()}
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <div className={cn("relative", className)}>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
          disabled={isLoading}
        >
          <BuildingOffice2Icon className="h-5 w-5 text-primary" />
          <span className="hidden md:inline truncate max-w-[200px]">
            {isLoading ? 'Loading...' : (currentFacility?.name || 'Select Facility')}
          </span>
        </button>

        {renderModal()}
      </div>
    );
  }

  // Default modal variant
  return (
    <div className={className}>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        disabled={isLoading}
      >
        <BuildingOffice2Icon className="h-5 w-5 mr-2" />
        {isLoading ? 'Loading...' : 'Select Facility'}
      </button>

      {renderModal()}
    </div>
  );
}