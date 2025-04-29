import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@kit/ui/table";
import { formatDate } from "~/lib/utils/date";

export interface PatientAdmission {
  id: string;
  name: string;
  admissionDate: string;
  facilityId: number;
  facilityName: string;
  status: string;
}

interface PatientAdmissionsListProps {
  admissions: PatientAdmission[];
  total: number;
}

export function PatientAdmissionsList({ admissions, total }: PatientAdmissionsListProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Patient Admissions</h3>
        <span className="text-sm text-muted-foreground">Total: {total}</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Admission Date</TableHead>
            <TableHead>Facility</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {admissions.map((admission) => (
            <TableRow key={admission.id}>
              <TableCell>{admission.name}</TableCell>
              <TableCell>{formatDate(admission.admissionDate)}</TableCell>
              <TableCell>{admission.facilityName}</TableCell>
              <TableCell>{admission.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 