import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { SearchService } from '../services/searchService';
import {
  SearchState,
  SearchContextType,
  SearchFilters,
  SearchResult,
} from '../types/search';

const initialState: SearchState = {
  query: '',
  results: [],
  isLoading: false,
  error: null,
  filters: {},
  selectedResult: null,
};

type SearchAction =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_RESULTS'; payload: SearchResult[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: SearchFilters }
  | { type: 'SET_SELECTED_RESULT'; payload: SearchResult | null }
  | { type: 'CLEAR_SEARCH' };

const searchReducer = (state: SearchState, action: SearchAction): SearchState => {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.payload };
    case 'SET_RESULTS':
      return { ...state, results: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    case 'SET_SELECTED_RESULT':
      return { ...state, selectedResult: action.payload };
    case 'CLEAR_SEARCH':
      return initialState;
    default:
      return state;
  }
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(searchReducer, initialState);
  const searchService = SearchService.getInstance();

  const search = useCallback(async (query: string) => {
    try {
      dispatch({ type: 'SET_QUERY', payload: query });
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const results = await searchService.searchWithFilters(query, state.filters);
      dispatch({ type: 'SET_RESULTS', payload: results });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.filters]);

  const setFilters = useCallback((filters: SearchFilters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const selectResult = useCallback((result: SearchResult) => {
    dispatch({ type: 'SET_SELECTED_RESULT', payload: result });
  }, []);

  const clearSearch = useCallback(() => {
    dispatch({ type: 'CLEAR_SEARCH' });
  }, []);

  return (
    <SearchContext.Provider
      value={{
        state,
        search,
        setFilters,
        selectResult,
        clearSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}; 