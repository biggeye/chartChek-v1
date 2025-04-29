import { KipuDiagnosisHistory } from '~/lib/kipu/service/medical-records-service';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { formatDate } from '~/lib/utils/date';

interface DiagnosisHistoryListProps {
  diagnoses: KipuDiagnosisHistory[];
  total: number;
}

export function DiagnosisHistoryList({ diagnoses, total }: DiagnosisHistoryListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'resolved':
        return 'bg-blue-100 text-blue-800';
      case 'chronic':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnosis History ({total})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {diagnoses.map((diagnosis) => (
            <div key={diagnosis.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{diagnosis.diagnosis}</div>
                  <div className="text-sm text-muted-foreground">
                    Diagnosed: {formatDate(diagnosis.diagnosedAt)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    By: {diagnosis.diagnosedBy.name} ({diagnosis.diagnosedBy.role})
                  </div>
                </div>
                <Badge className={getStatusColor(diagnosis.status)}>
                  {diagnosis.status.charAt(0).toUpperCase() + diagnosis.status.slice(1)}
                </Badge>
              </div>
              {diagnosis.notes && (
                <div className="mt-4 text-sm italic border-t pt-2">
                  {diagnosis.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 