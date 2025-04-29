import { ComplianceProtocol } from '../evaluation';

// Request Types
export interface CreateProtocolRequest {
  name: string;
  description?: string;
  admissionEvaluations: number[];
  dailyEvaluations: number[];
  cyclicEvaluations: Array<{
    evaluationId: number;
    frequency: number;
  }>;
  cycleLength: number;
}

export interface UpdateProtocolRequest extends Partial<CreateProtocolRequest> {
  isActive?: boolean;
}

// Response Types
export interface ProtocolResponse {
  success: boolean;
  data?: ComplianceProtocol;
  error?: string;
}

export interface ProtocolsResponse {
  success: boolean;
  data?: ComplianceProtocol[];
  error?: string;
}

// Query Parameters
export interface ProtocolQueryParams {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
} 