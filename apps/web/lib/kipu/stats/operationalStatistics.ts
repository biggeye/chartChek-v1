// lib/kipu/stats/operationalStatistics.ts
import { KipuCredentials } from '~/types/kipu/kipuAdapter';
import { OperationalStatistics } from './types';
import { kipuServerGet } from '../auth/server';

interface KipuStaffData {
  staff: Array<any>;
  pagination?: any;
}

interface KipuResourceData {
  resources: Array<any>;
  sessions: Array<any>;
  assessments: Array<any>;
  pagination?: any;
}

interface KipuFinancialData {
  revenue: Array<any>;
  claims: Array<any>;
  balances: Array<any>;
  pagination?: any;
}

/**
 * Calculates operational statistics from KIPU API data
 * @param credentials KIPU API credentials
 * @param facilityId Facility ID to get statistics for
 * @returns Promise resolving to operational statistics
 */
export async function calculateOperationalStatistics(
  credentials: KipuCredentials,
  facilityId: string
): Promise<OperationalStatistics> {
  try {
    // Fetch required data from KIPU API
    const [staffData, resourceData, financialData] = await Promise.all([
      fetchStaffUtilizationData(credentials, facilityId),
      fetchResourceUtilizationData(credentials, facilityId),
      fetchFinancialMetricsData(credentials, facilityId)
    ]);

    return {
      staff_utilization: {
        clinician_patient_ratio: calculateClinicianPatientRatio(staffData),
        avg_patients_per_provider: calculatePatientsPerProvider(staffData),
        staff_availability: calculateStaffAvailability(staffData)
      },
      resource_utilization: {
        therapy_room_usage: calculateTherapyRoomUsage(resourceData),
        group_session_attendance: calculateGroupSessionAttendance(resourceData),
        assessment_completion_rate: calculateAssessmentCompletionRate(resourceData)
      },
      financial_metrics: {
        avg_daily_revenue: calculateAvgDailyRevenue(financialData),
        insurance_claim_status: calculateInsuranceClaimStatus(financialData),
        outstanding_balances: calculateOutstandingBalances(financialData)
      }
    };
  } catch (error) {
    console.error('Error calculating operational statistics:', error);
    return getDefaultOperationalStatistics();
  }
}

/**
 * Fetches staff utilization data from KIPU API
 */
async function fetchStaffUtilizationData(
  credentials: KipuCredentials,
  facilityId: string
): Promise<KipuStaffData | null> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      location_id: facilityId
    }).toString();
    
    const endpoint = `/api/staff?${queryParams}`;
    const response = await kipuServerGet(endpoint, credentials);
    return response.success ? (response.data as KipuStaffData) : null;
  } catch (error) {
    console.error('Error fetching staff utilization data:', error);
    return null;
  }
}

/**
 * Fetches resource utilization data from KIPU API
 */
async function fetchResourceUtilizationData(
  credentials: KipuCredentials,
  facilityId: string
): Promise<KipuResourceData | null> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      location_id: facilityId
    }).toString();
    
    const endpoint = `/api/resources?${queryParams}`;
    const response = await kipuServerGet(endpoint, credentials);
    return response.success ? (response.data as KipuResourceData) : null;
  } catch (error) {
    console.error('Error fetching resource utilization data:', error);
    return null;
  }
}

/**
 * Fetches financial metrics data from KIPU API
 */
async function fetchFinancialMetricsData(
  credentials: KipuCredentials,
  facilityId: string
): Promise<KipuFinancialData | null> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      location_id: facilityId
    }).toString();
    
    const endpoint = `/api/financial?${queryParams}`;
    const response = await kipuServerGet(endpoint, credentials);
    return response.success ? (response.data as KipuFinancialData) : null;
  } catch (error) {
    console.error('Error fetching financial metrics data:', error);
    return null;
  }
}

/**
 * Calculates clinician-to-patient ratio
 */
function calculateClinicianPatientRatio(staffData: KipuStaffData | null): number {
  if (!staffData || !staffData.staff || staffData.staff.length === 0) {
    return 0;
  }
  
  // Filter for clinical staff
  const clinicians = staffData.staff.filter(
    staff => staff.role_type === 'clinical'
  );
  
  if (clinicians.length === 0) {
    return 0;
  }
  
  // Sum up all patients assigned to clinicians
  const totalPatients = clinicians.reduce((sum, clinician) => {
    return sum + (clinician.assigned_patients?.length || 0);
  }, 0);
  
  return totalPatients / clinicians.length;
}

/**
 * Calculates average patients per provider type
 */
function calculatePatientsPerProvider(staffData: KipuStaffData | null): Record<string, number> {
  if (!staffData || !staffData.staff || staffData.staff.length === 0) {
    return {};
  }
  
  // Group staff by provider type
  const staffByType: Record<string, any[]> = {};
  
  staffData.staff.forEach(staff => {
    const type = staff.provider_type || 'unknown';
    if (!staffByType[type]) {
      staffByType[type] = [];
    }
    staffByType[type].push(staff);
  });
  
  // Calculate average patients per provider type
  const patientsPerProvider: Record<string, number> = {};
  
  Object.entries(staffByType).forEach(([type, providers]) => {
    const totalPatients = providers.reduce((sum, provider) => {
      return sum + (provider.assigned_patients?.length || 0);
    }, 0);
    
    patientsPerProvider[type] = totalPatients / providers.length;
  });
  
  return patientsPerProvider;
}

