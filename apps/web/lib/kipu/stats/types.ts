// lib/kipu/stats/types.ts

export interface KipuPatientData {
    patients: Array<any>;
    pagination?: any;
  }


/**
 * Date range structure for time-based statistics
 */

export interface DateRange {
    daily: {
      start: string;
      end: string;
    };
    weekly: {
      start: string;
      end: string;
    };
    monthly: {
      start: string;
      end: string;
    };
  }
  
  /**
   * Patient census statistics
   */
  export interface CensusStatistics {
    current_count: number;
    admissions_daily: number;
    admissions_weekly: number;
    admissions_monthly: number;
    discharges_daily: number;
    discharges_weekly: number;
    discharges_monthly: number;
    avg_length_of_stay: number;
  }
  
  /**
   * Demographic statistics
   */
  export interface DemographicStatistics {
    age_distribution: Record<string, number>;
    gender_distribution: Record<string, number>;
    insurance_distribution: Record<string, number>;
  }
  
  /**
   * Clinical statistics
   */
  export interface ClinicalStatistics {
    diagnosis_distribution: Record<string, number>;
    medication_adherence_rate: number;
    treatment_completion_rate: number;
  }
  
  /**
   * Bed utilization statistics
   */
  export interface BedUtilizationStatistics {
    occupancy_rate: number;
    available_beds: number;
    reserved_beds: number;
    projected_availability: {
      "7_days": number;
      "14_days": number;
      "30_days": number;
    };
  }
  
  /**
   * Complete patient statistics
   */
  export interface PatientStatistics {
    census: CensusStatistics;
    demographics: DemographicStatistics;
    clinical: ClinicalStatistics;
    bed_utilization: BedUtilizationStatistics;
  }
  
  /**
   * Operational statistics
   */
  export interface OperationalStatistics {
    staff_utilization: {
      clinician_patient_ratio: number;
      avg_patients_per_provider: Record<string, number>;
      staff_availability: Record<string, number>;
    };
    resource_utilization: {
      therapy_room_usage: number;
      group_session_attendance: number;
      assessment_completion_rate: number;
    };
    financial_metrics: {
      avg_daily_revenue: number;
      insurance_claim_status: Record<string, number>;
      outstanding_balances: number;
    };
  }
  
  /**
   * Outcome statistics
   */
  export interface OutcomeStatistics {
    treatment_outcomes: {
      completion_rate: number;
      early_discharge_rate: number;
      readmission_rate: number;
    };
    clinical_outcomes: {
      symptom_reduction: Record<string, number>;
      functional_improvement: Record<string, number>;
      patient_satisfaction: number;
    };
    follow_up_metrics: {
      aftercare_attendance: number;
      medication_compliance: number;
      recovery_maintenance: number;
    };
  }
  
  /**
   * Complete facility statistics
   */
  export interface FacilityStatistics {
    patient: PatientStatistics;
    operational: OperationalStatistics;
    outcomes: OutcomeStatistics;
    treatment: TreatmentStatistics;
    last_updated: string;
  }
  
  /**
   * Filter options for statistics queries
   */
  export interface StatisticsFilter {
    facilityId?: string;
    startDate?: string;
    endDate?: string;
    patientStatus?: string[];
    diagnosisTypes?: string[];
    insuranceTypes?: string[];
    ageGroups?: string[];
    genders?: string[];
  }
  
  /**
   * API response for statistics endpoints
   */
  export interface StatisticsResponse<T> {
    success: boolean;
    data?: T;
    error?: {
      code: string;
      message: string;
      details?: any;
    };
    metadata?: {
      query_time: string;
      data_freshness: string;
    };
  }

  // Only add these new interfaces to the file

export interface StaffStatistics {
  staffing_levels: {
    by_role: Record<string, number>;
    by_shift: Record<string, number>;
    staff_to_patient_ratios: Record<string, number>;
  };
  staff_activity: {
    direct_care_time: Record<string, number>;
    documentation_time: Record<string, number>;
    session_completion_rate: number;
  };
  staff_performance: {
    productivity_metrics: Record<string, number>;
    quality_metrics: Record<string, number>;
    certification_compliance: Record<string, number>;
  };
}

export interface TreatmentStatistics {
  treatment_duration: {
    avg_length_of_stay: number;
    duration_by_diagnosis: Record<string, number>;
    duration_by_program: Record<string, number>;
  };
  level_of_care: {
    distribution: Record<string, number>;
    transitions: Record<string, Record<string, number>>;
    avg_time_in_level: Record<string, number>;
  };
  treatment_plan: {
    goal_completion_rate: number;
    intervention_usage: Record<string, number>;
    plan_adherence: number;
  };
}

// Update the FacilityStatistics interface to include the new types
// Make sure this matches the existing structure
export interface FacilityStatistics {
  patient: PatientStatistics;
  operational: OperationalStatistics;

  treatment: TreatmentStatistics;
  outcomes: OutcomeStatistics;
  last_updated: string;
}