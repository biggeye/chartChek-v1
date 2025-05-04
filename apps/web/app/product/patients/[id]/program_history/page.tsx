"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Filter, ArrowUpDown } from 'lucide-react';
import { Button } from '@kit/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@kit/ui/card';
import { ScrollArea } from '@kit/ui/scroll-area';
import { format, isValid, parseISO } from 'date-fns';
import { Badge } from '@kit/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kit/ui/select";
import { useProgramHistory } from '~/hooks/useProgramHistory';

// Safe date formatting helper
const formatSafeDate = (dateString: string | undefined): string => {
  if (!dateString) return '-';
  const date = parseISO(dateString);
  return isValid(date) ? format(date, 'MMM dd, yyyy') : 'Invalid Date';
};

export default function ProgramHistoryPage() {
  const params = useParams();
  const patientId = params.id as string;
  
  const {
    programs: filteredAndSortedPrograms,
    total,
    isLoading,
    error,
    sortField,
    sortOrder,
    statusFilter,
    toggleSort,
    setStatusFilter,
    refetch
  } = useProgramHistory(patientId);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading program history...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-600">Error Loading Program History</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <Button
            onClick={() => refetch()}
            className="mt-4"
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Program History</h1>
          <p className="text-sm text-gray-500">
            Showing {filteredAndSortedPrograms.length} of {total} programs
          </p>
        </div>
        
        {/* Filters and Sorting */}
        <div className="flex items-center gap-4">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="discontinued">Discontinued</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        {/* Table Header */}
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <div className="grid grid-cols-12 gap-4">
            <Button
              variant="ghost"
              className="col-span-3 justify-start font-semibold"
              onClick={() => toggleSort('program')}
            >
              Program
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="col-span-2 justify-start font-semibold"
              onClick={() => toggleSort('startDate')}
            >
              Start Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
            <div className="col-span-2 font-semibold">End Date</div>
            <Button
              variant="ghost"
              className="col-span-2 justify-start font-semibold"
              onClick={() => toggleSort('status')}
            >
              Status
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
            <div className="col-span-3 font-semibold">Notes</div>
          </div>
        </div>

        {/* Program List */}
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="p-4 space-y-4">
            {filteredAndSortedPrograms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No program history found
              </div>
            ) : (
              filteredAndSortedPrograms.map((program) => (
                <div
                  key={program.id}
                  className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="col-span-3">
                    <div className="font-medium">{program.program}</div>
                    <div className="text-sm text-gray-500">Level: {program.level}</div>
                  </div>
                  <div className="col-span-2 text-sm">
                    {formatSafeDate(program.startDate)}
                  </div>
                  <div className="col-span-2 text-sm">
                    {formatSafeDate(program.endDate)}
                  </div>
                  <div className="col-span-2">
                    <Badge 
                      variant={
                        program.status === 'active' 
                          ? "success" 
                          : program.status === 'completed' 
                            ? "secondary" 
                            : "destructive"
                      }
                    >
                      {program.status}
                    </Badge>
                  </div>
                  <div className="col-span-3 text-sm text-gray-600">
                    {program.notes || '-'}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
} 