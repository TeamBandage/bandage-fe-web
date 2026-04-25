'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

import { ErrorState } from './error-state';

type FallbackRender = (error: Error, reset: () => void) => ReactNode;

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode | FallbackRender;
  onError?: (error: Error, info: ErrorInfo) => void;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorBoundary]', error, info);
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const { fallback } = this.props;
    if (typeof fallback === 'function') return fallback(error, this.reset);
    if (fallback !== undefined) return fallback;
    // 기본 fallback 은 사용자에게 기술적 메시지(error.message) 를 노출하지 않고
    // ErrorState 의 부드러운 기본 카피("서비스를 준비하고 있어요") 를 그대로 사용한다.
    void error;
    return <ErrorState onRetry={this.reset} />;
  }
}
