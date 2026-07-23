import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <h1>Something went wrong</h1>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/';
            }}
            style={{ marginTop: '16px', padding: '8px 16px' }}
          >
            Go to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
