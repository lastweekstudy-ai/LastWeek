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
        <div className="error-boundary">
          <div className="container">
            <div className="error-content">
              <h2>Something went wrong</h2>
              <p>The app encountered an error. This might be due to:</p>
              <ul>
                <li>Missing Appwrite collections or incorrect permissions</li>
                <li>Network connectivity issues</li>
                <li>Invalid session or document IDs</li>
              </ul>
              <div className="error-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Go to Dashboard
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => this.setState({ hasError: false, error: null })}
                >
                  Try Again
                </button>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <details className="error-details">
                  <summary>Error Details (Development)</summary>
                  <pre>{this.state.error?.toString()}</pre>
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