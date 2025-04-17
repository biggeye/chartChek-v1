// lib/kipu/stats/patientStatistics.ts

import { KipuCredentials } from '~/types/kipu/kipuAdapter';
import { PatientStatistics, DateRange } from './types';
import { kipuServerGet } from '../auth/server';

// Define interfaces for KIPU API responses
interface KipuPatientData {
  patients: Array<any>;
  pagination?: any;
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
    // Fetch required data from KIPU API
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

    // Calculate bed utilization
    const bedUtilization = calculateBedUtilization(censusData, facilityId);

    // Process demographics data
    const demographics = processDemographicsData(demographicsData);

    // Process clinical data
    const clinical = processClinicalData(censusData);

    // Construct and return the patient statistics object
    return {
      census: {
        current_count: censusData?.patients?.length || 0,
        admissions_daily: admissionsDaily?.patients?.length || 0,
        admissions_weekly: admissionsWeekly?.patients?.length || 0,
        admissions_monthly: admissionsMonthly?.patients?.length || 0,
        discharges_daily: dischargesDaily?.patients?.length || 0,
        discharges_weekly: dischargesWeekly?.patients?.length || 0,
        discharges_monthly: dischargesMonthly?.patients?.length || 0,
        avg_length_of_stay: avgLengthOfStay
      },
      demographics: demographics,
      clinical: clinical,
      bed_utilization: bedUtilization
    };
  } catch (error) {
    console.error('Error calculating patient statistics:', error);
    // Return default empty statistics object on error
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
return response.success ? (response.data as KipuPatientData) : null;} catch (error) {
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
    return response.success ? (response.data as KipuPatientData) : null;  } catch (error) {
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
    return response.success ? (response.data as KipuPatientData) : null;  } catch (error) {
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
    return response.success ? (response.data as KipuPatientData) : null;  } catch (error) {
    console.error('Error fetching demographics data:', error);
    return null;
  }
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
 * Calculates bed utilization metrics
 */
function calculateBedUtilization(censusData: any, facilityId: string): any {
  // This would typically require facility capacity data from another source
  // For now, we'll return a placeholder implementation
  const currentPatients = censusData?.patients?.length || 0;
  
  // Placeholder values - in a real implementation, these would come from facility configuration
  const totalBeds = 100; // Example value
  const occupancyRate = totalBeds > 0 ? parseFloat(((currentPatients / totalBeds) * 100).toFixed(1)) : 0;
  
  return {
    occupancy_rate: occupancyRate,
    available_beds: totalBeds - currentPatients,
    reserved_beds: 0, // Would come from reservations data
    projected_availability: {
      "7_days": totalBeds - currentPatients - 5, // Example projection
      "14_days": totalBeds - currentPatients - 8,
      "30_days": totalBeds - currentPatients - 12
    }
  };
}

/**
 * Processes demographics data into statistics
 */
function processDemographicsData(demographicsData: any): any {
  if (!demographicsData?.patients?.length) {
    return {
      age_distribution: {},
      gender_distribution: {},
      insurance_distribution: {}
    };
  }
  
  const ageGroups: Record<string, number> = {
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
  
  demographicsData.patients.forEach((patient: any) => {
    // Process age distribution
    if (patient.age) {
      const age = parseInt(patient.age);
      if (age < 18) ageGroups["under_18"]++;
      else if (age < 25) ageGroups["18_24"]++;
      else if (age < 35) ageGroups["25_34"]++;
      else if (age < 45) ageGroups["35_44"]++;
      else if (age < 55) ageGroups["45_54"]++;
      else if (age < 65) ageGroups["55_64"]++;
      else ageGroups["65_plus"]++;
    }
    
    // Process gender distribution
    if (patient.gender) {
      const gender = patient.gender.toLowerCase();
      genderCounts[gender] = (genderCounts[gender] || 0) + 1;
    }
    
    // Process insurance distribution
    if (patient.insurance && patient.insurance.primary_insurance) {
      const insurance = patient.insurance.primary_insurance;
      insuranceCounts[insurance] = (insuranceCounts[insurance] || 0) + 1;
    }
  });
  
  return {
    age_distribution: ageGroups,
    gender_distribution: genderCounts,
    insurance_distribution: insuranceCounts
  };
}

/**
 * Processes clinical data into statistics
 */
function processClinicalData(censusData: any): any {
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
  
  censusData.patients.forEach((patient: any) => {
    // Process diagnosis distribution
    if (patient.diagnoses && Array.isArray(patient.diagnoses)) {
      patient.diagnoses.forEach((diagnosis: any) => {
        if (diagnosis.name) {
          diagnosisCounts[diagnosis.name] = (diagnosisCounts[diagnosis.name] || 0) + 1;
        }
      });
    }
    
    // In a real implementation, medication adherence and treatment completion
    // would come from specific KIPU endpoints or calculations
    // These are placeholder values for now
    if (patient.medication_adherence) {
      medicationAdherenceSum += patient.medication_adherence;
      medicationAdherenceCount++;
    }
    
    if (patient.treatment_completion) {
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