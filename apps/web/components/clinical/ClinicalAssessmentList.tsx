import { KipuCiwaAr, KipuCiwaB, KipuCows } from '~/lib/kipu/service/clinical-assessment-service';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { formatDate } from '~/lib/utils/date';

type Assessment = KipuCiwaAr | KipuCiwaB | KipuCows;

interface ClinicalAssessmentListProps {
  assessments: Assessment[];
  type: string;
  total: number;
}

export function ClinicalAssessmentList({ assessments, type, total }: ClinicalAssessmentListProps) {
  const title = type === 'ciwaars' ? 'CIWA-Ar' : 
                type === 'ciwabs' ? 'CIWA-B' : 
                'COWS';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title} Assessments ({total})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assessments.map((assessment) => (
            <div key={assessment.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">Score: {assessment.score}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(assessment.assessmentDate)}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {Object.entries(assessment.symptoms).map(([symptom, value]) => (
                  <div key={symptom} className="text-sm">
                    <span className="font-medium">{symptom}:</span> {value}
                  </div>
                ))}
              </div>
              {assessment.notes && (
                <div className="mt-4 text-sm italic border-t pt-2">
                  {assessment.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 