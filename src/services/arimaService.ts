// src/services/arimaService.ts
export interface ARIMAParameters {
  p: number; d: number; q: number;
  seasonal: boolean;
  seasonalPeriod: number;
}
export interface ARIMADataPoint {
  timestamp: number;
  value: number;
}
export interface ARIMAApiRequest {
  data: ARIMADataPoint[];
  parameters: ARIMAParameters;
  forecastPeriods: number;
  confidenceLevel: number;
  log1p?: boolean;
}
export interface ARIMAApiResponse {
  ok: boolean;
  warning?: string | null;
  parameters: { ar: number[]; ma: number[]; p: number; d: number; q: number };
  metrics: { aic: number; bic: number; rmse: number; mae: number };
  fittedValues: number[];
  forecast: number[];
  forecastIntervals: { lower: number[]; upper: number[] };
}

export async function analyzeARIMA(body: ARIMAApiRequest): Promise<ARIMAApiResponse> {
  // Ensure log1p is included in the request
  const requestBody = {
    ...body,
    log1p: body.log1p ?? true  // Default to true for better results
  };
  
  const res = await fetch('/api/arima/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `ARIMA API failed with status ${res.status}`);
  }
  return res.json();
}

// Map backend response into the shape your ARIMA.tsx expects
export function convertToARIMAResult(
  api: ARIMAApiResponse,
  fieldName: string,
  originalData: number[],
) {
  return {
    field: fieldName,
    originalData,
    fittedValues: api.fittedValues || [],
    residuals: [], // optional in UI
    forecast: api.forecast || [],
    forecastIntervals: api.forecastIntervals || { lower: [], upper: [] },
    metrics: {
      aic: api.metrics?.aic ?? 0,
      bic: api.metrics?.bic ?? 0,
      rmse: api.metrics?.rmse ?? 0,
      mae: api.metrics?.mae ?? 0,
      mape: 0
    },
    parameters: {
      ar: api.parameters?.ar ?? [],
      ma: api.parameters?.ma ?? []
    },
    diagnostics: {
      stationarity: true,
      autocorrelation: [],
      ljungBox: 0
    }
  };
}

export const arimaService = { analyzeARIMA, convertToARIMAResult };

