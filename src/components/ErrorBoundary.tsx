import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    try {
      window.location.reload();
    } catch {
      // ignore
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07090E] text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0B0F17] border border-amber-500/30 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold font-heading text-white mb-2">
              Quantiq Prime Session Restored
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              A temporary runtime warning was intercepted and safely handled. Click below to continue your secure session.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

