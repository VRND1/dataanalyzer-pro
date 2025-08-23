import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';
import debounce from 'lodash/debounce';

interface SearchResult {
  id: string | number;
  label: string;
  value: string;
  category?: string;
}

interface SearchBarWithAutocompleteProps {
  onSearch: (query: string) => void;
  onSelect: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
  showClearButton?: boolean;
  initialValue?: string;
  results?: SearchResult[];
  isLoading?: boolean;
  maxResults?: number;
}

export const SearchBarWithAutocomplete: React.FC<SearchBarWithAutocompleteProps> = ({
  onSearch,
  onSelect,
  placeholder = 'Search...',
  className = '',
  debounceMs = 300,
  showClearButton = true,
  initialValue = '',
  results = [],
  isLoading = false,
  maxResults = 5,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      onSearch(query);
    }, debounceMs),
    [onSearch, debounceMs]
  );

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery);
    }
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev < Math.min(results.length - 1, maxResults - 1) ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        onSelect(results[selectedIndex]);
        setSearchQuery(results[selectedIndex].label);
        setIsOpen(false);
      } else if (searchQuery.trim()) {
        window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-[#1A1B2E] text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-400"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        {showClearButton && searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (results.length > 0 || isLoading) && (
        <div className="absolute z-50 w-full mt-1 bg-[#1A1B2E] border border-white/10 rounded-lg shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-500 mx-auto"></div>
            </div>
          ) : results.length > 0 ? (
            <ul className="py-2">
              {results.slice(0, maxResults).map((result, index) => (
                <li
                  key={result.id}
                  className={`px-4 py-2 cursor-pointer ${
                    index === selectedIndex
                      ? 'bg-teal-500/20 text-teal-400'
                      : 'hover:bg-white/5 text-white'
                  }`}
                  onClick={() => {
                    onSelect(result);
                    setSearchQuery(result.label);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center">
                    <span className="flex-1">{result.label}</span>
                    {result.category && (
                      <span className="text-xs text-gray-400 ml-2">
                        {result.category}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-400">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}; 