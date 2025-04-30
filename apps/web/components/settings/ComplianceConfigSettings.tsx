"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@kit/ui/card";
import { Button } from "@kit/ui/button";
import { Label } from "@kit/ui/label";
import { cn } from "@kit/ui/utils";
import { useProtocolStore } from "~/store/protocolStore";
import { getCategoryColors, EvaluationTemplate } from "~/types/evaluation";
import { Input } from "@kit/ui/input";
import { Textarea } from "@kit/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@kit/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@kit/ui/dialog";
import { Checkbox } from "@kit/ui/checkbox";

interface SortConfig {
  key: "name" | "category";
  direction: "asc" | "desc";
}

type SetType = "admission" | "daily" | "cyclic";

export default function ComplianceConfigSettings() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedType, setSelectedType] = useState<SetType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "name",
    direction: "asc",
  });

  const {
    protocols,
    form,
    selectedProtocolId,
    isLoading,
    error,
    success,
    showSaveModal,
    protocolName,
    protocolDescription,
    fetchProtocols,
    setForm,
    selectProtocol,
    loadSelectedProtocol,
    setShowSaveModal,
    setProtocolName,
    setProtocolDescription,
    saveProtocol,
    resetForm,
  } = useProtocolStore();

  // Fetch all evaluation templates for selection
  const [allTemplates, setAllTemplates] = useState<EvaluationTemplate[]>([]);
  useEffect(() => {
    async function fetchTemplates() {
      const client = (await import("~/utils/supabase/client")).createClient();
      const { data, error } = await client
        .from("evaluation_templates")
        .select("*")
        .order("name", { ascending: true });
      if (!error) setAllTemplates(data || []);
    }
    fetchTemplates();
  }, []);

  useEffect(() => {
    fetchProtocols();
  }, [fetchProtocols]);

  useEffect(() => {
    loadSelectedProtocol();
  }, [selectedProtocolId, loadSelectedProtocol]);

  useEffect(() => {
    if (!isInitialized && form) {
      setForm(form);
      setIsInitialized(true);
    }
  }, [form, isInitialized, setForm]);

  const handleCreateSet = (type: SetType) => setSelectedType(type);
  const handleCloseModal = () => setSelectedType(null);

  const handleSaveSelection = (ids: number[]) => {
    if (!selectedType || !form) return;
    setForm({ ...form, [selectedType]: ids });
    setSelectedType(null);
  };

  const handleSort = (key: "name" | "category") =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));

  const handleLoadProtocol = (id: string) => selectProtocol(id);
  const handleClear = () => resetForm();

  // --- Filtering & sorting ---
  const categories = useMemo(() => {
    const uniq = new Set(allTemplates.map((e) => e.category || "Uncategorized"));
    return ["all", ...uniq];
  }, [allTemplates]);

  const filtered = useMemo(() => {
    return allTemplates
      .filter((e) => {
        const matchText =
          !searchQuery ||
          e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (e as any).description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCat = selectedCategory === "all" || e.category === selectedCategory;
        return matchText && matchCat;
      })
      .sort((a, b) => {
        if (sortConfig.key === "name") {
          const na = a.name || `Evaluation ${a.id}`;
          const nb = b.name || `Evaluation ${b.id}`;
          return sortConfig.direction === "asc"
            ? na.localeCompare(nb)
            : nb.localeCompare(na);
        } else {
          const ca = a.category || "Uncategorized";
          const cb = b.category || "Uncategorized";
          return sortConfig.direction === "asc"
            ? ca.localeCompare(cb)
            : cb.localeCompare(ca);
        }
      });
  }, [allTemplates, searchQuery, selectedCategory, sortConfig]);

  if (!form) {
    return (
      <Card>
        <CardContent className="text-sm text-muted-foreground px-3 py-2">
          Loading configuration...
        </CardContent>
      </Card>
    );
  }

  function SelectedEvaluations({
    evaluations,
    onRemove,
  }: {
    evaluations: EvaluationTemplate[];
    onRemove: (id: number) => void;
  }) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {evaluations.map((ev) => {
          const colors = getCategoryColors(ev.category);
          return (
            <div
              key={ev.id}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-sm border",
                colors.bg,
                colors.text,
                colors.border,
                colors.bgHover,
                colors.textHover,
                "transition-colors"
              )}
            >
              <span className="truncate flex-1">
                {ev.name || `Evaluation ${ev.id}`}
              </span>
              <button
                onClick={() => onRemove(ev.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  function ConfigSection({
    title,
    description,
    children,
  }: {
    title: string;
    description?: string;
    children: React.ReactNode;
  }) {
    return (
      <div className="border rounded-lg bg-background divide-y divide-border">
        <div className="px-4 py-3">
          <h3 className="font-medium text-sm">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="p-4 space-y-4">{children}</div>
      </div>
    );
  }

  function EvaluationSelectionTable({
    templates,
    selected,
    onChange,
    onCancel,
  }: {
    templates: EvaluationTemplate[];
    selected: number[];
    onChange: (ids: number[]) => void;
    onCancel: () => void;
  }) {
    const [localSelected, setLocalSelected] = useState<number[]>(selected || []);
    const [filter, setFilter] = useState("");
    const [sortKey, setSortKey] = useState<"name" | "category">("name");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

    const filteredTemplates = useMemo(() => {
      let list = templates;
      if (filter) {
        list = list.filter(
          (t: EvaluationTemplate) =>
            t.name.toLowerCase().includes(filter.toLowerCase()) ||
            (t.category || "Uncategorized").toLowerCase().includes(filter.toLowerCase())
        );
      }
      list = [...list].sort((a: EvaluationTemplate, b: EvaluationTemplate) => {
        let aVal = a[sortKey] || "";
        let bVal = b[sortKey] || "";
        if (sortDir === "asc") return aVal.localeCompare(bVal);
        return bVal.localeCompare(aVal);
      });
      return list;
    }, [templates, filter, sortKey, sortDir]);

    const toggle = (id: number) => {
      setLocalSelected((prev) =>
        prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
      );
    };

    const handleSave = () => {
      onChange(localSelected);
    };

    return (
      <div>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Filter by name or category"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-64"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSortKey(sortKey === "name" ? "category" : "name");
              setSortDir(sortDir === "asc" ? "desc" : "asc");
            }}
          >
            Sort by {sortKey === "name" ? "Category" : "Name"} ({sortDir})
          </Button>
        </div>
        <div className="max-h-80 overflow-y-auto border rounded">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="px-2 py-1 w-8"></th>
                <th className="px-2 py-1 text-left">Name</th>
                <th className="px-2 py-1 text-left">Category</th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.map((t: EvaluationTemplate) => (
                <tr key={t.id} className="border-t">
                  <td className="px-2 py-1">
                    <Checkbox checked={localSelected.includes(t.id)} onCheckedChange={() => toggle(t.id)} />
                  </td>
                  <td className="px-2 py-1">{t.name}</td>
                  <td className="px-2 py-1">{t.category || "Uncategorized"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleSave}>
            Save Selection
          </Button>
        </div>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Protocol Builder</CardTitle>
        <CardDescription>
          Build protocols by selecting required evaluation templates for each phase.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Protocol meta */}
          <div className="flex flex-col gap-2">
            <Input
              placeholder="Protocol Name"
              value={protocolName}
              onChange={(e) => setProtocolName(e.target.value)}
              className="w-full"
            />
            <Textarea
              placeholder="Protocol Description"
              value={protocolDescription}
              onChange={(e) => setProtocolDescription(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Admission */}
          <ConfigSection title="Admission Evaluations">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleCreateSet("admission")}
            >
              Select Admission Evaluations
            </Button>
            <SelectedEvaluations
              evaluations={allTemplates.filter((ev) =>
                form.admission.includes(ev.id)
              )}
              onRemove={(id) =>
                setForm({
                  ...form,
                  admission: form.admission.filter((evId) => evId !== id),
                })
              }
            />
          </ConfigSection>

          {/* Daily */}
          <ConfigSection title="Daily Evaluations">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleCreateSet("daily")}
            >
              Select Daily Evaluations
            </Button>
            <SelectedEvaluations
              evaluations={allTemplates.filter((ev) =>
                form.daily.includes(ev.id)
              )}
              onRemove={(id) =>
                setForm({
                  ...form,
                  daily: form.daily.filter((evId) => evId !== id),
                })
              }
            />
          </ConfigSection>

          {/* Cyclic */}
          <ConfigSection title="Cyclic Evaluations">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleCreateSet("cyclic")}
            >
              Select Cyclic Evaluations
            </Button>
            <SelectedEvaluations
              evaluations={allTemplates.filter((ev) =>
                form.cyclic.includes(ev.id)
              )}
              onRemove={(id) =>
                setForm({
                  ...form,
                  cyclic: form.cyclic.filter((evId) => evId !== id),
                })
              }
            />
          </ConfigSection>

          {/* Cycle Length */}
          <ConfigSection title="Cycle Length (days)">
            <Input
              type="number"
              min={1}
              value={form.cycleLength}
              onChange={(e) =>
                setForm({
                  ...form,
                  cycleLength: Math.max(1, parseInt(e.target.value, 10) || 7),
                })
              }
              className="w-32"
            />
          </ConfigSection>
        </div>

        {/* --- Evaluation Selection Modal --- */}
        <Dialog open={!!selectedType} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <span className="font-semibold text-lg">
                Select {selectedType ? selectedType.charAt(0).toUpperCase() + selectedType.slice(1) : ""} Evaluations
              </span>
            </DialogHeader>
            {selectedType && (
              <EvaluationSelectionTable
                templates={filtered}
                selected={form[selectedType]}
                onChange={(ids: number[]) => handleSaveSelection(ids)}
                onCancel={handleCloseModal}
              />
            )}
            <DialogFooter>
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
              {/* Save handled in EvaluationSelectionTable */}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={isLoading}
        >
          Clear
        </Button>
        <Button
          variant="default"
          onClick={saveProtocol}
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save Protocol"}
        </Button>
      </CardFooter>
    </Card>
  );
}