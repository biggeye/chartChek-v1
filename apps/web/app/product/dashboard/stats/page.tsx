import React from 'react';
import { ComplianceMetricsDashboard } from '~/components/compliance/ComplianceMetricsDashboard';
import { useComplianceMetrics } from '~/hooks/useComplianceMetrics';
import { StatsModule } from '~/components/stats/StatsModule';
import { createClient } from '~/utils/supabase/client';


export default async function Stats() {
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
const userId = user?.id;
const { data: complianceData, isLoading: isLoadingCompliance } = useComplianceMetrics();

 
// TODO: Verify if userId is the correct type for 'credentials' prop in StatsModule
// Currently passing userId, but StatsModule might expect KipuCredentials.
    return (
      <>  
      {!isLoadingCompliance && complianceData?.data && (
          <ComplianceMetricsDashboard
            currentMetrics={complianceData.data.currentMetrics}
            historicalMetrics={complianceData.data.historicalMetrics}
            patientCompliance={complianceData.data.patientCompliance}
          />
        )}
    <StatsModule facilityId="2" credentials={{accessId: "123", appId: "123", baseUrl: "www.whoa.com", secretKey: "whoaSoSecret" }} />
    </>
  ) 
}
