import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-50 p-6 text-surface-900 dark:bg-surface-950 dark:text-white">
          <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
            <div className="glass-card p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/15 text-3xl text-brand-400">!</div>
              <h2 className="font-display text-2xl font-bold text-surface-900 dark:text-white">Something went wrong</h2>
              <p className="mt-3 text-surface-600 dark:text-surface-200">The app encountered an error. This might be due to:</p>
              <ul className="mt-4 space-y-2 text-left text-sm text-surface-600 dark:text-surface-200">
                <li>Missing Appwrite collections or incorrect permissions</li>
                <li>Network connectivity issues</li>
                <li>Invalid session or document IDs</li>
              </ul>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button 
                  className="btn-primary"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Go to Dashboard
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => this.setState({ hasError: false, error: null })}
                >
                  Try Again
                </button>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-6 rounded-xl border border-red-500/20 bg-red-600/5 p-4 text-left">
                  <summary className="cursor-pointer font-mono text-xs text-red-500 dark:text-red-400">Error Details (Development)</summary>
                  <pre className="mt-3 overflow-auto whitespace-pre-wrap font-mono text-xs text-surface-600 dark:text-surface-200">{this.state.error?.toString()}</pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
