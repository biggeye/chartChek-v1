
/**
 * KIPU API Credentials
 */
export interface KipuCredentials {
    username?: string;
    accessId: string;
    secretKey: string;
    appId: string; // Also referred to as recipient_id
    baseUrl: string;
    apiEndpoint?: string; // For direct API calls
  }
  
  /**
   * Application Credentials (placeholder)
   */
  export interface Credentials {
    username: string;
    accessId: string;
    secretKey: string;
    appId: string;
    baseUrl: string;
    apiEndpoint?: string;
  }
  
  /**
   * KIPU API Response
   */
  export interface KipuApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
      code: string;
      message: string;
      details?: any;
    };
  }
  
  /**
   * Application API Response (placeholder)
   */
  export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
      code: string;
      message: string;
      details?: any;
    };
  }
  
  /**
   * Casefile type from KIPU EMR
   */
  export type Casefile = string; // Format: ^[0-9]+\:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$
  
  /**
   * Raw KIPU Patient data as returned by the API
   */
  export interface KipuPatient {
    id: string;
    mrn?: string;
    first_name: string;
    last_name: string;
    date_of_birth?: string;
    gender?: string;
    status?: string;
    admission_date?: string;
    discharge_date?: string;
    facility_id?: string;
    // Add more fields as needed based on the API documentation
  }
  
  /**
   * Application Patient (transformed from KipuPatient)
   */
  export interface Patient {
    id: string;
    mrn?: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: string;
    status?: string;
    admissionDate?: string;
    dischargeDate?: string;
    facilityId?: string;
  }
  
  /**
   * Raw Patient Basic Information from KIPU API
   */
  export interface KipuPatientBasicInfo {
    id?: string;
    casefile_id: Casefile;
    first_name: string;
    middle_name?: string;
    last_name: string;
    dob: string;
    admission_date: string;
    discharge_date: string;
    mr_number: string;
    gender?: string;
    contact?: {
      email?: string;
      phone?: string;
    };
    email?: string;
    phone?: string;
  }
  
  /**
   * Application-specific Patient Basic Information
   */
  export interface PatientBasicInfo {
    patientId: string;
    mrn?: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: string;
    status?: string;
    admissionDate?: string;
    dischargeDate?: string;
    facilityId: number;
    fullName?: string;
    age?: number;
    roomNumber?: string;
    primaryDiagnosis?: string;
    insuranceProvider?: string;
    dischargeType: string;
    sobrietyDate: string;
    insurances: object[];
    patient_statuses: object[];
    patient_contacts: object[];
    levelOfCare: string;
    nextLevelOfCare: string;
    nextLevelOfCareDate: string;
    program: string;
    bedName: string;
    roomName: string;
    buildingName: string;
    locationName: string;
  }
  
  /**
   * Raw KIPU Patient Appointment data as returned by the API
   */
  export interface KipuPatientAppointment {
    id: number;
    start_time: string;
    end_time: string;
    subject: string;
    appointment_type: string;
    status: string;
    billable: boolean;
    all_day: boolean;
    recurring: boolean;
    upcoming_dates?: string[];
    patient_id: string;
    provider_name?: string;
    location?: string;
    notes?: string;
  }
  
  /**
   * Application-specific Patient Appointment
   */
  export interface PatientAppointment {
    id: string;
    patientId: string;
    facilityId: number;
    title: string;
    startTime: string;
    endTime: string;
    status: string;
    type: string;
    provider?: string;
    providerName?: string;
    location?: string;
    notes?: string;
    appointmentType?: string;
    patient_id?: string | number;
  }
  
  
  /**
   * Raw KIPU Vital Sign data as returned by the API
   */
  export interface KipuVitalSign {
    id: string | number;
    patient_id: number;
    type: string;
    value: string | number;
    interval_timestamp: string;
    unit?: string;
    notes?: string;
    blood_pressure_systolic?: number;
    blood_pressure_diastolic?: number;
    temperature?: number;
    pulse?: number;
    respirations?: number;
    o2_saturation?: number;
    user_name?: string;
  }
  
  /**
   * Application-specific Patient Vital Sign
   */
  export interface PatientVitalSign {
    id: string | number;
    patientId: string;
    patient_id?: number;
    facilityId?: string;
    recordedAt: string;
    recordedBy?: string;
    interval_timestamp?: string;
    type: string;
    value: string | number;
    unit?: string;
    notes?: string;
    blood_pressure_systolic?: number;
    blood_pressure_diastolic?: number;
    temperature?: number;
    pulse?: number;
    respirations?: number;
    o2_saturation?: number;
    user_name?: string;
  }
  
  /**
   * Raw KIPU Paginated Patients Response
   */
  export interface KipuPaginatedPatientsResponse {
    patients: KipuPatientBasicInfo[];
    pagination: {
      current_page: number;
      total_pages: number;
      records_per_page: number;
      total_records: number;
    };
  }
  
  /**
   * Application-specific Paginated Patients Response
   */
  export interface PaginatedPatientsResponse {
    patients: PatientBasicInfo[];
    pagination: {
      currentPage: number;
      totalPages: number;
      recordsPerPage: number;
      totalRecords: number;
    };
  }
  
  /**
   * Raw KIPU Location data as returned by the API
   */
  export interface KipuLocation {
    id: string;
    name: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
    };
  }
  
  /**
   * Application-specific Facility (corresponds to KIPU Location)
   */
  export interface Facility {
    id: number;
    name: string;
    code?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
    status?: 'active' | 'inactive';
    created_at?: string;
    updated_at?: string;
    buildings?: Building[];
    data?: FacilityData;
    api_settings?: FacilityApiSettingsDisplay;
    enabled?: boolean;
  }
  
  
  
  /**
   * Raw KIPU Document data as returned by the API
   */
  export interface KipuDocument {
    id: string;
    patient_id: string;
    facility_id?: string;
    document_type: string;
    created_date: string;
    file_name: string;
    file_size?: number;
    mime_type?: string;
    url?: string;
  }
  
  /**
   * Application-specific Document
   */
  export interface Document {
    id: string;
    patientId: string;
    facilityId?: string;
    documentType: string;
    createdDate: string;
    fileName: string;
    fileSize?: number;
    mimeType?: string;
    url?: string;
  }
  
  /**
   * Facility API Settings
   * 
   * Represents the API settings for a facility, including credentials for KIPU integration.
   * Corresponds to the facility_api_settings table in Supabase.
   */
  export interface FacilityApiSettings {
    id?: number | string;
    facility_id: string;
    kipu_access_id?: string;
    kipu_secret_key?: string;
    kipu_app_id?: string;
    kipu_base_url?: string;
    has_api_key_configured: boolean;
    created_at?: string;
    updated_at?: string;
  }
  
  /**
   * Simplified Facility API Settings for UI display
   * 
   * A subset of FacilityApiSettings used for display in the UI
   */
  export interface FacilityApiSettingsDisplay {
    has_api_key_configured: boolean;
    updated_at?: string;
  }
  
  /**
   * Building within a Facility
   */
  export interface Building {
    id: string;
    name: string;
    code?: string;
    address?: string;
    status?: 'active' | 'inactive';
    facility_id: number;
  }
  
  /**
   * Raw KIPU Patient Order data as returned by the API
   */
  export interface KipuPatientOrder {
    id: number;
    name: string;
    medication: string;
    route: string;
    dosage_form: string;
    dispense_amount: string;
    refills: number;
    justification: string;
    no_substitutions: boolean;
    warnings: string;
    note: string;
    created_at: string;
    updated_at: string;
    mar_start_time: string;
    mar_end_time: string;
    user_name: string;
    user_id: number;
    discontinued: boolean;
    discontinue_reason: string;
    discontinued_timestamp: string;
    discontinued_user_name: string;
    discontinued_user_id: number;
    discontinue_physician_id: number;
    original_patient_order_id: number;
    instructed_by: string;
    ordered_by: string;
    instructed_via: string;
    medical_necessity_note: string;
    prn: boolean;
    erx: boolean;
    patient_id: number;
    canceled: boolean;
    canceled_timestamp: string;
    diagnosis_code: string;
    status: string;
    interaction_check_error: string;
    is_erx: boolean;
    is_prn: boolean;
    nurse_reviewed_by: string;
    nurse_reviewed_at: string;
    schedule_prn: boolean;
    fdb_data: KipuFdbData[];
  }
  
  /**
   * Application-specific Patient Order
   */
  export interface PatientOrder {
    id: number | string;
    name: string;
    medication: string;
    route: string;
    dosageForm: string;
    dispenseAmount: string;
    refills: number;
    justification: string;
    noSubstitutions: boolean;
    warnings: string;
    note: string;
    createdAt: string;
    updatedAt: string;
    marStartTime: string;
    marEndTime: string;
    userName: string;
    userId: number;
    discontinued: boolean;
    discontinueReason: string;
    discontinuedTimestamp: string;
    discontinuedUserName: string;
    discontinuedUserId: number;
    discontinuePhysicianId: number;
    originalPatientOrderId: number;
    instructedBy: string;
    orderedBy: string;
    instructedVia: string;
    medicalNecessityNote: string;
    prn: boolean;
    erx: boolean;
    patientId: number | string;
    canceled: boolean;
    canceledTimestamp: string;
    diagnosisCode: string;
    status: string;
    interactionCheckError: string;
    isErx: boolean;
    isPrn: boolean;
    nurseReviewedBy: string;
    nurseReviewedAt: string;
    schedulePrn: boolean;
    fdbData?: KipuFdbData[];
  }
  
  /**
   * Raw KIPU FDB Data for medication as returned by the API
   */
  export interface KipuFdbData {
    id: number;
    medication_id: number;
    rxcui: string;
    ndc: string;
  }
  
  /**
   * Application-specific FDB Data
   */
  export interface FdbData {
    id: number;
    medicationId: number;
    rxcui: string;
    ndc: string;
  }
  
  /**
   * Raw KIPU Patient Orders Paginated Response as returned by the API
   */
  export interface KipuPatientOrdersResponse {
    pagination: {
      current_page: string;
      total_pages: string;
      records_per_page: string;
      total_records: string;
    };
    patient_orders: KipuPatientOrder[];
  }
  
  /**
   * Application-specific Patient Orders Response
   */
  export interface PatientOrdersResponse {
    pagination: {
      currentPage: number;
      totalPages: number;
      recordsPerPage: number;
      totalRecords: number;
    };
    patientOrders: PatientOrder[];
  }
  
  /**
   * Raw KIPU Patient Order Detail Response as returned by the API
   * 
   * Response from the GET /patient_orders/{patient_order_id} endpoint
   * Contains detailed information about a specific patient order including schedules
   */
  export interface KipuPatientOrderDetailResponse {
    patient_order: KipuPatientOrder;
    schedules?: Array<{
      id: number;
      patient_order_id: number;
      day_of_week?: string;
      time_of_day?: string;
      frequency?: string;
      frequency_unit?: string;
      start_date?: string;
      end_date?: string;
      created_at: string;
      updated_at: string;
      status: string;
    }>;
  }
  
  /**
   * Application-specific Patient Order Detail Response
   */
  export interface PatientOrderDetailResponse {
    patientOrder: PatientOrder;
    schedules?: Array<{
      id: number;
      patientOrderId: number;
      dayOfWeek?: string;
      timeOfDay?: string;
      frequency?: string;
      frequencyUnit?: string;
      startDate?: string;
      endDate?: string;
      createdAt: string;
      updatedAt: string;
      status: string;
    }>;
  }
  
  /**
   * Raw KIPU Patient Order Query Parameters
   */
  export interface KipuPatientOrderQueryParams {
    page?: number;
    per?: number;
    status?: 'canceled' | 'pending_order_review' | 'pending_discontinue_review' | 'reviewed';
    medication_name?: string;
    created_at_start_date?: string;
    created_at_end_date?: string;
    updated_at_start_date?: string;
    updated_at_end_date?: string;
    rxcui?: string;
    ndc?: string;
    patient_master_id?: string;
  }
  
  /**
   * Application-specific Patient Order Query Parameters
   */
  export interface PatientOrderQueryParams {
    page?: number;
    per?: number;
    status?: 'canceled' | 'pending_order_review' | 'pending_discontinue_review' | 'reviewed';
    medication_name?: string;
    created_at_start_date?: string;
    created_at_end_date?: string;
    updated_at_start_date?: string;
    updated_at_end_date?: string;
    rxcui?: string;
    ndc?: string;
    patient_master_id?: string;
  }
  
  /**
   * Additional data associated with a Facility
   */
  export interface FacilityData {
    beds?: {
      total: number;
      available: number;
      occupied: number;
    };
    staff?: {
      total: number;
      active: number;
    };
    patients?: {
      total: number;
      admitted: number;
      discharged: number;
    };
    insights?: {
      occupancy_rate?: number;
      avg_length_of_stay?: number;
      readmission_rate?: number;
      [key: string]: any;
    };
    metrics?: Record<string, any>;
  }
  
  /**
   * Blood Pressure measurement
   */
  export interface BloodPressure {
    systolic: string;
    diastolic: string;
  }
  
  /**
   * Raw KIPU Consent Form Record Extended as returned by the API
   */
  export interface KipuConsentFormRecordExtended {
    id: number;
    patient_casefile_id: Casefile;
    consent_form_id: number;
    name: string;
    complete: boolean;
    expires: boolean;
    expired: boolean;
    expiration_date: string | null;
    error?: string;
    fields?: Record<string, any>;
    content?: Record<string, any>;
  }
  
  /**
   * Application-specific Consent Form Record
   */
  export interface ConsentFormRecordExtended {
    id: number;
    patient_casefile_id: Casefile;
    consent_form_id: number;
    name: string;
    complete: boolean;
    expires: boolean;
    expired: boolean;
    expiration_date: string | null;
    error?: string;
    fields?: Record<string, any>;
    content?: Record<string, any>;
  }
  
  /**
   * Settings Object
   */
  export interface SettingsObject {
    Id: number;
    Code: string;
    Name?: string;
  }
  
  /**
   * Raw KIPU Patient Appointments Response as returned by the API
   */
  export interface KipuPatientAppointmentsResponse {
    appointments?: Array<KipuPatientAppointment>;
    pagination?: {
      current_page: string;
      total_pages: string;
      records_per_page: string;
      total_records: string;
    };
  }
  
  /**
   * Application-specific Patient Appointments Response
   */
  export interface PatientAppointmentsResponse {
    appointments?: Array<PatientAppointment>;
    pagination?: {
      currentPage: number;
      totalPages: number;
      recordsPerPage: number;
      totalRecords: number;
    };
  }


