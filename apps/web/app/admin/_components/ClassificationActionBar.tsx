import { useState, useEffect } from 'react';
import { Button } from '@kit/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@kit/ui/utils';

interface ClassificationActionBarProps {
  onRunClassification: () => void;
  onDeleteSelected: () => void;
  onCheckAll: () => void;
  selectedCount: number;
  totalCount: number;
  isLoading?: boolean;
}

export function ClassificationActionBar({
  onRunClassification,
  onDeleteSelected,
  onCheckAll,
  selectedCount,
  totalCount,
  isLoading
}: ClassificationActionBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-expand when items are selected
  useEffect(() => {
    if (selectedCount > 0 && !isExpanded) {
      setIsExpanded(true);
    }
  }, [selectedCount, isExpanded]);

  return (
    <div
      className={cn(
        "sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border z-10 transition-all duration-300 ease-in-out",
        isExpanded ? "h-[4.5rem]" : "h-8",
        "-mt-4 -mx-6 px-6 mb-2"
      )}
    >
      {/* Header/Toggle */}
      <div 
        className="flex items-center justify-between h-8 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {selectedCount} of {totalCount} selected
          </span>
          {selectedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1.5 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onCheckAll();
              }}
            >
              {selectedCount === totalCount ? 'Uncheck All' : 'Check All'}
            </Button>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronUp className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Action Buttons */}
      <div
        className={cn(
          "pb-2 space-x-2",
          "transition-all duration-300",
          isExpanded 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 -translate-y-2 pointer-events-none"
        )}
      >
        {selectedCount === 0 ? (
          <Button
            variant="default"
            size="sm"
            onClick={onRunClassification}
            disabled={isLoading}
            className="h-7 px-2 text-xs"
          >
            Run Classification
          </Button>
        ) : (
          <Button
            variant="destructive"
            size="sm"
            onClick={onDeleteSelected}
            disabled={isLoading}
            className="h-7 px-2 text-xs"
          >
            Delete Selected ({selectedCount})
          </Button>
        )}
      </div>
    </div>
  );
}