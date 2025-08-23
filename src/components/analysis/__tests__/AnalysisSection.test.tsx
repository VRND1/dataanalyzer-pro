import { render, screen, waitFor } from '@testing-library/react';
import { AnalysisSection } from '../AnalysisSection';
import { useAnalysis } from '@/hooks/analysis';

// Mock the useAnalysis hook
jest.mock('@/hooks/analysis', () => ({
  useAnalysis: jest.fn()
}));

describe('AnalysisSection', () => {
  const mockData = {
    fields: [
      {
        name: 'field1',
        type: 'number' as const,
        value: [1, 2, 3, 4, 5]
      },
      {
        name: 'field2',
        type: 'number' as const,
        value: [2, 4, 6, 8, 10]
      }
    ]
  };

  const mockResults = {
    fields: [],
    statistics: {
      mean: {},
      median: {},
      standardDeviation: {},
      correlations: {}
    },
    insights: [],
    recommendations: [],
    correlations: [],
    outliers: [],
    trends: [],
    patterns: [],
    pros: [],
    cons: [],
    hasNumericData: true,
    hasTextData: false,
    dataQuality: {
      completeness: 1,
      validity: 1
    },
    analysis: {
      trends: [{
        field: 'default',
        direction: 'stable' as const,
        confidence: 0
      }]
    }
  };

  beforeEach(() => {
    (useAnalysis as jest.Mock).mockReturnValue({
      isAnalyzing: false,
      error: null,
      results: null,
      progress: 0,
      analyze: jest.fn()
    });
  });

  it('should render loading state', () => {
    (useAnalysis as jest.Mock).mockReturnValue({
      isAnalyzing: true,
      error: null,
      results: null,
      progress: 50,
      analyze: jest.fn()
    });

    render(<AnalysisSection data={mockData} fileData={undefined} category={null} results={mockResults} />);
    expect(screen.getByText(/analyzing data/i)).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should render error state', () => {
    (useAnalysis as jest.Mock).mockReturnValue({
      isAnalyzing: false,
      error: new Error('Test error'),
      results: null,
      progress: 0,
      analyze: jest.fn()
    });

    render(<AnalysisSection data={mockData} fileData={undefined} category={null} results={mockResults} />);
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should render analysis overview', async () => {
    render(<AnalysisSection data={mockData} fileData={undefined} category={null} results={mockResults} />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Fields')).toBeInTheDocument();
      expect(screen.getByText('Numeric Fields')).toBeInTheDocument();
    });
  });

  it('should render visualizations for numeric fields', async () => {
    render(<AnalysisSection data={mockData} fileData={undefined} category={null} results={mockResults} />);
    
    await waitFor(() => {
      expect(screen.getByText('Data Visualization')).toBeInTheDocument();
    });
  });

  it('should handle empty data', () => {
    render(<AnalysisSection data={{ fields: [] }} fileData={undefined} category={null} results={mockResults} />);
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });

  it('should handle non-numeric data', () => {
    const textData = {
      fields: [
        {
          name: 'text1',
          type: 'string' as const,
          value: ['a', 'b', 'c']
        }
      ]
    };

    render(<AnalysisSection data={textData} fileData={undefined} category={null} results={mockResults} />);
    expect(screen.queryByText('Data Visualization')).not.toBeInTheDocument();
  });

  it('should render analysis overview with mock results', async () => {
    render(<AnalysisSection data={mockData} fileData={undefined} category={null} results={mockResults} />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Fields')).toBeInTheDocument();
      expect(screen.getByText('Numeric Fields')).toBeInTheDocument();
    });
  });

  it('should render visualizations for numeric fields with mock results', async () => {
    render(<AnalysisSection data={mockData} fileData={undefined} category={null} results={mockResults} />);
    
    await waitFor(() => {
      expect(screen.getByText('Data Visualization')).toBeInTheDocument();
    });
  });

  it('should handle empty data with mock results', () => {
    render(<AnalysisSection data={{ fields: [] }} fileData={undefined} category={null} results={mockResults} />);
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });

  it('should handle non-numeric data with mock results', () => {
    const textData = {
      fields: [
        {
          name: 'text1',
          type: 'string' as const,
          value: ['a', 'b', 'c']
        }
      ]
    };

    render(<AnalysisSection data={textData} fileData={undefined} category={null} results={mockResults} />);
    expect(screen.queryByText('Data Visualization')).not.toBeInTheDocument();
  });
});