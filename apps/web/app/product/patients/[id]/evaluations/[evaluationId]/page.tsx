'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { DocumentView } from '~/lib/DocumentView';
import { fetchEvaluationDetails } from '~/lib/services/evaluationsService';
import { KipuPatientEvaluation } from '~/types/kipu/kipuAdapter';

export default function EvaluationDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [evaluation, setEvaluation] = useState<KipuPatientEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const evaluationId = params.evaluationId as string;

  const handleOpenSummary = useCallback(() => {
    if (!evaluation) {
      return;
    }
  }, [evaluation]);

  useEffect(() => {
    async function loadEvaluationDetails() {
      if (!evaluationId) {
        setError("Evaluation ID is missing in the URL.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null); 

      try {
        const data = await fetchEvaluationDetails(evaluationId);
        setEvaluation(data); 
      } catch (err) {
        console.error("[EvaluationDetailPage] Failed to load evaluation details:", err);
        const message = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(`Failed to load evaluation: ${message}. Please try again.`);
        setEvaluation(null); 
      } finally {
        setLoading(false); 
      }
    }

    loadEvaluationDetails();
  }, [evaluationId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="mt-2 text-destructive">{error}</p>
            <Button
              onClick={() => router.back()} 
              variant="destructive"
              className="mt-4"
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!evaluation) {
    return (
      <Card>
        <CardHeader>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="mt-2">Evaluation with ID '{evaluationId}' not found or could not be loaded.</p>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="mt-4"
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">
          {evaluation.name || 'Evaluation Details'}
        </h2>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <Button onClick={handleOpenSummary} variant="secondary">
            View Summary (WIP)
          </Button>
          
          {evaluation.patientEvaluationItems && evaluation.patientEvaluationItems.length > 0 ? (
            <DocumentView items={evaluation.patientEvaluationItems} />
          ) : (
            <p>No items found in this evaluation.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}