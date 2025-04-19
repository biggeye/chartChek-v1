'use client';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';
import { Trans } from '@kit/ui/trans';
import { toast } from 'sonner';

const FormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

type WaitlistFormData = z.infer<typeof FormSchema>;

export function WaitlistForm({ children }: { children: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(
    null,
  );

  const form = useForm<WaitlistFormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(data: WaitlistFormData) {
    setIsSubmitting(true);
    setSubmissionMessage(null);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit email.');
      }

      // Success
      setSubmissionMessage('Thank you! We\'ll notify you when we launch.');
      form.reset();
      // Optionally close the dialog after a short delay
      setTimeout(() => setIsOpen(false), 3000);
    } catch (error) {
      console.error('Waitlist submission error:', error);
      setSubmissionMessage(
        error instanceof Error ? error.message : 'An unexpected error occurred.',
      );
      toast.error('Submission Error', {
        description: (
          error instanceof Error
            ? error.message
            : 'Could not add email to waitlist.'
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="marketing:waitlist.title" />
          </DialogTitle>
          <DialogDescription>
            <>
              <Trans i18nKey="marketing:waitlist.description" />
            </>
          </DialogDescription>
        </DialogHeader>

        {submissionMessage ? (
          <div className="py-4 text-center text-sm text-green-600 dark:text-green-400">
            {submissionMessage}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Trans i18nKey="common:emailAddress" />
                    </FormLabel>
                    <FormControl>
                      <Input
                        data-test="waitlist-email-input"
                        placeholder="you@example.com"
                        type="email"
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="submit"
                  data-test="waitlist-submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Trans i18nKey="marketing:waitlist.submitting" />
                  ) : (
                    <Trans i18nKey="marketing:waitlist.submitButton" />
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Add necessary translations to your i18n files (e.g., apps/web/public/locales/en/common.json and apps/web/public/locales/en/marketing.json)
/*
// common.json
{
  "emailAddress": "Email Address"
}

// marketing.json
{
  "waitlist": {
    "title": "Coming Soon!",
    "description": "chartChek isn't quite ready yet. Enter your email below, and we'll notify you when we launch.",
    "submitButton": "Notify Me",
    "submitting": "Submitting..."
  }
}
*/
