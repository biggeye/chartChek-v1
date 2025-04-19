import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UsersIcon, 
  FileTextIcon, 
  ClipboardCheckIcon, 
  ActivityIcon 
} from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { usePatientStore } from '~/store/patient/patientStore';
import { useUserDocuments } from '~/hooks/useUserDocuments';

export function QuickStatsCard() {
  const router = useRouter();
  const { patients, isLoadingPatients } = usePatientStore();
  const { documents, isLoading: isLoadingDocuments } = useUserDocuments();
  const [complianceScore, setComplianceScore] = useState<number | null>(null);
  const [isLoadingCompliance, setIsLoadingCompliance] = useState(true);

  useEffect(() => {
    const fetchComplianceScore = async () => {
      try {
        setIsLoadingCompliance(true);
        
        // This would typically be an API call to get the compliance score
        // For now, we'll simulate it with a random score between 70-95
        const score = Math.floor(Math.random() * 26) + 70;
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setComplianceScore(score);
      } catch (error) {
        console.error('Error fetching compliance score:', error);
      } finally {
        setIsLoadingCompliance(false);
      }
    };

    fetchComplianceScore();
  }, []);

  const isLoading = isLoadingPatients || isLoadingDocuments || isLoadingCompliance;

  // Get the compliance score color based on the value
  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <DashboardCard 
      title="Quick Stats" 
      description="Key metrics at a glance"
      icon={<ActivityIcon className="h-5 w-5" />}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Patients Count */}
        <div 
          className="flex flex-col items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
          onClick={() => router.push('/product/patients')}
        >
          <div className="p-2 rounded-full bg-indigo_dye-100 text-indigo_dye-600 mb-2">
            <UsersIcon className="h-5 w-5" />
          </div>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse mx-auto"></div>
            ) : (
              patients?.length || 0
            )}
          </div>
          <div className="text-xs text-gray-500 text-center">Patients</div>
        </div>
        
        {/* Documents Count */}
        <div 
          className="flex flex-col items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
          onClick={() => router.push('/product/documents')}
        >
          <div className="p-2 rounded-full bg-indigo_dye-100 text-indigo_dye-600 mb-2">
            <FileTextIcon className="h-5 w-5" />
          </div>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse mx-auto"></div>
            ) : (
              documents?.length || 0
            )}
          </div>
          <div className="text-xs text-gray-500 text-center">Documents</div>
        </div>
        
        {/* Compliance Score */}
        <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <div className="p-2 rounded-full bg-indigo_dye-100 text-indigo_dye-600 mb-2">
            <ClipboardCheckIcon className="h-5 w-5" />
          </div>
          <div className={`text-2xl font-bold ${complianceScore ? getComplianceScoreColor(complianceScore) : ''}`}>
            {isLoading ? (
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse mx-auto"></div>
            ) : (
              complianceScore ? `${complianceScore}%` : 'N/A'
            )}
          </div>
          <div className="text-xs text-gray-500 text-center">Compliance</div>
        </div>
        
        {/* Today's Date */}
        <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
          <div className="p-2 rounded-full bg-indigo_dye-100 text-indigo_dye-600 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-lg font-bold text-center">
            {new Date().toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
          <div className="text-xs text-gray-500 text-center">Today</div>
        </div>
      </div>
    </DashboardCard>
  );
}
