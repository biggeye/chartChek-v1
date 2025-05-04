import { createServer } from '~/utils/supabase/server';
 import { NextResponse } from 'next/server';
 
 export async function GET() {
   const supabase = await createServer();
   const { data: { user }, error: authError } = await supabase.auth.getUser();
   const userId = user?.id;
   if (authError) {
     return NextResponse.json({ error: 'Failed to fetch user', details: authError }, { status: 500 });
   }

   const { data: staffWithFacilities, error: staffError } = await supabase
   .from('staff')
   .select(`
     id,
     email,
     full_name,
     role,
     account_id,
     facilities: staff_facility_access!inner (
       facility: facilities (id, name)
     )
   `)

   if (staffError) {
     return NextResponse.json({ error: 'Failed to fetch staff', details: staffError }, { status: 500 });
   }
   const processedStaff = staffWithFacilities?.map(staff => {
    // Ensure facilities is an array before mapping
    const facilities = Array.isArray(staff.facilities)
      ? staff.facilities
          .map(sfa => sfa.facility) // Extract the 'facility' object
          .filter(facility => facility !== null) // Filter out any potential nulls if using left join
      : [];
    return {
      ...staff, // Keep original staff fields (id, email, full_name, role, account_id)
      facilities: facilities // Replace nested structure with a simple array of {id, name}
    };
  }) || []; // Handle null case for staffWithFacilities

  // 5. Return the processed data
  return NextResponse.json(processedStaff);
}