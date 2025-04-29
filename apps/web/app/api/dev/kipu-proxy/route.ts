import { NextRequest, NextResponse } from 'next/server';
// Import your KIPU service functions
import { fetchPatients } from '~/lib/services/patientService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get('endpoint') || Object.keys(Object.fromEntries(searchParams)).find(key => key === 'evaluations' || key === 'patient_evaluations' || key === 'patients/census' || key === 'patients/admissions');
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint param' }, { status: 400 });
    }

    let result;
    switch (endpoint) {
      case 'patients/census': {
        const facilityId = searchParams.get('facilityId');
        result = await fetchPatients(facilityId ? Number(facilityId) : undefined);
        break;
      }
      case 'patients/admissions': {
        result = await fetchPatients();
        break;
      }
      case 'evaluations': {
        // Fetch evaluation templates (no patientId required)
        const { fetchEvaluationTemplates } = await import('~/lib/services/evaluationsService');
        result = await fetchEvaluationTemplates();
        break;
      }
      case 'patient_evaluations': {
        const patientId = searchParams.get('patientId');
        if (!patientId) {
          return NextResponse.json({ error: 'Missing patientId param' }, { status: 400 });
        }
        const { fetchEvaluationsByPatientId } = await import('~/lib/services/evaluationsService');
        result = await fetchEvaluationsByPatientId(patientId);
        break;
      }
      // Add more endpoints as needed
      default:
        return NextResponse.json({ error: 'Unknown endpoint' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get('endpoint') || Object.keys(Object.fromEntries(searchParams)).find(key => key === 'evaluations' || key === 'patient_evaluations' || key === 'patients/census' || key === 'patients/admissions');
    const body = await req.json();

    // Example: Add POST routing here as needed
    return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}
