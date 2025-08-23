declare module 'regression' {
  interface RegressionResult {
    predict: (x: number[]) => number[];
    r2: number;
    equation: number[];
  }

  interface Regression {
    linear: (data: number[][]) => RegressionResult;
  }

  const regression: Regression;
  export default regression;
} 