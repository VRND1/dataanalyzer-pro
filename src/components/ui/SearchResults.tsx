import React from 'react';
import { useSearch } from '../../contexts/SearchContext';
import { SearchResult } from '../../types/search';

interface SearchResultsProps {
  className?: string;
  onResultClick?: (result: SearchResult) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  className = '',
  onResultClick,
}) => {
  const { state } = useSearch();
  const { results, isLoading, error } = state;

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 text-red-500 bg-red-50 rounded-lg ${className}`}>
        {error}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={`p-4 text-gray-500 text-center ${className}`}>
        No results found
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {results.map((result) => (
        <div
          key={result.id}
          className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onResultClick?.(result)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">{result.label}</h3>
              {result.description && (
                <p className="mt-1 text-sm text-gray-500">{result.description}</p>
              )}
            </div>
            {result.category && (
              <span className="ml-4 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">
                {result.category}
              </span>
            )}
          </div>
          {result.metadata && (
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(result.metadata).map(([key, value]) => (
                <span
                  key={key}
                  className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-full"
                >
                  {key}: {value}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}; 