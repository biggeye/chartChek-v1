/**
 * Enhanced Kipu Evaluation interfaces based on the official Kipu API schema
 * These interfaces provide more comprehensive type coverage for patient evaluations
 */

import { KipuFieldTypes } from './kipuAdapter';
import { snakeToCamel } from '~/lib/utils/case-converters';

/**
 * Enhanced Patient Evaluation Item interface that captures all possible fields
 * from the Kipu API schema
 */
export interface KipuPatientEvaluationItemEnhanced {
  id: number;
  name: string;
  evaluationName?: string;
  evaluationItemId: number;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
  fieldType: KipuFieldTypes;
  label: string;
  optional: boolean;
  dividerBelow: boolean;
  description?: string;
  
  // Value fields - can be different types based on the field_type
  value?: string | boolean | number | null;
  date?: string | null; // Can be a date string or null
  
  // Time-related fields
  timestamp?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  duration?: string | null;
  
  // Common fields
  recordNames?: string;
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
  
  // CIWA-AR fields (Clinical Institute Withdrawal Assessment for Alcohol, Revised)
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
  score?: number;
  
  // CIWA-B fields (Clinical Institute Withdrawal Assessment for Benzodiazepines)
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
  
  // COWS fields (Clinical Opiate Withdrawal Scale)
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
  
  // Complex nested data
  totalProblems?: number;
  problems?: Array<any>;
  attendancesLastUpdated?: string;
  patientAttendances?: Array<any>;
  patientOrders?: Array<any>;
  glucoseLogs?: Array<any>;
  evaluations?: Array<any>;
  evalNotes?: Array<any>;
  titles?: Array<any>;
  evalTreatmentPlans?: Array<any>;
  groupedTreatmentPlans?: Array<any>;
  inventories?: Array<any>;
  drugsOfChoice?: Array<any>;
  electronicDevices?: Array<any>;
  broughtInMedications?: Array<any>;
  allergies?: Array<any>;
  records?: Array<any> | Array<{
    label: string;
    columnNames?: Array<{
      key: string;
      value: string;
    }>;
    name?: string;
    description?: string;
    value?: string;
  }>;
  notes?: Array<any>;
}

/**
 * Enhanced Patient Evaluation interface that captures all fields
 * from the Kipu API schema
 */
export interface KipuPatientEvaluationEnhanced {
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
  patientEvaluationItems: KipuPatientEvaluationItemEnhanced[];
}

/**
 * Adapter function to convert snake_case API response to camelCase
 * for use with our enhanced interfaces
 */
export function adaptKipuEvaluation(rawData: any): KipuPatientEvaluationEnhanced {
  // Handle the case where the API returns data wrapped in a "patient_evaluation" object
  const source = rawData.patient_evaluation || rawData;
  
  // Use the snakeToCamel utility to convert all keys
  const camelCaseData = snakeToCamel(source);
  
  const result: KipuPatientEvaluationEnhanced = {
    id: camelCaseData.id,
    name: camelCaseData.name,
    status: camelCaseData.status,
    patientCasefileId: camelCaseData.patientCasefileId,
    evaluationId: camelCaseData.evaluationId,
    patientProcessId: camelCaseData.patientProcessId,
    createdAt: camelCaseData.createdAt,
    createdBy: camelCaseData.createdBy,
    updatedAt: camelCaseData.updatedAt,
    updatedBy: camelCaseData.updatedBy,
    requireSignature: camelCaseData.requireSignature,
    requirePatientSignature: camelCaseData.requirePatientSignature,
    billable: camelCaseData.billable,
    evaluationType: camelCaseData.evaluationType,
    evaluationContent: camelCaseData.evaluationContent,
    ancillary: camelCaseData.ancillary,
    renderingProvider: camelCaseData.renderingProvider,
    billableClaimFormat: camelCaseData.billableClaimFormat,
    requireGuarantorSignature: camelCaseData.requireGuarantorSignature,
    requireGuardianSignature: camelCaseData.requireGuardianSignature,
    isCrm: camelCaseData.isCrm,
    availableOnPortal: camelCaseData.availableOnPortal,
    placeOfService: camelCaseData.placeOfService,
    billingCodes: camelCaseData.billingCodes,
    signatureUserTitles: camelCaseData.signatureUserTitles,
    reviewSignatureUserTitles: camelCaseData.reviewSignatureUserTitles,
    masterTreatmentPlanCategory: camelCaseData.masterTreatmentPlanCategory,
    forceAllStaffUsersTitles: camelCaseData.forceAllStaffUsersTitles,
    forceAllReviewUsersTitles: camelCaseData.forceAllReviewUsersTitles,
    evaluationVersionId: camelCaseData.evaluationVersionId,
    locked: camelCaseData.locked,
    isRequired: camelCaseData.isRequired,
    patientEvaluationItems: []
  };
  
  // Convert patient_evaluation_items
  if (camelCaseData.patientEvaluationItems && Array.isArray(camelCaseData.patientEvaluationItems)) {
    result.patientEvaluationItems = camelCaseData.patientEvaluationItems.map((item: any) => adaptKipuEvaluationItem(item));
  }
  
  return result;
}

