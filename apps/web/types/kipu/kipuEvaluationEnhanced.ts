/**
 * Enhanced Kipu Evaluation interfaces based on the official Kipu API schema
 * These interfaces provide more comprehensive type coverage for patient evaluations
 */

import { KipuFieldTypes, KipuPatientEvaluation, KipuPatientEvaluationItem } from './kipuAdapter';
import { snakeToCamel } from '~/utils/case-converters';

/**
 * Base record interface that all record types extend
 */
export interface BaseRecord {
  id?: number;
  name?: string;
  description?: string;
  value?: string;
  status?: string;
}

/**
 * Matrix record structure for evaluation items
 */
export interface MatrixRecord extends BaseRecord {
  label?: string;
  comments?: string;
  option?: string;
  columnNames?: Array<{
    key: string;
    value: string;
  }>;
  [key: string]: any; // For dynamic column values
}

/**
 * Drug history record structure
 */
export interface DrugHistoryRecord extends BaseRecord {
  drugName?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  frequency?: string;
  route?: string;
  dosage?: string;
}

/**
 * Diagnosis record structure
 */
export interface DiagnosisRecord extends BaseRecord {
  diagnosisDescription?: string;
  code?: string;
  status?: string;
  dateIdentified?: string;
  provider?: string;
  severity?: string;
}

/**
 * Problem list record structure
 */
export interface ProblemListRecord extends BaseRecord {
  problemDescription?: string;
  status?: string;
  dateIdentified?: string;
  severity?: string;
  provider?: string;
}

/**
 * Drug of choice record structure
 */
export interface DrugOfChoiceRecord extends BaseRecord {
  drugName?: string;
  frequency?: string;
  lastUsed?: string;
  yearsUsed?: number;
  ageFirstUsed?: number;
  routeOfAdministration?: string;
}

/**
 * Treatment plan record structure
 */
export interface TreatmentPlanRecord extends BaseRecord {
  goal?: string;
  objective?: string;
  intervention?: string;
  targetDate?: string;
  progress?: string;
  status?: string;
}

/**
 * Medication record structure
 */
export interface MedicationRecord extends BaseRecord {
  medicationName?: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  startDate?: string;
  endDate?: string;
  prescriber?: string;
  status?: string;
}

/**
 * Problem record structure
 */
export interface ProblemRecord {
  id?: number;
  description?: string;
  status?: string;
  severity?: string;
  dateIdentified?: string;
  provider?: string;
}

/**
 * Patient attendance record structure
 */
export interface AttendanceRecord {
  id?: number;
  date?: string;
  type?: string;
  status?: string;
  provider?: string;
  notes?: string;
}

/**
 * Patient order record structure
 */
export interface OrderRecord {
  id?: number;
  orderDate?: string;
  type?: string;
  status?: string;
  provider?: string;
  details?: string;
}

/**
 * Glucose log record structure
 */
export interface GlucoseLogRecord {
  id?: number;
  date?: string;
  value?: number;
  units?: string;
  notes?: string;
}

/**
 * Evaluation note record structure
 */
export interface EvaluationNoteRecord {
  id?: number;
  date?: string;
  note?: string;
  provider?: string;
  type?: string;
}

/**
 * Treatment plan record structure with grouping
 */
export interface GroupedTreatmentPlanRecord extends TreatmentPlanRecord {
  groupId?: string;
  groupName?: string;
  order?: number;
}

/**
 * Inventory record structure
 */
export interface InventoryRecord {
  id?: number;
  item?: string;
  quantity?: number;
  status?: string;
  location?: string;
  notes?: string;
}

/**
 * Electronic device record structure
 */
export interface ElectronicDeviceRecord {
  id?: number;
  deviceType?: string;
  make?: string;
  model?: string;
  serialNumber?: string;
  status?: string;
}

/**
 * Note record structure
 */
export interface NoteRecord {
  id?: number;
  date?: string;
  content?: string;
  type?: string;
  provider?: string;
}

/**
 * Assessment record structure (for CIWA-AR, CIWA-B, COWS)
 */
export interface AssessmentRecord extends BaseRecord {
  label?: string;
  value?: string;
  description?: string;
  score?: number;
}

/**
 * Union type of all possible record types
 */
