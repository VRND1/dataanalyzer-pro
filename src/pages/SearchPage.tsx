import React from 'react';
import { SearchBarWithAutocomplete } from '../components/ui/SearchBarWithAutocomplete';
import { SearchFilters } from '../components/ui/SearchFilters';
import { SearchResults } from '../components/ui/SearchResults';
import { useSearch } from '../contexts/SearchContext';
import { SearchResult } from '../types/search';

export const SearchPage: React.FC = () => {
  const { state, search, selectResult } = useSearch();

  const handleSearch = (query: string) => {
    // Always search, even with empty query to show all results
    search(query);
  };

  const handleResultSelect = (result: SearchResult) => {
    selectResult(result);
    // You can add navigation or other actions here
    console.log('Selected result:', result);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Search Your Data
          </h1>
          <p className="text-gray-600">
            Find what you're looking for using our powerful search tools
          </p>
        </div>

        <div className="space-y-6">
          {/* Search Bar */}
          <SearchBarWithAutocomplete
            onSearch={handleSearch}
            onSelect={handleResultSelect}
            placeholder="Search for anything..."
            className="w-full"
            results={state.results}
            isLoading={state.isLoading}
          />

          {/* Search Filters */}
          <SearchFilters className="bg-white p-4 rounded-lg shadow" />

          {/* Search Results */}
          <SearchResults
            className="mt-8"
            onResultClick={handleResultSelect}
          />

          {/* Selected Result Details */}
          {state.selectedResult && (
            <div className="mt-8 p-6 bg-white rounded-lg shadow">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Selected Result
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {state.selectedResult.label}
                  </h3>
                  {state.selectedResult.description && (
                    <p className="mt-1 text-gray-600">
                      {state.selectedResult.description}
                    </p>
                  )}
                </div>
                {state.selectedResult.metadata && (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(state.selectedResult.metadata).map(
                      ([key, value]) => (
                        <div key={key}>
                          <dt className="text-sm font-medium text-gray-500">
                            {key}
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {value}
                          </dd>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 