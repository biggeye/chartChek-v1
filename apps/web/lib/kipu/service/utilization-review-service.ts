import { KipuCredentials, KipuApiResponse } from 'types/kipu/kipuAdapter';
import { kipuServerGet } from '../auth/server';
import { parsePatientId } from '../auth/config';

// KIPU API Response Interfaces
interface KipuUtilizationReviewItem {
  id: number;
  start_date: string;
  end_date: string | null;
  number_of_days: number | null;
  frequency: string | null;
  level_of_care: string | null;
  lcd: boolean;
  authorization_date: string;
  authorization_number: string;
  next_review: string | null;
  insurance: string;
  comment: string;
  status: string;
  next_care_level: string | null;
  next_care_level_date: string | null;
}

interface KipuPatient {
  casefile_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  dob: string;
  utilization_reviews: KipuUtilizationReviewItem[];
}

interface KipuResponseData {
  patient: KipuPatient;
}

// Complete KIPU API Response
interface KipuUtilizationReviewResponse extends KipuApiResponse<KipuResponseData> {}

// Internal App Interfaces
export interface UtilizationReviewItem {
  id: number;
  startDate: string;
  endDate: string | null;
  numberOfDays: number | null;
  frequency: string | null;
  levelOfCare: string | null;
  lcd: boolean;
  authorizationDate: string;
  authorizationNumber: string;
  nextReview: string | null;
  insurance: string;
  comment: string;
  status: string;
  nextCareLevel: string | null;
  nextCareLevelDate: string | null;
}

export interface UtilizationReview {
  casefileId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dob: string;
  utilizationReviews: UtilizationReviewItem[];
}

export async function kipuListUtilizationReviews(
  patientId: string,
  credentials: KipuCredentials
): Promise<KipuApiResponse<UtilizationReview[]>> {
  const { chartId, patientMasterId } = parsePatientId(patientId);

  const queryParams = new URLSearchParams({
    app_id: credentials.appId,
    patient_master_id: patientMasterId,
  });

  const kipuResponse = await kipuServerGet<KipuResponseData>(
    `/api/patients/${chartId}/ur/?${queryParams.toString()}`,
    credentials
  );

  console.log('utilization review response: ', kipuResponse);

  if (!kipuResponse.success || !kipuResponse.data?.patient) {
    return {
      success: false,
      error: kipuResponse.error || {
        code: 'DATA_ERROR',
        message: 'Response data is undefined'
      }
    };
  }

  const { patient } = kipuResponse.data;

  const transformedData: UtilizationReview = {
    casefileId: patient.casefile_id,
    firstName: patient.first_name,
    middleName: patient.middle_name,
    lastName: patient.last_name,
    dob: patient.dob,
    utilizationReviews: patient.utilization_reviews.map((review: KipuUtilizationReviewItem) => ({
      id: review.id,
      startDate: review.start_date,
      endDate: review.end_date,
      numberOfDays: review.number_of_days,
      frequency: review.frequency,
      levelOfCare: review.level_of_care,
      lcd: review.lcd,
      authorizationDate: review.authorization_date,
      authorizationNumber: review.authorization_number,
      nextReview: review.next_review,
      insurance: review.insurance,
      comment: review.comment,
      status: review.status,
      nextCareLevel: review.next_care_level,
      nextCareLevelDate: review.next_care_level_date
    }))
  };

  return {
    success: true,
    data: [transformedData]
  };
}

/*
KIPU endpoint we're fetching from:
d
GET
/patients/{patient_id}/ur
List a patient's utilization reviews
Parameters
Name	Description
Accept *
string
(header)
Accept Header [Do not change this value]

Available values : application/vnd.kipusystems+json; version=3

Authorization *
string($APIAuth {access_id}:{signature})
(header)
APIAuth {your Access ID}:{signature}

Date *
string($rfc822)
(header)
RFC 822 Format (Example: Tue, 03 Sep 2019 16:05:56 GMT)

app_id *
string
(query)
app_id (also referred to as recipient_id, provided by Kipu)

patient_master_id *
string($uuid)
(query)
Patient Master UUID (Important: NOT ID)

patient_id *
integer
(path)
Location Patient ID

Responses
Code	Description	Links
200	
Success

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "patient": {
    "casefile_id": "casefilestring($casefile)",
    "first_name": "string",
    "middle_name": "string",
    "last_name": "string",
    "dob": "string",
    "utilization_reviews": [
      {
        "id": 0,
        "start_date": "string",
        "end_date": null,
        "number_of_days": null,
        "frequency": null,
        "level_of_care": null,
        "lcd": true,
        "authorization_date": "string",
        "authorization_number": "string",
        "next_review": null,
        "insurance": "string",
        "comment": "string",
        "status": "string",
        "next_care_level": null,
        "next_care_level_date": null
      }
    ]
  }
}

No links
404	
Not Found

Media type

application/json
Example Value
Schema
error_response{
errors*	string
}

*/