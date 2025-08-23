import { render, screen, fireEvent } from '@testing-library/react';
import { CorrelationMatrix } from '../AnalysisSection/components/CorrelationMatrix';
import type { DataField } from '@/types/data';

describe('CorrelationMatrix', () => {
  const mockFields: DataField[] = [
    {
      name: 'field1',
      type: 'number',
      value: [1, 2, 3, 4, 5]
    },
    {
      name: 'field2',
      type: 'number',
      value: [2, 4, 6, 8, 10]
    },
    {
      name: 'field3',
      type: 'string',
      value: ['a', 'b', 'c', 'd', 'e']
    }
  ];

  it('should render correlation matrix for numeric fields', () => {
    render(<CorrelationMatrix fields={mockFields} />);
    
    // Check for field names
    expect(screen.getByText('field1')).toBeInTheDocument();
    expect(screen.getByText('field2')).toBeInTheDocument();
    
    // String field should not be included
    expect(screen.queryByText('field3')).not.toBeInTheDocument();
  });

  it('should show tooltip on cell hover', async () => {
    render(<CorrelationMatrix fields={mockFields} />);
    
    const cell = screen.getByText('1.00');
    fireEvent.mouseEnter(cell);
    
    expect(await screen.findByText(/correlation/i)).toBeInTheDocument();
  });

  it('should handle empty fields array', () => {
    render(<CorrelationMatrix fields={[]} />);
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });

  it('should handle insufficient numeric fields', () => {
    const singleField: DataField[] = [
      {
        name: 'field1',
        type: 'number',
        value: [1, 2, 3]
      }
    ];
    
    render(<CorrelationMatrix fields={singleField} />);
    expect(screen.getByText(/at least 2 numeric fields/i)).toBeInTheDocument();
  });

  it('should calculate correlations correctly', () => {
    render(<CorrelationMatrix fields={mockFields} />);
    
    // Perfect positive correlation should be 1.00
    const perfectCorrelation = screen.getAllByText('1.00');
    expect(perfectCorrelation.length).toBeGreaterThan(0);
  });
});