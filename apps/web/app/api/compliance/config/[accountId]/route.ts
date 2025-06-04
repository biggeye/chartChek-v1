import { NextResponse } from 'next/server'
import { createServer } from '~/utils/supabase/server'
import { complianceConfigSchema } from '~/types/complianceConfig'
import { z } from 'zod'

export async function GET(
  request: Request,
  { params }: { params: { accountId: string } }
) {
  const supabase = await createServer()
  const { accountId } = params

  if (!accountId) {
    return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('compliance_configs')
      .select('config')
      .eq('account_id', accountId)
      .single()

    if (error) {
      console.error('Error fetching compliance config:', error)
      return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Config not found' }, { status: 404 })
    }

    // Validate the config against our schema
    const validatedConfig = complianceConfigSchema.parse(data.config)
    return NextResponse.json(validatedConfig)
  } catch (error) {
    console.error('Unexpected error in compliance config route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { accountId: string } }
) {
  const supabase = await createServer()
  const { accountId } = params

  if (!accountId) {
    return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
  }

  try {
    const body = await request.json()
    
    // Validate the incoming config
    const validatedConfig = complianceConfigSchema.parse(body)

    const { error } = await supabase
      .from('compliance_configs')
      .upsert([
        {
          account_id: accountId,
          config: validatedConfig,
          updated_at: new Date().toISOString(),
        }
      ], { onConflict: 'account_id' })

    if (error) {
      console.error('Error saving compliance config:', error)
      return NextResponse.json({ error: 'Failed to save config' }, { status: 500 })
    }

    return NextResponse.json(validatedConfig)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid config format' }, { status: 400 })
    }
    console.error('Unexpected error in compliance config route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 