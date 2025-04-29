import { Database } from '~/types/supabase';

// Base types for common fields
interface BaseRecord {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

// Patient types
export interface Patient extends BaseRecord {
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string | null;
  admission_date: string | null;
  discharge_date: string | null;
  status: 'active' | 'discharged' | 'transferred';
}

// Evaluation types
export interface Evaluation extends BaseRecord {
  name: string;
  description: string | null;
  category: string;
  is_active: boolean;
}

// Compliance Protocol types
export interface CyclicEvaluation {
  evaluation_id: string;
  frequency: number;
}

export interface ComplianceProtocol extends BaseRecord {
  name: string;
  description: string | null;
  admission_evaluations: string[];
  daily_evaluations: string[];
  cyclic_evaluations: CyclicEvaluation[];
  cycle_length: number;
  is_active: boolean;
}

// Compliance Record types
export type EvaluationType = 'admission' | 'daily' | 'cyclic';
export type ComplianceStatus = 'pending' | 'completed' | 'missed' | 'rescheduled';

export interface PatientComplianceRecord extends BaseRecord {
  patient_id: string;
  protocol_id: string;
  evaluation_id: string;
  evaluation_type: EvaluationType;
  expected_date: string;
  completed_date: string | null;
  status: ComplianceStatus;
  cycle_number: number | null;
}

// Facility Metrics types
export interface FacilityComplianceMetrics extends BaseRecord {
  date: string;
  protocol_id: string;
  total_patients: number;
  total_evaluations: number;
  completed_evaluations: number;
  missed_evaluations: number;
  pending_evaluations: number;
  average_completion_time: string | null;
  compliance_rate: number;
}

// API Response types
export interface ComplianceMetricsResponse {
  success: boolean;
  data?: {
    currentMetrics: FacilityComplianceMetrics;
    historicalMetrics: FacilityComplianceMetrics[];
    patientCompliance: PatientComplianceRecord[];
  };
  error?: string;
}

// Query parameter types
export interface ComplianceMetricsQueryParams {
  startDate?: string;
  endDate?: string;
  protocolId?: string;
  patientId?: string;
  status?: ComplianceStatus;
} 