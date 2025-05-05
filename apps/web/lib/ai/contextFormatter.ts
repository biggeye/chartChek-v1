import { ChatContext, PatientContext } from '~/types/chat/context';
import { logger } from '~/lib/logger';

const formatPatientInfo = (patient: PatientContext): string => {
  logger.debug('[contextFormatter] Formatting patient info', { patientId: patient.patientId });
  
  return `
Patient Information:
Patient ID: ${patient.patientId}
Name: ${patient.name}
Date of Birth: ${patient.dateOfBirth}
Gender: ${patient.gender}
Status: ${patient.status || 'Not provided'}
MRN: ${patient.mrn || 'Not provided'}

Admission Details:
- Admission Date: ${patient.admissionDetails.date}
- Level of Care: ${patient.admissionDetails.levelOfCare}
- Next Level of Care: ${patient.admissionDetails.nextLevelOfCare || 'Not provided'}
- Next Level of Care Date: ${patient.admissionDetails.nextLevelOfCareDate || 'Not provided'}
- Program: ${patient.admissionDetails.program}

Location:
- Building: ${patient.location.building || 'Not provided'}
- Room: ${patient.location.room || 'Not provided'}
- Bed: ${patient.location.bed || 'Not provided'}

Insurance Information:
- Provider: ${patient.insurance.provider}
- Insurance Plans: ${patient.insurance.plans.length ? patient.insurance.plans.join(', ') : '[]'}

Clinical Information:
- Discharge Type: ${patient.clinicalInfo.dischargeType || 'Not provided'}
- Sobriety Date: ${patient.clinicalInfo.sobrietyDate || 'Not provided'}
- Patient Statuses: ${patient.clinicalInfo.patientStatuses.length ? patient.clinicalInfo.patientStatuses.join(', ') : '[]'}
- Patient Contacts: ${patient.clinicalInfo.patientContacts.length ? patient.clinicalInfo.patientContacts.join(', ') : '[]'}
`.trim();
};

export const formatContext = (context: ChatContext): string => {
  logger.debug('[contextFormatter] Formatting chat context', { 
    hasPatientContext: !!context.patient 
  });

  const sections: string[] = [];

  if (context.patient) {
    sections.push(formatPatientInfo(context.patient));
  }

  // We can add more context sections here later

  return sections.join('\n\n');
}; 