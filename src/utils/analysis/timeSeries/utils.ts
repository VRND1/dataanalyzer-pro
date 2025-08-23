import { DataField } from '@/types/data';

export function convertFieldsToTimeSeriesData(fields: DataField[]) {
  // Convert data fields to time series format
  const timeFields = fields.filter(f => f.type === 'date');
  const numericFields = fields.filter(f => f.type === 'number');
  
  return {
    timeFields,
    numericFields,
    hasTimeData: timeFields.length > 0,
    hasNumericData: numericFields.length > 0
  };
}
