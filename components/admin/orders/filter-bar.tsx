'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, LayoutGrid, List, Download, X } from 'lucide-react';
import type { ViewMode, FilterState } from './types';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onExport?: () => void;
}

export function FilterBar({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  onExport,
}: FilterBarProps) {
  const [searchValue, setSearchValue] = useState(filters.search);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleSearchSubmit = () => {
    onFiltersChange({ ...filters, search: searchValue });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const clearSearch = () => {
    setSearchValue('');
    onFiltersChange({ ...filters, search: '' });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-[400px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search order #, customer, email..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="pl-9 pr-8"
        />
        {searchValue && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Date Range */}
      <Select
        value={filters.dateRange}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, dateRange: value as FilterState['dateRange'] })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Date range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All time</SelectItem>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="90d">Last 90 days</SelectItem>
        </SelectContent>
      </Select>

      {/* Spacer */}
      <div className="flex-1" />

      {/* View Toggle */}
      <div className="flex items-center border rounded-lg overflow-hidden">
        <button
          onClick={() => onViewModeChange('table')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 text-sm transition-colors',
            viewMode === 'table'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background hover:bg-muted'
          )}
        >
          <List className="h-4 w-4" />
          <span className="hidden sm:inline">Table</span>
        </button>
        <button
          onClick={() => onViewModeChange('kanban')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 text-sm transition-colors',
            viewMode === 'kanban'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background hover:bg-muted'
          )}
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline">Kanban</span>
        </button>
      </div>

      {/* Export */}
      {onExport && (
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="h-4 w-4 mr-1.5" />
          Export
        </Button>
      )}
    </div>
  );
}
