import { NextResponse, NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { createServer } from '~/utils/supabase/server';
import { generateText } from 'ai';

const EVAL_CATEGORIES = [
  'Assessments',
  'Screenings',
  'TreatmentPlans',
  'ConsentForms',
  'AdministrativeForms',
  'Medical',
  'Other'
];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServer();

    const {
      evaluations
    }: {
      evaluations: Array<{
        evaluation_template_id?: number;
        id?: number;
        name: string;
        patient_process_id: string;
      }>;
    } = await req.json();

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const prompts = evaluations.map(({ name }) =>
      `Classify the following evaluation into one of these categories: ${EVAL_CATEGORIES.join(", ")}.\nEvaluation name: "${name}"\nReturn only the category.`
    );

  
    const responses = await Promise.all(
      prompts.map(async (prompt) => {
        const { text } = await generateText({
          model: openai('gpt-4'),
          system: 'You are a healthcare compliance assistant helping categorize evaluation templates.',
          prompt,
          temperature: 0.2,
          maxTokens: 10,
        });
         return text;
      })
    );

    // Prepare the batch update payload for evaluation_templates
    const updates = evaluations.map((evaluation, idx) => ({
      id: evaluation.evaluation_template_id ?? evaluation.id,
      name: evaluation.name,
      patient_process_id: evaluation.patient_process_id,
      category: responses[idx] || 'Other',
      account_id: user.id,
    }));

    // Batch upsert (update) categories in evaluation_templates
    const { error } = await supabase
    .from('evaluation_templates')
    .upsert(updates, { onConflict: 'id' });
    if (error) throw new Error(error.message);

  
    return NextResponse.json({ status: 'success', updated: updates.length });
  } catch (err) {
    console.error('Classification error:', err);
    return NextResponse.json({
      error: 'Failed to classify and update evaluation_templates.',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}