export enum KipuFieldTypes {
attachments = "attachments",
auto_complete = "auto_complete",
care_team = "care_team",
care_team_Case_Manager = "care_team.Case_Manager",
care_team_Intake_Technician = "care_team.Intake_Technician",
care_team_Other_Case_Manager = "care_team.Other_Case_Manager",
care_team_Other_therapist = "care_team.Other_therapist",
care_team_Peer_Support = "care_team.Peer_Support",
care_team_Peer_Support_Specialist = "care_team.Peer_Support_Specialist",
care_team_Peer_Support_Specialist_Off_Day = "care_team.Peer_Support_Specialist_Off_Day",
care_team_Peer_Support_Specialist_Swing = "care_team.Peer_Support_Specialist_Swing",
care_team_Primary_Therapist = "care_team.Primary_Therapist",
care_team_intake_specialist = "care_team.intake_specialist",
conditional_question = "conditional_question",
create_evaluation = "create_evaluation",
check_box = "check_box",
checkbox = "checkbox",
datestamp = "datestamp",
drop_down_list = "drop_down_list",
evaluation_date = "evaluation_date",
evaluation_datetime = "evaluation_datetime",
evaluation_name = "evaluation_name",
evaluation_name_drop_down = "evaluation_name_drop_down",
evaluation_start_and_end_time = "evaluation_start_and_end_time",
formatted_text = "formatted_text",
golden_thread_tag = "golden_thread_tag",
image = "image",
image_with_canvas = "image_with_canvas",
matrix = "matrix",
patient_admission_datetime = "patient.admission_datetime",
patient_allergies = "patient.allergies",
patient_anticipated_discharge_date = "patient.anticipated_discharge_date",
patient_attendances = "patient.attendances",
patient_bed = "patient.bed",
patient_bmi = "patient.bmi",
patient_brought_in_medication = "patient.brought_in_medication",
patient_ciwa_ar = "patient.ciwa_ar",
patient_ciwa_ar_current = "patient.ciwa_ar_current",
patient_ciwa_b = "patient.ciwa_b",
patient_ciwa_b_current = "patient.ciwa_b_current",
patient_cows = "patient.cows",
patient_cows_current = "patient.cows_current",
patient_diagnosis_code = "patient.diagnosis_code",
patient_diagnosis_code_current = "patient.diagnosis_code_current",
patient_discharge_datetime = "patient.discharge_datetime",
patient_discharge_medications = "patient.discharge_medications",
patient_discharge_type = "patient.discharge_type",
patient_diets = "patient.diets",
patient_drug_of_choice = "patient.drug_of_choice",
patient_electronic_devices = "patient.electronic_devices",
patient_employer = "patient.employer",
patient_ethnicity = "patient.ethnicity",
patient_glucose_log = "patient.glucose_log",
patient_height_weight = "patient.height_weight",
patient_height_weight_current = "patient.height_weight_current",
patient_locker = "patient.locker",
patient_marital_status = "patient.marital_status",
patient_medication_current = "patient.medication_current",
patient_medication_inventory = "patient.medication_inventory",
patient_occupation = "patient.occupation",
patient_orthostatic_vitals = "patient.orthostatic_vitals",
patient_orthostatic_vital_signs_current = "patient.orthostatic_vital_signs_current",
patient_recurring_forms = "patient.recurring_forms",
patient_toggle_mars_generation = "patient.toggle_mars_generation",
patient_vital_signs = "patient.vital_signs",
patient_vital_signs_current = "patient.vital_signs_current",
points_item = "points_item",
points_total = "points_total",
progress_note = "progress_note",
problem_list = "problem_list",
radio_buttons = "radio_buttons",
string = "string",
text = "text",
timestamp = "timestamp",
title = "title",
treatment_plan_column_titles = "treatment_plan_column_titles",
treatment_plan_goal = "treatment_plan_goal",
treatment_plan_item = "treatment_plan_item",
treatment_plan_master_plan = "treatment_plan_master_plan",
treatment_plan_objective = "treatment_plan_objective",
treatment_plan_problem = "treatment_plan_problem",
};


