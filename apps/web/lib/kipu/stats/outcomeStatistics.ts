// lib/kipu/stats/outcomeStatistics.ts
import { KipuCredentials } from 'types/kipu/kipuAdapter';
import { OutcomeStatistics } from './types';
import { kipuServerGet } from '../auth/server';

interface KipuTreatmentData {
  treatments: Array<any>;
  pagination?: any;
}

interface KipuClinicalData {
  assessments: Array<any>;
  pagination?: any;
}

interface KipuFollowUpData {
  followups: Array<any>;
  pagination?: any;
}

/**
 * Calculates outcome statistics from KIPU API data
 * @param credentials KIPU API credentials
 * @param facilityId Facility ID to get statistics for
 * @returns Promise resolving to outcome statistics
 */
export async function calculateOutcomeStatistics(
  credentials: KipuCredentials,
  facilityId: string
): Promise<OutcomeStatistics> {
  try {
    // Fetch required data from KIPU API
    const [treatmentData, clinicalData, followUpData] = await Promise.all([
      fetchTreatmentOutcomesData(credentials, facilityId),
      fetchClinicalOutcomesData(credentials, facilityId),
      fetchFollowUpMetricsData(credentials, facilityId)
    ]);

    return {
      treatment_outcomes: {
        completion_rate: calculateCompletionRate(treatmentData),
        early_discharge_rate: calculateEarlyDischargeRate(treatmentData),
        readmission_rate: calculateReadmissionRate(treatmentData)
      },
      clinical_outcomes: {
        symptom_reduction: calculateSymptomReduction(clinicalData),
        functional_improvement: calculateFunctionalImprovement(clinicalData),
        patient_satisfaction: calculatePatientSatisfaction(clinicalData)
      },
      follow_up_metrics: {
        aftercare_attendance: calculateAftercareAttendance(followUpData),
        medication_compliance: calculateMedicationCompliance(followUpData),
        recovery_maintenance: calculateRecoveryMaintenance(followUpData)
      }
    };
  } catch (error) {
    console.error('Error calculating outcome statistics:', error);
    return getDefaultOutcomeStatistics();
  }
}

/**
 * Fetches treatment outcomes data from KIPU API
 */
async function fetchTreatmentOutcomesData(
  credentials: KipuCredentials, 
  facilityId: string
): Promise<KipuTreatmentData | null> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      location_id: facilityId,
      phi_level: 'high'
    }).toString();
    
    const endpoint = `/api/treatments/outcomes?${queryParams}`;
    const response = await kipuServerGet(endpoint, credentials);
    return response.success ? (response.data as KipuTreatmentData) : null;
  } catch (error) {
    console.error('Error fetching treatment outcomes data:', error);
    return null;
  }
}

/**
 * Fetches clinical outcomes data from KIPU API
 */
async function fetchClinicalOutcomesData(
  credentials: KipuCredentials, 
  facilityId: string
): Promise<KipuClinicalData | null> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      location_id: facilityId,
      phi_level: 'high'
    }).toString();
    
    const endpoint = `/api/clinical/assessments?${queryParams}`;
    const response = await kipuServerGet(endpoint, credentials);
    return response.success ? (response.data as KipuClinicalData) : null;
  } catch (error) {
    console.error('Error fetching clinical outcomes data:', error);
    return null;
  }
}

/**
 * Fetches follow-up metrics data from KIPU API
 */
async function fetchFollowUpMetricsData(
  credentials: KipuCredentials, 
  facilityId: string
): Promise<KipuFollowUpData | null> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      location_id: facilityId,
      phi_level: 'high'
    }).toString();
    
    const endpoint = `/api/aftercare/followups?${queryParams}`;
    const response = await kipuServerGet(endpoint, credentials);
    return response.success ? (response.data as KipuFollowUpData) : null;
  } catch (error) {
    console.error('Error fetching follow-up metrics data:', error);
    return null;
  }
}

/**
 * Calculates treatment completion rate
 */
function calculateCompletionRate(treatmentData: KipuTreatmentData | null): number {
  if (!treatmentData || !treatmentData.treatments || treatmentData.treatments.length === 0) {
    return 0;
  }
  
  const completedTreatments = treatmentData.treatments.filter(
    treatment => treatment.status === 'completed'
  ).length;
  
  return (completedTreatments / treatmentData.treatments.length) * 100;
}

/**
 * Calculates early discharge rate
 */
function calculateEarlyDischargeRate(treatmentData: KipuTreatmentData | null): number {
  if (!treatmentData || !treatmentData.treatments || treatmentData.treatments.length === 0) {
    return 0;
  }
  
  const earlyDischarges = treatmentData.treatments.filter(
    treatment => treatment.status === 'discharged_early'
  ).length;
  
  return (earlyDischarges / treatmentData.treatments.length) * 100;
}

/**
 * Calculates readmission rate
 */
function calculateReadmissionRate(treatmentData: KipuTreatmentData | null): number {
  if (!treatmentData || !treatmentData.treatments || treatmentData.treatments.length === 0) {
    return 0;
  }
  
  const readmissions = treatmentData.treatments.filter(
    treatment => treatment.is_readmission === true
  ).length;
  
  return (readmissions / treatmentData.treatments.length) * 100;
}

/**
 * Calculates symptom reduction metrics
 */
