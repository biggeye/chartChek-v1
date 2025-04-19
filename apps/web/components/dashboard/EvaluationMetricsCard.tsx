import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3Icon, CheckCircleIcon, ClockIcon, AlertCircleIcon } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { Button } from '@kit/ui/button';
import { Progress } from '@kit/ui/progress';
import { usePatientStore } from '~/store/patient/patientStore';
import { parseEvaluationMetrics, calculateCompletionPercentage } from '~/lib/kipu/service/evaluation-metrics-service';

export function EvaluationMetricsCard() {
  const router = useRouter();
  const { patients, isLoadingPatients } = usePatientStore();
  const [evaluationStats, setEvaluationStats] = useState<{
    totalEvaluations: number;
    completedCount: number;
    inProgressCount: number;
    readyForReviewCount: number;
    completionRate: number;
    patientWithMostEvals?: string;
    patientWithLowestCompletion?: string;
  }>({
    totalEvaluations: 0,
    completedCount: 0,
    inProgressCount: 0,
    readyForReviewCount: 0,
    completionRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvaluationStats = async () => {
      if (!patients || patients.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Get evaluations for up to 3 patients to avoid overwhelming the API
        const patientSample = patients.slice(0, 3);
        const patientStats: Record<string, any> = {};
        
        for (const patient of patientSample) {
          if (!patient.patientId) continue;
          
          const response = await fetch(`/api/kipu/patients/${encodeURIComponent(patient.patientId)}/evaluations`);
          
          if (response.ok) {
            const data = await response.json();
            if (data) {
              patientStats[patient.patientId] = {
                data,
                metrics: parseEvaluationMetrics(data),
                name: patient.firstName + ' ' + patient.lastName
              };
            }
          }
        }
        
        // Calculate aggregate stats
        let totalEvals = 0;
        let completedCount = 0;
        let inProgressCount = 0;
        let readyForReviewCount = 0;
        let highestEvalCount = 0;
        let lowestCompletionRate = 100;
        let patientWithMostEvals = '';
        let patientWithLowestCompletion = '';
        
        Object.entries(patientStats).forEach(([patientId, stats]) => {
          const metrics = stats.metrics;
          const evalCount = Object.keys(metrics.byId).length;
          totalEvals += evalCount;
          completedCount += metrics.statusCounts.completed;
          inProgressCount += metrics.statusCounts.inProgress;
          readyForReviewCount += metrics.statusCounts.readyForReview;
          
          // Track patient with most evaluations
          if (evalCount > highestEvalCount) {
            highestEvalCount = evalCount;
            patientWithMostEvals = stats.name;
          }
          
          // Track patient with lowest completion rate
          const completionRate = calculateCompletionPercentage(metrics);
          if (completionRate < lowestCompletionRate && evalCount > 0) {
            lowestCompletionRate = completionRate;
            patientWithLowestCompletion = stats.name;
          }
        });
        
        // Calculate overall completion rate
        const completionRate = totalEvals > 0 ? (completedCount / totalEvals) * 100 : 0;
        
        setEvaluationStats({
          totalEvaluations: totalEvals,
          completedCount,
          inProgressCount,
          readyForReviewCount,
          completionRate,
          patientWithMostEvals,
          patientWithLowestCompletion
        });
        
      } catch (error) {
        console.error('Error fetching evaluation stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluationStats();
  }, [patients]);

  return (
    <DashboardCard 
      title="Evaluation Metrics" 
      description="Patient evaluation status overview"
      icon={<BarChart3Icon className="h-5 w-5" />}
      footer={
        <Button 
          variant="ghost" 
          className="w-full justify-center text-indigo_dye-600 hover:text-indigo_dye-900 hover:bg-indigo_dye-50"
          onClick={() => router.push('/product/patients')}
        >
          View All Patients
        </Button>
      }
    >
      {isLoading || isLoadingPatients ? (
        <div className="space-y-4 py-2">
          <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
      ) : evaluationStats.totalEvaluations > 0 ? (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Completion Rate</span>
              <span className="text-sm font-medium">
                {evaluationStats.completionRate.toFixed(0)}%
              </span>
            </div>
            <Progress value={evaluationStats.completionRate} className="h-2" />
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center">
              <div className="flex justify-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mb-1" />
              </div>
              <div className="text-2xl font-bold">{evaluationStats.completedCount}</div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center">
                <ClockIcon className="h-5 w-5 text-yellow-500 mb-1" />
              </div>
              <div className="text-2xl font-bold">{evaluationStats.inProgressCount}</div>
              <div className="text-xs text-gray-500">In Progress</div>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center">
                <AlertCircleIcon className="h-5 w-5 text-blue-500 mb-1" />
              </div>
              <div className="text-2xl font-bold">{evaluationStats.readyForReviewCount}</div>
              <div className="text-xs text-gray-500">For Review</div>
            </div>
          </div>
          
          {evaluationStats.patientWithMostEvals && (
            <div className="pt-2 text-sm">
              <p className="text-gray-600">
                <span className="font-medium">{evaluationStats.patientWithMostEvals}</span> has the most evaluations
              </p>
            </div>
          )}
          
          {evaluationStats.patientWithLowestCompletion && (
            <div className="text-sm">
              <p className="text-gray-600">
                <span className="font-medium">{evaluationStats.patientWithLowestCompletion}</span> needs attention
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500 mb-4">No evaluation data available</p>
          <Button 
            onClick={() => router.push('/product/patients')}
            variant="outline"
          >
            View Patients
          </Button>
        </div>
      )}
    </DashboardCard>
  );
}
