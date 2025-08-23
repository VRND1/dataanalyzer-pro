import { DataField } from '@/types/data';

export interface RegressionAnalysisRequest {
  X: number[];
  y: number[];
  model_type: string;
  options?: {
    polynomialDegree?: number;
    regularizationStrength?: number;
    confidenceLevel?: number;
  };
}

export interface RegressionAnalysisResponse {
  modelType: string;
  coefficients: number[];
  predictions: number[];
  metrics: {
    r2Score: number;
    adjustedR2: number;
    rmse: number;
    mae: number;
    aic: number;
    bic: number;
    fStatistic?: number;
    pValue?: number;
    confidenceIntervals?: Array<[number, number]>;
  };
  diagnostics: {
    residualPlotData: Array<{x: number, y: number}>;
    qqPlotData: Array<{x: number, y: number}>;
    residuals: number[];
  };
  actualValues: number[];
}

export interface CrossValidationRequest {
  X: number[];
  y: number[];
  model_type: string;
  folds?: number;
  options?: {
    polynomialDegree?: number;
    regularizationStrength?: number;
  };
}

export interface CrossValidationResponse {
  scores: number[];
  meanScore: number;
  stdScore: number;
  minScore: number;
  maxScore: number;
}

export interface FeatureImportanceRequest {
  features: Array<{name: string, values: number[]}>;
  target: number[];
  method?: 'correlation' | 'regression' | 'mutual_info';
}

export interface FeatureImportanceResponse {
  name: string;
  importance: number;
}

class RegressionService {
  private baseUrl = '/api/regression';

  async analyzeRegression(request: RegressionAnalysisRequest): Promise<RegressionAnalysisResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Regression analysis API error:', error);
      throw new Error(`Failed to perform regression analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async performCrossValidation(request: CrossValidationRequest): Promise<CrossValidationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/cross-validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Cross-validation API error:', error);
      throw new Error(`Failed to perform cross-validation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async calculateFeatureImportance(request: FeatureImportanceRequest): Promise<FeatureImportanceResponse[]> {
    try {
      const response = await fetch(`${this.baseUrl}/feature-importance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Feature importance API error:', error);
      throw new Error(`Failed to calculate feature importance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async performMultipleRegression(
    features: DataField[],
    target: DataField,
    modelType: string,
    options?: any
  ): Promise<RegressionAnalysisResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/multiple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          features: features.map(f => f.value as number[]),
          target: target.value as number[],
          model_type: modelType,
          options
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Multiple regression API error:', error);
      throw new Error(`Failed to perform multiple regression: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper method to check if backend is available
  async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch('/api/health');
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const regressionService = new RegressionService(); 