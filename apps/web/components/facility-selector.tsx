'use client';

import { useState, useEffect, Fragment, useCallback } from 'react'; // Added useCallback
// useRouter might not be needed anymore if selection doesn't trigger navigation directly
// import { useRouter } from 'next/navigation';
import { useFacilityStore } from '~/store/patient/facilityStore';
// usePatientStore might only be needed if displaying patient count, etc.
// import { usePatientStore } from '~/store/patient/patientStore';
// Removed the useFetchPatients import from here
import { Dialog, Transition } from '@headlessui/react';
import { BuildingOffice2Icon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { cn } from '@kit/ui/utils';

interface FacilitySelectorProps {
  variant?: 'sidebar' | 'header' | 'modal';
  className?: string;
  onSelect?: () => void;
}

// Define Facility type based on expected data from store
interface Facility {
  id: number | string; // Can be number or string depending on source
  name: string;
  // Add other relevant fields if needed, e.g., address
  address?: string;
}

export function FacilitySelector({ variant = 'sidebar', className, onSelect }: FacilitySelectorProps) {
  // const router = useRouter(); // Keep if needed for other reasons
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Removed local selectedFacilityId state

  // Use individual, memoized selectors for store values and actions
  const facilities = useFacilityStore(useCallback(state => state.facilities, []));
  const currentFacilityId = useFacilityStore(useCallback(state => state.currentFacilityId, []));
  const isLoading = useFacilityStore(useCallback(state => state.isLoading, []));
  const fetchFacilities = useFacilityStore(useCallback(state => state.fetchFacilities, []));
  const changeFacilityWithContext = useFacilityStore(useCallback(state => state.changeFacilityWithContext, []));
  const getCurrentFacility = useFacilityStore(useCallback(state => state.getCurrentFacility, []));

  // Get the current facility object based on the store's currentFacilityId
  const currentFacility = getCurrentFacility();

  // Fetch facilities on component mount if the list is empty
  useEffect(() => {
    if (facilities.length === 0 && !isLoading) {
      console.log('[FacilitySelector] Facilities empty, fetching...');
      fetchFacilities();
    }
    // Dependencies are stable references now
  }, [fetchFacilities, facilities.length, isLoading]); 

  // Handle facility selection - only needs to update the store now
  // Memoize the handler to prevent unnecessary rerenders if passed down
  const handleSelectFacility = useCallback((facilityId: number | null) => {
    const newFacilityId = facilityId === null ? 0 : facilityId;
    console.log('[FacilitySelector] Changing facility context to:', newFacilityId);
    changeFacilityWithContext(newFacilityId);
    setIsModalOpen(false);
    onSelect?.(); // Call onSelect callback if provided
  }, [changeFacilityWithContext, onSelect]); // Added onSelect to dependencies

  // ----- Render Modal Logic -----
  const renderModal = () => (
     <Transition show={isModalOpen} as={Fragment}>
       <Dialog
         as="div"
         className="relative z-50"
         onClose={() => setIsModalOpen(false)}
       >
         {/* Backdrop */}
         <Transition.Child
           as={Fragment}
           enter="transition-opacity ease-out duration-300"
           enterFrom="opacity-0"
           enterTo="opacity-100"
           leave="transition-opacity ease-in duration-200"
           leaveFrom="opacity-100"
           leaveTo="opacity-0"
         >
           <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
         </Transition.Child>

         {/* Modal panel container */}
         <div className="fixed inset-0 overflow-y-auto">
           <div className="flex min-h-full items-center justify-center p-4 text-center">
             <Transition.Child
               as={Fragment}
               enter="transition ease-out duration-300"
               enterFrom="opacity-0 scale-95"
               enterTo="opacity-100 scale-100"
               leave="transition ease-in duration-200"
               leaveFrom="opacity-100 scale-100"
               leaveTo="opacity-0 scale-95"
             >
               <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-background p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
                 <div className="flex items-center justify-between mb-4">
                   <Dialog.Title as="h3" className="text-lg font-semibold text-foreground dark:text-white">
                     Select Facility
                   </Dialog.Title>
                   <button
                     type="button" // Explicit type button
                     onClick={() => setIsModalOpen(false)}
                     className="rounded-full p-1 text-foreground-muted hover:bg-muted transition-colors dark:text-gray-400 dark:hover:bg-gray-700"
                     aria-label="Close facility selection modal"
                   >
                     <XMarkIcon className="h-5 w-5" />
                   </button>
                 </div>

                 <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-2 pr-2">
                   {/* All Facilities Option */}
                   <button
                     key="all-facilities"
                     type="button"
                     onClick={() => handleSelectFacility(null)} // Pass null for "All"
                     className={cn(
                       "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left border transition-colors",
                       currentFacilityId === 0 // Check against 0 (representing "All")
                         ? "bg-primary/10 border-primary/20 dark:bg-primary/20"
                         : "hover:bg-muted border-border dark:border-gray-700 dark:hover:bg-gray-700"
                     )}
                   >
                     <div>
                       <h4 className="font-medium text-foreground dark:text-white">All Facilities</h4>
                       <p className="text-sm text-foreground-muted dark:text-gray-400">View patients across all facilities</p>
                     </div>
                     {currentFacilityId === 0 && (
                       <CheckIcon className="h-5 w-5 text-primary" />
                     )}
                   </button>
                   {/* Dynamically rendered facilities */}
                   {isLoading ? (
                     <div className="text-center py-8 text-foreground-muted dark:text-gray-400">
                       Loading facilities...
                     </div>
                   ) : facilities.length === 0 ? (
                     <div className="text-center py-8 text-foreground-muted dark:text-gray-400">
                       No facilities available. Check KIPU settings.
                     </div>
                   ) : (
                     facilities.map((facility: Facility) => (
                       <button
                         key={facility.id}
                         type="button"
                         onClick={() => handleSelectFacility(Number(facility.id))} // Ensure ID is number
                         className={cn(
                           "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left border transition-colors",
                           Number(currentFacilityId) === Number(facility.id)
                             ? "bg-primary/10 border-primary/20 dark:bg-primary/20"
                             : "hover:bg-muted border-border dark:border-gray-700 dark:hover:bg-gray-700"
                         )}
                       >
                         <div>
                           <h4 className="font-medium text-foreground dark:text-white">{facility.name}</h4>
                           {facility.address && ( // Conditionally render address if available
                             <p className="text-sm text-foreground-muted dark:text-gray-400">{facility.address}</p>
                           )}
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
                     type="button" // Explicit type button
                     onClick={() => setIsModalOpen(false)}
                     className="px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
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

  // ----- Render Different Variants -----
  const buttonText = isLoading 
    ? 'Loading...' 
    : (currentFacility?.name || 'All Facilities'); // Default must match server rendering
  const displayIcon = <BuildingOffice2Icon className="h-5 w-5 mr-2 text-primary flex-shrink-0" />;

  if (variant === 'sidebar') {
    return (
      <div className={cn("px-2 py-4", className)}>
        <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted dark:text-gray-500">Facility</div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md bg-background-muted hover:bg-muted transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
          disabled={isLoading}
          aria-label={`Change facility. Currently selected: ${buttonText}`}
        >
          <div className="flex items-center overflow-hidden">
            {displayIcon}
            <span className="truncate" title={buttonText}>
              {buttonText}
            </span>
          </div>
          {/* Add dropdown indicator maybe? */}
        </button>
        {renderModal()}
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <div className={cn("relative", className)}>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors dark:hover:bg-gray-700 dark:text-white"
          disabled={isLoading}
           aria-label={`Change facility. Currently selected: ${buttonText}`}
        >
          {displayIcon}
          <span className="hidden md:inline truncate max-w-[200px]" title={buttonText}>
            {buttonText}
          </span>
        </button>
        {renderModal()}
      </div>
    );
  }

  // Default modal variant (e.g., a standalone button)
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        disabled={isLoading}
      >
        {displayIcon}
        {isLoading ? 'Loading Facilities...' : 'Select Facility'}
      </button>
      {renderModal()}
    </div>
  );
}