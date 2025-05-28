import { NextRequest, NextResponse } from 'next/server';
import { createServer } from '~/utils/supabase/server';
import { ProtocolResponse, ProtocolsResponse, CreateProtocolRequest, UpdateProtocolRequest, ProtocolQueryParams } from '~/types/api/compliance';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServer();
    
    console.log('Protocols API - Incoming GET request:', { url: request.url, method: request.method });
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    console.log('Protocols API - Query params:', { isActive, search, page, limit });
    
    // Build query
    let query = supabase
      .from('compliance_protocols')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (isActive !== null) {  // Only apply if explicitly set
      query = query.eq('is_active', isActive === 'true');
    }
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    console.log('Protocols API - Supabase query object:', query);

    console.log('Protocols API - Executing query...');
    const { data, error } = await query;
    console.log('Protocols API - Query result:', { data, error });

    if (error) throw error;

    return NextResponse.json<ProtocolsResponse>({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching protocols:', error);
    return NextResponse.json<ProtocolsResponse>({
      success: false,
      error: 'Failed to fetch protocols'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServer();
    console.log('Protocols API - Incoming POST request:', { url: request.url, method: request.method });

    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Protocols API - Session:', session);
    if (!session) {
      return NextResponse.json<ProtocolResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const user = await supabase.auth.getUser();
    console.log('Protocols API - User:', user);
    const userId = user.data?.user?.id;

    const body: CreateProtocolRequest = await request.json();
    console.log('Protocols API - POST body:', body);

    // Validate required fields
    if (!body.name || !body.cycleLength) {
      console.log('Protocols API - Missing required fields:', { name: body.name, cycleLength: body.cycleLength });
      return NextResponse.json<ProtocolResponse>({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Create protocol (only protocol metadata)
    const { data, error } = await supabase
      .from('compliance_protocols')
      .insert({
        created_by: userId,
        name: body.name,
        description: body.description,
        cycle_length: body.cycleLength,
        is_active: true
      })
      .select()
      .single();
    console.log('Protocols API - Insert result:', { data, error });

    if (error) throw error;

    return NextResponse.json<ProtocolResponse>({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error creating protocol:', error);
    return NextResponse.json<ProtocolResponse>({
      success: false,
      error: 'Failed to create protocol'
    }, { status: 500 });
  }
} 