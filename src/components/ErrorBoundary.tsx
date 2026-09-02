import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PROGRESS_KEY, PORTFOLIO_KEY } from '@/lib/constants';
import { removeKey } from '@/lib/storage';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/** Last line of defence. A demo should degrade to a readable screen with a way
 *  out, never to a blank white page. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ShapeTrader crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="grid min-h-screen place-items-center bg-base p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-xl font-semibold">Something went sideways</h1>
          <p className="mt-2 text-sm text-ink-muted">
            The app hit an unexpected error. Reloading usually fixes it; clearing saved progress
            always does.
          </p>
          <pre className="mt-4 max-h-32 overflow-auto rounded-lg border border-line bg-surface p-3 text-left text-[11px] text-ink-muted">
            {this.state.error.message}
          </pre>
          <div className="mt-5 flex justify-center gap-3">
            <Button onClick={() => window.location.reload()} icon={<RotateCcw className="size-4" />}>
              Reload
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                removeKey(PROGRESS_KEY);
                removeKey(PORTFOLIO_KEY);
                window.location.href = '/';
              }}
            >
              Reset progress and restart
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
