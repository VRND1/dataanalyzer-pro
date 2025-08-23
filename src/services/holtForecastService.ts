// holtForecastService.ts
import type { HoltGridSearchResult } from '../utils/analysis/timeSeries/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface HoltForecastRequest {
  series: number[];
  horizon?: number;
  holdout?: number;
}

export interface HoltForecastResponse {
  success: boolean;
  data: HoltGridSearchResult;
  timestamp: string;
  request_id: string;
}

export async function fetchHoltForecast(request: HoltForecastRequest): Promise<HoltForecastResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/advanced/forecast/exponential`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Holt forecast API error:', error);
    throw error;
  }
}

export async function computeHoltForecast(
  series: number[], 
  horizon = 12, 
  holdout?: number
): Promise<HoltGridSearchResult> {
  const response = await fetchHoltForecast({ series, horizon, holdout });
  return response.data;
}
