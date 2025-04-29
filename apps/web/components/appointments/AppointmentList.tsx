import { KipuAppointment } from '~/lib/kipu/service/appointment-service';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { formatDate } from '~/lib/utils/date';

interface AppointmentListProps {
  appointments: KipuAppointment[];
  total: number;
}

export function AppointmentList({ appointments, total }: AppointmentListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointments ({total})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{appointment.type}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(appointment.startTime)} - {formatDate(appointment.endTime)}
                  </div>
                </div>
                <div className="text-sm">
                  <span className={`px-2 py-1 rounded-full ${
                    appointment.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                    appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {appointment.status}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-sm">
                <div>Location: {appointment.location}</div>
                {appointment.notes && <div className="mt-1 italic">{appointment.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 