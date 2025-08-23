export function createError(code: string, message: string): Error {
  const error = new Error(message);
  (error as any).code = code;
  return error;
} 