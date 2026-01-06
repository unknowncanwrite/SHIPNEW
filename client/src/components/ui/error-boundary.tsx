import React, { ReactNode, ReactElement } from 'react';
import { Button } from './button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="max-w-md w-full p-8 border rounded-lg shadow-lg bg-card">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-destructive/10 rounded-full mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-center mb-2 text-foreground">Something went wrong</h1>
            <p className="text-center text-muted-foreground mb-4">
              An unexpected error occurred. Try refreshing the page or contact support if the problem persists.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="bg-muted p-3 rounded mb-4 text-xs overflow-auto max-h-40 text-destructive">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-2">
              <Button onClick={this.handleReset} className="w-full">
                Try Again
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
