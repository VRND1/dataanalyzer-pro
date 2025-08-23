export interface SearchResult {
  id: string | number;
  label: string;
  value: string;
  category?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface SearchFilters {
  category?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  sortBy?: 'relevance' | 'date' | 'name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  filters: SearchFilters;
  selectedResult: SearchResult | null;
}

export interface SearchContextType {
  state: SearchState;
  search: (query: string) => Promise<void>;
  setFilters: (filters: SearchFilters) => void;
  selectResult: (result: SearchResult) => void;
  clearSearch: () => void;
} 