export interface KipuPatientEvaluationItem {
  id: number;
  name: string;
  evaluationName?: string;
  evaluationItemId: number;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
  fieldType: KipuFieldTypes; // Expected enum value (e.g. one of 96 possible values)
  label: string;
  optional: boolean;
  dividerBelow: boolean;
  description?: string;
  // Nullable datetime strings; they may be null or a valid datetime string.
  timestamp?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  duration?: string | null;
  recordNames?: string;
  // COWS fields (camelCase)
  cowIntervalLabel?: string;
  cowPulseRateLabel?: string;
  cowSweatingLabel?: string;
  cowRestlessnessLabel?: string;
  cowPupilSizeLabel?: string;
  cowBoneJointAcheLabel?: string;
  cowRunnyNoseLabel?: string;
  cowGiUpsetLabel?: string;
  cowTremorLabel?: string;
  cowYawningLabel?: string;
  cowAnxietyIrritabilityLabel?: string;
  cowGoosefleshSkinLabel?: string;
  cowInterval?: string | null;
  cowPulseRate?: string | null;
  cowSweating?: string | null;
  cowRestlessness?: string | null;
  cowPupilSize?: string | null;
  cowBoneJointAche?: string | null;
  cowRunnyNose?: string | null;
  cowGiUpset?: string | null;
  cowTremor?: string | null;
  cowYawning?: string | null;

}


