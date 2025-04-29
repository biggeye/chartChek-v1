// --- Client Component ---

"use client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@kit/ui/card";
import { Loader2 } from "lucide-react";
import type { DbContextItem } from "~/types/chat";

export function PatientRecordsClient({ patientId }: { patientId: string }) {
  const {
    data: records,
    isLoading,
    isError,
    error,
  } = useQuery<DbContextItem[]>({
    queryKey: ["patient-records", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/records/${patientId}`);
      if (!res.ok) throw new Error("Failed to fetch patient records");
      return res.json();
    },
    enabled: !!patientId,
  });

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }
  if (isError) {
    return <div className="text-red-500">Error: {error instanceof Error ? error.message : "Unknown error"}</div>;
  }
  if (!records || records.length === 0) {
    return <div className="text-muted-foreground">No records found for this patient.</div>;
  }
  return (
    <div className="space-y-4">
      {records.map((record) => (
        <Card key={record.id}>
          <CardHeader>
            <CardTitle>{record.title || "Untitled Record"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground mb-2">
              Created: {record.created_at ? new Date(record.created_at).toLocaleString() : "Unknown"}
            </div>
            <div className="text-sm">
              {record.content || <span className="italic text-gray-400">No content</span>}
            </div>
            {record.metadata?.patientName && (
              <div className="mt-2 text-xs text-gray-500">Patient: {record.metadata.patientName}</div>
            )}
            {record.metadata?.source && (
              <div className="mt-1 text-xs text-gray-400">Source: {record.metadata.source}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}