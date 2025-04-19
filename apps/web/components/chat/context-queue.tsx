"use client"

import { useState } from "react"
import { useContextQueueStore } from "~/store/chat/contextQueueStore"
import type { ContextItem } from "types/chat"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kit/ui/tabs"
import { ScrollArea } from "@kit/ui/scroll-area"
import { Button } from "@kit/ui/button"
import { Checkbox } from "@kit/ui/checkbox"
import { Badge } from "@kit/ui/badge"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle, CardContent } from "@kit/ui/card"
import { Collapsible, CollapsibleContent } from "@kit/ui/collapsible"
import { ChevronDown, ChevronUp, X, FileText, Upload, ClipboardList, Eye } from "lucide-react"
import { cn } from "@kit/ui/utils"
import { usePatientStore } from "~/store/patient/patientStore"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@kit/ui/dialog"

interface ContextQueueProps {
  compact?: boolean;
}

// Context Item Viewer Modal Component
function ContextItemViewer({ item }: { item: ContextItem | null }) {
  if (!item) return null;
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{item.title}</h3>
        <Badge variant="outline">{item.type}</Badge>
        <p className="text-sm text-muted-foreground">
          Added on {new Date(item.createdAt).toLocaleString()}
        </p>
      </div>
      
      <ScrollArea className="h-[350px] border rounded-md p-4">
        <pre className="whitespace-pre-wrap text-sm">{item.content}</pre>
      </ScrollArea>
    </div>
  );
}

