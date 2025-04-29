import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@kit/ui/table";
import { Badge } from "@kit/ui/badge";

export interface PatientCensus {
  id: string;
  name: string;
  facilityName: string;
  status: string;
  insuranceType: string;
  roomNumber?: string;
}

interface PatientCensusListProps {
  patients: PatientCensus[];
  total: number;
}

export function PatientCensusList({ patients, total }: PatientCensusListProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Current Census</h3>
        <Badge variant="secondary">Total Patients: {total}</Badge>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Facility</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Insurance</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell>{patient.name}</TableCell>
              <TableCell>{patient.facilityName}</TableCell>
              <TableCell>{patient.roomNumber || 'N/A'}</TableCell>
              <TableCell>{patient.insuranceType}</TableCell>
              <TableCell>
                <Badge variant={patient.status === 'Active' ? 'success' : 'secondary'}>
                  {patient.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 