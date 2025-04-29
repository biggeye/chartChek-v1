// NOTE: If you see type errors related to 'context_items', regenerate your Supabase types to include this table and ensure it matches the DbContextItem interface.

"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@kit/ui/card";
import { Button } from "@kit/ui/button";
import { Input } from "@kit/ui/input";
import { Loader2, PlusCircle, Search } from "lucide-react";
import type { DbContextItem } from "~/types/chat";
import { PatientContextModal } from "~/components/chat/patient-context-modal";

export default function RecordsPage() {
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeRecord, setActiveRecord] = useState<DbContextItem | null>(null);

  const {
    data: records,
    isLoading,
    isError,
    error,
  } = useQuery<DbContextItem[]>({
    queryKey: ["user-records"],
    queryFn: async () => {
      const res = await fetch("/api/records");
      if (!res.ok) throw new Error("Failed to fetch records");
      return res.json();
    },
  });

  // Extract unique patient names for filter
  const patientOptions = useMemo(() => {
    if (!records) return [];
    const names = Array.from(
      new Set(records.map(r => r.metadata?.patientName).filter(Boolean))
    );
    return names as string[];
  }, [records]);

  // Filter and search
  const filteredRecords = useMemo(() => {
    if (!records) return [];
    return records.filter(record => {
      const matchesPatient = selectedPatient ? record.metadata?.patientName === selectedPatient : true;
      const matchesSearch =
        search.trim() === "" ||
        record.title?.toLowerCase().includes(search.toLowerCase()) ||
        record.content?.toLowerCase().includes(search.toLowerCase());
      return matchesPatient && matchesSearch;
    });
  }, [records, selectedPatient, search]);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 w-full">
        <div className="flex-1 flex gap-2 w-full">
          <div className="relative w-full">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search records..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 w-full max-w-full"
            />
          </div>
          {patientOptions.length > 0 && (
            <select
              className="border rounded px-2 py-1 text-sm w-auto max-w-xs"
              value={selectedPatient || ""}
              onChange={e => setSelectedPatient(e.target.value || null)}
            >
              <option value="">All Patients</option>
              {patientOptions.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          )}
        </div>
        <Button onClick={() => setShowModal(true)} variant="default" className="gap-2">
          <PlusCircle className="h-5 w-5" /> New Record
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="text-red-500">Error: {error instanceof Error ? error.message : "Unknown error"}</div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-muted-foreground">No records found.</div>
      ) : (
        <div className="grid gap-4">
          {filteredRecords.map(record => (
            <Card key={record.id} className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setActiveRecord(record)}>
              <CardHeader>
                <CardTitle>{record.title || "Untitled Record"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground mb-2">
                  Created: {record.created_at ? new Date(record.created_at).toLocaleString() : "Unknown"}
                </div>
                <div className="text-sm line-clamp-2">
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
      )}

      {/* Record Details Modal (stub) */}
      {activeRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded shadow-lg max-w-lg w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setActiveRecord(null)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-2">{activeRecord.title || "Untitled Record"}</h2>
            <div className="text-xs text-muted-foreground mb-2">
              Created: {activeRecord.created_at ? new Date(activeRecord.created_at).toLocaleString() : "Unknown"}
            </div>
            <div className="mb-2">
              {activeRecord.content || <span className="italic text-gray-400">No content</span>}
            </div>
            {activeRecord.metadata?.patientName && (
              <div className="text-xs text-gray-500">Patient: {activeRecord.metadata.patientName}</div>
            )}
            {activeRecord.metadata?.source && (
              <div className="text-xs text-gray-400">Source: {activeRecord.metadata.source}</div>
            )}
          </div>
        </div>
      )}

      {/* New Record Modal (stub, can wire up PatientContextModal if desired) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded shadow-lg max-w-lg w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-2">New Record</h2>
            <div className="mb-4 text-muted-foreground">(Record creation coming soon...)</div>
            {/* Optionally, render <PatientContextModal onClose={() => setShowModal(false)} /> here */}
          </div>
        </div>
      )}
    </div>
  );
}
