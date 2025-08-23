declare module 'jstat' {
  export const jStat: {
    normal: {
      cdf: (x: number, mean?: number, std?: number) => number;
      inv: (p: number, mean?: number, std?: number) => number;
    };
    studentt: {
      cdf: (x: number, df: number) => number;
      inv: (p: number, df: number) => number;
    };
    f: {
      cdf: (x: number, df1: number, df2: number) => number;
      inv: (p: number, df1: number, df2: number) => number;
    };
    chisquare: {
      cdf: (x: number, df: number) => number;
      inv: (p: number, df: number) => number;
    };
  };
} 