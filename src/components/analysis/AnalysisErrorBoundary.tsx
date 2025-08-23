import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface AnalysisErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AnalysisErrorBoundary extends React.Component<
  { children: React.ReactNode },
  AnalysisErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Analysis error caught by boundary:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[200px] flex items-center justify-center bg-red-50 p-4 rounded-lg">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Analysis Error</h2>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An error occurred during analysis'}
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