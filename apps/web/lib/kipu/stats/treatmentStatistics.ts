// lib/kipu/stats/treatmentStatistics.ts
import { KipuCredentials } from 'types/kipu/kipuAdapter';
import { 
  KipuApiResponse,
  KipuTreatment,
  TreatmentStatus,
  DateRange
} from './types';
import { kipuServerGet } from '../auth/server';

/**
 * Fetches treatment data from KIPU API
 */
async function fetchTreatmentData(
  credentials: KipuCredentials,
  facilityId: string,
  startDate: string,
  endDate: string
): Promise<KipuApiResponse<KipuTreatment[]> | null> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      location_id: facilityId,
      start_date: startDate,
      end_date: endDate
    }).toString();
    
    const endpoint = `/api/treatments?${queryParams}`;
    const response = await kipuServerGet(endpoint, credentials);
    return response as KipuApiResponse<KipuTreatment[]>;
  } catch (error) {
    console.error('Error fetching treatment data:', error);
    return null;
  }
}

/**
 * Calculates treatment completion metrics
 */
async function calculateTreatmentCompletion(
  treatments: KipuTreatment[]
): Promise<{
  completed: number;
  dischargedEarly: number;
  active: number;
  pending: number;
}> {
  const stats = {
    completed: 0,
    dischargedEarly: 0,
    active: 0,
    pending: 0
  };

  treatments.forEach(treatment => {
    switch (treatment.status) {
      case TreatmentStatus.Completed:
        stats.completed++;
        break;
      case TreatmentStatus.DischargedEarly:
        stats.dischargedEarly++;
        break;
      case TreatmentStatus.Active:
        stats.active++;
        break;
      case TreatmentStatus.Pending:
        stats.pending++;
        break;
    }
  });

  return stats;
}

/**
 * Calculates readmission rate
 */
function calculateReadmissionRate(treatments: KipuTreatment[]): number {
  const readmissions = treatments.filter(t => t.is_readmission).length;
  return treatments.length > 0 ? (readmissions / treatments.length) * 100 : 0;
}

/**
 * Calculates average length of stay (in days) with detailed validation
 */
function calculateAverageLOS(treatments: KipuTreatment[]): {
  averageLOS: number;
  dischargedCount: number;
  totalDays: number;
} {
  if (!Array.isArray(treatments) || treatments.length === 0) {
    console.log('[TreatmentStats] No treatment data available for LOS calculation.');
    return { averageLOS: 0, dischargedCount: 0, totalDays: 0 };
  }

  let totalDays = 0;
  let dischargedCount = 0;

  treatments.forEach(treatment => {
    const admissionDateStr = treatment.admission_date;
    const dischargeDateStr = treatment.discharge_date;

    if (admissionDateStr && dischargeDateStr) {
      try {
        const admissionDate = new Date(admissionDateStr);
        const dischargeDate = new Date(dischargeDateStr);

        if (!isNaN(admissionDate.getTime()) && !isNaN(dischargeDate.getTime()) && dischargeDate >= admissionDate) {
          const differenceInTime = dischargeDate.getTime() - admissionDate.getTime();
          if (differenceInTime >= 0) {
            const differenceInDays = Math.ceil(differenceInTime / (1000 * 60 * 60 * 24));
            totalDays += differenceInDays;
            dischargedCount++;
          } else {
            console.warn(`[TreatmentStats] Discharge date is before admission date for treatment:`, treatment.id);
          }
        } else {
          console.warn(`[TreatmentStats] Invalid date format or illogical dates for treatment:`, treatment.id);
        }
      } catch (error) {
        console.error(`[TreatmentStats] Error parsing dates for treatment:`, treatment.id, error);
      }
    }
  });

  const averageLOS = dischargedCount > 0 ? totalDays / dischargedCount : 0;
  console.log(`[TreatmentStats] Calculated Average LOS: ${averageLOS.toFixed(1)} days across ${dischargedCount} discharged patients.`);
  
  return { averageLOS, dischargedCount, totalDays };
}

/**
 * Gets treatment statistics for a facility
 */
export async function getTreatmentStatistics(
  credentials: KipuCredentials,
  facilityId: string,
  dateRange: DateRange
) {
  try {
    // Fetch treatment data for each time period
    const [dailyData, weeklyData, monthlyData] = await Promise.all([
      fetchTreatmentData(credentials, facilityId, dateRange.daily.start, dateRange.daily.end),
      fetchTreatmentData(credentials, facilityId, dateRange.weekly.start, dateRange.weekly.end),
      fetchTreatmentData(credentials, facilityId, dateRange.monthly.start, dateRange.monthly.end)
    ]);

    if (!dailyData?.data || !weeklyData?.data || !monthlyData?.data) {
      throw new Error('Failed to fetch treatment data');
    }

    // Calculate basic metrics
    const [dailyStats, weeklyStats, monthlyStats] = await Promise.all([
      calculateTreatmentCompletion(dailyData.data),
      calculateTreatmentCompletion(weeklyData.data),
      calculateTreatmentCompletion(monthlyData.data)
    ]);

    const [dailyLOS, weeklyLOS, monthlyLOS] = [
      calculateAverageLOS(dailyData.data),
      calculateAverageLOS(weeklyData.data),
      calculateAverageLOS(monthlyData.data)
    ];

    return {
      daily: {
        ...dailyStats,
        readmissionRate: calculateReadmissionRate(dailyData.data),
        los: dailyLOS
      },
      weekly: {
        ...weeklyStats,
        readmissionRate: calculateReadmissionRate(weeklyData.data),
        los: weeklyLOS
      },
      monthly: {
        ...monthlyStats,
        readmissionRate: calculateReadmissionRate(monthlyData.data),
        los: monthlyLOS
      }
    };
  } catch (error) {
    console.error('Error calculating treatment statistics:', error);
    throw error;
  }
}

// Commented out complex metrics that require additional computation or data sources
/*
export async function calculateComplexMetrics(
  credentials: KipuCredentials,
  facilityId: string,
  dateRange: DateRange
) {
  // Treatment success rate (requires outcome data)
  // Patient satisfaction scores (requires survey data)
  // Treatment plan adherence (requires detailed progress notes)
  // Cost per successful treatment (requires financial data)
  // Risk-adjusted outcomes (requires detailed clinical data)
  // Predictive readmission risk (requires ML model)
}
*/