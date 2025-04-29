import { KipuConsentForm } from '~/lib/kipu/service/medical-records-service';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';

interface ConsentFormListProps {
  forms: KipuConsentForm[];
  total: number;
}

export function ConsentFormList({ forms, total }: ConsentFormListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Consent Forms ({total})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {forms.map((form) => (
            <div key={form.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{form.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Version: {form.version}
                  </div>
                </div>
                <Badge variant={form.isActive ? "success" : "secondary"}>
                  {form.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {form.description && (
                <div className="mt-2 text-sm">
                  {form.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 