// lib/kipu/stats/patientStatistics.ts

import { KipuCredentials } from 'types/kipu/kipuAdapter';
import { 
  PatientStatistics, 
  DateRange, 
  BedUtilizationStatistics 
} from './types';
import { kipuServerGet } from '../auth/server';

// Define interfaces for KIPU API responses
interface KipuPatientData {
  patients: Array<{
    id?: string;
    age?: string | number;
    gender?: string;
    diagnoses?: Array<{ name: string }>;
    insurance?: {
      primary_insurance?: string;
    };
    admission_date?: string;
    discharge_date?: string;
    medication_adherence?: number;
    treatment_completion?: number;
  }>;
  pagination?: {
    current_page: number;
    total_pages: number;
    records_per_page: number;
    total_records: number;
  };
}

interface FacilityCapacityResponse {
  total_beds: number;
  reserved_beds: number;
}

interface DemographicStatistics {
  age_distribution: Record<string, number>;
  gender_distribution: Record<string, number>;
  insurance_distribution: Record<string, number>;
}

interface ClinicalStatistics {
  diagnosis_distribution: Record<string, number>;
  medication_adherence_rate: number;
  treatment_completion_rate: number;
}

/**
 * Calculates comprehensive patient statistics from KIPU API data
 * @param credentials - KIPU API credentials
 * @param facilityId - The facility ID to get statistics for
 * @param dateRange - Date range for time-based statistics
 * @returns Promise resolving to patient statistics object
 */
export async function calculatePatientStatistics(
  credentials: KipuCredentials,
  facilityId: string,
  dateRange: DateRange
): Promise<PatientStatistics> {
  try {
    const [
      censusData,
      admissionsDaily,
      admissionsWeekly,
      admissionsMonthly,
      dischargesDaily,
      dischargesWeekly,
      dischargesMonthly,
      demographicsData
    ] = await Promise.all([
      fetchCensusData(credentials, facilityId),
      fetchAdmissionsData(credentials, facilityId, dateRange.daily.start, dateRange.daily.end),
      fetchAdmissionsData(credentials, facilityId, dateRange.weekly.start, dateRange.weekly.end),
      fetchAdmissionsData(credentials, facilityId, dateRange.monthly.start, dateRange.monthly.end),
      fetchDischargesData(credentials, facilityId, dateRange.daily.start, dateRange.daily.end),
      fetchDischargesData(credentials, facilityId, dateRange.weekly.start, dateRange.weekly.end),
      fetchDischargesData(credentials, facilityId, dateRange.monthly.start, dateRange.monthly.end),
      fetchDemographicsData(credentials, facilityId)
    ]);

    // Calculate average length of stay
    const avgLengthOfStay = calculateAverageLengthOfStay(dischargesMonthly);

    // Calculate bed utilization with real facility data
    const bedUtilization = await calculateBedUtilization(censusData, credentials, facilityId);

    // Process demographics data
    const demographics = processDemographicsData(demographicsData);

    // Process clinical data
    const clinical = processClinicalData(censusData);

    const stats: PatientStatistics = {
      census: {
        current_count: censusData?.patients?.length ?? 0,
        admissions_daily: admissionsDaily?.patients?.length ?? 0,
        admissions_weekly: admissionsWeekly?.patients?.length ?? 0,
        admissions_monthly: admissionsMonthly?.patients?.length ?? 0,
        discharges_daily: dischargesDaily?.patients?.length ?? 0,
        discharges_weekly: dischargesWeekly?.patients?.length ?? 0,
        discharges_monthly: dischargesMonthly?.patients?.length ?? 0,
        avg_length_of_stay: avgLengthOfStay
      },
      demographics,
      clinical,
      bed_utilization: bedUtilization
    };

    return stats;
  } catch (error) {
    console.error('Error calculating patient statistics:', error);
    return getDefaultPatientStatistics();
  }
}

/**
 * Fetches current census data from KIPU API
 */
async function fetchCensusData(credentials: KipuCredentials, facilityId: string): Promise<KipuPatientData | null> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      location_id: facilityId,
      phi_level: 'high',
      demographics_detail: 'v121',
      patient_status_detail: 'v121',
      insurance_detail: 'v121'
    }).toString();
    
    const endpoint = `/api/patients/census?${queryParams}`;
    const response = await kipuServerGet(endpoint, credentials);
    return response.success ? (response.data as KipuPatientData) : null;
  } catch (error) {
    console.error('Error fetching census data:', error);
    return null;
  }
}

/**
 * Fetches admissions data from KIPU API
 */
