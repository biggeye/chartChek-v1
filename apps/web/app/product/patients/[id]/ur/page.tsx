'use client';

import { useEffect } from 'react';
import { use } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { format } from 'date-fns';
import { useUtilizationReviews } from '~/hooks/useUtilizationReviews';
import { Loader as LoadingSpinner } from '~/components/loading';
import { Badge } from '@kit/ui/badge';
import type { UtilizationReview } from '~/lib/kipu/service/utilization-review-service';

interface UtilizationReviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function UtilizationReviewPage({ params }: UtilizationReviewPageProps) {
  const { id: patientId } = use(params);
  const {
    reviews,
    isLoading,
    error,
    fetchReviews,
  } = useUtilizationReviews(patientId);

  useEffect(() => {
    console.log('UR Page - patientId:', patientId);
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    console.log('UR Page - reviews:', reviews);
    console.log('UR Page - isLoading:', isLoading);
    console.log('UR Page - error:', error);
  }, [reviews, isLoading, error]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner 
          showLogo={false}
          size="sm"
          message="Loading Utilization Reviews..."/>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Flatten the reviews array to avoid nested mapping
  const flattenedReviews = reviews.flatMap((review) =>
    review.utilizationReviews.map((ur) => ({
      ...ur,
      patientInfo: {
        firstName: review.firstName,
        lastName: review.lastName,
        dob: review.dob,
        casefileId: review.casefileId,
      },
    }))
  );

  console.log('UR Page - flattenedReviews:', flattenedReviews);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Utilization Reviews</h1>
      </div>

      {reviews.length > 0 && reviews[0] && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{`${reviews[0].firstName} ${reviews[0].lastName}`}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">DOB</p>
                <p className="font-medium">{format(new Date(reviews[0].dob), 'MM/dd/yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Case ID</p>
                <p className="font-medium">{reviews[0].casefileId}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Level of Care</TableHead>
                <TableHead>Insurance</TableHead>
                <TableHead>Auth Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flattenedReviews.map((ur) => (
                <TableRow key={`${ur.id}-${ur.patientInfo.casefileId}`}>
                  <TableCell>{format(new Date(ur.startDate), 'MM/dd/yyyy')}</TableCell>
                  <TableCell>
                    {ur.endDate ? format(new Date(ur.endDate), 'MM/dd/yyyy') : '-'}
                  </TableCell>
                  <TableCell>{ur.levelOfCare || '-'}</TableCell>
                  <TableCell>{ur.insurance}</TableCell>
                  <TableCell>{ur.authorizationNumber}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(ur.status)}>
                      {ur.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {ur.nextReview ? format(new Date(ur.nextReview), 'MM/dd/yyyy') : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 