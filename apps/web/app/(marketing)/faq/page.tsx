import Link from 'next/link';

import { ArrowRight, ChevronDown } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Trans } from '@kit/ui/trans';

import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:faq'),
  };
};

async function FAQPage() {
  const { t } = await createI18nServerInstance();

  // Replace generic content with chartChek specific FAQs
  const faqItems = [
    {
      question: `What exactly does chartChek do for my KIPU EMR?`,
      answer: `chartChek enhances your existing KIPU EMR by adding layers for compliance monitoring, workflow automation, and actionable data insights. It helps you prepare for audits (CARF, Joint Commission, State), streamline processes, and understand your facility's performance better without replacing KIPU.`,
    },
    {
      question: `Is chartChek a replacement for KIPU?`,
      answer: `No, chartChek is designed to work *with* your existing KIPU EMR installation. It leverages your KIPU data to provide additional value and functionality, focusing on compliance and process improvement.`,
    },
    {
      question: `How does chartChek access KIPU data? Is it secure?`,
      answer: `chartChek uses secure, KIPU-approved methods for data interaction, following strict security protocols. We prioritize data privacy and security, ensuring compliance with HIPAA and other relevant regulations. We do not store sensitive PHI outside of secure, compliant environments.`,
    },
    {
      question: `What kind of compliance standards does chartChek help with?`,
      answer: `Our primary focus is helping facilities meet CARF, Joint Commission, and state-specific behavioral health/substance abuse treatment regulations. We provide tools for automated checks, documentation tracking, and reporting relevant to these standards.`,
    },
    {
      question: `Will using chartChek require extensive retraining for my staff?`,
      answer: `chartChek is designed to be intuitive and integrate smoothly with existing KIPU workflows where possible. While there will be a learning curve for the new features, the goal is to enhance, not overhaul, your team's processes. We provide comprehensive onboarding and support.`,
    },
    {
      question: `What is the pricing model for chartChek?`,
      answer: `We offer tiered subscription plans based on facility size and feature requirements. Please visit our Pricing page or contact our sales team for a detailed quote tailored to your needs.`,
    },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => {
      return {
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      };
    }),
  };

  return (
    <>
      <script
        key={'ld:json'}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className={'flex flex-col space-y-4 xl:space-y-8'}>
        <SitePageHeader
          title={t('marketing:faq')}
          subtitle={t('marketing:faqSubtitle')}
        />

        <div className={'container flex flex-col space-y-8 pb-16'}>
          <div className="flex w-full max-w-xl flex-col">
            {faqItems.map((item, index) => {
              return <FaqItem key={index} item={item} />;
            })}
          </div>

          <div>
            <Button asChild variant={'outline'}>
              <Link href={'/contact'}>
                <span>
                  <Trans i18nKey={'marketing:contactFaq'} />
                </span>

                <ArrowRight className={'ml-2 w-4'} />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default withI18n(FAQPage);

function FaqItem({
  item,
}: React.PropsWithChildren<{
  item: {
    question: string;
    answer: string;
  };
}>) {
  return (
    <details className={'group border-b px-2 py-4 last:border-b-transparent'}>
      <summary
        className={
          'flex items-center justify-between hover:cursor-pointer hover:underline'
        }
      >
        <h2
          className={
            'hover:underline-none cursor-pointer font-sans font-medium'
          }
        >
          <Trans i18nKey={item.question} defaults={item.question} />
        </h2>

        <div>
          <ChevronDown
            className={'h-5 transition duration-300 group-open:-rotate-180'}
          />
        </div>
      </summary>

      <div className={'text-muted-foreground flex flex-col space-y-2 py-1'}>
        <Trans i18nKey={item.answer} defaults={item.answer} />
      </div>
    </details>
  );
}
