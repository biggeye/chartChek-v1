import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '~/utils/supabase/server';
// import { ProtocolRequirement } from '~/types/api/compliance';

// Type for POST body
interface AddRequirementsRequest {
  requirements: Array<{
    evaluationId: number;
    requirement: 'admission' | 'daily' | 'cyclic';
  }>;
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  const { id } = await params;
  try {
    const supabase = await createServer();
    const { data, error } = await supabase
      .from('compliance_protocol_requirements')
      .select('*')
      .eq('protocol_id', id);
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching protocol requirements:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch requirements' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  const { id } = await params;
  try {
    const supabase = await createServer();
    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const body: AddRequirementsRequest = await request.json();
    if (!body.requirements || !Array.isArray(body.requirements) || body.requirements.length === 0) {
      return NextResponse.json({ success: false, error: 'No requirements provided' }, { status: 400 });
    }
    // Prepare insert data
    const insertData = body.requirements.map(r => ({
      protocol_id: id,
      evaluation_id: r.evaluationId,
      requirement: r.requirement
    }));
    const { data, error } = await supabase
      .from('compliance_protocol_requirements')
      .upsert(insertData, { onConflict: 'protocol_id,evaluation_id,requirement' })
      .select();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error adding protocol requirements:', error);
    return NextResponse.json({ success: false, error: 'Failed to add requirements' }, { status: 500 });
  }
} 