async function fetchAdmissionsData(
  credentials: KipuCredentials,
  facilityId: string,
  startDate: string,
  endDate: string
): Promise<KipuPatientData | null> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      location_id: facilityId,
      start_date: startDate,
      end_date: endDate,
      phi_level: 'high'
    }).toString();
    
    const endpoint = `/api/patients/admissions?${queryParams}`;
    const response = await kipuServerGet(endpoint, credentials);
    return response.success ? (response.data as KipuPatientData) : null;
  } catch (error) {
    console.error('Error fetching admissions data:', error);
    return null;
  }
}

/**
 * Fetches discharges data from KIPU API
 */
async function fetchDischargesData(
  credentials: KipuCredentials,
  facilityId: string,
  startDate: string,
  endDate: string
): Promise<KipuPatientData | null> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      location_id: facilityId,
      start_date: startDate,
      end_date: endDate,
      phi_level: 'high'
    }).toString();
    
    const endpoint = `/api/patients/discharges?${queryParams}`;
    const response = await kipuServerGet(endpoint, credentials);
    return response.success ? (response.data as KipuPatientData) : null;
  } catch (error) {
    console.error('Error fetching discharges data:', error);
    return null;
  }
}

/**
 * Fetches demographics data from KIPU API
 */
async function fetchDemographicsData(credentials: KipuCredentials, facilityId: string): Promise<KipuPatientData | null> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      location_id: facilityId,
      phi_level: 'high'
    }).toString();
    
    const endpoint = `/api/patients/demographics?${queryParams}`;
    const response = await kipuServerGet(endpoint, credentials);
    return response.success ? (response.data as KipuPatientData) : null;
  } catch (error) {
    console.error('Error fetching demographics data:', error);
    return null;
  }
}

/**
 * Fetches facility capacity data from KIPU API
 */
async function fetchFacilityCapacity(
  credentials: KipuCredentials,
  facilityId: string
): Promise<FacilityCapacityResponse | null> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      location_id: facilityId
    }).toString();
    
    const endpoint = `/api/facilities/${facilityId}/capacity?${queryParams}`;
    const response = await kipuServerGet(endpoint, credentials);
    return response.success ? (response.data as FacilityCapacityResponse) : null;
  } catch (error) {
    console.error('Error fetching facility capacity:', error);
    return null;
  }
}

/**
 * Calculates bed utilization metrics
 */
async function calculateBedUtilization(
  censusData: KipuPatientData | null,
  credentials: KipuCredentials,
  facilityId: string
): Promise<BedUtilizationStatistics> {
  const currentPatients = censusData?.patients?.length || 0;
  const capacityData = await fetchFacilityCapacity(credentials, facilityId);
  
  const totalBeds = capacityData?.total_beds || 0;
  const reservedBeds = capacityData?.reserved_beds || 0;
  const availableBeds = Math.max(0, totalBeds - currentPatients - reservedBeds);
  
  // Calculate occupancy rate
  const occupancyRate = totalBeds > 0 
    ? parseFloat(((currentPatients / totalBeds) * 100).toFixed(1)) 
    : 0;
  
  // Project availability based on historical admission/discharge rates
  // This would ideally use more sophisticated prediction models
  const projectedAvailability = {
    "7_days": Math.max(0, availableBeds - Math.floor(currentPatients * 0.1)),
    "14_days": Math.max(0, availableBeds - Math.floor(currentPatients * 0.15)),
    "30_days": Math.max(0, availableBeds - Math.floor(currentPatients * 0.2))
  };
  
  return {
    occupancy_rate: occupancyRate,
    available_beds: availableBeds,
    reserved_beds: reservedBeds,
    projected_availability: projectedAvailability
  };
}

/**
 * Calculates average length of stay from discharge data
 */
