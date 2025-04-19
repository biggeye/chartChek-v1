// lib/kipu/stats/treatmentStatistics.ts
import { KipuCredentials } from 'types/kipu/kipuAdapter';
import { TreatmentStatistics } from './types';
import { kipuServerGet } from '../auth/server';

interface KipuTreatmentData {
    treatments: Array<any>;
    pagination?: any;
}

interface KipuLevelOfCareData {
    levels_of_care: Array<any>;
    pagination?: any;
}

interface KipuTreatmentPlanData {
    treatment_plans: Array<any>;
    pagination?: any;
}

/**
 * Calculates treatment statistics from KIPU API data
 * @param credentials KIPU API credentials
 * @param facilityId Facility ID to get statistics for
 * @returns Promise resolving to treatment statistics
 */
export async function calculateTreatmentStatistics(
    credentials: KipuCredentials,
    facilityId: string
): Promise<TreatmentStatistics> {
    try {
        // Fetch required data from KIPU API
        const [treatmentData, levelOfCareData, treatmentPlanData] = await Promise.all([
            fetchTreatmentData(credentials, facilityId),
            fetchLevelOfCareData(credentials, facilityId),
            fetchTreatmentPlanData(credentials, facilityId)
        ]);

        return {
            treatment_duration: {
                avg_length_of_stay: calculateAvgLengthOfStay(treatmentData),
                duration_by_diagnosis: calculateDurationByDiagnosis(treatmentData),
                duration_by_program: calculateDurationByProgram(treatmentData)
            },
            level_of_care: {
                distribution: calculateLevelOfCareDistribution(levelOfCareData),
                transitions: calculateLevelOfCareTransitions(levelOfCareData),
                avg_time_in_level: calculateAvgTimeInLevel(levelOfCareData)
            },
            treatment_plan: {
                goal_completion_rate: calculateGoalCompletionRate(treatmentPlanData),
                intervention_usage: calculateInterventionUsage(treatmentPlanData),
                plan_adherence: calculatePlanAdherence(treatmentPlanData)
            }
        };
    } catch (error) {
        console.error('Error calculating treatment statistics:', error);
        return getDefaultTreatmentStatistics();
    }
}

/**
 * Fetches treatment data from KIPU API
 */
async function fetchTreatmentData(
    credentials: KipuCredentials,
    facilityId: string
): Promise<KipuTreatmentData | null> {
    try {
        const queryParams = new URLSearchParams({
            app_id: credentials.appId,
            location_id: facilityId,
            phi_level: 'high'
        }).toString();

        const endpoint = `/api/treatments?${queryParams}`;
        const response = await kipuServerGet(endpoint, credentials);
        return response.success ? (response.data as KipuTreatmentData) : null;
    } catch (error) {
        console.error('Error fetching treatment data:', error);
        return null;
    }
}

/**
 * Fetches level of care data from KIPU API
 */
async function fetchLevelOfCareData(
    credentials: KipuCredentials,
    facilityId: string
): Promise<KipuLevelOfCareData | null> {
    try {
        const queryParams = new URLSearchParams({
            app_id: credentials.appId,
            location_id: facilityId,
            phi_level: 'high'
        }).toString();

        const endpoint = `/api/levels-of-care?${queryParams}`;
        const response = await kipuServerGet(endpoint, credentials);
        return response.success ? (response.data as KipuLevelOfCareData) : null;
    } catch (error) {
        console.error('Error fetching level of care data:', error);
        return null;
    }
}

/**
 * Fetches treatment plan data from KIPU API
 */
async function fetchTreatmentPlanData(
    credentials: KipuCredentials,
    facilityId: string
): Promise<KipuTreatmentPlanData | null> {
    try {
        const queryParams = new URLSearchParams({
            app_id: credentials.appId,
            location_id: facilityId,
            phi_level: 'high'
        }).toString();

        const endpoint = `/api/treatment-plans?${queryParams}`;
        const response = await kipuServerGet(endpoint, credentials);
        return response.success ? (response.data as KipuTreatmentPlanData) : null;
    } catch (error) {
        console.error('Error fetching treatment plan data:', error);
        return null;
    }
}

/**
 * Calculates average length of stay in days
 */
