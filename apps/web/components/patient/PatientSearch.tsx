'use client';

import { Input } from '@kit/ui/input';
import { Search, Calendar, X, SortAsc, SortDesc, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@kit/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@kit/ui/dropdown-menu';

export type SortField = 'lastName' | 'admissionDate' | 'status' | null;
export type SortDirection = 'asc' | 'desc';

interface PatientSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  dateRange?: { 
    start: string | null; 
    end: string | null 
  };
  setDateRange?: (range: { 
    start: string | null; 
    end: string | null 
  }) => void;
  sortField?: SortField;
  setSortField?: (field: SortField) => void;
  sortDirection?: SortDirection;
  setSortDirection?: (direction: SortDirection) => void;
  compact?: boolean;
}

export function PatientSearch({ 
  searchQuery, 
  setSearchQuery,
  dateRange = { start: null, end: null },
  setDateRange = () => {},
  sortField = null,
  setSortField = () => {},
  sortDirection = 'asc',
  setSortDirection = () => {},
  compact = false
}: PatientSearchProps) {
  const [showDateFilters, setShowDateFilters] = useState(false);
  const [localStartDate, setLocalStartDate] = useState(dateRange.start || '');
  const [localEndDate, setLocalEndDate] = useState(dateRange.end || '');

  // Sync local state with props when they change
  useEffect(() => {
    setLocalStartDate(dateRange.start || '');
    setLocalEndDate(dateRange.end || '');
  }, [dateRange.start, dateRange.end]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setLocalStartDate(newDate);
    setDateRange({ 
      ...dateRange, 
      start: newDate || null 
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setLocalEndDate(newDate);
    setDateRange({ 
      ...dateRange, 
      end: newDate || null 
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setLocalStartDate('');
    setLocalEndDate('');
    setDateRange({ start: null, end: null });
    setSortField(null);
    setSortDirection('asc');
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <SortAsc className="h-3 w-3 ml-1" /> : 
      <SortDesc className="h-3 w-3 ml-1" />;
  };

  return (
    <div className={`w-full ${compact ? 'space-y-1' : 'space-y-2'}`}>
      {/* Search and Sort Row */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search Input */}
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            className="pl-8 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 whitespace-nowrap">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              Sort & Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuItem 
              className="flex justify-between cursor-pointer"
              onClick={() => handleSort('lastName')}
            >
              Last Name
              {getSortIcon('lastName')}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="flex justify-between cursor-pointer"
              onClick={() => handleSort('admissionDate')}
            >
              Admission Date
              {getSortIcon('admissionDate')}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="flex justify-between cursor-pointer"
              onClick={() => handleSort('status')}
            >
              Status
              {getSortIcon('status')}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => setShowDateFilters(!showDateFilters)}
            >
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              {showDateFilters ? 'Hide' : 'Show'} Date Filters
            </DropdownMenuItem>
            
            {(searchQuery || localStartDate || localEndDate || sortField) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-red-500"
                  onClick={handleClearFilters}
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Clear All Filters
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Active Filters Display */}
      {(sortField || searchQuery || localStartDate || localEndDate) && (
        <div className="flex flex-wrap gap-1.5 items-center text-xs">
          <span className="text-muted-foreground">Active filters:</span>
          
          {sortField && (
            <div className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center">
              Sort: {sortField} ({sortDirection})
              <button 
                onClick={() => setSortField(null)} 
                className="ml-1 hover:text-blue-900"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {searchQuery && (
            <div className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center">
              Search: {searchQuery.length > 10 ? `${searchQuery.substring(0, 10)}...` : searchQuery}
              <button 
                onClick={() => setSearchQuery('')} 
                className="ml-1 hover:text-blue-900"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {(localStartDate || localEndDate) && (
            <div className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center">
              Date range
              <button 
                onClick={() => setDateRange({ start: null, end: null })} 
                className="ml-1 hover:text-blue-900"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Date Filter Panel */}
      {showDateFilters && (
        <div className={`flex flex-col sm:flex-row gap-2 p-3 ${compact ? 'mb-2' : 'mb-3'} bg-gray-50 rounded-lg border border-gray-200`}>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Admission From</label>
            <input
              type="date"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={localStartDate}
              onChange={handleStartDateChange}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
            <input
              type="date"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={localEndDate}
              onChange={handleEndDateChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}