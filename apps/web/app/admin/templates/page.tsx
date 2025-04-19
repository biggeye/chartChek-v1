'use client';
import { useState, useEffect } from 'react';
import { useTemplateStore } from '~/store/doc/templateStore';
import { KipuEvaluationItemObject, KipuFieldTypes } from '~/types/kipu/kipuAdapter';
import DocumentViewer from '~/lib/DocumentView';
import { X } from 'lucide-react';
import ReactJsonView from '@microlink/react-json-view';

// Update your TemplateForm component to match the expected signature
const TemplateForm = ({ onSave }: { onSave: () => void }) => {
    // Reuse your existing TemplateEditor for creating new templates
    return <DocumentViewer />;
};

// Update the TemplateDetail component
const TemplateDetail = ({ template }: { template: any }) => {
    // Pass the selectedKipuTemplate as the document prop
    return <DocumentViewer />;
};

export default function TemplateAdminDashboard() {
    const {
        templates,
        fetchTemplates,
        createTemplate,
        selectedTemplate,
        setSelectedTemplate,
        kipuTemplates,
        isLoadingKipuTemplates,
        selectedKipuTemplate,
        error,
        fetchKipuTemplates,
        fetchKipuTemplate,
        setSelectedKipuTemplate,
        importKipuTemplate
    } = useTemplateStore();

    const isLoadingKipu = isLoadingKipuTemplates;
    const kipuError = error;

    useEffect(() => {
        // Load templates and KIPU templates on component mount
        const initTemplates = async () => {

            await fetchTemplates();
            await fetchKipuTemplates();
        };
        initTemplates();
    }, [fetchTemplates, fetchKipuTemplates]);

    const handleSelectKipuTemplate = (template: any) => {
        fetchKipuTemplate(template.id);
    };
    // In TemplateAdminDashboard component in page.tsx

    const filteredKipuTemplateView = selectedKipuTemplate ? {
        name: selectedKipuTemplate.name,
        createdBy: selectedKipuTemplate.createdBy,
        updatedBy: selectedKipuTemplate.updatedBy,
        evaluationItems: selectedKipuTemplate.evaluationItems // Keep the full array for now
    } : null;

    return (
        <div className="container mx-auto py-8">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-medium mb-4">KIPU Templates</h2>

                    {isLoadingKipu ? (
                        <div className="text-center py-4">
                            <span>Loading KIPU templates...</span>
                        </div>
                    ) : kipuError ? (
                        <div className="text-center py-4 text-red-500">
                            Error loading KIPU templates: {kipuError}
                        </div>
                    ) : kipuTemplates.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                            No KIPU templates available
                        </div>
                   // In page.tsx, replace lines ~150-163 (the kipuTemplates.map block)

                ) : (
                    <div className="space-y-2 max-h-96 text-xs overflow-y-auto">
                        {selectedKipuTemplate ? (
                            // Render only the selected template with a deselect button
                            <div
                                key={selectedKipuTemplate.id}
                                className="p-2 border rounded-md bg-blue-50 border-blue-300 flex justify-between items-center"
                            >
                                <div>
                                    <div className="font-sm">{selectedKipuTemplate.name || 'Unnamed Template'}</div>
                                    <div className="text-xs text-gray-500">{selectedKipuTemplate.evaluationContent || 'No description'}</div>
                                </div>
                                <button
                                    onClick={() => setSelectedKipuTemplate(null)} // Clear selection
                                    className="p-1 text-gray-500 hover:text-red-600"
                                    aria-label="Deselect KIPU template"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            // Render the full list if nothing is selected
                            kipuTemplates.map(template => (
                                <div
                                    key={template.id}
                                    className="p-2 border rounded-md cursor-pointer hover:bg-gray-50"
                                    onClick={() => handleSelectKipuTemplate(template)}
                                >
                                    <div className="font-sm">{template.name || 'Unnamed Template'}</div>
                                    <div className="text-xs text-gray-500">{template.evaluationContent || 'No description'}</div>
                                </div>
                            ))
                        )}
                    </div>
                )}
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
                {selectedKipuTemplate ? (
                    <>
                        <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
                            <ReactJsonView
                                src={filteredKipuTemplateView || {}} // Example theme, check available themes
                                collapsed={1}
                                enableClipboard={false}
                                displayDataTypes={false}
                                style={{ fontSize: '0.75rem' }}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                        Select a template from the library
                    </div>
                )}


            </div>
{filteredKipuTemplateView &&
<div>
<DocumentViewer 
items={filteredKipuTemplateView}/>
</div>}

        </div>
    );
}