/**
 * Adapter function to convert snake_case API response to camelCase
 * for individual evaluation items
 */
export function adaptKipuEvaluationItem(rawItem: any): KipuPatientEvaluationItemEnhanced {
  // Use the snakeToCamel utility to convert all keys
  const camelCaseItem = snakeToCamel(rawItem);
  
  return {
    id: camelCaseItem.id,
    name: camelCaseItem.name,
    evaluationName: camelCaseItem.evaluationName,
    evaluationItemId: camelCaseItem.evaluationItemId,
    createdAt: camelCaseItem.createdAt,
    updatedAt: camelCaseItem.updatedAt,
    fieldType: camelCaseItem.fieldType,
    label: camelCaseItem.label,
    optional: camelCaseItem.optional,
    dividerBelow: camelCaseItem.dividerBelow,
    description: camelCaseItem.description,
    
    // Value fields can be different types
    value: camelCaseItem.value,
    date: camelCaseItem.date,
    
    // Time-related fields
    timestamp: camelCaseItem.timestamp,
    startTime: camelCaseItem.startTime,
    endTime: camelCaseItem.endTime,
    duration: camelCaseItem.duration,
    
    // Common fields
    recordNames: camelCaseItem.recordNames,
    bedName: camelCaseItem.bedName,
    bmi: camelCaseItem.bmi,
    primaryTherapist: camelCaseItem.primaryTherapist,
    assignedOn: camelCaseItem.assignedOn,
    key: camelCaseItem.key,
    diagCode: camelCaseItem.diagCode,
    diets: camelCaseItem.diets,
    otherRestrictions: camelCaseItem.otherRestrictions,
    dischargeType: camelCaseItem.dischargeType,
    employer: camelCaseItem.employer,
    race: camelCaseItem.race,
    ethnicity: camelCaseItem.ethnicity,
    optionText: camelCaseItem.optionText,
    points: camelCaseItem.points,
    
    // Height and weight
    height: camelCaseItem.height,
    weight: camelCaseItem.weight,
    heightUnits: camelCaseItem.heightUnits,
    weightUnits: camelCaseItem.weightUnits,
    
    // Vital signs
    bloodPressure: camelCaseItem.bloodPressure,
    respirations: camelCaseItem.respirations,
    temperature: camelCaseItem.temperature,
    pulse: camelCaseItem.pulse,
    o2Saturation: camelCaseItem.o2Saturation,
    
    // Level of care
    locLabel: camelCaseItem.locLabel,
    locValue: camelCaseItem.locValue,
    dateOfChange: camelCaseItem.dateOfChange,
    transitionToLevelOfCare: camelCaseItem.transitionToLevelOfCare,
    
    // Orthostatic vitals
    bloodPressureSystolicLying: camelCaseItem.bloodPressureSystolicLying,
    bloodPressureDiastolicLying: camelCaseItem.bloodPressureDiastolicLying,
    bloodPressureSystolicSitting: camelCaseItem.bloodPressureSystolicSitting,
    bloodPressureDiastolicSitting: camelCaseItem.bloodPressureDiastolicSitting,
    bloodPressureSystolicStanding: camelCaseItem.bloodPressureSystolicStanding,
    bloodPressureDiastolicStanding: camelCaseItem.bloodPressureDiastolicStanding,
    pulseLying: camelCaseItem.pulseLying,
    pulseSitting: camelCaseItem.pulseSitting,
    pulseStanding: camelCaseItem.pulseStanding,
    
    // CIWA-AR fields
    ciwaArIntervalLabel: camelCaseItem.ciwaArIntervalLabel,
    ciwaArInterval: camelCaseItem.ciwaArInterval,
    ciwaArAgitationLabel: camelCaseItem.ciwaArAgitationLabel,
    ciwaArAgitation: camelCaseItem.ciwaArAgitation,
    ciwaArAnxietyLabel: camelCaseItem.ciwaArAnxietyLabel,
    ciwaArAnxiety: camelCaseItem.ciwaArAnxiety,
    ciwaArAuditoryDisturbancesLabel: camelCaseItem.ciwaArAuditoryDisturbancesLabel,
    ciwaArAuditoryDisturbances: camelCaseItem.ciwaArAuditoryDisturbances,
    ciwaArCloudingOfSensoriumLabel: camelCaseItem.ciwaArCloudingOfSensoriumLabel,
    ciwaArCloudingOfSensorium: camelCaseItem.ciwaArCloudingOfSensorium,
    ciwaArHeadacheLabel: camelCaseItem.ciwaArHeadacheLabel,
    ciwaArHeadache: camelCaseItem.ciwaArHeadache,
    ciwaArNauseaLabel: camelCaseItem.ciwaArNauseaLabel,
    ciwaArNausea: camelCaseItem.ciwaArNausea,
    ciwaArParoxysmalSweatsLabel: camelCaseItem.ciwaArParoxysmalSweatsLabel,
    ciwaArParoxysmalSweats: camelCaseItem.ciwaArParoxysmalSweats,
    ciwaArTactileDisturbancesLabel: camelCaseItem.ciwaArTactileDisturbancesLabel,
    ciwaArTactileDisturbances: camelCaseItem.ciwaArTactileDisturbances,
    ciwaArTremorLabel: camelCaseItem.ciwaArTremorLabel,
    ciwaArTremor: camelCaseItem.ciwaArTremor,
    ciwaArVisualDisturbancesLabel: camelCaseItem.ciwaArVisualDisturbancesLabel,
    ciwaArVisualDisturbances: camelCaseItem.ciwaArVisualDisturbances,
    score: camelCaseItem.score,
    
    // CIWA-B fields
    ciwaBIntervalLabel: camelCaseItem.ciwaBIntervalLabel,
    ciwaBIrritableLabel: camelCaseItem.ciwaBIrritableLabel,
    ciwaBFatiguedLabel: camelCaseItem.ciwaBFatiguedLabel,
    ciwaBTensedLabel: camelCaseItem.ciwaBTensedLabel,
    ciwaBDifficultyConcentratingLabel: camelCaseItem.ciwaBDifficultyConcentratingLabel,
    ciwaBLossOfAppetiteLabel: camelCaseItem.ciwaBLossOfAppetiteLabel,
    ciwaBNumbnessLabel: camelCaseItem.ciwaBNumbnessLabel,
    ciwaBHeartRacingLabel: camelCaseItem.ciwaBHeartRacingLabel,
    ciwaBHeadFullAchyLabel: camelCaseItem.ciwaBHeadFullAchyLabel,
    ciwaBMuscleAcheLabel: camelCaseItem.ciwaBMuscleAcheLabel,
    ciwaBAnxietyLabel: camelCaseItem.ciwaBAnxietyLabel,
    ciwaBUpsetLabel: camelCaseItem.ciwaBUpsetLabel,
    ciwaBRestfulSleepLabel: camelCaseItem.ciwaBRestfulSleepLabel,
    ciwaBEnoughSleepLabel: camelCaseItem.ciwaBEnoughSleepLabel,
    ciwaBVisualDisturbancesLabel: camelCaseItem.ciwaBVisualDisturbancesLabel,
    ciwaBFearfulLabel: camelCaseItem.ciwaBFearfulLabel,
    ciwaBPossibleMisfortunesLabel: camelCaseItem.ciwaBPossibleMisfortunesLabel,
    ciwaBSweatingAgitationLabel: camelCaseItem.ciwaBSweatingAgitationLabel,
    ciwaBTremorsLabel: camelCaseItem.ciwaBTremorsLabel,
    ciwaBFeelPalmsLabel: camelCaseItem.ciwaBFeelPalmsLabel,
    ciwaBInterval: camelCaseItem.ciwaBInterval,
    ciwaBIrritable: camelCaseItem.ciwaBIrritable,
    ciwaBFatigued: camelCaseItem.ciwaBFatigued,
    ciwaBTensed: camelCaseItem.ciwaBTensed,
    ciwaBDifficultyConcentrating: camelCaseItem.ciwaBDifficultyConcentrating,
    ciwaBLossOfAppetite: camelCaseItem.ciwaBLossOfAppetite,
    ciwaBNumbness: camelCaseItem.ciwaBNumbness,
    ciwaBHeartRacing: camelCaseItem.ciwaBHeartRacing,
    ciwaBHeadFullAchy: camelCaseItem.ciwaBHeadFullAchy,
    ciwaBMuscleAche: camelCaseItem.ciwaBMuscleAche,
    ciwaBAnxiety: camelCaseItem.ciwaBAnxiety,
    ciwaBUpset: camelCaseItem.ciwaBUpset,
    ciwaBRestfulSleep: camelCaseItem.ciwaBRestfulSleep,
    ciwaBEnoughSleep: camelCaseItem.ciwaBEnoughSleep,
    ciwaBVisualDisturbances: camelCaseItem.ciwaBVisualDisturbances,
    ciwaBFearful: camelCaseItem.ciwaBFearful,
    ciwaBPossibleMisfortunes: camelCaseItem.ciwaBPossibleMisfortunes,
    ciwaBSweatingAgitation: camelCaseItem.ciwaBSweatingAgitation,
    ciwaBTremors: camelCaseItem.ciwaBTremors,
    ciwaBFeelPalms: camelCaseItem.ciwaBFeelPalms,
    
    // COWS fields
    cowIntervalLabel: camelCaseItem.cowIntervalLabel,
    cowPulseRateLabel: camelCaseItem.cowPulseRateLabel,
    cowSweatingLabel: camelCaseItem.cowSweatingLabel,
    cowRestlessnessLabel: camelCaseItem.cowRestlessnessLabel,
    cowPupilSizeLabel: camelCaseItem.cowPupilSizeLabel,
    cowBoneJointAcheLabel: camelCaseItem.cowBoneJointAcheLabel,
    cowRunnyNoseLabel: camelCaseItem.cowRunnyNoseLabel,
    cowGiUpsetLabel: camelCaseItem.cowGiUpsetLabel,
    cowTremorLabel: camelCaseItem.cowTremorLabel,
    cowYawningLabel: camelCaseItem.cowYawningLabel,
    cowAnxietyIrritabilityLabel: camelCaseItem.cowAnxietyIrritabilityLabel,
    cowGoosefleshSkinLabel: camelCaseItem.cowGoosefleshSkinLabel,
    cowInterval: camelCaseItem.cowInterval,
    cowPulseRate: camelCaseItem.cowPulseRate,
    cowSweating: camelCaseItem.cowSweating,
    cowRestlessness: camelCaseItem.cowRestlessness,
    cowPupilSize: camelCaseItem.cowPupilSize,
    cowBoneJointAche: camelCaseItem.cowBoneJointAche,
    cowRunnyNose: camelCaseItem.cowRunnyNose,
    cowGiUpset: camelCaseItem.cowGiUpset,
    cowTremor: camelCaseItem.cowTremor,
    cowYawning: camelCaseItem.cowYawning,
    cowAnxietyIrritability: camelCaseItem.cowAnxietyIrritability,
    cowGoosefleshSkin: camelCaseItem.cowGoosefleshSkin,
    
    // Patient info fields
    maritalStatus: camelCaseItem.maritalStatus,
    locker: camelCaseItem.locker,
    occupation: camelCaseItem.occupation,
    medications: camelCaseItem.medications,
    
    // Complex nested data
    totalProblems: camelCaseItem.totalProblems,
    problems: camelCaseItem.problems,
    attendancesLastUpdated: camelCaseItem.attendancesLastUpdated,
    patientAttendances: camelCaseItem.patientAttendances,
    patientOrders: camelCaseItem.patientOrders,
    glucoseLogs: camelCaseItem.glucoseLogs,
    evaluations: camelCaseItem.evaluations,
    evalNotes: camelCaseItem.evalNotes,
    titles: camelCaseItem.titles,
    evalTreatmentPlans: camelCaseItem.evalTreatmentPlans,
    groupedTreatmentPlans: camelCaseItem.groupedTreatmentPlans,
    inventories: camelCaseItem.inventories,
    drugsOfChoice: camelCaseItem.drugsOfChoice,
    electronicDevices: camelCaseItem.electronicDevices,
    broughtInMedications: camelCaseItem.broughtInMedications,
    allergies: camelCaseItem.allergies,
    records: camelCaseItem.records || [],
    notes: camelCaseItem.notes
  };
}
