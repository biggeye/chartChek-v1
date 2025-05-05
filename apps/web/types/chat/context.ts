export interface PatientAdmissionDetails {
  date: string;
  levelOfCare: string;
  nextLevelOfCare?: string;
  nextLevelOfCareDate?: string;
  program: string;
}

export interface PatientLocation {
  building?: string;
  room?: string;
  bed?: string;
}

export interface PatientInsurance {
  provider: string;
  plans: string[];
}

export interface PatientClinicalInfo {
  dischargeType?: string;
  sobrietyDate?: string;
  patientStatuses: string[];
  patientContacts: string[];
}

export interface PatientContext {
  patientId: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  status?: string;
  mrn?: string;
  admissionDetails: PatientAdmissionDetails;
  location: PatientLocation;
  insurance: PatientInsurance;
  clinicalInfo: PatientClinicalInfo;
}

export interface ChatContext {
  patient?: PatientContext;
  // We can add other context types here later (facility, provider, etc.)
} 