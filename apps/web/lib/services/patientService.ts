import { usePatientStore } from "~/store/patient/patientStore";
import { PatientBasicInfo } from "~/types/kipu/kipuAdapter";
import { parsePatientId } from "~/lib/kipu/auth/config";
import { KipuOccupancy } from "~/types/kipu/kipuAdapter";

export interface GroupedPatient {
  patientMasterId: string;
  currentChart: PatientBasicInfo;
  allCharts: PatientBasicInfo[];
  isActive: boolean;
}

interface PatientGroupingOptions {
  searchTerm?: string;
  showActive?: boolean;
  sortBy?: 'name' | 'date' | 'status';
  sortDirection?: 'asc' | 'desc';
}

export const fetchPatients = async (facilityId?: number) => {
  const { setIsLoadingPatients } = usePatientStore.getState();
  setIsLoadingPatients(true);
  
  try {
    let endpoint: string;
    if (facilityId === 0) {
      endpoint = '/api/kipu/patients/admissions';
    } else {
      endpoint = `/api/kipu/patients/census`;
    }

    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`Failed to fetch patients: ${response.statusText}`);
    
    const result = await response.json();
    return result.data.patients;
  } catch (error) {
    console.error('Error fetching patients:', error);
    throw error;
  } finally {
    setIsLoadingPatients(false);
  }
};

export const fetchPatientById = async (patientId: string) => {
  try {
    const encodedId = encodeURIComponent(patientId);
    const response = await fetch(`/api/kipu/patients/${encodedId}`);
    if (!response.ok) throw new Error(`Failed to fetch patient: ${response.statusText}`);
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching patient by ID:', error);
    throw error;
  }
};

export const groupPatientsByMasterId = (patients: PatientBasicInfo[]): GroupedPatient[] => {
  if (!patients?.length) return [];

  // Create a map to group patients by their master ID
  const patientMap = new Map<string, PatientBasicInfo[]>();
  
  // First pass: group all charts by patient master ID
  patients.forEach(patient => {
    const { patientMasterId } = parsePatientId(patient.patientId);
    if (!patientMap.has(patientMasterId)) {
      patientMap.set(patientMasterId, []);
    }
    patientMap.get(patientMasterId)?.push(patient);
  });

  // Convert the map to our desired format
  return Array.from(patientMap.entries())
    .map(([masterId, charts]) => {
      // Sort charts by admission date, most recent first
      const sortedCharts = charts.sort((a, b) => {
        const dateA = a.admissionDate ? new Date(a.admissionDate).getTime() : 0;
        const dateB = b.admissionDate ? new Date(b.admissionDate).getTime() : 0;
        return dateB - dateA;
      });

      // Determine if any chart is active
      const hasActiveChart = sortedCharts.some(chart => 
        chart.status?.toLowerCase() === 'active' || 
        (chart.admissionDate && !chart.dischargeDate)
      );

      // Current chart is either the active one or the most recent one
      const currentChart = sortedCharts.find(chart => 
        chart.status?.toLowerCase() === 'active' || 
        (chart.admissionDate && !chart.dischargeDate)
      ) || sortedCharts[0];

      // Only create the group if we have a valid current chart
      if (!currentChart) return null;

      return {
        patientMasterId: masterId,
        currentChart,
        allCharts: sortedCharts,
        isActive: hasActiveChart
      };
    })
    .filter((group): group is GroupedPatient => group !== null);
};

export const sortGroupedPatients = (
  patients: GroupedPatient[],
  sortBy: PatientGroupingOptions['sortBy'] = 'status',
  direction: PatientGroupingOptions['sortDirection'] = 'desc'
): GroupedPatient[] => {
  return [...patients].sort((a, b) => {
    // Primary sort by active status
    if (sortBy === 'status') {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
    }

    // Secondary sort based on option
    switch (sortBy) {
      case 'name':
        const nameA = `${a.currentChart.lastName}, ${a.currentChart.firstName}`.toLowerCase();
        const nameB = `${b.currentChart.lastName}, ${b.currentChart.firstName}`.toLowerCase();
        return direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      
      case 'date':
        const dateA = a.currentChart.admissionDate ? new Date(a.currentChart.admissionDate).getTime() : 0;
        const dateB = b.currentChart.admissionDate ? new Date(b.currentChart.admissionDate).getTime() : 0;
        return direction === 'asc' ? dateA - dateB : dateB - dateA;
      
      default:
        return 0;
    }
  });
};

export const filterGroupedPatients = (
  patients: GroupedPatient[],
  options: PatientGroupingOptions = {}
): GroupedPatient[] => {
  const { searchTerm = '', showActive = false } = options;

  return patients.filter(patient => {
    // Filter by active status if requested
    if (showActive && !patient.isActive) return false;

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const currentChart = patient.currentChart;
      
      return (
        currentChart.firstName?.toLowerCase().includes(searchLower) ||
        currentChart.lastName?.toLowerCase().includes(searchLower) ||
        currentChart.mrn?.toLowerCase().includes(searchLower) ||
        patient.patientMasterId.toLowerCase().includes(searchLower) ||
        currentChart.insuranceProvider?.toLowerCase().includes(searchLower) ||
        // Also search through all charts' programs
        patient.allCharts.some(chart => 
          chart.program?.toLowerCase().includes(searchLower)
        )
      );
    }

    return true;
  });
};

export const processPatients = (
  patients: PatientBasicInfo[],
  options: PatientGroupingOptions = {}
): GroupedPatient[] => {
  try {
    const grouped = groupPatientsByMasterId(patients);
    const sorted = sortGroupedPatients(grouped, options.sortBy, options.sortDirection);
    return filterGroupedPatients(sorted, options);
  } catch (error) {
    console.error('Error processing patients:', error);
    return [];
  }
};

export const fetchPatientOccupancy = async (): Promise<KipuOccupancy> => {
  const { setIsLoadingPatients } = usePatientStore.getState();
  setIsLoadingPatients(true);

  try {
    const endpoint = '/api/kipu/patients/occupancy';
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`Failed to fetch occupancy: ${response.statusText}`);

    const result = await response.json();
    return result as KipuOccupancy;
  } catch (error) {
    console.error('Error fetching patient occupancy:', error);
    throw error;
  } finally {
    setIsLoadingPatients(false);
  }
};
