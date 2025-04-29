import { KipuAppointment, KipuAppointmentType } from '~/lib/kipu/service/appointment-service';
import { KipuCiwaAr, KipuCiwaB, KipuCows, KipuVitalSigns } from '~/lib/kipu/service/clinical-assessment-service';
import { KipuContact } from '~/lib/kipu/service/contact-service';
import { KipuConsentForm, KipuDiagnosisHistory } from '~/lib/kipu/service/medical-records-service';
import { KipuProvider, KipuUser } from '~/lib/kipu/service/provider-service';

// App Components
import { EvaluationTemplateList } from '~/components/patient/evaluations/EvaluationTemplateList';
import { PatientEvaluationViewer } from '~/components/patient/evaluations/PatientEvaluationViewer';
import { EvaluationCreated } from '~/components/patient/evaluations/EvaluationCreated';
import { PatientAdmissionsList } from '~/components/patient/admissions/PatientAdmissionsList';
import { PatientCensusList } from '~/components/patient/census/PatientCensusList';
import { PatientDetailsView } from '~/components/patient/details/PatientDetailsView';
import { PatientAdmission } from '~/components/patient/admissions/PatientAdmissionsList';
import { PatientCensus } from '~/components/patient/census/PatientCensusList';
import { PatientDetails } from '~/components/patient/details/PatientDetailsView';
import { AppointmentList } from '~/components/appointments/AppointmentList';
import { AppointmentTypeList } from '~/components/appointments/AppointmentTypeList';
import { ClinicalAssessmentList } from '~/components/clinical/ClinicalAssessmentList';
import { VitalSignsList } from '~/components/clinical/VitalSignsList';
import { ContactList } from '~/components/contacts/ContactList';
import { ConsentFormList } from '~/components/medical-records/ConsentFormList';
import { DiagnosisHistoryList } from '~/components/medical-records/DiagnosisHistoryList';
import { ProviderList } from '~/components/providers/ProviderList';
import { UserList } from '~/components/providers/UserList';

type Assessment = KipuCiwaAr | KipuCiwaB | KipuCows;

interface ParsedToolResult {
  status: 'approved' | 'rejected' | 'error' | 'processed';
  message: string;
  text?: string;
  timestamp?: string;
  data?: {
    templates?: unknown[];
    evaluations?: unknown[];
    evaluation?: unknown;
    patients?: PatientAdmission[] | PatientCensus[];
    total?: number;
    patient?: PatientDetails;
    appointments?: KipuAppointment[];
    types?: KipuAppointmentType[];
    assessments?: Assessment[];
    vitalSigns?: KipuVitalSigns[];
    contacts?: KipuContact[];
    forms?: KipuConsentForm[];
    diagnoses?: KipuDiagnosisHistory[];
    providers?: KipuProvider[];
    users?: KipuUser[];
  };
}

interface KipuToolRendererProps {
  toolName: string;
  result: unknown;
}

/** Helper: Parse tool result safely */
const parseToolResult = (result: unknown): ParsedToolResult => {
  if (typeof result === 'string') {
    try {
      return JSON.parse(result) as ParsedToolResult;
    } catch {
      return { status: 'error', message: 'Failed to parse tool result' };
    }
  }
  return result as ParsedToolResult;
};

export function KipuToolRenderer({ toolName, result }: KipuToolRendererProps) {
  const resultObj = parseToolResult(result);

  switch (toolName) {
    case 'fetchEvaluationTemplates':
      return <EvaluationTemplateList templates={resultObj.data?.templates || []} />;
    case 'fetchPatientEvaluations':
      return <PatientEvaluationViewer evaluations={resultObj.data?.evaluations || []} />;
    case 'createPatientEvaluation':
      return <EvaluationCreated evaluation={resultObj.data?.evaluation} />;
    case 'fetchPatientAdmissions': {
      const { patients = [], total = 0 } = resultObj.data || {};
      return <PatientAdmissionsList admissions={patients as PatientAdmission[]} total={total} />;
    }
    case 'fetchPatientCensus': {
      const { patients = [], total = 0 } = resultObj.data || {};
      return <PatientCensusList patients={patients as PatientCensus[]} total={total} />;
    }
    case 'fetchPatientDetails': {
      const { patient } = resultObj.data || {};
      return patient ? <PatientDetailsView patient={patient as PatientDetails} /> : null;
    }
    case 'fetchAppointments':
      return <AppointmentList appointments={resultObj.data?.appointments as KipuAppointment[] || []} total={resultObj.data?.total || 0} />;
    case 'fetchAppointmentTypes':
      return <AppointmentTypeList types={resultObj.data?.types as KipuAppointmentType[] || []} />;
    case 'fetchCiwaArs':
    case 'fetchCiwaBs':
    case 'fetchCows':
      return <ClinicalAssessmentList 
        assessments={resultObj.data?.assessments as Assessment[] || []} 
        type={toolName.replace('fetch', '').toLowerCase()} 
        total={resultObj.data?.total || 0} 
      />;
    case 'fetchVitalSigns':
      return <VitalSignsList vitalSigns={resultObj.data?.vitalSigns as KipuVitalSigns[] || []} total={resultObj.data?.total || 0} />;
    case 'fetchContacts':
      return <ContactList contacts={resultObj.data?.contacts as KipuContact[] || []} total={resultObj.data?.total || 0} />;
    case 'fetchConsentForms':
      return <ConsentFormList forms={resultObj.data?.forms as KipuConsentForm[] || []} total={resultObj.data?.total || 0} />;
    case 'fetchPatientDiagnosisHistory':
      return <DiagnosisHistoryList diagnoses={resultObj.data?.diagnoses as KipuDiagnosisHistory[] || []} total={resultObj.data?.total || 0} />;
    case 'fetchProviders':
      return <ProviderList providers={resultObj.data?.providers as KipuProvider[] || []} total={resultObj.data?.total || 0} />;
    case 'fetchUsers':
      return <UserList users={resultObj.data?.users as KipuUser[] || []} total={resultObj.data?.total || 0} />;
    default:
      return (
        <div className="text-xs rounded-md p-3 border bg-green-50 text-green-700 border-green-200 space-y-2"> 
          <div className="font-semibold">✅ Tool Result: {toolName}</div>
          <pre className="whitespace-pre-wrap bg-green-100 p-2 rounded">{JSON.stringify(resultObj, null, 2)}</pre>
        </div>
      );
  }
} 