export type EvaluationRecord = 
  | MatrixRecord 
  | DrugHistoryRecord 
  | DiagnosisRecord 
  | ProblemListRecord 
  | DrugOfChoiceRecord 
  | TreatmentPlanRecord 
  | MedicationRecord
  | AssessmentRecord;

/**
 * Enhanced Patient Evaluation Item interface that extends the base KipuPatientEvaluationItem
 * while adding more comprehensive type coverage
 */
export interface KipuPatientEvaluationItemEnhanced extends KipuPatientEvaluationItem {
  // Additional fields not in base type
  evaluationName?: string;
  
  // Value fields - can be different types based on the field_type
  value?: string | boolean | number | null;
  date?: string | null;
  
  // Time-related fields
  timestamp?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  duration?: string | null;
  
  // Common fields
  bedName?: string;
  bmi?: string;
  primaryTherapist?: string;
  assignedOn?: string | null;
  key?: string;
  diagCode?: string | null;
  diets?: string;
  otherRestrictions?: string;
  dischargeType?: string;
  employer?: string;
  race?: string;
  ethnicity?: string;
  optionText?: string;
  points?: string;
  
  // Height and weight
  height?: number;
  weight?: number;
  heightUnits?: string;
  weightUnits?: string;
  
  // Vital signs
  bloodPressure?: {
    systolic?: string;
    diastolic?: string;
  };
  respirations?: string;
  temperature?: string;
  pulse?: string;
  o2Saturation?: string;
  
  // Level of care
  locLabel?: string;
  locValue?: string;
  dateOfChange?: string | null;
  transitionToLevelOfCare?: string | null;
  
  // Records field - properly typed with union type
  records?: EvaluationRecord[];
  
  // Orthostatic vitals
  bloodPressureSystolicLying?: string;
  bloodPressureDiastolicLying?: string;
  bloodPressureSystolicSitting?: string;
  bloodPressureDiastolicSitting?: string;
  bloodPressureSystolicStanding?: string;
  bloodPressureDiastolicStanding?: string;
  pulseLying?: string;
  pulseSitting?: string;
  pulseStanding?: string;
  
  // CIWA-AR fields
  ciwaArIntervalLabel?: string;
  ciwaArInterval?: string | null;
  ciwaArAgitationLabel?: string;
  ciwaArAgitation?: string | null;
  ciwaArAnxietyLabel?: string;
  ciwaArAnxiety?: string | null;
  ciwaArAuditoryDisturbancesLabel?: string;
  ciwaArAuditoryDisturbances?: string | null;
  ciwaArCloudingOfSensoriumLabel?: string;
  ciwaArCloudingOfSensorium?: string | null;
  ciwaArHeadacheLabel?: string;
  ciwaArHeadache?: string | null;
  ciwaArNauseaLabel?: string;
  ciwaArNausea?: string | null;
  ciwaArParoxysmalSweatsLabel?: string;
  ciwaArParoxysmalSweats?: string | null;
  ciwaArTactileDisturbancesLabel?: string;
  ciwaArTactileDisturbances?: string | null;
  ciwaArTremorLabel?: string;
  ciwaArTremor?: string | null;
  ciwaArVisualDisturbancesLabel?: string;
  ciwaArVisualDisturbances?: string | null;
  score?: string | null;
  
  // CIWA-B fields
  ciwaBIntervalLabel?: string;
  ciwaBIrritableLabel?: string;
  ciwaBFatiguedLabel?: string;
  ciwaBTensedLabel?: string;
  ciwaBDifficultyConcentratingLabel?: string;
  ciwaBLossOfAppetiteLabel?: string;
  ciwaBNumbnessLabel?: string;
  ciwaBHeartRacingLabel?: string;
  ciwaBHeadFullAchyLabel?: string;
  ciwaBMuscleAcheLabel?: string;
  ciwaBAnxietyLabel?: string;
  ciwaBUpsetLabel?: string;
  ciwaBRestfulSleepLabel?: string;
  ciwaBEnoughSleepLabel?: string;
  ciwaBVisualDisturbancesLabel?: string;
  ciwaBFearfulLabel?: string;
  ciwaBPossibleMisfortunesLabel?: string;
  ciwaBSweatingAgitationLabel?: string;
  ciwaBTremorsLabel?: string;
  ciwaBFeelPalmsLabel?: string;
  ciwaBInterval?: string | null;
  ciwaBIrritable?: string | null;
  ciwaBFatigued?: string | null;
  ciwaBTensed?: string | null;
  ciwaBDifficultyConcentrating?: string | null;
  ciwaBLossOfAppetite?: string | null;
  ciwaBNumbness?: string | null;
  ciwaBHeartRacing?: string | null;
  ciwaBHeadFullAchy?: string | null;
  ciwaBMuscleAche?: string | null;
  ciwaBAnxiety?: string | null;
  ciwaBUpset?: string | null;
  ciwaBRestfulSleep?: string | null;
  ciwaBEnoughSleep?: string | null;
  ciwaBVisualDisturbances?: string | null;
  ciwaBFearful?: string | null;
  ciwaBPossibleMisfortunes?: string | null;
  ciwaBSweatingAgitation?: string | null;
  ciwaBTremors?: string | null;
  ciwaBFeelPalms?: string | null;
  
