import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "./button";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("[ErrorBoundary caught an error]:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    private handleGoHome = () => {
        window.location.href = "/";
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50/50 dark:bg-slate-950/50">
                    <div className="max-w-md w-full bg-card border border-border/80 shadow-2xl rounded-3xl p-8 text-center space-y-6 backdrop-blur-xl">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shadow-inner">
                            <AlertTriangle className="h-8 w-8" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">
                                Something went wrong
                            </h2>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                An unexpected issue occurred while rendering this view. Your session and data are secure.
                            </p>
                        </div>

                        {this.state.error && (
                            <div className="text-left bg-muted/60 p-3.5 rounded-xl border border-border/50 text-xs font-mono text-muted-foreground max-h-32 overflow-y-auto break-words">
                                {this.state.error.message || "Unknown Application Error"}
                            </div>
                        )}

                        <div className="flex gap-3 justify-center pt-2">
                            <Button
                                variant="outline"
                                className="rounded-xl flex items-center gap-2"
                                onClick={this.handleGoHome}
                            >
                                <Home className="h-4 w-4" /> Return Home
                            </Button>
                            <Button
                                className="rounded-xl flex items-center gap-2 font-bold"
                                onClick={this.handleReset}
                            >
                                <RefreshCw className="h-4 w-4" /> Refresh Page
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
