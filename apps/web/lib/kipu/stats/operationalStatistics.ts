// lib/kipu/stats/operationalStatistics.ts
import { KipuCredentials } from 'types/kipu/kipuAdapter';
import { 
  KipuApiResponse,
  KipuStaffMember,
  KipuResource,
  StaffStatus,
  RoleType,
  ResourceType,
  DateRange
} from './types';
import { kipuServerGet } from '../auth/server';

/**
 * Fetches staff data from KIPU API
 */
async function fetchStaffData(
  credentials: KipuCredentials,
  facilityId: string,
  startDate: string,
  endDate: string
): Promise<KipuApiResponse<KipuStaffMember[]> | null> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      location_id: facilityId,
      start_date: startDate,
      end_date: endDate
    }).toString();
    
    const endpoint = `/api/staff?${queryParams}`;
    const response = await kipuServerGet(endpoint, credentials);
    return response as KipuApiResponse<KipuStaffMember[]>;
  } catch (error) {
    console.error('Error fetching staff data:', error);
    return null;
  }
}

/**
 * Fetches resource utilization data from KIPU API
 */
async function fetchResourceData(
  credentials: KipuCredentials,
  facilityId: string,
  startDate: string,
  endDate: string
): Promise<KipuApiResponse<KipuResource[]> | null> {
  try {
    const queryParams = new URLSearchParams({
      app_id: credentials.appId,
      location_id: facilityId,
      start_date: startDate,
      end_date: endDate
    }).toString();
    
    const endpoint = `/api/resources?${queryParams}`;
    const response = await kipuServerGet(endpoint, credentials);
    return response as KipuApiResponse<KipuResource[]>;
  } catch (error) {
    console.error('Error fetching resource data:', error);
    return null;
  }
}

/**
 * Calculates staff availability metrics
 */
function calculateStaffAvailability(staff: KipuStaffMember[]): {
  available: number;
  unavailable: number;
  onLeave: number;
} {
  const stats = {
    available: 0,
    unavailable: 0,
    onLeave: 0
  };

  staff.forEach(member => {
    switch (member.status) {
      case StaffStatus.Available:
        stats.available++;
        break;
      case StaffStatus.Unavailable:
        stats.unavailable++;
        break;
      case StaffStatus.OnLeave:
        stats.onLeave++;
        break;
    }
  });

  return stats;
}

/**
 * Calculates resource utilization rate
 */
function calculateResourceUtilization(resources: KipuResource[]): Record<ResourceType, number> {
  const utilization: Record<ResourceType, number> = {
    [ResourceType.TherapyRoom]: 0,
    [ResourceType.GroupRoom]: 0,
    [ResourceType.Office]: 0
  };

  const resourceCounts: Record<ResourceType, number> = {
    [ResourceType.TherapyRoom]: 0,
    [ResourceType.GroupRoom]: 0,
    [ResourceType.Office]: 0
  };

  resources.forEach(resource => {
    if (resource.scheduled_minutes && resource.available_minutes) {
      utilization[resource.type] += (resource.scheduled_minutes / resource.available_minutes) * 100;
      resourceCounts[resource.type]++;
    }
  });

  // Calculate averages
  Object.keys(utilization).forEach(type => {
    const count = resourceCounts[type as ResourceType];
    if (count > 0) {
      utilization[type as ResourceType] /= count;
    }
  });

  return utilization;
}

/**
 * Gets operational statistics for a facility
 */
export async function getOperationalStatistics(
  credentials: KipuCredentials,
  facilityId: string,
  dateRange: DateRange
) {
  try {
    // Fetch operational data for each time period
    const [
      dailyStaffData,
      weeklyStaffData,
      monthlyStaffData,
      dailyResourceData,
      weeklyResourceData,
      monthlyResourceData
    ] = await Promise.all([
      fetchStaffData(credentials, facilityId, dateRange.daily.start, dateRange.daily.end),
      fetchStaffData(credentials, facilityId, dateRange.weekly.start, dateRange.weekly.end),
      fetchStaffData(credentials, facilityId, dateRange.monthly.start, dateRange.monthly.end),
      fetchResourceData(credentials, facilityId, dateRange.daily.start, dateRange.daily.end),
      fetchResourceData(credentials, facilityId, dateRange.weekly.start, dateRange.weekly.end),
      fetchResourceData(credentials, facilityId, dateRange.monthly.start, dateRange.monthly.end)
    ]);

    if (!dailyStaffData?.data || !weeklyStaffData?.data || !monthlyStaffData?.data ||
        !dailyResourceData?.data || !weeklyResourceData?.data || !monthlyResourceData?.data) {
      throw new Error('Failed to fetch operational data');
    }

    return {
      daily: {
        staffAvailability: calculateStaffAvailability(dailyStaffData.data),
        resourceUtilization: calculateResourceUtilization(dailyResourceData.data)
      },
      weekly: {
        staffAvailability: calculateStaffAvailability(weeklyStaffData.data),
        resourceUtilization: calculateResourceUtilization(weeklyResourceData.data)
      },
      monthly: {
        staffAvailability: calculateStaffAvailability(monthlyStaffData.data),
        resourceUtilization: calculateResourceUtilization(monthlyResourceData.data)
      }
    };
  } catch (error) {
    console.error('Error calculating operational statistics:', error);
    throw error;
  }
}

// Commented out complex metrics that require additional data sources or computation
/*
export async function calculateComplexOperationalMetrics(
  credentials: KipuCredentials,
  facilityId: string,
  dateRange: DateRange
) {
  // Staff efficiency metrics (requires detailed time tracking)
  // Resource scheduling optimization (requires historical booking data)
  // Cost per service metrics (requires financial data)
  // Staff-to-patient ratios (requires real-time census data)
  // Equipment utilization rates (requires asset management data)
  // Facility maintenance metrics (requires maintenance records)
}
*/