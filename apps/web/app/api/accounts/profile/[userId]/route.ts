import { NextResponse } from 'next/server'
import { createServer } from '~/utils/supabase/server'
import { z } from 'zod'

const userProfileSchema = z.object({
  username: z.string().nullable(),
  avatar_url: z.string().nullable(),
})

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const supabase = await createServer()
  const { userId } = params

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('username, avatar_url')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Validate the data against our schema
    const validatedData = userProfileSchema.parse(data)
    return NextResponse.json(validatedData)
  } catch (error) {
    console.error('Unexpected error in profile route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 