export function ContextQueue({ compact = false }: ContextQueueProps) {
  const { items, toggleItem, removeItem, toggleEvaluationItemDetail, clearQueue } = useContextQueueStore()
  const { selectedPatient } = usePatientStore();
  const patient = selectedPatient;
  const documents = items.filter((item) => item.type === "document")
  const uploads = items.filter((item) => item.type === "upload")
  const evaluations = items.filter((item) => item.type === "evaluation")
  const [viewingItem, setViewingItem] = useState<ContextItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const selectedCount = items.filter((item) => item.selected).length
  
  // Function to handle viewing an item
  const handleViewItem = (item: ContextItem) => {
    setViewingItem(item);
    setIsViewerOpen(true);
  };
  
  // Function to toggle all evaluations
  const toggleAllEvaluations = (checked: boolean) => {
    evaluations.forEach(item => {
      toggleItem(item.id, checked);
    });
  };

  // If compact mode and no items, show a simple message
  if (compact && items.length === 0) {
    return (
      <div className="p-3 text-center text-sm text-muted-foreground">
        No context items added
      </div>
    )
  }

  // In compact mode, render a simplified version
  if (compact) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="text-sm font-medium">{patient?.firstName} {patient?.lastName}({selectedCount} selected)</div>
          {items.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearQueue} 
              className="h-7 px-2 text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
        
        <ScrollArea className="flex-1 max-h-[350px]">
          <div className="p-2 space-y-2">
            {items.map((item) => (
              <CompactContextItem 
                key={item.id} 
                item={item} 
                onToggle={toggleItem} 
                onRemove={removeItem}
                onToggleSection={
                  item.type === "evaluation" 
                    ? toggleEvaluationItemDetail
                    : undefined
                }
                onView={handleViewItem}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    )
  }

  // Regular full-size mode
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>{patient?.firstName} {patient?.lastName}</CardTitle>
          <Badge variant="secondary">{selectedCount} selected</Badge>
        </div>
        <CardDescription>Add documents, uploads, and evaluations to provide context for your chat</CardDescription>
      </CardHeader>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid grid-cols-3 mb-2 mx-4">
          <TabsTrigger value="documents" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>Documents</span>
            {documents.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {documents.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="uploads" className="flex items-center gap-1">
            <Upload className="h-4 w-4" />
            <span>Uploads</span>
            {uploads.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {uploads.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="flex items-center gap-1">
            <ClipboardList className="h-4 w-4" />
            <span>Evaluations</span>
            {evaluations.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {evaluations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="m-0">
          <ScrollArea className="h-[350px] px-4">
            <div className="space-y-2 pb-4">
              {documents.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">No documents added</div>
              ) : (
                documents.map((item) => (
                  <ContextItemCard key={item.id} item={item} onToggle={toggleItem} onRemove={removeItem} onView={handleViewItem} />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="uploads" className="m-0">
          <ScrollArea className="h-[350px] px-4">
            <div className="space-y-2 pb-4">
              {uploads.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">No uploads added</div>
              ) : (
                uploads.map((item) => (
                  <ContextItemCard key={item.id} item={item} onToggle={toggleItem} onRemove={removeItem} onView={handleViewItem} />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="evaluations" className="m-0">
          <ScrollArea className="h-[350px] px-4">
            <div className="space-y-2 pb-4">
              {evaluations.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">No evaluations added</div>
              ) : (
                <>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="select-all-evaluations"
                        checked={evaluations.every(item => item.selected)}
                        onCheckedChange={(checked) => toggleAllEvaluations(!!checked)}
                      />
                      <label 
                        htmlFor="select-all-evaluations" 
                        className="text-sm font-medium cursor-pointer"
                      >
                        Select All
                      </label>
                    </div>
                    <Badge variant="outline">{evaluations.filter(item => item.selected).length}/{evaluations.length}</Badge>
                  </div>
                  
                  {evaluations.map((item) => (
                    <ContextItemCard 
                      key={item.id} 
                      item={item} 
                      onToggle={toggleItem} 
                      onRemove={removeItem}
                      onView={handleViewItem}
                    />
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <CardFooter className="flex justify-between pt-0">
        <Button variant="destructive" size="sm" onClick={clearQueue} disabled={items.length === 0}>
          Clear All
        </Button>
      </CardFooter>
      
      {/* Context Item Viewer Dialog */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Context Item Details</DialogTitle>
          </DialogHeader>
          <ContextItemViewer item={viewingItem} />
        </DialogContent>
      </Dialog>
    </Card>
  )
}

interface ContextItemCardProps {
  item: ContextItem
  onToggle: (id: string, selected: boolean) => void
  onRemove: (id: string) => void
  onView?: (item: ContextItem) => void
}

function ContextItemCard({ item, onToggle, onRemove, onView }: ContextItemCardProps) {
  return (
    <div className="flex items-start gap-2 p-3 border rounded-md bg-card">
      <Checkbox
        id={`item-${item.id}`}
        checked={item.selected}
        onCheckedChange={(checked) => onToggle(item.id, !!checked)}
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{item.title}</div>
        <div className="text-sm text-muted-foreground">{item.content.substring(0, 100)}</div>
      </div>
      <div className="flex items-center">
        {onView && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={() => onView(item)} 
            title="View content"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(item.id)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// New compact context item component
interface CompactContextItemProps {
  item: ContextItem
  onToggle: (id: string, selected: boolean) => void
  onRemove: (id: string) => void
  onToggleSection?: (itemId: string, sectionId: string, selected: boolean) => void
  onView?: (item: ContextItem) => void
}

function CompactContextItem({ item, onToggle, onRemove, onToggleSection, onView }: CompactContextItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // For evaluation items with sections
  const isEvaluation = item.type === "evaluation" && "sections" in item && Array.isArray((item as any).sections);
  
  return (
    <div className="border rounded-md bg-card text-sm">
      <div className="flex items-center gap-1 p-2">
        <Checkbox
          id={`compact-item-${item.id}`}
          checked={item.selected}
          onCheckedChange={(checked) => onToggle(item.id, !!checked)}
          className="h-3.5 w-3.5"
        />
        <div className="flex-1 min-w-0 truncate text-xs">{item.title}</div>
        {isEvaluation && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5" 
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        )}
        <div className="flex items-center">
          {onView && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5" 
              onClick={() => onView(item)} 
              title="View content"
            >
              <Eye className="h-3 w-3" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5" 
            onClick={() => onRemove(item.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {isEvaluation && isOpen && onToggleSection && (
        <CollapsibleContent forceMount className="border-t px-2 py-1">
          <div className="space-y-1">
            {((item as any).sections || []).map((section: any) => (
              <div key={section.id} className="flex items-center gap-1">
                <Checkbox
                  id={`section-${section.id}`}
                  checked={section.selected}
                  onCheckedChange={(checked) => 
                    onToggleSection(item.id, section.id, !!checked)
                  }
                  className="h-3 w-3"
                />
                <label 
                  htmlFor={`section-${section.id}`}
                  className="text-xs truncate flex-1"
                >
                  {section.title}
                </label>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      )}
    </div>
  )
}

// Define our own interface that matches what we're using
interface EvaluationContextItem extends Omit<ContextItem, 'type'> {
  type: "evaluation";
  id: string;
  title: string;
  evaluationType: string;
  evaluationDate: Date;
  sections: any[];
  selected: boolean;
}

interface EvaluationCardProps {
  item: EvaluationContextItem
  onToggle: (id: string, selected: boolean) => void
  onRemove: (id: string) => void
  onToggleSection: (itemId: string, sectionId: string, selected: boolean) => void
}

function EvaluationCard({ item, onToggle, onRemove, onToggleSection }: EvaluationCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border rounded-md bg-card">
      <div className="flex items-start gap-2 p-3">
        <Checkbox
          id={`item-${item.id}`}
          checked={item.selected}
          onCheckedChange={(checked) => onToggle(item.id, !!checked)}
        />
        <div className="flex-1 min-w-0">
          <div className="font-medium">{item.title}</div>
          <div className="text-sm text-muted-foreground">
            {item.evaluationType} • {item.evaluationDate.toLocaleDateString()}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Collapse sections" : "Expand sections"}
        >
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(item.id)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent className="border-t px-3 py-2">
          <div className="space-y-2">
            {item.sections.map((section: any) => (
              <div key={section.id} className="flex items-center gap-2">
                <Checkbox
                  id={`section-${section.id}`}
                  checked={section.selected}
                  onCheckedChange={(checked) => onToggleSection(item.id, section.id, !!checked)}
                />
                <label
                  htmlFor={`section-${section.id}`}
                  className="flex-1 text-sm cursor-pointer hover:underline"
                >
                  {section.title}
                </label>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
