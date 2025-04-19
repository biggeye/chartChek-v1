/**
 * KIPU API Mapping Module
 * 
 * This module centralizes all mapping functions between KIPU API responses and our application's data structures.
 * It handles the terminology differences and field naming conventions between systems.
 */

import { Facility, Building, PatientBasicInfo as AppPatientBasicInfo, KipuPatientEvaluation as AppPatientEvaluation, PatientVitalSign as AppPatientVitalSign, PatientAppointment as AppPatientAppointment, PaginatedPatientsResponse as AppPaginatedPatientsResponse, KipuEvaluation } from 'types/kipu/kipuAdapter';
import { PatientBasicInfo, Facility as KipuFacility } from 'types/kipu/kipuAdapter';

/**
 * Maps a KIPU location object to our Facility format
 * This function handles different field naming conventions between our app and KIPU API
 * 
 * @param kipuLocation - The location data from KIPU API
 * @returns Facility object with mapped fields
 */
export function mapKipuLocationToFacility(kipuLocation: any): Facility {
  // Handle null or undefined input
  if (!kipuLocation) {
    console.error('Attempted to map null or undefined KIPU location');
    return {
      id: 0,
      name: '',
      address: '',
      phone: '',
      status: 'inactive',
      created_at: '',
      data: { 
        beds: { total: 0, available: 0, occupied: 0 },
        staff: { total: 0, active: 0 },
        patients: { total: 0, admitted: 0, discharged: 0 }
      }
    };
  }

  // Map from KIPU location to our Facility format
  // Note: KIPU uses location_id and location_name, we use id and name
  return {
    id: kipuLocation.location_id?.toString() || `facility-${Math.random().toString(36).substring(2, 9)}`,
    name: kipuLocation.location_name || 'Unnamed Facility',
    code: kipuLocation.code || '',
    address: kipuLocation.address?.street || '',
    city: kipuLocation.address?.city || '',
    state: kipuLocation.address?.state || '',
    zip: kipuLocation.address?.zip || '',
    phone: kipuLocation.phone || '',
    status: kipuLocation.status || 'active',
    created_at: kipuLocation.created_at || new Date().toISOString(),
    updated_at: kipuLocation.updated_at || new Date().toISOString(),
    data: { 
      beds: { total: 0, available: 0, occupied: 0 },
      staff: { total: 0, active: 0 },
      patients: { total: 0, admitted: 0, discharged: 0 }
    },
    buildings: Array.isArray(kipuLocation.buildings) 
      ? kipuLocation.buildings.map((building: any) => mapKipuBuildingToBuilding(building, kipuLocation.location_id?.toString() || ''))
      : []
  };
}

/**
 * Maps a KIPU building to our Building format
 * 
 * @param kipuBuilding - The building data from KIPU API
 * @param facilityId - The ID of the parent facility
 * @returns Building object with mapped fields
 */
function mapKipuBuildingToBuilding(kipuBuilding: any, facilityId: number): Building {
  return {
    id: kipuBuilding.id?.toString() || `building-${Math.random().toString(36).substring(2, 9)}`,
    name: kipuBuilding.name || 'Unnamed Building',
    code: kipuBuilding.code || '',
    address: kipuBuilding.address || '',
    status: kipuBuilding.status || 'active',
    facility_id: facilityId
  };
}

/**
 * Maps a KIPU patient object to our PatientBasicInfo format
 * This function handles different field naming conventions between our app and KIPU API
 * 
 * @param kipuPatient - The patient data from KIPU API
 * @returns PatientBasicInfo object with mapped fields
 */
export function mapKipuPatientToPatientBasicInfo(kipuPatient: any): PatientBasicInfo {
  if (!kipuPatient) {
    console.error('Attempted to map null or undefined KIPU patient');
    return {
      patientId: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      mrn: '',
      admissionDate: '',
      dischargeDate: '',
      facilityId: 0,
      fullName: '',
      insuranceProvider: '',
      dischargeType: '',
      sobrietyDate: '',
      insurances: [],
      patient_statuses: [],
      patient_contacts: [],
      levelOfCare: '',
      nextLevelOfCare: '',
      nextLevelOfCareDate: '',
      program: '',
      bedName: '',
      roomName: '',
      buildingName: '',
      locationName: ''
    };
  }

  return {
    patientId: kipuPatient.casefile_id || kipuPatient.patient_id || '',
    firstName: kipuPatient.first_name || kipuPatient.firstName || '',
    lastName: kipuPatient.last_name || kipuPatient.lastName || '',
    dateOfBirth: kipuPatient.dob || kipuPatient.date_of_birth || '',
    gender: kipuPatient.gender || kipuPatient.sex || '',
    mrn: kipuPatient.mr_number || kipuPatient.mrNumber || kipuPatient.medical_record_number || '',
    admissionDate: kipuPatient.admission_date || kipuPatient.admissionDate || '',
    dischargeDate: kipuPatient.discharge_date || kipuPatient.dischargeDate || '',
    facilityId: kipuPatient.location_id || kipuPatient.locationId || '',
    fullName: `${kipuPatient.first_name || kipuPatient.firstName || ''} ${kipuPatient.last_name || kipuPatient.lastName || ''}`.trim(),
    insuranceProvider: `${kipuPatient.insurance_company || ''}`,
    dischargeType: `${kipuPatient.discharge_type || ''}`,
    sobrietyDate: `${kipuPatient.sobriety_date || ''}`,
    insurances: kipuPatient.insurances || [],
    patient_statuses: kipuPatient.patient_statuses || [],
    patient_contacts: kipuPatient.patient_contacts || [],
    levelOfCare: `${kipuPatient.level_of_care || ''}`,
    nextLevelOfCare: `${kipuPatient.next_level_of_care || ''}`,
    nextLevelOfCareDate: `${kipuPatient.next_level_of_care_date || ''}`,
    program: `${kipuPatient.program || ''}`,
    bedName: `${kipuPatient.bed_name || ''}`,
    roomName: `${kipuPatient.room_name || ''}`,
    buildingName: `${kipuPatient.building_name || ''}`,
    locationName: `${kipuPatient.location_name || ''}`
  };
}