function calculateAvgLengthOfStay(treatmentData: KipuTreatmentData | null): number {
    if (!treatmentData || !treatmentData.treatments || treatmentData.treatments.length === 0) {
        return 0;
    }

    // Filter for completed treatments with valid dates
    const completedTreatments = treatmentData.treatments.filter(
        t => t.status === 'completed' && t.admission_date && t.discharge_date
    );

    if (completedTreatments.length === 0) {
        return 0;
    }

    // Calculate total days
    const totalDays = completedTreatments.reduce((sum, treatment) => {
        const admissionDate = new Date(treatment.admission_date);
        const dischargeDate = new Date(treatment.discharge_date);
        const daysInTreatment = (dischargeDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24);
        return sum + daysInTreatment;
    }, 0);

    return totalDays / completedTreatments.length;
}

/**
 * Calculates average duration by primary diagnosis
 */
function calculateDurationByDiagnosis(treatmentData: KipuTreatmentData | null): Record<string, number> {
    if (!treatmentData || 
        !treatmentData.treatments || 
        treatmentData.treatments.length === 0) {
        return {};
    }

    // Filter for completed treatments with valid dates and diagnosis
    const validTreatments = treatmentData.treatments.filter(
        t => t.status === 'completed' && t.admission_date && t.discharge_date && t.primary_diagnosis
    );

    if (validTreatments.length === 0) {
        return {};
    }

    // Group by diagnosis
    const treatmentsByDiagnosis: Record<string, any[]> = {};

    validTreatments.forEach(treatment => {
        const diagnosis = treatment.primary_diagnosis;
        if (!treatmentsByDiagnosis[diagnosis]) {
            treatmentsByDiagnosis[diagnosis] = [];
        }
        treatmentsByDiagnosis[diagnosis].push(treatment);
    });

    // Calculate average duration for each diagnosis
    const durationByDiagnosis: Record<string, number> = {};

    Object.entries(treatmentsByDiagnosis).forEach(([diagnosis, treatments]) => {
        const totalDays = treatments.reduce((sum, treatment) => {
            const admissionDate = new Date(treatment.admission_date);
            const dischargeDate = new Date(treatment.discharge_date);
            const daysInTreatment = (dischargeDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24);
            return sum + daysInTreatment;
        }, 0);

        durationByDiagnosis[diagnosis] = totalDays / treatments.length;
    });

    return durationByDiagnosis;
}

/**
 * Calculates average duration by program type
 */
function calculateDurationByProgram(treatmentData: KipuTreatmentData | null): Record<string, number> {
    if (!treatmentData || 
        !treatmentData.treatments || 
        treatmentData.treatments.length === 0) {
        return {};
    }

    // Filter for completed treatments with valid dates and program
    const validTreatments = treatmentData.treatments.filter(
        t => t.status === 'completed' && t.admission_date && t.discharge_date && t.program
    );

    if (validTreatments.length === 0) {
        return {};
    }

    // Group by program
    const treatmentsByProgram: Record<string, any[]> = {};

    validTreatments.forEach(treatment => {
        const program = treatment.program;
        if (!treatmentsByProgram[program]) {
            treatmentsByProgram[program] = [];
        }
        treatmentsByProgram[program].push(treatment);
    });

    // Calculate average duration for each program
    const durationByProgram: Record<string, number> = {};

    Object.entries(treatmentsByProgram).forEach(([program, treatments]) => {
        const totalDays = treatments.reduce((sum, treatment) => {
            const admissionDate = new Date(treatment.admission_date);
            const dischargeDate = new Date(treatment.discharge_date);
            const daysInTreatment = (dischargeDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24);
            return sum + daysInTreatment;
        }, 0);

        durationByProgram[program] = totalDays / treatments.length;
    });

    return durationByProgram;
}

/**
 * Calculates distribution of patients across levels of care
 */
function calculateLevelOfCareDistribution(levelOfCareData: KipuLevelOfCareData | null): Record<string, number> {
    if (!levelOfCareData || 
        !levelOfCareData.levels_of_care || 
        levelOfCareData.levels_of_care.length === 0) {
        return {};
    }

    // Count patients in each level of care
    const patientsByLevel: Record<string, number> = {};

    levelOfCareData.levels_of_care.forEach(loc => {
        const level = loc.level || 'unknown';
        if (!patientsByLevel[level]) {
            patientsByLevel[level] = 0;
        }
        patientsByLevel[level] += loc.patient_count || 0;
    });

    return patientsByLevel;
}

