import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangleIcon, ShieldAlertIcon, ExternalLinkIcon } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';

interface ComplianceAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  date: string;
  relatedPatientId?: string;
  relatedDocumentId?: string;
}

export function ComplianceAlertsCard() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComplianceAlerts = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, this would be an API call
        // For now, we'll simulate with mock data
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Mock data for demonstration
        const mockAlerts: ComplianceAlert[] = [
          {
            id: '1',
            title: 'Missing Trauma Assessment',
            description: 'Patient John D. is missing a required Trauma Assessment',
            severity: 'high',
            date: new Date().toISOString(),
            relatedPatientId: '1234:abcd-1234-5678'
          },
          {
            id: '2',
            title: 'Incomplete Bio-psychosocial Assessment',
            description: 'Bio-psychosocial Assessment for Sarah M. has been in progress for over 30 days',
            severity: 'medium',
            date: new Date(Date.now() - 86400000).toISOString(),
            relatedPatientId: '5678:efgh-5678-9012'
          },
          {
            id: '3',
            title: 'DHCS Compliance Update',
            description: 'New DHCS requirements effective May 1, 2025',
            severity: 'low',
            date: new Date(Date.now() - 172800000).toISOString()
          }
        ];
        
        setAlerts(mockAlerts);
      } catch (error) {
        console.error('Error fetching compliance alerts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplianceAlerts();
  }, []);

  // Get severity badge styling
  const getSeverityBadge = (severity: string) => {
    const styles = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };
    
    return styles[severity as keyof typeof styles] || styles.low;
  };

  return (
    <DashboardCard 
      title="Compliance Alerts" 
      description="Recent compliance issues that need attention"
      icon={<ShieldAlertIcon className="h-5 w-5" />}
      footer={
        <Button 
          variant="ghost" 
          className="w-full justify-center text-indigo_dye-600 hover:text-indigo_dye-900 hover:bg-indigo_dye-50"
          onClick={() => router.push('/protected/documents')}
        >
          View All Compliance Documents
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start space-x-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[180px]" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div 
              key={alert.id} 
              className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer"
              onClick={() => {
                if (alert.relatedPatientId) {
                  router.push(`/protected/patients/${encodeURIComponent(alert.relatedPatientId)}`);
                } else if (alert.relatedDocumentId) {
                  router.push(`/protected/documents/${alert.relatedDocumentId}`);
                }
              }}
            >
              <div className={`flex-shrink-0 p-2 rounded-full ${
                alert.severity === 'high' ? 'bg-red-100' : 
                alert.severity === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
              }`}>
                <AlertTriangleIcon className={`h-4 w-4 ${
                  alert.severity === 'high' ? 'text-red-600' : 
                  alert.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                }`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {alert.title}
                  </p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityBadge(alert.severity)}`}>
                    {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {alert.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(alert.date).toLocaleDateString()}
                </p>
              </div>
              {(alert.relatedPatientId || alert.relatedDocumentId) && (
                <div className="flex-shrink-0">
                  <ExternalLinkIcon className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500">No compliance alerts at this time</p>
        </div>
      )}
    </DashboardCard>
  );
}