/**
 * Maps a KIPU PatientBasicInfo to our application PatientBasicInfo format
 * This function handles different field naming conventions between our internal types
 * 
 * @param kipuPatient - The PatientBasicInfo from KIPU API types
 * @param facilityId - The ID of the facility the patient belongs to
 * @returns Application PatientBasicInfo object with mapped fields
 */
export function mapToAppPatientBasicInfo(kipuPatient: PatientBasicInfo, facilityId: number): AppPatientBasicInfo {
  if (!kipuPatient) {
    console.error('Attempted to map null or undefined KIPU patient');
    return {
    patientId: '',
      mrn: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      status: '',
      admissionDate: '',
      dischargeDate: '',
      facilityId: facilityId,
      fullName: '',
      insuranceProvider: '',
      dischargeType: '',
      sobrietyDate: '',
      insurances: [],
      patient_statuses: [],
      patient_contacts: [],
      levelOfCare: '',
      nextLevelOfCare: '',
      nextLevelOfCareDate: '',
      program: '',
      bedName: '',
      roomName: '',
      buildingName: '',
      locationName: ''
    };
  }

  const fullName = `${kipuPatient.firstName || ''} ${kipuPatient.lastName || ''}`.trim();
  
  return {
    patientId: kipuPatient.patientId || '',
    mrn: kipuPatient.mrn || '',
    firstName: kipuPatient.firstName || '',
    lastName: kipuPatient.lastName || '',
    dateOfBirth: kipuPatient.dateOfBirth || '',
    gender: kipuPatient.gender || '',
    status: kipuPatient.dischargeDate ? 'discharged' : 'active',
    admissionDate: kipuPatient.admissionDate || '',
    dischargeDate: kipuPatient.dischargeDate || '',
    facilityId: facilityId || kipuPatient.facilityId || 0,
    fullName: fullName || 'Unknown Patient',
    insuranceProvider: kipuPatient.insuranceProvider || '',
    dischargeType: kipuPatient.dischargeType || '',
    sobrietyDate: kipuPatient.sobrietyDate || '',
    insurances: kipuPatient.insurances || [],
    patient_statuses: kipuPatient.patient_statuses || [],
    patient_contacts: kipuPatient.patient_contacts || [],
    levelOfCare: kipuPatient.levelOfCare || '',
    nextLevelOfCare: kipuPatient.nextLevelOfCare || '',
    nextLevelOfCareDate: kipuPatient.nextLevelOfCareDate || '',
    program: kipuPatient.program || '',
    bedName: kipuPatient.bedName || '',
    roomName: kipuPatient.roomName || '',
    buildingName: kipuPatient.buildingName || '',
    locationName: kipuPatient.locationName || ''
  };
}




/**
 * Maps a KIPU appointment to our application PatientAppointment format
 * 
 * @param kipuAppointment - The appointment data from KIPU API
 * @param facilityId - The ID of the facility the appointment belongs to
 * @returns Application PatientAppointment object with mapped fields
 */
export function mapToAppPatientAppointment(kipuAppointment: any, facilityId: number): AppPatientAppointment {
  if (!kipuAppointment) {
    console.error('Attempted to map null or undefined KIPU appointment');
    return {
      id: '',
      patientId: '',
      facilityId: facilityId,
      title: '',
      startTime: '',
      endTime: '',
      status: '',
      type: '',
      provider: '',
      location: '',
      notes: ''
    };
  }

  return {
    id: kipuAppointment.id || '',
    patientId: kipuAppointment.patient_id || '',
    facilityId: facilityId,
    title: kipuAppointment.title || kipuAppointment.name || '',
    startTime: kipuAppointment.start_time || kipuAppointment.scheduled_at || '',
    endTime: kipuAppointment.end_time || '',
    status: kipuAppointment.status || 'scheduled',
    type: kipuAppointment.type || kipuAppointment.appointment_type || '',
    provider: kipuAppointment.provider || kipuAppointment.provider_name || '',
    location: kipuAppointment.location || '',
    notes: kipuAppointment.notes || ''
  };
}