/**
 * Calculates transitions between levels of care
 */
function calculateLevelOfCareTransitions(levelOfCareData: KipuLevelOfCareData | null): Record<string, Record<string, number>> {
    if (!levelOfCareData || !levelOfCareData.levels_of_care || levelOfCareData.levels_of_care.length === 0) {
        return {};
    }

    // Extract transition data if available
    const transitions: Record<string, Record<string, number>> = {};

    levelOfCareData.levels_of_care.forEach(loc => {
        if (loc.transitions) {
            const fromLevel = loc.level || 'unknown';
            transitions[fromLevel] = {};

            Object.entries(loc.transitions).forEach(([toLevel, count]) => {
                transitions[fromLevel][toLevel] = Number(count) || 0;
            });
        }
    });

    return transitions;
}

/**
 * Calculates average time spent in each level of care
 */
function calculateAvgTimeInLevel(levelOfCareData: KipuLevelOfCareData | null): Record<string, number> {
    if (!levelOfCareData || 
        !levelOfCareData.levels_of_care || 
        levelOfCareData.levels_of_care.length === 0) {
        return {};
    }

    // Calculate average days in each level
    const avgTimeByLevel: Record<string, number> = {};

    levelOfCareData.levels_of_care.forEach(loc => {
        const level = loc.level || 'unknown';
        if (loc.avg_days) {
            avgTimeByLevel[level] = Number(loc.avg_days) || 0;
        }
    });

    return avgTimeByLevel;
}

/**
 * Calculates goal completion rate from treatment plans
 */
function calculateGoalCompletionRate(treatmentPlanData: KipuTreatmentPlanData | null): number {
    if (!treatmentPlanData || 
        !treatmentPlanData.treatment_plans || 
        treatmentPlanData.treatment_plans.length === 0) {
        return 0;
    }

    let totalGoals = 0;
    let completedGoals = 0;

    treatmentPlanData.treatment_plans.forEach(plan => {
        if (plan.goals && Array.isArray(plan.goals)) {
            totalGoals += plan.goals.length;
            completedGoals += plan.goals.filter((goal: any) =>
                goal.status === 'completed').length;
        }
    });

    return totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
}

/**
 * Calculates intervention usage frequency
 */
function calculateInterventionUsage(treatmentPlanData: KipuTreatmentPlanData | null): Record<string, number> {
    if (!treatmentPlanData || !treatmentPlanData.treatment_plans || treatmentPlanData.treatment_plans.length === 0) {
      return {};
    }
    
    const interventionCounts: Record<string, number> = {};
    
    treatmentPlanData.treatment_plans.forEach(plan => {
      if (plan.interventions && Array.isArray(plan.interventions)) {
        plan.interventions.forEach((intervention: any) => {
          const type = intervention.type || 'unknown';
          interventionCounts[type] = (interventionCounts[type] || 0) + 1;
        });
      }
    });
    
    return interventionCounts;
  }
/**
 * Calculates treatment plan adherence rate
 */
function calculatePlanAdherence(treatmentPlanData: KipuTreatmentPlanData | null): number {
    if (!treatmentPlanData || 
        !treatmentPlanData.treatment_plans || 
        treatmentPlanData.treatment_plans.length === 0) {
        return 0;
    }

    // Filter for plans with adherence data
    const plansWithAdherence = treatmentPlanData.treatment_plans.filter(
        plan => plan.adherence_rate !== undefined
    );

    if (plansWithAdherence.length === 0) {
        return 0;
    }

    // Calculate average adherence
    const totalAdherence = plansWithAdherence.reduce((sum, plan) => {
        return sum + (Number(plan.adherence_rate) || 0);
    }, 0);

    return totalAdherence / plansWithAdherence.length;
}

/**
 * Returns default treatment statistics when data cannot be fetched
 */
function getDefaultTreatmentStatistics(): TreatmentStatistics {
    return {
        treatment_duration: {
            avg_length_of_stay: 0,
            duration_by_diagnosis: {},
            duration_by_program: {}
        },
        level_of_care: {
            distribution: {},
            transitions: {},
            avg_time_in_level: {}
        },
        treatment_plan: {
            goal_completion_rate: 0,
            intervention_usage: {},
            plan_adherence: 0
        }
    };
}