/**
 * Calculates staff availability percentages
 */
function calculateStaffAvailability(staffData: KipuStaffData | null): Record<string, number> {
  if (!staffData || !staffData.staff || staffData.staff.length === 0) {
    return {};
  }
  
  // Group staff by role
  const staffByRole: Record<string, any[]> = {};
  
  staffData.staff.forEach(staff => {
    const role = staff.role || 'unknown';
    if (!staffByRole[role]) {
      staffByRole[role] = [];
    }
    staffByRole[role].push(staff);
  });
  
  // Calculate availability percentage by role
  const availabilityByRole: Record<string, number> = {};
  
  Object.entries(staffByRole).forEach(([role, staff]) => {
    const availableStaff = staff.filter(
      s => s.status === 'available'
    ).length;
    
    availabilityByRole[role] = (availableStaff / staff.length) * 100;
  });
  
  return availabilityByRole;
}

/**
 * Calculates therapy room usage percentage
 */
function calculateTherapyRoomUsage(resourceData: KipuResourceData | null): number {
  if (!resourceData || !resourceData.resources || resourceData.resources.length === 0) {
    return 0;
  }
  
  // Filter for therapy rooms
  const therapyRooms = resourceData.resources.filter(
    r => r.type === 'therapy_room'
  );
  
  if (therapyRooms.length === 0) {
    return 0;
  }
  
  // Calculate usage based on scheduled time vs. available time
  const totalScheduledMinutes = therapyRooms.reduce((sum, room) => {
    return sum + (room.scheduled_minutes || 0);
  }, 0);
  
  const totalAvailableMinutes = therapyRooms.reduce((sum, room) => {
    return sum + (room.available_minutes || 0);
  }, 0);
  
  return totalAvailableMinutes > 0 
    ? (totalScheduledMinutes / totalAvailableMinutes) * 100 
    : 0;
}

/**
 * Calculates group session attendance rate
 */
function calculateGroupSessionAttendance(resourceData: KipuResourceData | null): number {
  if (!resourceData || !resourceData.sessions || resourceData.sessions.length === 0) {
    return 0;
  }
  
  // Filter for group sessions
  const groupSessions = resourceData.sessions.filter(
    s => s.type === 'group'
  );
  
  if (groupSessions.length === 0) {
    return 0;
  }
  
  // Calculate attendance rate
  const totalAttendees = groupSessions.reduce((sum, session) => {
    return sum + (session.attendees?.length || 0);
  }, 0);
  
  const totalCapacity = groupSessions.reduce((sum, session) => {
    return sum + (session.capacity || 0);
  }, 0);
  
  return totalCapacity > 0 
    ? (totalAttendees / totalCapacity) * 100 
    : 0;
}

/**
 * Calculates assessment completion rate
 */
function calculateAssessmentCompletionRate(resourceData: KipuResourceData | null): number {
  if (!resourceData || !resourceData.assessments || resourceData.assessments.length === 0) {
    return 0;
  }
  
  const completedAssessments = resourceData.assessments.filter(
    a => a.status === 'completed'
  ).length;
  
  return (completedAssessments / resourceData.assessments.length) * 100;
}

/**
 * Calculates average daily revenue
 */
function calculateAvgDailyRevenue(financialData: KipuFinancialData | null): number {
  if (!financialData || !financialData.revenue || financialData.revenue.length === 0) {
    return 0;
  }
  
  const totalRevenue = financialData.revenue.reduce((sum, entry) => {
    return sum + (Number(entry.amount) || 0);
  }, 0);
  
  // Assuming revenue data is for a specific period
  const uniqueDays = new Set(
    financialData.revenue.map(entry => entry.date.split('T')[0])
  ).size;
  
  return uniqueDays > 0 
    ? totalRevenue / uniqueDays 
    : 0;
}

/**
 * Calculates insurance claim status breakdown
 */
function calculateInsuranceClaimStatus(financialData: KipuFinancialData | null): Record<string, number> {
  if (!financialData || !financialData.claims || financialData.claims.length === 0) {
    return {};
  }
  
  // Count claims by status
  const claimsByStatus: Record<string, number> = {};
  
  financialData.claims.forEach(claim => {
    const status = claim.status || 'unknown';
    if (!claimsByStatus[status]) {
      claimsByStatus[status] = 0;
    }
    claimsByStatus[status]++;
  });
  
  return claimsByStatus;
}

/**
 * Calculates total outstanding balances
 */
function calculateOutstandingBalances(financialData: KipuFinancialData | null): number {
  if (!financialData || !financialData.balances || financialData.balances.length === 0) {
    return 0;
  }
  
  return financialData.balances.reduce((sum, balance) => {
    return sum + (Number(balance.outstanding_amount) || 0);
  }, 0);
}

/**
 * Returns default operational statistics when data cannot be fetched
 */
function getDefaultOperationalStatistics(): OperationalStatistics {
  return {
    staff_utilization: {
      clinician_patient_ratio: 0,
      avg_patients_per_provider: {},
      staff_availability: {}
    },
    resource_utilization: {
      therapy_room_usage: 0,
      group_session_attendance: 0,
      assessment_completion_rate: 0
    },
    financial_metrics: {
      avg_daily_revenue: 0,
      insurance_claim_status: {},
      outstanding_balances: 0
    }
  };
}