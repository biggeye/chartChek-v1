    import { NextRequest, NextResponse } from 'next/server';
    import { createServer } from '~/utils/supabase/server';
    import { cookies } from 'next/headers';
    import { ProtocolResponse, UpdateProtocolRequest } from '~/types/api/compliance';

    export async function GET(
      request: NextRequest,
      { params }: { params: { id: string } }
    ) {
      try {
        const supabase = await createServer();
        
        const { data, error } = await supabase
          .from('compliance_protocols')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) throw error;

        return NextResponse.json<ProtocolResponse>({
          success: true,
          data
        });
      } catch (error) {
        console.error('Error fetching protocol:', error);
        return NextResponse.json<ProtocolResponse>({
          success: false,
          error: 'Failed to fetch protocol'
        }, { status: 500 });
      }
    }

    export async function PATCH(
      request: NextRequest,
      { params }: { params: { id: string } }
    ) {
      try {
        const supabase = await createServer();
        
        // Verify user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          return NextResponse.json<ProtocolResponse>({
            success: false,
            error: 'Unauthorized'
          }, { status: 401 });
        }

        const body: UpdateProtocolRequest = await request.json();

        // Update protocol
        const { data, error } = await supabase
          .from('compliance_protocols')
          .update({
            ...body,
            updated_by: session.user.id
          })
          .eq('id', params.id)
          .select()
          .single();

        if (error) throw error;

        return NextResponse.json<ProtocolResponse>({
          success: true,
          data
        });
      } catch (error) {
        console.error('Error updating protocol:', error);
        return NextResponse.json<ProtocolResponse>({
          success: false,
          error: 'Failed to update protocol'
        }, { status: 500 });
      }
    }

    export async function DELETE(
      request: NextRequest,
      { params }: { params: { id: string } }
    ) {
      try {
        const supabase = await createServer();
        
        // Verify user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          return NextResponse.json<ProtocolResponse>({
            success: false,
            error: 'Unauthorized'
          }, { status: 401 });
        }

        // Soft delete by setting is_active to false
        const { data, error } = await supabase
          .from('compliance_protocols')
          .update({
            is_active: false,
            updated_by: session.user.id
          })
          .eq('id', params.id)
          .select()
          .single();

        if (error) throw error;

        return NextResponse.json<ProtocolResponse>({
          success: true,
          data
        });
      } catch (error) {
        console.error('Error deleting protocol:', error);
        return NextResponse.json<ProtocolResponse>({
          success: false,
          error: 'Failed to delete protocol'
        }, { status: 500 });
      }
    } 