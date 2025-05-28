'use client'
import { useState, useCallback } from 'react';
import ComplianceConfigSettings from '../_components/ComplianceConfigSettings';
import ClassificationTable from '../_components/ClassificationTable';
import { complianceConfigSchema } from '~/types/complianceConfig';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';

export default function ComplianceSettings() {
  const [config, setConfig] = useState(complianceConfigSchema);

  // Function to trigger KIPU evaluations sync
  const syncKipuEvaluations = useCallback(async () => {
    try {
      const res = await fetch('/api/kipu/evaluations/sync', { method: 'POST' });
      const data = await res.json();
      return { success: res.ok, data };
    } catch (err) {
      return { success: false, data: { error: err instanceof Error ? err.message : String(err) } };
    }
  }, []);

  return (
    <>
      <Tabs>
        <TabsList>
          <TabsTrigger value="results">
            Evaluation Selection
          </TabsTrigger>
          <TabsTrigger value="configuration">
            Protocol Configuration
          </TabsTrigger>
        </TabsList>
        <TabsContent value="configuration">
          <ComplianceConfigSettings />
        </TabsContent>
        <TabsContent value="results">
          <ClassificationTable />
        </TabsContent>
      </Tabs>
    </>
  );
}

