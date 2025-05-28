"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePatientStore } from '~/store/patient/patientStore';
import { Input } from "@kit/ui/input";
import { Button } from "@kit/ui/button";
import { Badge } from "@kit/ui/badge";
import { Card } from "@kit/ui/card";
import { format } from 'date-fns';
import { ChevronDown, ChevronRight, Search, ArrowUpDown } from 'lucide-react';
import { processPatients, GroupedPatient } from '~/lib/services/patientService';

export default function PatientsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [showActive, setShowActive] = useState(false);
  const [sortBy, setSortBy] = useState<'status' | 'name' | 'date'>('status');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());
  const { patients, isLoadingPatients, error } = usePatientStore();

  // Process patients using the service layer
  const groupedPatients = useMemo(() => {
    return processPatients(patients, {
      searchTerm,
      showActive,
      sortBy,
      sortDirection
    });
  }, [patients, searchTerm, showActive, sortBy, sortDirection]);

  const toggleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  };

  const toggleExpand = (patientMasterId: string) => {
    const newExpanded = new Set(expandedPatients);
    if (newExpanded.has(patientMasterId)) {
      newExpanded.delete(patientMasterId);
    } else {
      newExpanded.add(patientMasterId);
    }
    setExpandedPatients(newExpanded);
  };

  const handlePatientSelect = (chartId: string) => {
    router.push(`/product/patients/${chartId}`);
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showActive ? "default" : "outline"}
            onClick={() => setShowActive(!showActive)}
            className="whitespace-nowrap"
          >
            {showActive ? "Show All" : "Active Only"}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleSort('name')}
            className="flex items-center gap-1"
          >
            Name
            {sortBy === 'name' && <ArrowUpDown className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleSort('date')}
            className="flex items-center gap-1"
          >
            Date
            {sortBy === 'date' && <ArrowUpDown className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleSort('status')}
            className="flex items-center gap-1"
          >
            Status
            {sortBy === 'status' && <ArrowUpDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Patient List */}
      {isLoadingPatients ? (
        <div className="text-center py-8">Loading patients...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : groupedPatients.length === 0 ? (
        <div className="text-center py-8">No patients found</div>
      ) : (
        <div className="space-y-4">
          {groupedPatients.map((patient) => (
            <Card key={patient.patientMasterId} className="p-4">
              {/* Patient Header */}
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpand(patient.patientMasterId)}
              >
                <div className="flex items-center gap-4">
                  {expandedPatients.has(patient.patientMasterId) ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">
                      {patient.currentChart.lastName}, {patient.currentChart.firstName}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>MRN: {patient.currentChart.mrn || 'N/A'}</span>
                      <span>•</span>
                      <span>Charts: {patient.allCharts.length}</span>
                      {patient.currentChart.program && (
                        <>
                          <span>•</span>
                          <span>Current Program: {patient.currentChart.program}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant={patient.isActive ? "success" : "secondary"}>
                  {patient.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              {/* Expanded View - Treatment History */}
              {expandedPatients.has(patient.patientMasterId) && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Treatment History</h4>
                  <div className="space-y-2">
                    {patient.allCharts.map((chart) => (
                      <div
                        key={chart.patientId}
                        onClick={() => handlePatientSelect(chart.patientId)}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                      >
                        <div>
                          <div className="font-medium">
                            {chart.program || 'Unknown Program'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(chart.admissionDate)} - {chart.dischargeDate ? formatDate(chart.dischargeDate) : 'Present'}
                          </div>
                        </div>
                        <Badge variant={chart.dischargeDate ? "secondary" : "success"}>
                          {chart.dischargeDate ? "Completed" : "Active"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
