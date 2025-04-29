export interface ProtocolEvaluation {
  id: number;
  name: string;
  category: string;
  dueDate?: string;
  description?: string;
}

export interface ComplianceProtocol {
  id: string;
  name: string;
  description?: string;
  evaluations: ProtocolEvaluation[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
} 