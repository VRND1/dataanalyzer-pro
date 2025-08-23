import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { DataField } from '@/types/data';

interface BasicStatsProps {
  field?: DataField;
}

export function BasicStats({ field }: BasicStatsProps) {
  const [inputData, setInputData] = useState<string>('');
  const [numbers, setNumbers] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    count: number;
    sum: number;
    mean: number;
    median: number;
    min: number;
    max: number;
    range: number;
    variance: number;
    stdDev: number;
  } | null>(null);

  useEffect(() => {
    if (field?.type === 'number' && Array.isArray(field.value)) {
      setNumbers(field.value);
    }
  }, [field]);

  useEffect(() => {
    if (numbers.length > 0) {
      calculateStats();
    } else {
      setStats(null);
    }
  }, [numbers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputData(e.target.value);
    setError(null);
  };

  const parseInputData = () => {
    try {
      // Support comma, space, or newline separated values
      const parsedNumbers = inputData
        .split(/[, \n]+/)
        .filter(item => item.trim() !== '')
        .map(item => {
          const num = parseFloat(item);
          if (isNaN(num)) {
            throw new Error(`"${item}" is not a valid number`);
          }
          return num;
        });

      if (parsedNumbers.length === 0) {
        throw new Error('Please enter at least one number');
      }

      setNumbers(parsedNumbers);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid input');
      setNumbers([]);
    }
  };

  const calculateStats = () => {
    const sorted = [...numbers].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    const mean = sum / count;
    
    // Median calculation
    let median;
    if (count % 2 === 0) {
      median = (sorted[count / 2 - 1] + sorted[count / 2]) / 2;
    } else {
      median = sorted[Math.floor(count / 2)];
    }
    
    // Variance and standard deviation
    const squaredDiffs = sorted.map(num => Math.pow(num - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / count;
    const stdDev = Math.sqrt(variance);

    setStats({
      count,
      sum,
      mean,
      median,
      min: sorted[0],
      max: sorted[count - 1],
      range: sorted[count - 1] - sorted[0],
      variance,
      stdDev,
    });
  };

  const formatNumber = (num: number) => {
    // Format numbers to 4 decimal places if they have decimal parts
    return num % 1 === 0 ? num.toString() : num.toFixed(4);
  };

  // If we have field data, show stats directly
  if (field?.type === 'number' && Array.isArray(field.value) && stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Count" 
          value={stats.count.toString()} 
          description="Total number of values" 
        />
        <StatCard 
          title="Mean" 
          value={formatNumber(stats.mean)} 
          description="Average value" 
        />
        <StatCard 
          title="Median" 
          value={formatNumber(stats.median)} 
          description="Middle value" 
        />
        <StatCard 
          title="Min" 
          value={formatNumber(stats.min)} 
          description="Smallest value" 
        />
        <StatCard 
          title="Max" 
          value={formatNumber(stats.max)} 
          description="Largest value" 
        />
        <StatCard 
          title="Std Dev" 
          value={formatNumber(stats.stdDev)} 
          description="Standard deviation" 
        />
      </div>
    );
  }

  // Otherwise show the input form
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Basic Statistics Calculator</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-5 w-5 text-gray-500 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[300px]">
              <p>Enter numbers separated by commas, spaces, or new lines. Statistics will be calculated automatically.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter numbers (e.g., 1, 2, 3 or 1 2 3 or 1↵2↵3)"
            value={inputData}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && parseInputData()}
          />
          <Button onClick={parseInputData}>Calculate</Button>
        </div>

        {error && (
          <div className="text-red-500 text-sm py-2 px-3 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        {stats && (
          <div className="mt-6">
            <h4 className="font-medium mb-3">Results for {numbers.length} numbers:</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard 
                title="Count" 
                value={stats.count.toString()} 
                description="Total number of values" 
              />
              <StatCard 
                title="Sum" 
                value={formatNumber(stats.sum)} 
                description="Total of all values" 
              />
              <StatCard 
                title="Mean (Average)" 
                value={formatNumber(stats.mean)} 
                description="Sum divided by count" 
              />
              <StatCard 
                title="Median" 
                value={formatNumber(stats.median)} 
                description="Middle value of sorted data" 
              />
              <StatCard 
                title="Minimum" 
                value={formatNumber(stats.min)} 
                description="Smallest value" 
              />
              <StatCard 
                title="Maximum" 
                value={formatNumber(stats.max)} 
                description="Largest value" 
              />
              <StatCard 
                title="Range" 
                value={formatNumber(stats.range)} 
                description="Difference between max and min" 
              />
              <StatCard 
                title="Variance" 
                value={formatNumber(stats.variance)} 
                description="Average of squared differences from mean" 
              />
              <StatCard 
                title="Standard Deviation" 
                value={formatNumber(stats.stdDev)} 
                description="Square root of variance" 
              />
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p>Sorted data: {numbers.sort((a, b) => a - b).join(', ')}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function StatCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="border rounded-md p-3 bg-gray-50">
      <div className="flex justify-between items-start">
        <div>
          <h5 className="font-medium text-sm">{title}</h5>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-gray-500 cursor-help mt-1" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px]">
              <p>{description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
} 