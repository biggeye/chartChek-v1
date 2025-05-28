'use client';

import { useState } from 'react';
import { Button } from '@kit/ui/button';
import { KnowledgeDocumentUploader } from '../_components/knowledge/knowledge-document-uploader';
import { useKnowledgeDocuments } from '~/hooks/useKnowledgeDocuments';

export default function KnowledgeAdminPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [chunkDialogDocId, setChunkDialogDocId] = useState<string | null>(null);
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkOverlap, setChunkOverlap] = useState(200);
  const { documents, isLoading, deleteKnowledgeDocument, chunkKnowledgeDocument, isChunking, refetch } = useKnowledgeDocuments();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Knowledge Management</h1>
        <Button onClick={() => setShowAddModal(true)}>
          Add Knowledge Document
        </Button>
      </div>
      <KnowledgeDocumentUploader
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={refetch}
      />
      <div className="bg-white rounded shadow p-6 min-h-[200px]">
        {isLoading ? (
          <div>Loading...</div>
        ) : documents.length === 0 ? (
          <div className="text-gray-400 text-center">No knowledge documents found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Title</th>
                <th className="text-left py-2">Category</th>
                <th className="text-left py-2">Created</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">{doc.title}</td>
                  <td className="py-2">{doc.category_id}</td>
                  <td className="py-2">{doc.created_at ? new Date(doc.created_at).toLocaleString() : ''}</td>
                  <td className="py-2 space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setChunkDialogDocId(doc.id)}
                      disabled={isChunking}
                    >
                      Chunk
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => { await deleteKnowledgeDocument(doc.id); refetch(); }}
                    >
                      Delete
                    </Button>
                    {/* Chunking dialog inline */}
                    {chunkDialogDocId === doc.id && (
                      <div className="absolute bg-white border rounded shadow p-4 z-50 mt-2">
                        <div className="mb-2 font-semibold">Chunk Document</div>
                        <div className="flex items-center gap-2 mb-2">
                          <label>Chunk Size</label>
                          <input
                            type="number"
                            value={chunkSize}
                            min={100}
                            step={50}
                            onChange={e => setChunkSize(Number(e.target.value))}
                            className="border rounded px-2 py-1 w-20"
                          />
                          <label>Overlap</label>
                          <input
                            type="number"
                            value={chunkOverlap}
                            min={0}
                            step={10}
                            onChange={e => setChunkOverlap(Number(e.target.value))}
                            className="border rounded px-2 py-1 w-20"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={async () => {
                              await chunkKnowledgeDocument({ documentId: doc.id, chunkSize, chunkOverlap });
                              setChunkDialogDocId(null);
                              refetch();
                            }}
                            disabled={isChunking}
                          >
                            {isChunking ? 'Chunking...' : 'Start Chunking'}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setChunkDialogDocId(null)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 