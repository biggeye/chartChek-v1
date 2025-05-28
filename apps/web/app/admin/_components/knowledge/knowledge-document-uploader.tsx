import { useState, useEffect } from "react";
import { useKnowledgeDocuments } from "~/hooks/useKnowledgeDocuments";
import { Button } from "@kit/ui/button";
import { Input } from "@kit/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@kit/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@kit/ui/select";

interface KnowledgeCategory {
  id: string;
  slug: string;
  display_name: string;
}

export function KnowledgeDocumentUploader({ open, onClose, onSuccess }: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { uploadKnowledgeDocument } = useKnowledgeDocuments();

  useEffect(() => {
    if (!open) return;
    setLoadingCategories(true);
    fetch("/api/documents/knowledge/categories")
      .then(res => res.json())
      .then(data => setCategories(data.categories || []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, [open]);

  const handleUpload = async () => {
    if (!file || !categoryId || !title) return;
    setUploading(true);
    try {
      await uploadKnowledgeDocument({ file, categoryId, title });
      onSuccess?.();
      onClose();
      setFile(null);
      setCategoryId("");
      setTitle("");
    } catch (e: any) {
      alert("Upload failed: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Knowledge Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={categoryId} onValueChange={setCategoryId} disabled={loadingCategories || uploading}>
            <SelectTrigger>
              <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select category"} />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.display_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} disabled={uploading} />
          <Input type="file" accept=".pdf,.txt" onChange={e => setFile(e.target.files?.[0] || null)} disabled={uploading} />
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="secondary" disabled={uploading}>Cancel</Button>
          <Button onClick={handleUpload} disabled={uploading || !file || !categoryId || !title}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 