import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen w-full bg-[#FAFCFB] text-slate-900 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-4 text-rose-600 font-bold">
              !
            </div>
            <h2 className="text-lg font-bold text-slate-950 mb-2">Display Reset Required</h2>
            <p className="text-xs text-slate-500 mb-6 font-sans">
              An unexpected display exception occurred. Please refresh or return to the main console.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-full bg-slate-950 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                className="px-4 py-2 rounded-full border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Return to Landing
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
