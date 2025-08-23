import { render, screen } from '@testing-library/react';
import { FunnelAnalysis } from '../FunnelAnalysis';
import { DataField } from '@/types/data';

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="chart">Chart</div>,
  Line: () => <div data-testid="chart">Chart</div>,
  Doughnut: () => <div data-testid="chart">Chart</div>,
}));

// Mock Chart.js registration
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  BarElement: {},
  ArcElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  Filler: {},
}));

describe('FunnelAnalysis', () => {
  const mockData: { fields: DataField[] } = {
    fields: [
      {
        name: 'Page Views',
        type: 'number',
        value: [1000, 950, 900, 850, 800],
      },
      {
        name: 'Add to Cart',
        type: 'number',
        value: [800, 750, 700, 650, 600],
      },
      {
        name: 'Checkout Started',
        type: 'number',
        value: [600, 550, 500, 450, 400],
      },
      {
        name: 'Purchase Completed',
        type: 'number',
        value: [400, 350, 300, 250, 200],
      },
      {
        name: 'Email Field',
        type: 'string',
        value: ['test@example.com', 'user@test.com'],
      },
    ],
  };

  it('renders funnel analysis with valid data', () => {
    render(<FunnelAnalysis data={mockData} />);
    
    expect(screen.getByText('Funnel Analysis')).toBeInTheDocument();
    expect(screen.getByText('Total Stages')).toBeInTheDocument();
    expect(screen.getByText('Overall Conversion')).toBeInTheDocument();
    expect(screen.getByText('Total Dropoff')).toBeInTheDocument();
    expect(screen.getByText('Best Stage')).toBeInTheDocument();
  });

  it('renders funnel stages correctly', () => {
    render(<FunnelAnalysis data={mockData} />);
    
    expect(screen.getByText('Page Views')).toBeInTheDocument();
    expect(screen.getByText('Add to Cart')).toBeInTheDocument();
    expect(screen.getByText('Checkout Started')).toBeInTheDocument();
    expect(screen.getByText('Purchase Completed')).toBeInTheDocument();
  });

  it('shows chart when data is available', () => {
    render(<FunnelAnalysis data={mockData} />);
    
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('renders no data message when no data provided', () => {
    render(<FunnelAnalysis data={undefined} />);
    
    expect(screen.getByText('No Data Available')).toBeInTheDocument();
    expect(screen.getByText('Upload data with numeric fields to perform funnel analysis.')).toBeInTheDocument();
  });

  it('renders insufficient data message when less than 2 numeric fields', () => {
    const insufficientData = {
      fields: [
        {
          name: 'Single Field',
          type: 'number',
          value: [100, 200, 300],
        },
        {
          name: 'Text Field',
          type: 'string',
          value: ['text1', 'text2'],
        },
      ],
    };

    render(<FunnelAnalysis data={{ fields: insufficientData.fields as DataField[] }} />);
    
    expect(screen.getByText('Insufficient Data for Funnel Analysis')).toBeInTheDocument();
    expect(screen.getByText('At least 2 numeric fields are required to create a funnel analysis.')).toBeInTheDocument();
  });

  it('shows insights when toggle is enabled', () => {
    render(<FunnelAnalysis data={mockData} />);
    
    // Insights should be visible by default
    expect(screen.getByText('Insights:')).toBeInTheDocument();
  });

  it('shows recommendations when available', () => {
    render(<FunnelAnalysis data={mockData} />);
    
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
  });

  it('displays chart controls', () => {
    render(<FunnelAnalysis data={mockData} />);
    
    expect(screen.getByText('Chart Type:')).toBeInTheDocument();
    expect(screen.getByText('Funnel')).toBeInTheDocument();
    expect(screen.getByText('Conversion')).toBeInTheDocument();
    expect(screen.getByText('Dropoff')).toBeInTheDocument();
  });

  it('displays time range controls', () => {
    render(<FunnelAnalysis data={mockData} />);
    
    expect(screen.getByText('Time Range:')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Month')).toBeInTheDocument();
    expect(screen.getByText('Week')).toBeInTheDocument();
  });

  it('shows action buttons', () => {
    render(<FunnelAnalysis data={mockData} />);
    
    expect(screen.getByText('Hide Insights')).toBeInTheDocument();
    // Download and Share buttons should be present (though they might not have visible text)
    expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
  });
}); 