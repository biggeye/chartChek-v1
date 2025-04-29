import { KipuVitalSigns } from '~/lib/kipu/service/clinical-assessment-service';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { formatDate } from '~/lib/utils/date';

interface VitalSignsListProps {
  vitalSigns: KipuVitalSigns[];
  total: number;
}

export function VitalSignsList({ vitalSigns, total }: VitalSignsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vital Signs ({total})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {vitalSigns.map((vitals) => (
            <div key={vitals.id} className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-2">
                Recorded: {formatDate(vitals.recordedAt)}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-medium">Temperature</div>
                  <div>{vitals.temperature}°F</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Pulse</div>
                  <div>{vitals.pulse} bpm</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Respiratory Rate</div>
                  <div>{vitals.respiratoryRate} breaths/min</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Blood Pressure</div>
                  <div>{vitals.bloodPressureSystolic}/{vitals.bloodPressureDiastolic} mmHg</div>
                </div>
                {vitals.oxygenSaturation && (
                  <div>
                    <div className="text-sm font-medium">O2 Saturation</div>
                    <div>{vitals.oxygenSaturation}%</div>
                  </div>
                )}
              </div>
              {vitals.notes && (
                <div className="mt-4 text-sm italic border-t pt-2">
                  {vitals.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 