function calculateAverageLengthOfStay(dischargesData: any): number {
  if (!dischargesData?.patients?.length) return 0;
  
  let totalDays = 0;
  let validDischarges = 0;
  
  dischargesData.patients.forEach((patient: any) => {
    if (patient.admission_date && patient.discharge_date) {
      const admissionDate = new Date(patient.admission_date);
      const dischargeDate = new Date(patient.discharge_date);
      const stayDuration = (dischargeDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (stayDuration > 0) {
        totalDays += stayDuration;
        validDischarges++;
      }
    }
  });
  
  return validDischarges > 0 ? parseFloat((totalDays / validDischarges).toFixed(1)) : 0;
}

/**
 * Processes demographics data into statistics
 */
function processDemographicsData(demographicsData: KipuPatientData | null): DemographicStatistics {
  if (!demographicsData?.patients?.length) {
    return {
      age_distribution: {},
      gender_distribution: {},
      insurance_distribution: {}
    };
  }
  
  const ageGroups = {
    "under_18": 0,
    "18_24": 0,
    "25_34": 0,
    "35_44": 0,
    "45_54": 0,
    "55_64": 0,
    "65_plus": 0
  } as const;

  type AgeGroup = keyof typeof ageGroups;
  const ageGroupCounts: Record<AgeGroup, number> = {
    "under_18": 0,
    "18_24": 0,
    "25_34": 0,
    "35_44": 0,
    "45_54": 0,
    "55_64": 0,
    "65_plus": 0
  };
  
  const genderCounts: Record<string, number> = {};
  const insuranceCounts: Record<string, number> = {};
  
  demographicsData.patients.forEach((patient) => {
    // Process age distribution
    if (patient.age) {
      const ageValue = typeof patient.age === 'string' ? parseInt(patient.age, 10) : patient.age;
      
      if (!isNaN(ageValue)) {
        if (ageValue < 18) ageGroupCounts["under_18"]++;
        else if (ageValue < 25) ageGroupCounts["18_24"]++;
        else if (ageValue < 35) ageGroupCounts["25_34"]++;
        else if (ageValue < 45) ageGroupCounts["35_44"]++;
        else if (ageValue < 55) ageGroupCounts["45_54"]++;
        else if (ageValue < 65) ageGroupCounts["55_64"]++;
        else ageGroupCounts["65_plus"]++;
      }
    }
    
    // Process gender distribution
    if (patient.gender) {
      const gender = patient.gender.toLowerCase();
      genderCounts[gender] = (genderCounts[gender] || 0) + 1;
    }
    
    // Process insurance distribution
    if (patient.insurance?.primary_insurance) {
      const insurance = patient.insurance.primary_insurance;
      insuranceCounts[insurance] = (insuranceCounts[insurance] || 0) + 1;
    }
  });
  
  return {
    age_distribution: ageGroupCounts,
    gender_distribution: genderCounts,
    insurance_distribution: insuranceCounts
  };
}

/**
 * Processes clinical data into statistics
 */
function processClinicalData(censusData: KipuPatientData | null): ClinicalStatistics {
  if (!censusData?.patients?.length) {
    return {
      diagnosis_distribution: {},
      medication_adherence_rate: 0,
      treatment_completion_rate: 0
    };
  }
  
  const diagnosisCounts: Record<string, number> = {};
  let medicationAdherenceSum = 0;
  let medicationAdherenceCount = 0;
  let treatmentCompletionSum = 0;
  let treatmentCompletionCount = 0;
  
  censusData.patients.forEach((patient) => {
    // Process diagnosis distribution
    if (patient.diagnoses && Array.isArray(patient.diagnoses)) {
      patient.diagnoses.forEach((diagnosis) => {
        if (diagnosis.name) {
          diagnosisCounts[diagnosis.name] = (diagnosisCounts[diagnosis.name] || 0) + 1;
        }
      });
    }
    
    if (typeof patient.medication_adherence === 'number') {
      medicationAdherenceSum += patient.medication_adherence;
      medicationAdherenceCount++;
    }
    
    if (typeof patient.treatment_completion === 'number') {
      treatmentCompletionSum += patient.treatment_completion;
      treatmentCompletionCount++;
    }
  });
  
  const medicationAdherenceRate = medicationAdherenceCount > 0 
    ? parseFloat((medicationAdherenceSum / medicationAdherenceCount).toFixed(1)) 
    : 0;
    
  const treatmentCompletionRate = treatmentCompletionCount > 0 
    ? parseFloat((treatmentCompletionSum / treatmentCompletionCount).toFixed(1)) 
    : 0;
  
  return {
    diagnosis_distribution: diagnosisCounts,
    medication_adherence_rate: medicationAdherenceRate,
    treatment_completion_rate: treatmentCompletionRate
  };
}

/**
 * Returns default empty patient statistics object
 */
function getDefaultPatientStatistics(): PatientStatistics {
  return {
    census: {
      current_count: 0,
      admissions_daily: 0,
      admissions_weekly: 0,
      admissions_monthly: 0,
      discharges_daily: 0,
      discharges_weekly: 0,
      discharges_monthly: 0,
      avg_length_of_stay: 0
    },
    demographics: {
      age_distribution: {},
      gender_distribution: {},
      insurance_distribution: {}
    },
    clinical: {
      diagnosis_distribution: {},
      medication_adherence_rate: 0,
      treatment_completion_rate: 0
    },
    bed_utilization: {
      occupancy_rate: 0,
      available_beds: 0,
      reserved_beds: 0,
      projected_availability: {
        "7_days": 0,
        "14_days": 0,
        "30_days": 0
      }
    }
  };
}