export function isValidValueForType(value: any, type: string): boolean {
  if (value === null || value === undefined || value === '') return false;

  switch (type) {
    case 'number':
      // Try to convert string values to numbers
      if (typeof value === 'string') {
        // Remove any non-numeric characters except decimal point
        const cleaned = value.replace(/[^0-9.]/g, '');
        if (!cleaned) return false;
        const num = parseFloat(cleaned);
        return !isNaN(num) && isFinite(num);
      }
      return typeof value === 'number' && !isNaN(value) && isFinite(value);
    case 'string':
      return typeof value === 'string' && value.trim().length > 0;
    case 'date':
      return !isNaN(Date.parse(String(value)));
    case 'boolean':
      return typeof value === 'boolean';
    default:
      return false;
  }
}