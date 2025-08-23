import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { ErrorReporter } from '../../utils/monitoring/ErrorReporter';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  private errorReporter: ErrorReporter;

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
    this.errorReporter = new ErrorReporter();
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Report error to monitoring service
    this.errorReporter.report({
      error,
      componentStack: errorInfo.componentStack || undefined,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Store error details for recovery
    sessionStorage.setItem('lastError', JSON.stringify({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    }));
  }

  private handleRetry = async () => {
    try {
      // Clear error state
      this.setState({ hasError: false, error: null });
      
      // Attempt to recover last state
      const lastError = sessionStorage.getItem('lastError');
      if (lastError) {
        console.log('Recovering from error:', JSON.parse(lastError));
        sessionStorage.removeItem('lastError');
      }
    } catch (error) {
      console.error('Recovery failed:', error);
      this.setState({ 
        hasError: true, 
        error: new Error('Recovery failed. Please refresh the page.') 
      });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[200px] flex items-center justify-center bg-red-50 p-4 rounded-lg">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Analysis Error</h2>
            <p className="text-gray-600 mb-4">
              The data is too large to process. Try uploading a smaller dataset or using sampling.
            </p>
            <button
              onClick={this.handleRetry}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}