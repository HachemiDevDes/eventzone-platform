"use client";

import React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Eventzone Caught Component Error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6 text-center font-sans">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-md w-full shadow-lg space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs">
              <AlertCircle size={24} />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                {this.props.title || "Unable to display this section"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {this.props.description || "An unexpected issue occurred while loading this view. You can retry or return to the main dashboard."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-blue-600/20"
              >
                <RefreshCw size={13} />
                <span>Try Again</span>
              </button>

              {this.props.onGoHome && (
                <button
                  type="button"
                  onClick={this.props.onGoHome}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Home size={13} />
                  <span>Go to Home</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
