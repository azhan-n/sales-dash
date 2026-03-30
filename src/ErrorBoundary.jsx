// =============================================
// ErrorBoundary.jsx — Catches render errors to prevent full app crash
// =============================================
import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: this.props.fullPage ? "100vh" : "200px",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: "1rem", padding: "2rem",
        backgroundColor: this.props.bg || "#fff8f8",
        color: "#7f1d1d",
        fontFamily: "system-ui, sans-serif",
      }}>
        <AlertTriangle size={40} style={{ color: "#ef4444" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.125rem", fontWeight: "700", marginBottom: "0.375rem" }}>
            {this.props.title || "Something went wrong"}
          </div>
          <div style={{ fontSize: "0.875rem", opacity: 0.75, maxWidth: "360px" }}>
            {this.props.message || "An unexpected error occurred in this section."}
          </div>
          {this.state.error && (
            <pre style={{ marginTop: "0.75rem", fontSize: "0.6875rem", opacity: 0.6, textAlign: "left", background: "rgba(0,0,0,0.05)", padding: "0.5rem", borderRadius: "0.375rem", maxWidth: "400px", overflow: "auto" }}>
              {this.state.error.message}
            </pre>
          )}
        </div>
        <button
          onClick={() => this.setState({ hasError: false, error: null })}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 1.25rem", borderRadius: "0.5rem", border: "1px solid #fca5a5", backgroundColor: "#fee2e2", color: "#991b1b", cursor: "pointer", fontSize: "0.875rem", fontWeight: "600" }}
        >
          <RefreshCw size={15} /> Try again
        </button>
      </div>
    );
  }
}