export interface KipuPatientEvaluation {
  id: string | number;
  name: string;
  status: string;
  patientCasefileId: string; // Must follow the regex pattern: ^[0-9]+\\:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$
  evaluationId: number;
  patientProcessId?: number;
  createdAt: string; // ISO datetime string
  createdBy: string;
  updatedAt: string; // ISO datetime string
  updatedBy: string;
  requireSignature: boolean;
  requirePatientSignature: boolean;
  billable: boolean;
  evaluationType: string;
  evaluationContent: string;
  ancillary: boolean;
  renderingProvider: boolean;
  billableClaimFormat: string;
  requireGuarantorSignature: boolean;
  requireGuardianSignature: boolean;
  isCrm: boolean;
  availableOnPortal: boolean;
  placeOfService: string;
  billingCodes: string;
  signatureUserTitles: string;
  reviewSignatureUserTitles: string;
  masterTreatmentPlanCategory: string;
  forceAllStaffUsersTitles: boolean;
  forceAllReviewUsersTitles: boolean;
  evaluationVersionId: number;
  locked: boolean;
  isRequired: boolean;
  patientEvaluationItems: KipuPatientEvaluationItem[];
}

/*
____________________________________________
EVALUATION TEMPLATES
|                  |
|                  |
|                  |
|                  |
|                  |
--------------------
*/

