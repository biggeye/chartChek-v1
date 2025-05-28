'use client';

import { useState, useEffect } from 'react';
import { useProtocolStore } from '~/store/protocolStore';
import { usePatientStore } from '~/store/patient/patientStore';
import { useFetchPatient, useFetchPatientsOnFacilityChange, useFetchFacilityOccupancy } from '~/hooks/usePatients';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@kit/ui/select';

interface ComplianceProtocol {
  id: string;
  name: string;
}

export default function EvaluationMetricsDevPage() {
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string>('');
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProtocols, setIsLoadingProtocols] = useState(false);
  const { fetchProtocols, protocols } = useProtocolStore();

/*
  const { protocols, isLoading: isLoadingProtocols, error: protocolsError, fetchProtocols } =
    useProtocolStore((state) => ({
      protocols: state.protocols,
      isLoading: state.isLoading,
      error: state.error,
      fetchProtocols: state.fetchProtocols
    }));

*/

useEffect(() => {
  fetchProtocols();
}, []);

  useFetchPatientsOnFacilityChange();
  useFetchFacilityOccupancy();
  const { patients } = usePatientStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProtocol) {
      setError('Please select a protocol.');
      return;
    }
    setLoading(true);
    setError(null);
    setMetrics(null);
    try {
      const protocolState = useProtocolStore.getState().loadSelectedProtocol();
      const data = await protocolState;
      setMetrics(data);
      } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Evaluation Metrics</h1>
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Protocol</label>
            <Select
              value={selectedProtocol ?? ''}
              onValueChange={setSelectedProtocol}
              disabled={isLoadingProtocols || loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoadingProtocols ? 'Loading protocols...' : 'Select a protocol'} />
              </SelectTrigger>
              <SelectContent>
                {isLoadingProtocols ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : protocols && protocols.length > 0 ? (
                  protocols.map(protocol => (
                    <SelectItem key={protocol.id} value={protocol.id}>
                      {protocol.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-protocols" disabled>
                    No protocols available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
        
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Patient</label>
            <Select
              value={patientId}
              onValueChange={setPatientId}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={patients.length === 0 ? 'No patients' : 'Select a patient'} />
              </SelectTrigger>
              <SelectContent>
                {patients.length === 0 ? (
                  <SelectItem value="no-patients" disabled>
                    No patients available
                  </SelectItem>
                ) : (
                  patients.map((p: any) => (
                    <SelectItem key={p.patientId} value={p.patientId}>
                      {p.fullName || `${p.firstName} ${p.lastName}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !selectedProtocol}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Loading...' : 'Fetch Data'}
        </button>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {metrics && (
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">Metrics Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-500">Total Required</div>
                <div className="text-2xl font-bold">{metrics.totalRequired}</div>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-500">Completed</div>
                <div className="text-2xl font-bold">{metrics.completed}</div>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-500">In Progress</div>
                <div className="text-2xl font-bold">{metrics.inProgress}</div>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-500">Overdue</div>
                <div className="text-2xl font-bold">{metrics.overdue}</div>
              </div>
            </div>
          </section>
          {/* Additional metrics details can go here */}
        </div>
      )}
    </div>
  );
}