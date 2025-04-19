import Image from 'next/image';
import Link from 'next/link';

import { ArrowRightIcon, CheckCircle, FileCheck, Workflow, BarChartBig } from 'lucide-react';

import {
  CtaButton,
  FeatureGrid,
  FeatureShowcase,
  FeatureShowcaseIconContainer,
  Hero,
  Pill,
} from '@kit/ui/marketing';
import { Trans } from '@kit/ui/trans';
import { Card, CardHeader, CardTitle, CardDescription } from '@kit/ui/card';

import { withI18n } from '~/lib/i18n/with-i18n';
import { WaitlistForm } from '~/(marketing)/_components/site-waitlist-form';

function Home() {
  return (
    <div className={'mt-4 flex flex-col space-y-24 py-14'}>
      <div className={'container mx-auto'}>
        <Hero
          pill={
            <Pill label={'Enhancement'}>
              <span>Supercharge your KIPU EMR</span>
            </Pill>
          }
          title={
            <>
              <span>Unlock Compliance & Efficiency with chartChek</span>
            </>
          }
          subtitle={
            <span>
              Streamline workflows, ensure audit readiness, and gain critical insights from your KIPU data. chartChek transforms your EMR experience.
            </span>
          }
          cta={
            <WaitlistForm>
              <CtaButton>
                <Link href={'/auth/sign-up'}>
                  <span className={'flex items-center space-x-0.5'}>
                    <span>
                      <Trans i18nKey={'common:getStarted'} />
                    </span>

                    <ArrowRightIcon
                      className={
                        'animate-in fade-in slide-in-from-left-8 h-4' +
                        ' zoom-in fill-mode-both delay-1000 duration-1000'
                      }
                    />
                  </span>
                </Link>
              </CtaButton>
            </WaitlistForm>
          }
          image={
            <Image
              priority
              className={
                'dark:border-primary/10 rounded-2xl border border-gray-200'
              }
              width={3558}
              height={2222}
              src={`/images/dashboard.webp`}
              alt={`App Image`}
            />
          }
        />
      </div>

      <div className={'container mx-auto'}>
        <div
          className={'flex flex-col space-y-16 xl:space-y-32 2xl:space-y-36'}
        >
          <FeatureShowcase
            heading={
              <>
                <b className="font-semibold dark:text-white">
                  Elevate Your KIPU EMR Beyond the Basics
                </b>
                .{' '}
                <span className="text-muted-foreground font-normal">
                  chartChek integrates seamlessly with KIPU, providing tools designed by compliance experts to simplify audits and improve processes.
                </span>
              </>
            }
            icon={
              <FeatureShowcaseIconContainer>
                <CheckCircle className="h-5" />
                <span>Achieve compliance confidence</span>
              </FeatureShowcaseIconContainer>
            }
          >
            <FeatureGrid>
              {/* Card 1: Audit Readiness */}
              <Card className={'relative col-span-2 overflow-hidden'}>
                <CardHeader>
                  <div className="flex items-start space-x-3">
                    <FileCheck className="h-8 w-8 flex-shrink-0 text-primary" />
                    <div>
                      <CardTitle className="mb-1">Audit Readiness Simplified</CardTitle>
                      <CardDescription>
                        Navigate CARF, Joint Commission, and state audits with automated checks and proactive compliance monitoring integrated with KIPU.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Card 2: Streamlined Workflows */}
              <Card className={'relative col-span-2 w-full overflow-hidden lg:col-span-1'}>
                <CardHeader>
                  <div className="flex items-start space-x-3">
                    <Workflow className="h-8 w-8 flex-shrink-0 text-primary" />
                    <div>
                      <CardTitle className="mb-1">Streamlined Workflows</CardTitle>
                      <CardDescription>
                        Reduce manual tasks and improve staff efficiency with automated process enhancements built on top of your existing KIPU system.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Card 3: Actionable Insights */}
              <Card className={'relative col-span-2 overflow-hidden lg:col-span-1'}>
                <CardHeader>
                  <div className="flex items-start space-x-3">
                    <BarChartBig className="h-8 w-8 flex-shrink-0 text-primary" />
                    <div>
                      <CardTitle className="mb-1">Actionable Insights</CardTitle>
                      <CardDescription>
                        Visualize key performance and compliance metrics directly from your KIPU data to drive informed decision-making.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Card 4: Seamless KIPU Integration (No Icon) */}
              <Card className={'relative col-span-2 overflow-hidden'}>
                <CardHeader>
                  <CardTitle className="mb-1">Seamless KIPU Integration</CardTitle>
                  <CardDescription>
                    Leverages your existing KIPU EMR data securely and efficiently without requiring complex data migrations or workflow overhauls.
                  </CardDescription>
                </CardHeader>
              </Card>
            </FeatureGrid>
          </FeatureShowcase>
        </div>
      </div>

      <div className={'container mx-auto'}>
        <div className={'flex space-x-4'}>
          <WaitlistForm>
            <CtaButton>
              <Link href={'/auth/sign-up'}>
                <span className={'flex items-center space-x-0.5'}>
                  <span>
                    <Trans i18nKey={'common:getStarted'} />
                  </span>

                  <ArrowRightIcon
                    className={
                      'animate-in fade-in slide-in-from-left-8 h-4' +
                      ' zoom-in fill-mode-both delay-1000 duration-1000'
                    }
                  />
                </span>
              </Link>
            </CtaButton>
          </WaitlistForm>

          <WaitlistForm>
            <CtaButton variant={'link'}>
              <Link href={'/contact'}>
                <Trans i18nKey={'common:contactUs'} />
              </Link>
            </CtaButton>
          </WaitlistForm>
        </div>
      </div>
    </div>
  );
}

export default withI18n(Home);
