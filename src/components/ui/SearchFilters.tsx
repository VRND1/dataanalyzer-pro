import React from 'react';
import { useSearch } from '../../contexts/SearchContext';

interface SearchFiltersProps {
  className?: string;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ className = '' }) => {
  const { state, setFilters } = useSearch();

  const handleCategoryChange = (category: string) => {
    setFilters({
      ...state.filters,
      category: category || undefined,
    });
  };

  const handleSortChange = (sortBy: 'relevance' | 'date' | 'name') => {
    setFilters({
      ...state.filters,
      sortBy,
    });
  };

  const handleSortOrderChange = (sortOrder: 'asc' | 'desc') => {
    setFilters({
      ...state.filters,
      sortOrder,
    });
  };

  const handleDateRangeChange = (start: Date, end: Date) => {
    setFilters({
      ...state.filters,
      dateRange: { start, end },
    });
  };

  const handleTagsChange = (tags: string[]) => {
    setFilters({
      ...state.filters,
      tags,
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Category Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            value={state.filters.category || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            <option value="business">Business</option>
            <option value="technology">Technology</option>
            <option value="finance">Finance</option>
            <option value="marketing">Marketing</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Sort By
          </label>
          <select
            value={state.filters.sortBy || 'relevance'}
            onChange={(e) =>
              handleSortChange(e.target.value as 'relevance' | 'date' | 'name')
            }
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="relevance">Relevance</option>
            <option value="date">Date</option>
            <option value="name">Name</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Sort Order
          </label>
          <select
            value={state.filters.sortOrder || 'desc'}
            onChange={(e) =>
              handleSortOrderChange(e.target.value as 'asc' | 'desc')
            }
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Date Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={state.filters.dateRange?.start?.toISOString().split('T')[0] || ''}
              onChange={(e) =>
                handleDateRangeChange(
                  new Date(e.target.value),
                  state.filters.dateRange?.end || new Date()
                )
              }
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={state.filters.dateRange?.end?.toISOString().split('T')[0] || ''}
              onChange={(e) =>
                handleDateRangeChange(
                  state.filters.dateRange?.start || new Date(),
                  new Date(e.target.value)
                )
              }
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Tags
          </label>
          <input
            type="text"
            placeholder="Add tags (comma-separated)"
            value={state.filters.tags?.join(', ') || ''}
            onChange={(e) =>
              handleTagsChange(
                e.target.value.split(',').map((tag) => tag.trim())
              )
            }
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}; 