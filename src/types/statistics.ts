export interface DescriptiveStats {
  mean: number;
  median: number;
  mode: number[];
  standardDeviation: number;
  variance: number;
  range: [number, number];
  quartiles: {
    q1: number;
    q2: number;
    q3: number;
  };
  skewness: number;
  kurtosis: number;
} 