function calculateSymptomReduction(clinicalData: KipuClinicalData | null): Record<string, number> {
  if (!clinicalData || !clinicalData.assessments || clinicalData.assessments.length === 0) {
    return {};
  }
  
  // Group assessments by type
  const assessmentsByType: Record<string, any[]> = {};
  
  clinicalData.assessments.forEach(assessment => {
    const type = assessment.type || 'unknown';
    if (!assessmentsByType[type]) {
      assessmentsByType[type] = [];
    }
    assessmentsByType[type].push(assessment);
  });
  
  // Calculate average improvement for each assessment type
  const reductions: Record<string, number> = {};
  
  Object.entries(assessmentsByType).forEach(([type, assessments]) => {
    const validAssessments = assessments.filter(
      a => a.initial_score !== undefined && a.final_score !== undefined
    );
    
    if (validAssessments.length === 0) {
      reductions[type] = 0;
      return;
    }
    
    const totalReduction = validAssessments.reduce((sum, a) => {
      const initialScore = Number(a.initial_score);
      const finalScore = Number(a.final_score);
      return sum + (initialScore - finalScore);
    }, 0);
    
    reductions[type] = totalReduction / validAssessments.length;
  });
  
  return reductions;
}

/**
 * Calculates functional improvement metrics
 */
function calculateFunctionalImprovement(clinicalData: KipuClinicalData | null): Record<string, number> {
  if (!clinicalData || !clinicalData.assessments || clinicalData.assessments.length === 0) {
    return {};
  }
  
  // Filter for functional assessments
  const functionalAssessments = clinicalData.assessments.filter(
    a => a.category === 'functional'
  );
  
  if (functionalAssessments.length === 0) {
    return {};
  }
  
  // Group by domain
  const assessmentsByDomain: Record<string, any[]> = {};
  
  functionalAssessments.forEach(assessment => {
    const domain = assessment.domain || 'general';
    if (!assessmentsByDomain[domain]) {
      assessmentsByDomain[domain] = [];
    }
    assessmentsByDomain[domain].push(assessment);
  });
  
  // Calculate improvement for each domain
  const improvements: Record<string, number> = {};
  
  Object.entries(assessmentsByDomain).forEach(([domain, assessments]) => {
    const validAssessments = assessments.filter(
      a => a.initial_score !== undefined && a.final_score !== undefined
    );
    
    if (validAssessments.length === 0) {
      improvements[domain] = 0;
      return;
    }
    
    const totalImprovement = validAssessments.reduce((sum, a) => {
      const initialScore = Number(a.initial_score);
      const finalScore = Number(a.final_score);
      // For functional assessments, higher scores typically indicate improvement
      return sum + (finalScore - initialScore);
    }, 0);
    
    improvements[domain] = totalImprovement / validAssessments.length;
  });
  
  return improvements;
}

/**
 * Calculates patient satisfaction score
 */
function calculatePatientSatisfaction(clinicalData: KipuClinicalData | null): number {
  if (!clinicalData || !clinicalData.assessments || clinicalData.assessments.length === 0) {
    return 0;
  }
  
  // Filter for satisfaction surveys
  const satisfactionSurveys = clinicalData.assessments.filter(
    a => a.type === 'satisfaction_survey'
  );
  
  if (satisfactionSurveys.length === 0) {
    return 0;
  }
  
  const totalScore = satisfactionSurveys.reduce((sum, survey) => {
    return sum + (Number(survey.score) || 0);
  }, 0);
  
  return totalScore / satisfactionSurveys.length;
}

/**
 * Calculates aftercare attendance rate
 */
function calculateAftercareAttendance(followUpData: KipuFollowUpData | null): number {
  if (!followUpData || !followUpData.followups || followUpData.followups.length === 0) {
    return 0;
  }
  
  const aftercareAppointments = followUpData.followups.filter(
    f => f.type === 'aftercare'
  );
  
  if (aftercareAppointments.length === 0) {
    return 0;
  }
  
  const attendedAppointments = aftercareAppointments.filter(
    f => f.status === 'attended'
  ).length;
  
  return (attendedAppointments / aftercareAppointments.length) * 100;
}

/**
 * Calculates medication compliance rate
 */
function calculateMedicationCompliance(followUpData: KipuFollowUpData | null): number {
  if (!followUpData || !followUpData.followups || followUpData.followups.length === 0) {
    return 0;
  }
  
  const medicationChecks = followUpData.followups.filter(
    f => f.type === 'medication_check'
  );
  
  if (medicationChecks.length === 0) {
    return 0;
  }
  
  const compliantChecks = medicationChecks.filter(
    f => f.compliance_status === 'compliant'
  ).length;
  
  return (compliantChecks / medicationChecks.length) * 100;
}

/**
 * Calculates recovery maintenance rate
 */
function calculateRecoveryMaintenance(followUpData: KipuFollowUpData | null): number {
  if (!followUpData || !followUpData.followups || followUpData.followups.length === 0) {
    return 0;
  }
  
  const recoveryChecks = followUpData.followups.filter(
    f => f.type === 'recovery_check'
  );
  
  if (recoveryChecks.length === 0) {
    return 0;
  }
  
  const maintainingRecovery = recoveryChecks.filter(
    f => f.status === 'maintaining'
  ).length;
  
  return (maintainingRecovery / recoveryChecks.length) * 100;
}

/**
 * Returns default outcome statistics when data cannot be fetched
 */
function getDefaultOutcomeStatistics(): OutcomeStatistics {
  return {
    treatment_outcomes: {
      completion_rate: 0,
      early_discharge_rate: 0,
      readmission_rate: 0
    },
    clinical_outcomes: {
      symptom_reduction: {},
      functional_improvement: {},
      patient_satisfaction: 0
    },
    follow_up_metrics: {
      aftercare_attendance: 0,
      medication_compliance: 0,
      recovery_maintenance: 0
    }
  };
}