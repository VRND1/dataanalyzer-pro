import { DataField } from '@/types/data';
import { RegressionResult, RegressionOptions } from './types';
import { calculateLinearRegression } from './linear';
import { calculatePolynomialRegression } from './polynomial';
import { calculateRidgeRegression } from './ridge';
import { calculateLassoRegression } from './lasso';
import { calculateElasticNetRegression } from './elastic-net';
import { calculateLogisticRegression } from './logistic';
import { calculateQuantileRegression } from './quantile';
import { calculateTimeSeriesRegression } from './time-series';
import { calculateLogLogRegression } from './log-log';

export function performRegression(
  fields: DataField[],
  options: RegressionOptions = { type: 'linear' }
): RegressionResult[] {
  if (!fields?.length) return [];

  // Validate input data
  const validFields = fields.filter(field => {
    const values = field.value as number[];
    return values.every(v => typeof v === 'number' && isFinite(v));
  });

  if (validFields.length < 2) return [];

  const results: RegressionResult[] = [];
  const numericFields = validFields;

  if (numericFields.length < 2) return [];

  for (let i = 0; i < numericFields.length; i++) {
    const dependent = numericFields[i];
    const independents = numericFields.filter((_, index) => index !== i);
    
    let result: RegressionResult;

    switch (options.type) {
      case 'linear':
        result = calculateLinearRegression(dependent, independents[0]);
        break;
      case 'polynomial':
        result = calculatePolynomialRegression(dependent, independents[0], options.polynomialDegree || 2);
        break;
      case 'ridge':
        result = calculateRidgeRegression(dependent, independents[0], options.alpha || 0.1);
        break;
      case 'lasso':
        result = calculateLassoRegression(dependent, independents[0], options.alpha || 0.1);
        break;
      case 'elastic-net':
        result = calculateElasticNetRegression(dependent, independents[0], options.alpha || 0.1, options.l1Ratio || 0.5);
        break;
      case 'logistic':
        result = calculateLogisticRegression(dependent, independents[0]);
        break;
      case 'quantile':
        result = calculateQuantileRegression(dependent, independents[0], options.quantile || 0.5);
        break;
      case 'time-series':
        result = calculateTimeSeriesRegression(dependent, independents[0], options.timeSeriesLag || 1);
        break;
      case 'log-log':
        result = calculateLogLogRegression(dependent, independents[0]);
        break;
      default:
        result = calculateLinearRegression(dependent, independents[0]);
    }

    results.push(result);
  }

  return results;
} 