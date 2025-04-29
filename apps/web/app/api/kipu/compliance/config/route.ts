import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getComplianceConfig, setComplianceConfig } from '~/lib/services/accountService';
import { complianceConfigSchema } from '~/types/complianceConfig';
import { enhanceRouteHandler } from '@kit/next/routes';

// GET: Fetch compliance config for the current account
export const GET = enhanceRouteHandler(async ({ user, request }) => {
  // TODO: Replace with real account/facility id logic
  const accountId = user?.id || 'demo-facility-id';
  const config = await getComplianceConfig(accountId);
  return NextResponse.json(config);
});

// POST: Update compliance config for the current account
export const POST = enhanceRouteHandler(async ({ user, request }) => {
  const accountId = user?.id || 'demo-facility-id';
  const body = await request.json();
  const parsed = complianceConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid config', details: parsed.error }, { status: 400 });
  }
  await setComplianceConfig(accountId, parsed.data);
  return NextResponse.json({ success: true });
});
