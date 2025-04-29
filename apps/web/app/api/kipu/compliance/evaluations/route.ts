import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { enhanceRouteHandler } from '@kit/next/routes';
import { createServer } from '~/utils/supabase/server';

// Accept array of evaluation objects (matches frontend payload)
const EvaluationSelectionSchema = z.object({
  evaluations: z.array(z.object({
    evaluation_template_id: z.number(),
    name: z.string(),
    patient_process_id: z.number(),
  }))
});

// GET: List selected compliance evaluations for the current account
export const GET = enhanceRouteHandler(async () => {
  const supabase = await createServer();
  const user = await supabase.auth.getUser();
  const accountId = user?.data.user?.id;

  const { data, error } = await supabase
    .from('compliance_evaluations')
    .select('*')
    .eq('account_id', accountId)
    .order('display_order');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Join with evaluation_templates for details (assuming you have a table for this)
  const templateIds = data.map((row: any) => row.evaluation_template_id);
  // Return in order
  return NextResponse.json(templateIds);
});

// POST: Update selection/order
export const POST = enhanceRouteHandler(async ({ request }) => {
  console.log('POST: Update compliance evaluations selection');
  const supabase = await createServer();
  const user = await supabase.auth.getUser();
  const accountId = user.data.user?.id;
  const body = await request.json();
  console.log('Request body:', body);
  const parsed = EvaluationSelectionSchema.safeParse(body);
  if (!parsed.success) {
    console.log('Invalid input:', parsed.error);
    return NextResponse.json({ error: 'Invalid input', details: parsed.error }, { status: 400 });
  }
  // Remove all current selections, then upsert new ones
  console.log('Removing current selections for account:', accountId);
  await supabase.from('compliance_evaluations').delete().eq('account_id', accountId);
  console.log('Upserting new selection:', parsed.data.evaluations);
  const upserts = parsed.data.evaluations.map((evaluation: any, idx: number) => ({
    account_id: accountId,
    evaluation_template_id: evaluation.evaluation_template_id,
    display_order: idx
  }));
  const { error } = await supabase.from('compliance_evaluations').upsert(upserts);
  if (error) {
    console.log('Error upserting:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  console.log('Success!');
  return NextResponse.json({ success: true });
});

// DELETE: Remove a single template from selection
export const DELETE = enhanceRouteHandler(async ({ user, request }) => {
  const supabase = await createServer();
  const accountId = user?.id;
  const { evaluationTemplateId } = await request.json();
  const { error } = await supabase
    .from('compliance_evaluations')
    .delete()
    .eq('account_id', accountId)
    .eq('evaluation_template_id', evaluationTemplateId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
});
