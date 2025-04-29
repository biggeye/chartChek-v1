import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import { Badge } from "@kit/ui/badge";
import { formatDate } from "~/lib/utils/date";

export interface PatientDetails {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  status: string;
  facilityName: string;
  insurance: {
    provider: string;
    policyNumber: string;
    type: string;
  };
  demographics: {
    address: string;
    phone: string;
    email?: string;
  };
}

interface PatientDetailsViewProps {
  patient: PatientDetails;
}

export function PatientDetailsView({ patient }: PatientDetailsViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{patient.name}</h2>
        <Badge variant={patient.status === 'Active' ? 'success' : 'secondary'}>
          {patient.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Date of Birth:</span>{" "}
              {formatDate(patient.dateOfBirth)}
            </div>
            <div>
              <span className="font-medium">Gender:</span> {patient.gender}
            </div>
            <div>
              <span className="font-medium">Facility:</span> {patient.facilityName}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Insurance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Provider:</span>{" "}
              {patient.insurance.provider}
            </div>
            <div>
              <span className="font-medium">Policy Number:</span>{" "}
              {patient.insurance.policyNumber}
            </div>
            <div>
              <span className="font-medium">Type:</span> {patient.insurance.type}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Address:</span>{" "}
              {patient.demographics.address}
            </div>
            <div>
              <span className="font-medium">Phone:</span>{" "}
              {patient.demographics.phone}
            </div>
            {patient.demographics.email && (
              <div>
                <span className="font-medium">Email:</span>{" "}
                {patient.demographics.email}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 