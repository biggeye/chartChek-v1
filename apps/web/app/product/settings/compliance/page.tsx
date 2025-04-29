'use client'
import { useState } from 'react';
import ComplianceConfigSettings from '~/components/settings/ComplianceConfigSettings';
import ClassificationTable from '~/components/settings/ClassificationTable';
import { complianceConfigSchema } from '~/types/complianceConfig';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';
export default function ComplianceSettings() {

  const [config, setConfig] = useState(complianceConfigSchema);



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

