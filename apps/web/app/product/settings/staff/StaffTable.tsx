'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '@kit/ui/card';

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@kit/ui/table';

import { Badge } from '@kit/ui/badge';

interface FacilityInfo {
  id: string;
  name: string;
}

interface StaffMember {
  id: string;
  email: string;
  full_name: string;
  role: string;
  facilities: FacilityInfo[];
}

export default function StaffTable({ staff }: { staff: StaffMember[] }) {
  console.log('staff', staff);
  if (!staff || staff.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Staff Members</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground italic py-4">
            No staff members found for this account.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Staff</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <TableHeader className="bg-gray-50 dark:bg-gray-800">
              <TableRow>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Email
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Full Name
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Role
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Facility Access
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
              {staff.map((s) => (
                <TableRow key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <TableCell className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {s.email}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                    {s.full_name}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                    {s.role.charAt(0).toUpperCase() + s.role.slice(1)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                    <div className="flex flex-wrap gap-1">
                      {s.facilities?.length > 0 ? (
                        s.facilities.map((facility) => (
                          <Badge key={facility.id} variant="secondary">
                            {facility.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs italic text-muted-foreground">
                          No facilities assigned
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
