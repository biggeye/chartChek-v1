import { PageBody, PageHeader } from '@kit/ui/page';

import { DashboardDemo } from '~/admin/_components/dashboard-demo';

export default function HomePage() {
  return (
    <>
      <PageHeader description={'Your SaaS at a glance'} />

      <PageBody>
        <DashboardDemo />
      </PageBody>
    </>
  );
}
