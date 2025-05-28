"use client"

import { useState, useEffect } from "react"
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
function ContextItemViewer({ item }: { item: { id: string, type: string, title: string } | null }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { items } = useContextQueueStore();

  useEffect(() => {
    if (!item) return;
    setLoading(true);
    setError(null);
    setContent(null);
    try {
      const found = items.find((queueItem) => queueItem.id === item.id);
      setContent(found?.content || '[No content found]');
    } catch (err: any) {
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [item, items]);

  if (!item) return null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{item.title}</h3>
        <Badge className="border border-input bg-background text-foreground px-2 py-0.5 rounded-md text-xs font-medium">
          {item.type}
        </Badge>
        <p className="text-sm text-muted-foreground">
          ID: {item.id}
        </p>
      </div>
      <ScrollArea className="h-[350px] border rounded-md p-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : (
          <pre className="whitespace-pre-wrap text-sm">{content}</pre>
        )}
      </ScrollArea>
    </div>
  );
}

export function ContextQueue({ compact = false }: ContextQueueProps) {
  const { items, toggleItem, removeItem, clearQueue } = useContextQueueStore()
  const { selectedPatient } = usePatientStore();
  const patient = selectedPatient;
  const [viewingItem, setViewingItem] = useState<{ id: string, type: string, title: string } | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const selectedCount = items.filter((item) => item.selected).length

  // Function to handle viewing an item
  const handleViewItem = (item: { id: string, type: string, title: string }) => {
    setViewingItem(item);
    setIsViewerOpen(true);
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
      <div className={cn(
        "w-full flex flex-col gap-1 transition-all duration-300 ease-in-out",
        isCollapsed ? "h-8" : "px-2 pt-2 pb-1"
      )}>
        <div className="relative w-full">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center bg-background border border-border rounded-full h-6 w-6 shadow-sm hover:bg-accent transition-all duration-200"
            title={isCollapsed ? "Expand context" : "Collapse context"}
          >
            {isCollapsed ? (
              <ChevronUp className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        </div>
        {/* Tag row for context items */}
        <div className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isCollapsed ? "h-0" : "h-auto"
        )}>
          <div className="flex flex-wrap items-center gap-2">
            {items.map((item) => (
              <span
                key={item.id}
                className="flex items-center bg-muted border border-border rounded-full px-2 py-1 text-xs font-medium shadow-sm max-w-xs truncate"
                title={item.title}
              >
                <TypeBadge type={item.type} />
                <span className="truncate max-w-[120px] ml-1">{item.title}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="ml-1 h-4 w-4 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeItem(item.id)}
                  tabIndex={-1}
                >
                  <X className="h-3 w-3" />
                </Button>
              </span>
            ))}
            {items.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="ml-2 h-6 px-2 text-xs">View All</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Context Items</DialogTitle>
                  </DialogHeader>
                  <div className="mt-2">
                    <ContextQueue compact={false} />
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Regular full-size mode: single list with type badges
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>{patient?.firstName} {patient?.lastName}</CardTitle>
          <Badge className="border border-input bg-background text-foreground px-2 py-0.5 rounded-md text-xs font-medium">
            {selectedCount} selected
          </Badge>
        </div>
        <CardDescription>Add documents, uploads, evaluations, and context items to provide context for your chat</CardDescription>
      </CardHeader>
      <ScrollArea className="h-[350px] px-4">
        <div className="space-y-2 pb-4">
          {items.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">No context items added</div>
          ) : (
            items.map((item) => (
              <ContextItemCard key={item.id} item={item} onToggle={toggleItem} onRemove={removeItem} onView={handleViewItem} />
            ))
          )}
        </div>
      </ScrollArea>
      <CardFooter className="flex justify-between pt-0">
        <Button 
          className="bg-red-500 hover:bg-red-600 text-white rounded-md px-3 py-1.5 text-sm"
          onClick={clearQueue} 
          disabled={items.length === 0}
        >
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
  item: { id: string, type: string, title: string, selected: boolean };
  onToggle: (id: string, selected: boolean) => void;
  onRemove: (id: string) => void;
  onView?: (item: { id: string, type: string, title: string }) => void;
}

function ContextItemCard({ item, onToggle, onRemove, onView }: ContextItemCardProps) {
  return (
    <div className="flex items-start gap-2 p-3 border rounded-md bg-card">
      <Checkbox
        id={`item-${item.id}`}
        checked={item.selected}
        onCheckedChange={(checked) => onToggle(item.id, !!checked)}
        className="flex-shrink-0"
      />
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="font-medium truncate pr-2">{item.title}</div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {onView && (
          <Button 
            className="bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-md h-7 w-7 flex-shrink-0"
            onClick={() => onView(item)} 
            title="View content"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
        <Button 
          className="bg-red-500 hover:bg-red-600 text-white rounded-md h-7 w-7 flex-shrink-0"
          onClick={() => onRemove(item.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Helper component for type badge
function TypeBadge({ type }: { type: string }) {
  let color = "bg-gray-200 text-gray-700";
  if (type === "document") color = "bg-blue-100 text-blue-800";
  else if (type === "upload") color = "bg-green-100 text-green-800";
  else if (type === "evaluation") color = "bg-purple-100 text-purple-800";
  else if (type === "context") color = "bg-yellow-100 text-yellow-800";
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${color}`}>{type}</span>
  );
}
