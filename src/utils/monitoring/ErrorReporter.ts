interface ErrorDetails {
  error: Error;
  componentStack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  context?: Record<string, any>;
}

export class ErrorReporter {
  private static instance: ErrorReporter;
  private errors: ErrorDetails[] = [];
  private readonly MAX_ERRORS = 100;

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  report(details: ErrorDetails): void {
    // Add error to local queue
    this.errors.push(details);
    
    // Trim queue if too long
    if (this.errors.length > this.MAX_ERRORS) {
      this.errors = this.errors.slice(-this.MAX_ERRORS);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error reported:', details);
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(details);
    }
  }

  private async sendToMonitoringService(details: ErrorDetails): Promise<void> {
    try {
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(details),
      });

      if (!response.ok) {
        console.error('Failed to send error to monitoring service:', response.statusText);
      }
    } catch (error) {
      console.error('Error reporting failed:', error);
    }
  }

  getRecentErrors(): ErrorDetails[] {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }
}