  // COWS fields
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
  cowAnxietyIrritability?: string | null;
  cowGoosefleshSkin?: string | null;
  
  // Patient info fields
  maritalStatus?: string;
  locker?: string;
  occupation?: string;
  medications?: string;
  
  // Complex nested data with proper typing
  totalProblems?: number;
  problems?: ProblemRecord[];
  attendancesLastUpdated?: string;
  patientAttendances?: AttendanceRecord[];
  patientOrders?: OrderRecord[];
  glucoseLogs?: GlucoseLogRecord[];
  evaluations?: KipuPatientEvaluationItemEnhanced[];
  evalNotes?: EvaluationNoteRecord[];
  titles?: string[];
  evalTreatmentPlans?: TreatmentPlanRecord[];
  groupedTreatmentPlans?: GroupedTreatmentPlanRecord[];
  inventories?: InventoryRecord[];
  drugsOfChoice?: DrugOfChoiceRecord[];
  electronicDevices?: ElectronicDeviceRecord[];
  broughtInMedications?: MedicationRecord[];
  allergies?: DiagnosisRecord[];
  notes?: NoteRecord[];
}

/**
 * Enhanced Patient Evaluation interface that extends the base KipuPatientEvaluation
 */
export interface KipuPatientEvaluationEnhanced extends KipuPatientEvaluation {
  // Override the items array with enhanced type
  patientEvaluationItems: KipuPatientEvaluationItemEnhanced[];
}

/**
 * Adapter function to convert snake_case API response to camelCase
 * and enhance with additional type information
 */
export function adaptKipuEvaluation(rawData: any): KipuPatientEvaluationEnhanced {
  // First adapt to base type - handle various data structures
  // If the data is already unwrapped (direct from API), use it as is
  const baseEvaluation = rawData.data?.patient_evaluation || rawData.patient_evaluation || rawData;
  
  // If the data is already in camelCase (from API), use it as is, otherwise convert
  const camelCaseData = typeof baseEvaluation === 'object' && 'patientEvaluationItems' in baseEvaluation
    ? baseEvaluation
    : snakeToCamel(baseEvaluation);
  
  // Create the enhanced evaluation
  const result: KipuPatientEvaluationEnhanced = {
    ...camelCaseData,
    patientEvaluationItems: []
  };
  
  // Convert patient_evaluation_items - preserve the original records
  const items = camelCaseData.patientEvaluationItems || camelCaseData.items || [];
  if (Array.isArray(items)) {
    result.patientEvaluationItems = items.map((item: any) => {
      // If the item already has records in the correct format, preserve them
      const originalRecords = Array.isArray(item.records) ? item.records : [];
      
      // Adapt the item
      const adaptedItem = adaptKipuEvaluationItem({
        ...item,
        // Temporarily remove records to prevent double conversion
        records: undefined
      });
      
      // Restore the original records if they exist, otherwise adapt them
      if (originalRecords.length > 0) {
        adaptedItem.records = originalRecords.map((record: any) => {
          // If the record is already in camelCase, use it as is
          if (typeof record === 'object' && 'description' in record) {
            return record;
          }
          const camelRecord = snakeToCamel(record);
          return {
            id: camelRecord.id,
            name: camelRecord.name,
            description: camelRecord.description,
            value: camelRecord.value,
            status: camelRecord.status,
            ...camelRecord // Preserve all other fields
          };
        });
      }
      
      return adaptedItem;
    });
  }
  
  return result;
}

