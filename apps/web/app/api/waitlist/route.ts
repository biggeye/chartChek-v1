import { z } from 'zod';
import { NextResponse } from 'next/server';
import { createServer } from '~/utils/supabase/server';

const WaitlistEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: Request) {
  const data = await request.json();

  try {
    // Validate input
    const { email } = WaitlistEmailSchema.parse(data);

    const supabase = await createServer();

    // Insert email into the waitlist table
    const { error } = await supabase
      .from('waitlist_emails') // Ensure this table exists!
      .insert({ email: email.toLowerCase() })
      .select('id')
      .single();

    if (error) {
      // Handle potential errors, e.g., unique constraint violation (email already exists)
      if (error.code === '23505') { // Postgres unique violation code
        // Email already exists, consider it a success for the user
        console.warn(`Waitlist email already exists: ${email}`);
        return NextResponse.json({ success: true }, { status: 200 });
      }

      console.error('Error inserting waitlist email:', error);
      return NextResponse.json(
        { error: 'Failed to add email to waitlist.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
