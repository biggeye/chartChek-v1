import { KipuProvider } from '~/lib/kipu/service/provider-service';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';

interface ProviderListProps {
  providers: KipuProvider[];
  total: number;
}

export function ProviderList({ providers, total }: ProviderListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Providers ({total})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {providers.map((provider) => (
            <div key={provider.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">
                    {provider.firstName} {provider.lastName}
                    {provider.title && (
                      <span className="text-sm text-muted-foreground ml-2">
                        ({provider.title})
                      </span>
                    )}
                  </div>
                  {provider.specialties && provider.specialties.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {provider.specialties.map((specialty, index) => (
                        <Badge key={index} variant="outline">{specialty}</Badge>
                      ))}
                    </div>
                  )}
                  {provider.npi && (
                    <div className="text-sm text-muted-foreground mt-1">
                      NPI: {provider.npi}
                    </div>
                  )}
                </div>
                <Badge variant={provider.status === 'active' ? 'success' : 'secondary'}>
                  {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
                </Badge>
              </div>
              <div className="mt-4">
                <div className="text-sm font-medium">Roles:</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {provider.roles.map((role, index) => (
                    <Badge key={index} variant="outline">{role}</Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 