/**
 * Adapter function to convert snake_case API response to camelCase
 * and enhance with additional type information for individual items
 */
export function adaptKipuEvaluationItem(rawItem: any): KipuPatientEvaluationItemEnhanced {
  // Use the snakeToCamel utility to convert all keys
  const camelCaseItem = snakeToCamel(rawItem);
  
  // Handle records based on field type
  let records: EvaluationRecord[] | undefined;
  if (camelCaseItem.records && Array.isArray(camelCaseItem.records)) {
    records = camelCaseItem.records.map((record: any) => {
      const camelRecord = snakeToCamel(record);
      const baseRecord: BaseRecord = {
        id: camelRecord.id,
        name: camelRecord.name,
        description: camelRecord.description,
        value: camelRecord.value,
        status: camelRecord.status,
      };

      // Determine record type based on field type
      switch (camelCaseItem.fieldType) {
        case KipuFieldTypes.matrix:
          return {
            ...baseRecord,
            label: camelRecord.label,
            comments: camelRecord.comments,
            option: camelRecord.option,
            columnNames: Array.isArray(camelRecord.columnNames) 
              ? camelRecord.columnNames.map((col: any) => ({
                  key: col.key,
                  value: col.value
                }))
              : undefined,
            ...camelRecord, // Include any additional dynamic fields
          } as MatrixRecord;

        case KipuFieldTypes.patient_brought_in_medication:
          // Handle both drug history and medication records with the same field type
          if (camelRecord.drugName) {
            return {
              ...baseRecord,
              drugName: camelRecord.drugName,
              startDate: camelRecord.startDate,
              endDate: camelRecord.endDate,
              frequency: camelRecord.frequency,
              route: camelRecord.route,
              dosage: camelRecord.dosage,
            } as DrugHistoryRecord;
          } else {
            return {
              ...baseRecord,
              medicationName: camelRecord.medicationName,
              dosage: camelRecord.dosage,
              frequency: camelRecord.frequency,
              route: camelRecord.route,
              startDate: camelRecord.startDate,
              endDate: camelRecord.endDate,
              prescriber: camelRecord.prescriber,
            } as MedicationRecord;
          }

        case KipuFieldTypes.patient_allergies:
          return {
            ...baseRecord,
            diagnosisDescription: camelRecord.diagnosisDescription,
            code: camelRecord.code,
            dateIdentified: camelRecord.dateIdentified,
            provider: camelRecord.provider,
            severity: camelRecord.severity,
          } as DiagnosisRecord;

        case KipuFieldTypes.patient_diagnosis_code:
          return {
            ...baseRecord,
            problemDescription: camelRecord.problemDescription,
            dateIdentified: camelRecord.dateIdentified,
            severity: camelRecord.severity,
            provider: camelRecord.provider,
          } as ProblemListRecord;

        case KipuFieldTypes.patient_drug_of_choice:
          return {
            ...baseRecord,
            drugName: camelRecord.drugName,
            frequency: camelRecord.frequency,
            lastUsed: camelRecord.lastUsed,
            yearsUsed: camelRecord.yearsUsed,
            ageFirstUsed: camelRecord.ageFirstUsed,
            routeOfAdministration: camelRecord.routeOfAdministration,
          } as DrugOfChoiceRecord;

        case KipuFieldTypes.evaluation_name:
          return {
            ...baseRecord,
            goal: camelRecord.goal,
            objective: camelRecord.objective,
            intervention: camelRecord.intervention,
            targetDate: camelRecord.targetDate,
            progress: camelRecord.progress,
          } as TreatmentPlanRecord;

        case KipuFieldTypes.patient_ciwa_ar:
        case KipuFieldTypes.patient_ciwa_b:
        case KipuFieldTypes.patient_cows:
          return {
            ...baseRecord,
            label: camelRecord.label,
            value: camelRecord.value,
            description: camelRecord.description,
            score: camelRecord.score,
          } as AssessmentRecord;

        default:
          // For unknown field types, return the base record with all additional fields
          return {
            ...baseRecord,
            ...camelRecord,
          } as BaseRecord;
      }
    });
  }

  // Create the enhanced item
  const adaptedItem: KipuPatientEvaluationItemEnhanced = {
    ...camelCaseItem, // Include all base fields
    records, // Add the enhanced records
  };

  return adaptedItem;
}
