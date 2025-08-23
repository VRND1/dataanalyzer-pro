import { SearchResult } from '../types/search';

export class SearchService {
  private static instance: SearchService;
  private searchCache: Map<string, SearchResult[]> = new Map();

  // Mock data for testing
  private mockData: SearchResult[] = [
    {
      id: '1',
      label: 'Sample Data Analysis',
      value: 'sample-analysis',
      category: 'Analysis',
      description: 'A sample data analysis report',
      metadata: { date: '2024-03-15', type: 'report' }
    },
    {
      id: '2',
      label: 'Market Research',
      value: 'market-research',
      category: 'Business',
      description: 'Market research and trends analysis',
      metadata: { date: '2024-03-14', type: 'research' }
    },
    {
      id: '3',
      label: 'Financial Report',
      value: 'financial-report',
      category: 'Finance',
      description: 'Quarterly financial report',
      metadata: { date: '2024-03-13', type: 'finance' }
    }
  ];

  private constructor() {}

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  public async search(query: string): Promise<SearchResult[]> {
    // Check cache first
    const cachedResults = this.searchCache.get(query);
    if (cachedResults) {
      return cachedResults;
    }

    try {
      // For now, use mock data and filter based on query
      const results = this.mockData.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase()) ||
        item.category?.toLowerCase().includes(query.toLowerCase())
      );
      
      // Cache the results
      this.searchCache.set(query, results);
      
      return results;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  public async searchWithFilters(
    query: string,
    filters: Record<string, any>
  ): Promise<SearchResult[]> {
    try {
      // Get base results
      let results = await this.search(query);

      // Apply filters
      if (filters.category) {
        results = results.filter(item => 
          item.category?.toLowerCase() === filters.category.toLowerCase()
        );
      }

      if (filters.dateRange) {
        // Add date filtering logic here if needed
      }

      if (filters.tags) {
        // Add tags filtering logic here if needed
      }

      // Apply sorting
      if (filters.sortBy) {
        results = this.sortResults(results, filters.sortBy, filters.sortOrder);
      }

      return results;
    } catch (error) {
      console.error('Search with filters error:', error);
      return [];
    }
  }

  private sortResults(
    results: SearchResult[],
    sortBy: string,
    sortOrder: 'asc' | 'desc' = 'desc'
  ): SearchResult[] {
    return [...results].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.label.localeCompare(b.label);
          break;
        case 'date':
          comparison = (a.metadata?.date || '').localeCompare(b.metadata?.date || '');
          break;
        default:
          return 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  public clearCache(): void {
    this.searchCache.clear();
  }
} 