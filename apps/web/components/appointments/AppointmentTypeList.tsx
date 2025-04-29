import { KipuAppointmentType } from '~/lib/kipu/service/appointment-service';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';

interface AppointmentTypeListProps {
  types: KipuAppointmentType[];
}

export function AppointmentTypeList({ types }: AppointmentTypeListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointment Types</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map((type) => (
            <div 
              key={type.id} 
              className="border rounded-lg p-4"
              style={{ borderLeftColor: type.color, borderLeftWidth: '4px' }}
            >
              <div className="font-semibold">{type.name}</div>
              <div className="text-sm text-muted-foreground">
                Duration: {type.duration} minutes
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 