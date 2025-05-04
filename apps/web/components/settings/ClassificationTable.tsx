'use client';
import { useEffect, useState } from 'react';
import { createClient } from '~/utils/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';
import { ClassificationActionBar } from './ClassificationActionBar';
import { EvaluationCategory, getCategoryColors, EvaluationTemplate } from '~/types/evaluation';

const supabase = createClient();

// Same categories as used in the classification API
const EVAL_CATEGORIES: EvaluationCategory[] = [
  'Assessments',
  'Screenings',
  'TreatmentPlans',
  'ConsentForms',
  'AdministrativeForms',
  'Medical',
  'Other'
];

export default function ClassificationTable() {
  const [data, setData] = useState<Record<string, EvaluationTemplate[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  async function handleSyncAndClassify() {
    setTriggering(true);
    setError(null);
    try {
      console.log('🔍 [Classification] Fetching from KIPU...');
      // 1. Fetch from KIPU
      const resKipu = await fetch('/api/kipu/evaluations');
      console.log('🔍 [Classification] KIPU Response:', resKipu);
      if (!resKipu.ok) throw new Error('Failed to fetch from KIPU');
      const kipuData = await resKipu.json();
      
      const evaluations = kipuData?.data?.evaluations;
      if (!evaluations || !Array.isArray(evaluations)) {
        throw new Error('No evaluations returned from KIPU');
      }
      if (evaluations.length === 0) {
        throw new Error('KIPU returned an empty evaluations array');
      }
      
      // 2. POST to classification endpoint
      const resClassify = await fetch('/api/classify/kipu/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluations }),
      });
  
      if (!resClassify.ok) {
        const result = await resClassify.json();
        console.error('❌ [Classification] Error from classify endpoint:', result);
        throw new Error(result?.error || 'Classification failed');
      }
  
      // 3. Reload table
      console.log('🔍 [Classification] Fetching classified data...');
      await fetchClassifiedData();
      console.log('✅ [Classification] Done!');
    } catch (err: any) {
      console.error('❌ [Classification] Error:', err);
      setError(err.message || 'Sync & classification failed');
    } finally {
      setTriggering(false);
    }
  }

  useEffect(() => {
    fetchClassifiedData();
  }, []);

  async function handleTriggerClassification() {
    setTriggering(true);
    setError(null);
    try {
      // Fetch all evaluation templates to classify
      const { data: templates, error } = await supabase
        .from('evaluation_templates')
        .select('id, name, patient_process_id');
      if (error) throw error;

      // POST to your classification API
      const res = await fetch('/api/classify/kipu/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluations: (templates || []).map((tpl: any) => ({
            evaluation_template_id: tpl.id,
            name: tpl.name,
            patient_process_id: tpl.patient_process_id,
          })),
        }),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result?.error || 'Classification failed');
      }

      await fetchClassifiedData(); // Refresh table after classification
    } catch (err: any) {
      setError(err.message || 'Classification failed');
    } finally {
      setTriggering(false);
    }
  }

  async function fetchClassifiedData() {
    setLoading(true);
    const { data: templates, error } = await supabase
      .from('evaluation_templates')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      setError('Failed to fetch evaluation templates.');
      setData({});
    } else {
      // Group by category
      const grouped: Record<string, EvaluationTemplate[]> = {};
      (templates || []).forEach((tpl: EvaluationTemplate) => {
        const cat = tpl.category || 'Uncategorized';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(tpl);
      });
      setData(grouped);
    }
    setLoading(false);
  }

  function handleCheckAll() {
    const allIds = Object.values(data).flat().map((tpl) => tpl.id);
    if (selectedIds.size === allIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  }

  async function handleUpdateCategory(templateId: number, newCategory: string) {
    setUpdating(templateId);
    try {
      const { error } = await supabase
        .from('evaluation_templates')
        .update({ category: newCategory })
        .eq('id', templateId);

      if (error) throw error;
      await fetchClassifiedData();
    } catch (err) {
      setError('Failed to update category.');
    } finally {
      setUpdating(null);
    }
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    try {
      const { error } = await supabase
        .from('evaluation_templates')
        .delete()
        .in('id', Array.from(selectedIds));
      if (error) throw error;
      setSelectedIds(new Set());
      await fetchClassifiedData();
    } catch (err) {
      setError('Failed to delete selected templates.');
    }
  }

  const totalEvaluations = Object.values(data).flat().length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Evaluation Template Classification</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Classified Evaluation Templates</CardTitle>
          <CardDescription>
            Manage and categorize evaluation templates synced from KIPU.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClassificationActionBar
    onRunClassification={handleSyncAndClassify}
            onDeleteSelected={handleDeleteSelected}
            onCheckAll={handleCheckAll}
            selectedCount={selectedIds.size}
            totalCount={totalEvaluations}
            isLoading={loading || triggering}
          />
          {error && (
            <div className="text-red-500 text-xs mt-2">{error}</div>
          )}
          <div className="space-y-4">
            {loading ? (
              <div className="text-muted-foreground text-sm">Loading...</div>
            ) : (
              EVAL_CATEGORIES.map((cat) => (
                <div key={cat}>
                  <div className="font-medium mb-2">{cat}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {(data[cat] || []).map((tpl) => {
                      const colors = getCategoryColors(cat);
                      return (
                        <div
                          key={tpl.id}
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
                          <input
                            type="checkbox"
                            checked={selectedIds.has(tpl.id)}
                            onChange={() => {
                              const next = new Set(selectedIds);
                              if (next.has(tpl.id)) next.delete(tpl.id);
                              else next.add(tpl.id);
                              setSelectedIds(next);
                            }}
                          />
                          <span className="truncate flex-1">{tpl.name || `Evaluation ${tpl.id}`}</span>
                          
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            {totalEvaluations} evaluation templates classified
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}