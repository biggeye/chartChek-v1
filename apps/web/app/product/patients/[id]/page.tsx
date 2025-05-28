// app/product/patients/[id]/page.tsx
"use client";

import React from 'react';
import { usePatientStore } from '~/store/patient/patientStore';
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import { Badge } from "@kit/ui/badge";
import { format } from 'date-fns';
import { Calendar, Clock, Building2, Bed, Activity, Heart, FileText, User, AlertCircle } from 'lucide-react';

const getStatusColor = (status: string | undefined) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'discharged':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200';
  }
};

export default function PatientPage() {
  const { selectedPatient } = usePatientStore();

  if (!selectedPatient) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No patient selected or found.</h3>
        </div>
      </div>
    );
  }

  const formatDate = (date: string | undefined) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Demographics
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Date of Birth</p>
              <p className="font-medium">{formatDate(selectedPatient.dateOfBirth)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Age</p>
              <p className="font-medium">{selectedPatient.age || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <p className="font-medium">{selectedPatient.gender || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Primary Diagnosis</p>
              <p className="font-medium">{selectedPatient.primaryDiagnosis || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Admission Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Admission Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Admission Date</p>
              <p className="font-medium">{formatDate(selectedPatient.admissionDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Discharge Date</p>
              <p className="font-medium">{formatDate(selectedPatient.dischargeDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Discharge Type</p>
              <p className="font-medium">{selectedPatient.dischargeType || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Sobriety Date</p>
              <p className="font-medium">{formatDate(selectedPatient.sobrietyDate)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Location Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{selectedPatient.locationName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Building</p>
                <p className="font-medium">{selectedPatient.buildingName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Room</p>
                <p className="font-medium">{selectedPatient.roomName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bed</p>
                <p className="font-medium">{selectedPatient.bedName || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Treatment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Treatment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Program</p>
              <p className="font-medium">{selectedPatient.program || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Level of Care</p>
              <p className="font-medium">{selectedPatient.levelOfCare || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Next Level of Care</p>
              <p className="font-medium">{selectedPatient.nextLevelOfCare || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Next Level Date</p>
              <p className="font-medium">{formatDate(selectedPatient.nextLevelOfCareDate)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Insurance Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Insurance Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Primary Insurance Provider</p>
                <p className="font-medium">{selectedPatient.insuranceProvider || 'N/A'}</p>
              </div>
              {selectedPatient.insurances && selectedPatient.insurances.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Additional Insurance Plans</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedPatient.insurances.map((insurance: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-md">
                        <p className="font-medium">{insurance.provider || 'Unknown Provider'}</p>
                        <p className="text-sm text-gray-500">{insurance.type || 'Unknown Type'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}