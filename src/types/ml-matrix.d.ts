declare module 'ml-matrix' {
  export class Matrix {
    static eye(rows: number, columns: number): Matrix;
    static columnVector(array: number[]): Matrix;
    constructor(array: number[][]);
    transpose(): Matrix;
    mmul(matrix: Matrix): Matrix;
    add(matrix: Matrix): Matrix;
    mul(scalar: number): Matrix;
    solve(matrix: Matrix): Matrix;
    get(row: number, col: number): number;
    getColumn(col: number): number[];
  }
} 