export interface KipuEvaluationItemObject {
  id: number;
  fieldType: KipuFieldTypes;
  name: string;
  recordNames: string;
  columnNames: string;
  label: string;
  enabled: boolean;
  optional: boolean;
  evaluationId: number;
  defaultValue: string;
  dividerBelow: boolean;
  rule: string;
  placeholder: string;
  prePopulateWithId: number;
  parentItemId: string;
  conditions: string;
  labelWidth: string;
  itemGroup: string;
  showString: string;
  showStringCss: string;
  matrixDefaultRecords: number;
  cssStyle: string;
  image?: string;
  skipValidations?: boolean;
  records: any[]; // this is where the actual data from the evaluation lies (the answers so to speak)
}

export interface KipuEvaluationResponse {
  pagination: {
    current_page: number;
    total_pages: string;
    records_per_page: string;
    total_records: string;
  };
  patient_evaluations: any[]; // Using 'any' for now, ideally should match the KipuEvaluation type
}

export interface KipuEvaluation {
  id: number;
  name: string;
  status: string;
  patientCasefileId: string;
  evaluationId: number;
  patientProcessId: number;
  requireSignature: boolean;
  requirePatientSignature: boolean;
  billable: boolean;
  evaluationType: string;
  evaluationContent: string;
  ancillary: boolean;
  renderingProvider: null;
  billableClaimFormat: string;
  requireGuarantorSignature: boolean;
  requireGuardianSignature: boolean;
  isCrm: boolean;
  availableOnPortal: boolean;
  placeOfService: string;
  billingCodes: Record<string, any>;
  signatureUserTitles: Record<string, any>;
  reviewSignatureUserTitles: Record<string, any>;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  masterTreatmentPlanCategory: string;
  forceAllStaffUsersTitles: boolean;
  forceAllReviewUsersTitles: boolean;
  evaluationVersionId: number;
  locations: [];
  evaluationItems: Array<KipuEvaluationItemObject>;
  notes?: string;
  providerName?: string;
  patientId?: string;
  items?: Array<KipuEvaluationItemObject>;
}


/* evaluation.data.evaluationitems.records.description[0] = "something something"
   evaluation.data.evaluationitems.type = "textarea" | title | etc
*/