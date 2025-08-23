import { ErrorReporter } from '../ErrorReporter';

describe('ErrorReporter', () => {
  let errorReporter: ErrorReporter;
  const mockError = new Error('Test error');
  const mockDetails = {
    error: mockError,
    componentStack: 'Component stack trace',
    timestamp: '2024-03-20T12:00:00Z',
    userAgent: 'test-agent',
    url: 'http://localhost:3000'
  };

  beforeEach(() => {
    errorReporter = ErrorReporter.getInstance();
    errorReporter.clearErrors();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be a singleton', () => {
    const instance1 = ErrorReporter.getInstance();
    const instance2 = ErrorReporter.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should store reported errors', () => {
    errorReporter.report(mockDetails);
    const errors = errorReporter.getRecentErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual(mockDetails);
  });

  it('should limit the number of stored errors', () => {
    const maxErrors = 100;
    for (let i = 0; i < maxErrors + 10; i++) {
      errorReporter.report({
        ...mockDetails,
        timestamp: `2024-03-20T12:00:${i.toString().padStart(2, '0')}Z`
      });
    }
    const errors = errorReporter.getRecentErrors();
    expect(errors).toHaveLength(maxErrors);
  });

  it('should clear errors', () => {
    errorReporter.report(mockDetails);
    errorReporter.clearErrors();
    const errors = errorReporter.getRecentErrors();
    expect(errors).toHaveLength(0);
  });

  it('should send errors to monitoring service in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    errorReporter.report(mockDetails);
    
    expect(global.fetch).toHaveBeenCalledWith('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockDetails),
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('should handle failed API calls gracefully', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    errorReporter.report(mockDetails);
    
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error reporting failed:',
      expect.any(Error)
    );

    process.env.NODE_ENV = originalEnv;
    consoleSpy.mockRestore();
  });
});