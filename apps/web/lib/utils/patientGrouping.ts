import { PatientBasicInfo } from '~/types/kipu/kipuAdapter';
import { parsePatientId } from '~/lib/kipu/auth/config';

export interface GroupedPatient {
  patientMasterId: string;
  currentChart: PatientBasicInfo;  // The most recent/active chart
  allCharts: PatientBasicInfo[];   // All charts/admissions for this patient
  isActive: boolean;               // Whether the patient has any active charts
}

export function groupPatientsByMasterId(patients: PatientBasicInfo[]): GroupedPatient[] {
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
}

export function sortGroupedPatients(patients: GroupedPatient[]): GroupedPatient[] {
  return patients.sort((a, b) => {
    // First sort by active status
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;

    // Then sort by most recent admission date
    const dateA = a.currentChart.admissionDate ? new Date(a.currentChart.admissionDate).getTime() : 0;
    const dateB = b.currentChart.admissionDate ? new Date(b.currentChart.admissionDate).getTime() : 0;
    return dateB - dateA;
  });
}

export function filterGroupedPatients(
  patients: GroupedPatient[],
  searchTerm: string,
  showActive: boolean = false
): GroupedPatient[] {
  return patients.filter(patient => {
    // Filter by active status if requested
    if (showActive && !patient.isActive) return false;

    // Filter by search term
    const searchLower = searchTerm.toLowerCase();
    const currentChart = patient.currentChart;
    
    return (
      currentChart.firstName?.toLowerCase().includes(searchLower) ||
      currentChart.lastName?.toLowerCase().includes(searchLower) ||
      currentChart.mrn?.toLowerCase().includes(searchLower) ||
      patient.patientMasterId.toLowerCase().includes(searchLower)
    );
  });
} 