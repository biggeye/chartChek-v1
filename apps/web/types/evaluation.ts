export type EvaluationCategory =
  | 'Assessments'
  | 'Screenings'
  | 'TreatmentPlans'
  | 'ConsentForms'
  | 'AdministrativeForms'
  | 'Medical'
  | 'Other'
  | 'Uncategorized';

export type CategoryColor = {
  bg: string;
  text: string;
  border: string;
  bgHover: string;
  textHover: string;
};

export const CATEGORY_COLORS: Record<EvaluationCategory, CategoryColor> = {
  'Assessments': {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    bgHover: 'hover:bg-blue-100',
    textHover: 'hover:text-blue-800'
  },
  'Screenings': {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    bgHover: 'hover:bg-green-100',
    textHover: 'hover:text-green-800'
  },
  'TreatmentPlans': {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    bgHover: 'hover:bg-purple-100',
    textHover: 'hover:text-purple-800'
  },
  'ConsentForms': {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    bgHover: 'hover:bg-orange-100',
    textHover: 'hover:text-orange-800'
  },
  'AdministrativeForms': {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    bgHover: 'hover:bg-gray-100',
    textHover: 'hover:text-gray-800'
  },
  'Medical': {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    bgHover: 'hover:bg-red-100',
    textHover: 'hover:text-red-800'
  },
  'Other': {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    bgHover: 'hover:bg-yellow-100',
    textHover: 'hover:text-yellow-800'
  },
  'Uncategorized': {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    bgHover: 'hover:bg-gray-100',
    textHover: 'hover:text-gray-800'
  }
} as const;

export const getCategoryColors = (category: string | undefined): CategoryColor => {
  const defaultColors = CATEGORY_COLORS['Uncategorized'];
  const categoryColors = category ? CATEGORY_COLORS[category as EvaluationCategory] : null;
  return (categoryColors || defaultColors) as CategoryColor;
};

// --- NEW: Normalized Protocol Types ---
export type RequirementType = 'admission' | 'daily' | 'cyclic';

export interface ProtocolRequirement {
  protocol_id: string;
  evaluation_id: number;
  requirement: RequirementType;
}

export interface ComplianceProtocol {
  id: string;
  name: string;
  description?: string;
  cycleLength: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  requirements: ProtocolRequirement[];
}

export interface EvaluationTemplate {
  id: number;
  name: string;
  enabled: boolean;
  patient_process_id: number;
  category?: string;
  default_due_offset?: string;
  created_at?: string;
  updated_at?: string;
}