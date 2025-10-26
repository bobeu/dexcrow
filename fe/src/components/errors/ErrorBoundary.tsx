"use client";
/* eslint-disable */

import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  async componentDidCatch(error: Error, info: React.ErrorInfo) {
    try {
      await fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: error?.message, stack: error?.stack, info }),
      });
    } catch(error: any) {
      console.error('ErrorBoundary caught:', error);
    }
    console.error('UI ErrorBoundary caught:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-violet-900/20 p-6">
          <div className="max-w-md w-full space-y-6 text-center bg-violet-900 backdrop-blur-sm border border-stone-600 rounded-lg p-8">
            <div className="mx-auto h-16 w-16 rounded-full border-4 border-yellow-400/40 border-t-yellow-400 animate-spin" />
            <h2 className="text-2xl font-bold spooky-text">Something went wrong</h2>
            <p className="text-stone-300">We hit a snag rendering the UI. You can retry or refresh the page.</p>
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={this.handleRetry} 
                className="btn-primary px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300"
              >
                Retry
              </button>
              <button 
                onClick={() => location.reload()} 
                className="btn-secondary px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


